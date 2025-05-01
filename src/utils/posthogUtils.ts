
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
 * Uses email as the primary identifier for consistent cross-platform identification
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (typeof window === 'undefined' || !window.posthog) {
    console.warn("PostHog not available, identification skipped");
    return;
  }
  
  try {
    if (isPostHogInstance(window.posthog)) {
      // Check if PostHog is ready to identify users
      if (!window.posthog.config) {
        console.warn("PostHog not fully initialized yet, identification may fail");
      }
      
      // Get current distinct ID to check if we need to identify
      const currentId = window.posthog.get_distinct_id?.();
      console.log(`Current PostHog distinct ID: ${currentId}, identifying as: ${distinctId}`);
      
      // Identify the user
      window.posthog.identify(distinctId, properties);
      console.log(`PostHog: User identified with ID: ${distinctId}`);
    }
  } catch (err) {
    console.error("PostHog identify error:", err);
  }
};

/**
 * Get the current anonymous ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.get_distinct_id === 'function') {
        const currentId = window.posthog.get_distinct_id();
        console.log(`PostHog: Current distinct ID: ${currentId}`);
        return currentId;
      }
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  }
  return null;
};

/**
 * Reset PostHog identity (for logout)
 */
export const safeReset = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        console.log("PostHog: Resetting user identity");
        window.posthog.reset();
      }
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  }
};

/**
 * Safely reload feature flags
 */
export const safeReloadFeatureFlags = async (): Promise<void> => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        await window.posthog.reloadFeatureFlags();
        console.log("PostHog: Feature flags reloaded");
      }
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  }
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
