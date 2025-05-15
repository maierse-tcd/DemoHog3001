
/**
 * PostHog Utility Functions
 * 
 * This module provides a clean interface for capturing events and 
 * identifying users with PostHog without any caching mechanisms.
 */

import posthog from 'posthog-js';

/**
 * Safely capture an event in PostHog
 * This ensures the event is only captured if PostHog is properly loaded
 */
export const safeCapture = (event: string, properties?: Record<string, any>) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(event, properties);
    }
  } catch (error) {
    console.error('Error capturing PostHog event:', error);
  }
};

/**
 * Safely get the distinct ID from PostHog
 * This ensures we don't crash if PostHog isn't loaded
 */
export const safeGetDistinctId = (): string | null => {
  try {
    if (typeof posthog !== 'undefined' && posthog.get_distinct_id) {
      return posthog.get_distinct_id();
    }
  } catch (error) {
    console.error('Error getting PostHog distinct ID:', error);
  }
  return null;
};

/**
 * Safely check if a user has a feature flag enabled
 * This is a direct check against PostHog with no caching
 */
export const safeIsFeatureEnabled = (key: string): boolean => {
  try {
    if (typeof posthog !== 'undefined' && posthog.isFeatureEnabled) {
      return posthog.isFeatureEnabled(key);
    }
  } catch (error) {
    console.error(`Error checking feature flag ${key}:`, error);
  }
  return false;
};
