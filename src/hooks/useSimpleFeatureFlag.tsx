
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { usePostHog } from 'posthog-js/react';

/**
 * Simplified feature flag hook that relies on PostHog's native capabilities
 * No custom caching, identification checking, or manual state management
 */
export function useSimpleFeatureFlag(flagName: string): boolean {
  const posthog = usePostHog();
  const isEnabled = useFeatureFlagEnabled(flagName);
  
  // PostHog handles identification state internally
  // We trust PostHog to return correct values based on current user state
  return Boolean(isEnabled && posthog);
}

export default useSimpleFeatureFlag;
