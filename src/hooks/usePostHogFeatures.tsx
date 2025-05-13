
import { useCallback } from 'react';
import { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';
import { usePostHogContext } from '../contexts/PostHogContext';
import { useFeatureFlag } from './useFeatureFlag';

// Re-export all official hooks for consistency in our app
export { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
};

// Re-export our enhanced feature flag hook
export { useFeatureFlag };

/**
 * Enhanced hook for tracking and managing PostHog features
 */
export function usePostHogTracker() {
  const {
    captureEvent,
    captureGroupEvent,
    identifyUserGroup,
    identifySubscriptionGroup
  } = usePostHogContext();
  
  return {
    captureEvent,
    captureGroupEvent,
    identifyUserGroup,
    identifySubscriptionGroup
  };
}

/**
 * Hook for managing user type (Kid/Adult)
 */
export function usePostHogUser() {
  const { updateUserType, identifyUserGroup } = usePostHogContext();
  
  return { updateUserType, identifyUserGroup };
}

/**
 * Hook for managing subscriptions
 */
export function usePostHogSubscription() {
  const { updateSubscription, identifySubscriptionGroup } = usePostHogContext();
  
  return { updateSubscription, identifySubscriptionGroup };
}

/**
 * Legacy hook to maintain backwards compatibility
 */
export function usePostHogGroups() {
  const { identifyUserGroup, identifySubscriptionGroup } = usePostHogContext();
  
  // Legacy identifyGroup method
  const identifyGroup = useCallback((groupType: string, groupKey: string, properties?: Record<string, any>) => {
    if (groupType === 'user_type') {
      identifyUserGroup(groupKey, properties);
    } else if (groupType === 'subscription') {
      identifySubscriptionGroup(groupKey, properties);
    } 
    // Add more group types as needed
  }, [identifyUserGroup, identifySubscriptionGroup]);
  
  return { identifyGroup };
}

/**
 * Legacy event tracking hook
 */
export function usePostHogEvent() {
  const { captureEvent, captureGroupEvent } = usePostHogContext();
  
  return { captureEvent, captureGroupEvent };
}

/**
 * Legacy identity management
 */
export function usePostHogIdentity() {
  const posthog = usePostHog();
  
  const identifyUser = useCallback((userId: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      posthog.identify(userId, properties);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, [posthog]);
  
  return { identifyUser };
}

/**
 * Helper hook for easier access to common PostHog methods
 */
export function usePostHogHelper() {
  const { updateUserType, updateSubscription, captureEvent } = usePostHogContext();
  
  return { updateUserType, updateSubscription, captureEvent };
}
