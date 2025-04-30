
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagName: string): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined') {
      setEnabled(undefined);
      return;
    }
    
    let isMounted = true;
    
    // Wait for PostHog to be initialized
    const checkPostHog = () => {
      if (!window.posthog) {
        // PostHog not available yet, retry after a short delay
        setTimeout(checkPostHog, 100);
        return;
      }
      
      try {
        // Initial check when PostHog is available
        const initialValue = window.posthog.isFeatureEnabled(flagName);
        console.log(`Feature flag ${flagName} initial value:`, initialValue);
        
        if (isMounted) {
          setEnabled(initialValue);
        }
        
        // Set up listener for flag changes
        const onFlagChange = () => {
          try {
            const newValue = window.posthog.isFeatureEnabled(flagName);
            console.log(`Feature flag ${flagName} updated:`, newValue);
            
            if (isMounted) {
              setEnabled(newValue);
            }
          } catch (err) {
            console.error(`Error checking feature flag ${flagName}:`, err);
          }
        };
        
        // Register callback for flag updates
        if (window.posthog.onFeatureFlags) {
          window.posthog.onFeatureFlags(onFlagChange);
        }
        
        // Ensure flags are loaded
        if (!window.posthog.featureFlags || 
            !window.posthog.featureFlags.currentFlags || 
            Object.keys(window.posthog.featureFlags.currentFlags).length === 0) {
          console.log("Reloading feature flags...");
          window.posthog.reloadFeatureFlags();
        }
        
        return () => {
          isMounted = false;
          if (window.posthog && window.posthog.onFeatureFlags) {
            try {
              window.posthog.onFeatureFlags(onFlagChange, true); // Remove listener
            } catch (e) {
              console.error('Error removing PostHog feature flag listener:', e);
            }
          }
        };
      } catch (error) {
        console.error('Error in useFeatureFlag hook:', error);
        if (isMounted) {
          setEnabled(undefined);
        }
        return () => { 
          isMounted = false;
        };
      }
    };
    
    // Start checking for PostHog
    checkPostHog();
    
    return () => {
      isMounted = false;
    };
  }, [flagName]);
  
  return enabled;
}
