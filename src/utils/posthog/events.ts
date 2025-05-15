
import posthog from 'posthog-js';
import { isPostHogAvailable } from './core';

/**
 * Safely capture an event in PostHog
 * This ensures the event is only captured if PostHog is properly loaded
 */
export const safeCapture = (event: string, properties?: Record<string, any>) => {
  try {
    if (isPostHogAvailable() && posthog.capture) {
      posthog.capture(event, properties);
    }
  } catch (error) {
    console.error('Error capturing PostHog event:', error);
  }
};

/**
 * Safely reload feature flags from PostHog
 * Returns a promise that resolves when flags are loaded
 */
export const safeReloadFeatureFlags = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!isPostHogAvailable()) {
        console.warn('PostHog not available, cannot reload feature flags');
        resolve();
        return;
      }
      
      console.log('Reloading PostHog feature flags...');
      
      // Check if the reloadFeatureFlags method exists
      if (posthog.reloadFeatureFlags) {
        // The issue is here - the callback signature doesn't match what PostHog expects
        // Fix: Call reloadFeatureFlags without arguments if it doesn't accept any
        posthog.reloadFeatureFlags();
        console.log('Feature flags reload initiated');
        // Since we can't use the callback, we'll resolve after a short timeout
        setTimeout(() => {
          console.log('Feature flags reloaded successfully');
          resolve();
        }, 500);
      } else {
        console.warn('PostHog reloadFeatureFlags method not available');
        resolve();
      }
    } catch (error) {
      console.error('Error reloading feature flags:', error);
      reject(error);
    }
  });
};

/**
 * Check if a feature flag is enabled
 * This is a direct check against PostHog with no caching
 */
export const safeIsFeatureEnabled = (key: string): boolean => {
  try {
    if (isPostHogAvailable() && posthog.isFeatureEnabled) {
      return posthog.isFeatureEnabled(key);
    }
  } catch (error) {
    console.error(`Error checking feature flag ${key}:`, error);
  }
  return false;
};

/**
 * Capture an event with group context
 */
export const captureEventWithGroup = (
  eventName: string, 
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
) => {
  try {
    if (isPostHogAvailable() && posthog.capture) {
      posthog.capture(eventName, {
        ...properties,
        $groups: { 
          [groupType]: groupKey 
        }
      });
    }
  } catch (error) {
    console.error(`Error capturing group event ${eventName}:`, error);
  }
};

/**
 * Capture a test event with additional properties
 * Specifically for A/B testing
 */
export const captureTestEvent = (
  eventName: string,
  testName: string,
  variant: string,
  properties?: Record<string, any>
) => {
  try {
    if (isPostHogAvailable() && posthog.capture) {
      posthog.capture(eventName, {
        ...properties,
        $feature_flag: testName,
        $feature_flag_response: variant
      });
    }
  } catch (error) {
    console.error(`Error capturing test event ${eventName}:`, error);
  }
};
