
/**
 * React hooks for PostHog functionality
 * Provides easy access to PostHog features in React components
 */

export { useFeatureFlag } from '../../hooks/useFeatureFlag';
export { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';

// Export our custom hooks
export { useEventTracking } from './useEventTracking';
export { useFeatureFlags } from './useFeatureFlags';
export { useUserIdentity } from './useUserIdentity';
export { useGroupManagement } from './useGroupManagement';
