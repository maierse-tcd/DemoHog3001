
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagName: string): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    // Check if PostHog is available in the window object
    if (window.posthog) {
      // Initial check
      const initialValue = window.posthog.isFeatureEnabled(flagName);
      setEnabled(initialValue);
      
      // Listen for flag changes
      const onFeatureFlagsCallback = () => {
        const newValue = window.posthog.isFeatureEnabled(flagName);
        setEnabled(newValue);
      };
      
      // Register callback for flag updates
      window.posthog.onFeatureFlags(onFeatureFlagsCallback);
      
      return () => {
        // Clean up by removing the listener when the component unmounts
        if (window.posthog && typeof window.posthog.onFeatureFlags === 'function') {
          try {
            // Some versions of PostHog require you to pass the same function reference to remove
            window.posthog.onFeatureFlags(onFeatureFlagsCallback, true); // true to remove
          } catch (e) {
            console.error('Error removing PostHog feature flag listener:', e);
          }
        }
      };
    } else {
      console.warn('PostHog not available for feature flag:', flagName);
      return undefined;
    }
  }, [flagName]);
  
  return enabled;
}
