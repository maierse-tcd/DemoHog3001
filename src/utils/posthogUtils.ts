
/**
 * Utility functions for safely interacting with PostHog
 */

import { isPostHogInstance } from '../types/posthog.d';

/**
 * Check if PostHog is properly initialized
 */
export const isPostHogReady = (): boolean => {
  return typeof window !== 'undefined' && 
         window.posthog !== undefined && 
         isPostHogInstance(window.posthog);
};

/**
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (isPostHogReady()) {
    try {
      window.posthog.capture(event, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }
};

/**
 * Safely identify a user in PostHog
 */
export const safeIdentify = (
  distinctId: string, 
  properties?: Record<string, any>
): void => {
  if (isPostHogReady()) {
    try {
      window.posthog.identify(distinctId, properties);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }
};

/**
 * Safely reset user identity in PostHog
 */
export const safeReset = (): void => {
  if (isPostHogReady()) {
    try {
      window.posthog.reset();
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  }
};

/**
 * Safely check if a feature flag is enabled
 */
export const safeIsFeatureEnabled = (flag: string): boolean => {
  if (isPostHogReady()) {
    try {
      return window.posthog.isFeatureEnabled(flag);
    } catch (err) {
      console.error(`Error checking feature flag ${flag}:`, err);
    }
  }
  return false;
};

/**
 * Safely reload feature flags
 */
export const safeReloadFeatureFlags = async (): Promise<void> => {
  if (isPostHogReady()) {
    try {
      await window.posthog.reloadFeatureFlags();
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  }
};

/**
 * Safely register a callback for feature flag changes
 */
export const safeOnFeatureFlags = (callback: () => void): void => {
  if (isPostHogReady()) {
    try {
      window.posthog.onFeatureFlags(callback);
    } catch (err) {
      console.error("Error setting feature flag callback:", err);
    }
  }
};

/**
 * Safely set user properties
 */
export const safePeopleSet = (properties: Record<string, any>): void => {
  if (isPostHogReady() && window.posthog.people) {
    try {
      window.posthog.people.set(properties);
    } catch (err) {
      console.error("Error setting people properties:", err);
    }
  }
};

/**
 * Safely override feature flags
 */
export const safeOverrideFeatureFlags = (flags: Record<string, boolean | string>): void => {
  if (isPostHogReady() && window.posthog.featureFlags) {
    try {
      window.posthog.featureFlags.override(flags);
    } catch (err) {
      console.error("Error overriding feature flags:", err);
    }
  }
};
