
/**
 * Simplified PostHog identity management
 * Let PostHog handle persistence and state management
 */

import posthog from 'posthog-js';

/**
 * Identify user - simple and direct
 */
export const identifyUser = (distinctId: string, properties?: Record<string, any>) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.identify) {
      posthog.identify(distinctId, properties);
    }
  } catch (error) {
    console.error('PostHog identify error:', error);
  }
};

/**
 * Get current distinct ID
 */
export const getCurrentUserId = (): string | null => {
  try {
    if (typeof posthog !== 'undefined' && posthog.get_distinct_id) {
      return posthog.get_distinct_id();
    }
  } catch (error) {
    console.error('PostHog get distinct ID error:', error);
  }
  return null;
};

/**
 * Reset identity
 */
export const resetIdentity = () => {
  try {
    if (typeof posthog !== 'undefined' && posthog.reset) {
      posthog.reset();
    }
  } catch (error) {
    console.error('PostHog reset error:', error);
  }
};
