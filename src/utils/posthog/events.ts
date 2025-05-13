
/**
 * PostHog event tracking utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Keep track of feature flag reloads to prevent excessive calls
let lastFeatureFlagReload = 0;
const MIN_RELOAD_INTERVAL = 10000; // 10 seconds - increased from 5s
let featureFlagReloadPromise: Promise<boolean> | null = null;

/**
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (isPostHogAvailable()) {
    try {
      posthog.capture(event, properties);
    } catch (err) {
      console.error("PostHog event capture error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.capture(event, properties);
      }
    } catch (err) {
      console.error("PostHog event capture error:", err);
    }
  }
};

/**
 * Helper function to capture events with group context
 * @param eventName The name of the event to capture
 * @param groupType The type of group to associate this event with
 * @param groupKey The identifier for the specific group
 * @param properties Additional event properties
 */
export const captureEventWithGroup = (
  eventName: string, 
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
): void => {
  if (!eventName || !groupType || !groupKey) {
    console.warn("Missing required parameters for captureEventWithGroup");
    return;
  }

  // Merge properties with group information
  const eventProperties = {
    ...properties,
    $groups: {
      [groupType]: groupKey
    }
  };

  safeCapture(eventName, eventProperties);
};

// Alias for backward compatibility - will be deprecated
export const safeCaptureWithGroup = captureEventWithGroup;

/**
 * Helper function for tracking A/B test events
 * @param eventName The name of the event
 * @param testName The name of the A/B test
 * @param variant The variant the user is seeing
 * @param properties Additional event properties
 */
export const captureTestEvent = (
  eventName: string,
  testName: string,
  variant: string | null,
  properties?: Record<string, any>
): void => {
  safeCapture(eventName, {
    ...properties,
    ab_test: testName,
    variant: variant || 'control',
    test_id: testName,
    timestamp: new Date().toISOString(),
    funnel_step: properties?.funnel_step || null,
    time_to_decide: properties?.time_to_decide || null,
    conversion_value: properties?.conversion_value || null
  });
};

/**
 * Safely reload feature flags with rate limiting and singleton promise
 */
export const safeReloadFeatureFlags = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Check if we've reloaded too recently
  if (now - lastFeatureFlagReload < MIN_RELOAD_INTERVAL) {
    console.log("Feature flag reload throttled - too soon since last reload");
    return false;
  }
  
  // If a reload is already in progress, return that promise
  if (featureFlagReloadPromise) {
    return featureFlagReloadPromise;
  }
  
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance) {
    try {
      lastFeatureFlagReload = now;
      
      // Create a new promise for this reload
      featureFlagReloadPromise = new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await posthogInstance.reloadFeatureFlags();
            console.log("PostHog: Feature flags reloaded");
            resolve(true);
          } catch (err) {
            console.error("Error reloading feature flags:", err);
            resolve(false);
          } finally {
            // Clear the promise reference after a delay to prevent immediate subsequent calls
            setTimeout(() => {
              featureFlagReloadPromise = null;
            }, 1000);
          }
        }, 100); // Small delay to batch potential concurrent requests
      });
      
      return await featureFlagReloadPromise;
    } catch (err) {
      console.error("Error initiating feature flag reload:", err);
      featureFlagReloadPromise = null;
      return false;
    }
  }
  
  return false;
};

/**
 * Safely check if a feature flag is enabled
 */
export const safeIsFeatureEnabled = (flag: string): boolean => {
  const posthogInstance = getPostHogInstance();
  
  // No instance, return false as it's safer
  if (!posthogInstance) {
    return false;
  }
  
  try {
    return !!posthogInstance.isFeatureEnabled(flag);
  } catch (err) {
    console.error(`Error checking feature flag ${flag}:`, err);
    return false;
  }
};
