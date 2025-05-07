
import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * A simple wrapper for the PostHog useFeatureFlagEnabled hook
 * This provides a consistent way to use feature flags in the application
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const enabled = useFeatureFlagEnabled(flagName);
  
  // Return the flag value with a fallback to false for safety
  return enabled || false;
}

export default useFeatureFlag;
