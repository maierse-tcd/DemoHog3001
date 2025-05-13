
/**
 * Hook for working with PostHog feature flags
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { safeIsFeatureEnabled, safeReloadFeatureFlags } from '../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

// Minimum time between feature flag reloads (in ms)
const MIN_RELOAD_INTERVAL = 60000; // Increased to 60 seconds (from 30 seconds)

export function useFeatureFlags() {
  const posthog = usePostHog();
  const lastReloadTime = useRef<number>(0);
  const reloadInProgressRef = useRef<boolean>(false);
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // State to track loaded flags
  const [flagsLoaded, setFlagsLoaded] = useState<boolean>(false);
  
  /**
   * Check if a feature flag is enabled
   */
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return safeIsFeatureEnabled(flagName);
  }, []);
  
  /**
   * Reload all feature flags from the server with rate limiting
   */
  const reloadFeatureFlags = useCallback(async (): Promise<void> => {
    // Prevent concurrent reloads
    if (reloadInProgressRef.current || !isMounted.current) {
      console.log('Feature flag reload already in progress or component unmounted, skipping');
      return;
    }
    
    const now = Date.now();
    // Check if we've reloaded recently
    if (now - lastReloadTime.current < MIN_RELOAD_INTERVAL) {
      console.log('Feature flag reload throttled, too soon since last reload');
      return;
    }
    
    try {
      reloadInProgressRef.current = true;
      lastReloadTime.current = now;
      
      console.log('Reloading PostHog feature flags');
      await safeReloadFeatureFlags();
      
      if (isMounted.current) {
        setFlagsLoaded(true);
        console.log('PostHog feature flags reloaded successfully');
      }
    } catch (err) {
      console.error('Error reloading feature flags:', err);
    } finally {
      reloadInProgressRef.current = false;
    }
  }, []);
  
  // Load feature flags on component mount - with delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (posthog && !flagsLoaded) {
        reloadFeatureFlags();
      }
    }, 2000); // Delay initial load to avoid startup race conditions
    
    // Track mounted state
    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [posthog, flagsLoaded, reloadFeatureFlags]);
  
  /**
   * Check if a set of feature flags meets certain criteria
   * @param flagNames Array of flag names to check
   * @param requireAll If true, all flags must be enabled; if false, at least one must be enabled
   */
  const checkFeatureFlags = useCallback((
    flagNames: string[], 
    requireAll: boolean = true
  ): boolean => {
    if (!posthog || flagNames.length === 0) return false;
    
    try {
      if (requireAll) {
        // All flags must be enabled
        return flagNames.every(flag => isFeatureEnabled(flag));
      } else {
        // At least one flag must be enabled
        return flagNames.some(flag => isFeatureEnabled(flag));
      }
    } catch (err) {
      console.error(`Error checking feature flags:`, err);
      return false;
    }
  }, [posthog, isFeatureEnabled]);
  
  // Re-export the enhanced useFeatureFlag hook
  const useFlag = useFeatureFlag;
  
  return {
    isFeatureEnabled,
    reloadFeatureFlags,
    checkFeatureFlags,
    useFlag,
    flagsLoaded
  };
}
