
import { useEffect } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * A simple wrapper for the PostHog useFeatureFlagEnabled hook
 * This is a transition hook to allow gradual migration to the standard PostHog hook
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const enabled = useFeatureFlagEnabled(flagName);
  
  // For debugging purposes
  useEffect(() => {
    console.log(`Feature flag ${flagName} value:`, enabled);
  }, [flagName, enabled]);
  
  // Special case - my_list_override is deprecated and always returns false
  if (flagName === 'my_list_override') {
    return false;
  }
  
  return enabled || false;
}

export default useFeatureFlag;
