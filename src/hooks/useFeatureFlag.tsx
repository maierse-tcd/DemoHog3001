
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagName: string): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    // Check if PostHog is available in the window object
    if (typeof window !== 'undefined' && window.posthog) {
      // Initial check
      const initialValue = window.posthog.isFeatureEnabled(flagName);
      setEnabled(initialValue);
      
      // Listen for flag changes
      const onFeatureFlagsCallback = () => {
        const newValue = window.posthog.isFeatureEnabled(flagName);
        if (newValue !== enabled) {
          setEnabled(newValue);
        }
      };
      
      // Register callback for flag updates
      window.posthog.onFeatureFlags(onFeatureFlagsCallback);
      
      // Force reload feature flags to ensure we have the latest values
      window.posthog.reloadFeatureFlags();
      
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
      // If PostHog is not available, set to undefined
      setEnabled(undefined);
      return undefined;
    }
  }, [flagName, enabled]);
  
  return enabled;
}
