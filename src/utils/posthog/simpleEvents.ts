
/**
 * Simplified PostHog event tracking
 * Direct, clean interface with minimal abstraction
 */

import posthog from 'posthog-js';

/**
 * Track a simple event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    console.error('PostHog event tracking error:', error);
  }
};

/**
 * Track an event with group context
 */
export const trackGroupEvent = (
  eventName: string, 
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(eventName, {
        ...properties,
        $groups: { [groupType]: groupKey }
      });
    }
  } catch (error) {
    console.error('PostHog group event tracking error:', error);
  }
};
