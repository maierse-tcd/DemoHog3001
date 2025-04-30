
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagName: string): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    // Check if PostHog is available in the window object
    if (typeof window !== 'undefined' && window.posthog) {
      try {
        // Initial check
        const initialValue = window.posthog.isFeatureEnabled(flagName);
        setEnabled(initialValue);
        
        // Listen for flag changes
        const onFeatureFlagsCallback = () => {
          const newValue = window.posthog.isFeatureEnabled(flagName);
          setEnabled(newValue);
          console.log(`Feature flag ${flagName} updated:`, newValue);
        };
        
        // Register callback for flag updates
        window.posthog.onFeatureFlags(onFeatureFlagsCallback);
        
        // Ensure flags are loaded
        if (window.posthog.featureFlags.currentFlags === undefined || 
            Object.keys(window.posthog.featureFlags.currentFlags).length === 0) {
          window.posthog.reloadFeatureFlags();
        }
        
        return () => {
          // Clean up by removing the listener when the component unmounts
          if (window.posthog) {
            try {
              window.posthog.onFeatureFlags(onFeatureFlagsCallback, true); // true to remove
            } catch (e) {
              console.error('Error removing PostHog feature flag listener:', e);
            }
          }
        };
      } catch (error) {
        console.error('Error in useFeatureFlag hook:', error);
        setEnabled(undefined);
      }
    } else {
      // If PostHog is not available, set to undefined
      setEnabled(undefined);
    }
  }, [flagName]); // Remove dependency on enabled to prevent unnecessary re-renders
  
  return enabled;
}
