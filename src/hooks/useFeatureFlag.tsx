
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
  
  // Always show My List
  if (flagName === 'my_list_override') {
    return true;
  }
  
  return enabled || false;
}

export default useFeatureFlag;
