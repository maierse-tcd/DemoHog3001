
/**
 * PostHog event tracking utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

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
export const safeCaptureWithGroup = (
  eventName: string, 
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
): void => {
  if (!eventName || !groupType || !groupKey) {
    console.warn("Missing required parameters for captureWithGroup");
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

/**
 * Safely reload feature flags
 */
export const safeReloadFeatureFlags = async (): Promise<void> => {
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance) {
    try {
      await posthogInstance.reloadFeatureFlags();
      console.log("PostHog: Feature flags reloaded");
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  }
};

/**
 * Safely check if a feature flag is enabled
 */
export const safeIsFeatureEnabled = (flag: string): boolean => {
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance) {
    try {
      return !!posthogInstance.isFeatureEnabled(flag);
    } catch (err) {
      console.error(`Error checking feature flag ${flag}:`, err);
    }
  }
  return false;
};
