
/**
 * PostHog identity management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Local storage keys for caching
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';

/**
 * Safely identify a user in PostHog
 * Uses email as the primary identifier for consistent cross-platform identification
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (isPostHogAvailable()) {
    try {
      // Get current distinct ID to check if we need to identify
      const currentId = posthog.get_distinct_id?.();
      
      // Only log if different
      if (currentId !== distinctId) {
        console.log(`Current PostHog distinct ID: ${currentId}, identifying as: ${distinctId}`);
      }
      
      // Identify the user
      posthog.identify(distinctId, properties);
      console.log(`PostHog: User identified with ID: ${distinctId}`);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      const instance = window.posthog;
      // Add proper type guard to check if posthog is an instance with required methods
      if (isPostHogInstance(instance)) {
        // Get current distinct ID to check if we need to identify
        const currentId = instance.get_distinct_id?.();
        
        // Only log if different
        if (currentId !== distinctId) {
          console.log(`Current PostHog distinct ID: ${currentId}, identifying as: ${distinctId}`);
        }
        
        // Identify the user
        instance.identify(distinctId, properties);
        console.log(`PostHog: User identified with ID: ${distinctId}`);
      } else {
        console.warn("PostHog instance does not have required methods");
      }
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  } else {
    console.warn("PostHog not available, identification skipped");
  }
};

/**
 * Get the current anonymous ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.get_distinct_id === 'function') {
    try {
      const currentId = posthogInstance.get_distinct_id();
      return currentId;
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
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.reset === 'function') {
    try {
      console.log("PostHog: Resetting user identity");
      posthogInstance.reset();
      // Also clear stored groups
      clearStoredGroups();
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  }
};

/**
 * Clear the stored groups (e.g., on logout)
 */
export const clearStoredGroups = (): void => {
  try {
    localStorage.removeItem(LAST_GROUPS_STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing stored groups:", err);
  }
};
