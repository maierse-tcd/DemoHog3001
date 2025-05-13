
/**
 * Hook for working with PostHog feature flags
 */

import { useCallback } from 'react';
import { safeIsFeatureEnabled, safeReloadFeatureFlags } from '../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export function useFeatureFlags() {
  const posthog = usePostHog();
  
  /**
   * Check if a feature flag is enabled
   */
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return safeIsFeatureEnabled(flagName);
  }, []);
  
  /**
   * Reload all feature flags from the server
   */
  const reloadFeatureFlags = useCallback(async (): Promise<void> => {
    await safeReloadFeatureFlags();
  }, []);
  
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
    useFlag
  };
}
