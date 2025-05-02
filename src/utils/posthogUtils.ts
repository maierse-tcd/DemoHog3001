
/**
 * PostHog utility functions for safer and more consistent usage
 */

import { PostHog } from '../types/posthog';
import posthog from 'posthog-js';

// Consistent host configuration
export const POSTHOG_HOST = 'https://ph.hogflix.dev';

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
 * Check if PostHog is available and initialized
 */
export const isPostHogAvailable = (): boolean => {
  return typeof posthog !== 'undefined' && 
         typeof posthog.capture === 'function';
};

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
 * Safely identify a user in PostHog
 * Uses email as the primary identifier for consistent cross-platform identification
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (isPostHogAvailable()) {
    try {
      // Get current distinct ID to check if we need to identify
      const currentId = posthog.get_distinct_id?.();
      console.log(`Current PostHog distinct ID: ${currentId}, identifying as: ${distinctId}`);
      
      // Identify the user
      posthog.identify(distinctId, properties);
      console.log(`PostHog: User identified with ID: ${distinctId}`);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
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
  } else {
    console.warn("PostHog not available, identification skipped");
  }
};

/**
 * Safely associate a user with a group in PostHog
 * @param groupType The type of group (e.g., 'company', 'team', 'user_type')
 * @param groupKey The unique identifier for the group
 * @param properties Optional properties to set for the group
 */
export const safeGroupIdentify = (groupType: string, groupKey: string, properties?: Record<string, any>): void => {
  if (isPostHogAvailable()) {
    try {
      // Associate user with group and set properties
      posthog.group(groupType, groupKey, properties);
      console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:`, err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.group === 'function') {
        window.posthog.group(groupType, groupKey, properties);
        console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
      } else {
        console.warn("PostHog group function not available");
      }
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:`, err);
    }
  } else {
    console.warn("PostHog not available, group identification skipped");
  }
};

/**
 * Get the current anonymous ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  if (isPostHogAvailable()) {
    try {
      const currentId = posthog.get_distinct_id();
      console.log(`PostHog: Current distinct ID: ${currentId}`);
      return currentId;
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
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
  if (isPostHogAvailable()) {
    try {
      console.log("PostHog: Resetting user identity");
      posthog.reset();
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
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
  if (isPostHogAvailable()) {
    try {
      await posthog.reloadFeatureFlags();
      console.log("PostHog: Feature flags reloaded");
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
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
  if (isPostHogAvailable()) {
    try {
      return !!posthog.isFeatureEnabled(flag);
    } catch (err) {
      console.error(`Error checking feature flag ${flag}:`, err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
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
