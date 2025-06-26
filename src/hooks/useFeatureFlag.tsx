
import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Simplified feature flag hook that trusts PostHog's native capabilities
 * No custom state management, identification checking, or event listeners
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use PostHog's official hook directly - it handles identification state internally
  const isEnabled = useFeatureFlagEnabled(flagName);
  
  // PostHog returns undefined/null when user isn't identified
  // Convert to boolean for consistent API
  return Boolean(isEnabled);
}

export default useFeatureFlag;
