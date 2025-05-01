
/**
 * PostHog utility functions for safer and more consistent usage
 */

import { PostHog } from '../types/posthog';

/**
 * Type guard to check if an object is a PostHog instance
 */
export const isPostHogInstance = (obj: any): obj is PostHog => {
  return obj && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         typeof obj.capture === 'function';
};

/**
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
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
 * Safely identify a user in PostHog
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.identify(distinctId, properties);
      }
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }
};

/**
 * Reset PostHog identity (for logout)
 */
export const safeReset = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.reset();
      }
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  }
};

/**
 * Get the current distinct ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.get_distinct_id === 'function') {
        return window.posthog.get_distinct_id();
      }
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  }
  return null;
};

/**
 * Safely check if a feature flag is enabled
 */
export const safeIsFeatureEnabled = (flag: string): boolean => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        return !!window.posthog.isFeatureEnabled(flag);
      }
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
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        await window.posthog.reloadFeatureFlags();
      }
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  }
};

/**
 * Override feature flags (for debugging)
 */
export const safeOverrideFeatureFlags = (flags: Record<string, boolean | string>): void => {
  if (typeof window !== 'undefined' && window.posthog?.featureFlags?.override) {
    try {
      window.posthog.featureFlags.override(flags);
    } catch (err) {
      console.error("Error overriding feature flags:", err);
    }
  }
};

/**
 * Remove all feature flag overrides
 */
export const safeRemoveFeatureFlags = (): void => {
  if (typeof window !== 'undefined' && window.posthog?.featureFlags?.override) {
    try {
      // Reset all overrides by passing an empty object
      window.posthog.featureFlags.override({});
    } catch (err) {
      console.error("Error removing feature flag overrides:", err);
    }
  }
};
