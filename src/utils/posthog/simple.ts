
/**
 * Simplified PostHog utilities
 * Clean, focused API for PostHog integration
 */

import posthog from 'posthog-js';

// Re-export simplified utilities
export { trackEvent, trackGroupEvent } from './simpleEvents';
export { identifyUser, getCurrentUserId, resetIdentity } from './simpleIdentity';
export { identifyGroup, setUserType, setSubscriptionPlan } from './simpleGroups';

// Re-export core utilities that are still useful
export { isPostHogAvailable, getPostHogInstance } from './core';

// Helper to check if PostHog is ready
export const isPostHogReady = (): boolean => {
  return typeof posthog !== 'undefined' && typeof posthog.capture === 'function';
};
