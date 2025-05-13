
/**
 * PostHog identity management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Local storage keys for caching
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';
const POSTHOG_LAST_ID_KEY = 'posthog_last_identified_user';

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
        
        // Store the last identified user in localStorage for debugging
        try {
          localStorage.setItem(POSTHOG_LAST_ID_KEY, distinctId);
        } catch (err) {
          // Ignore storage errors
        }
      }
      
      // Identify the user
      posthog.identify(distinctId, properties);
      console.log(`PostHog: User identified with ID: ${distinctId}`);
      
      // Force reload feature flags after identification
      posthog.reloadFeatureFlags();
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
          
          // Store the last identified user in localStorage for debugging
          try {
            localStorage.setItem(POSTHOG_LAST_ID_KEY, distinctId);
          } catch (err) {
            // Ignore storage errors
          }
        }
        
        // Identify the user
        instance.identify(distinctId, properties);
        console.log(`PostHog: User identified with ID: ${distinctId}`);
        
        // Force reload feature flags
        instance.reloadFeatureFlags();
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
 * Get the current user ID from PostHog
 * 
 * IMPORTANT: This returns the user's ID in the format that matches what's in the database
 * For the user_my_list table, this should be the user ID string
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
  
  // If PostHog instance is not available, try to get from localStorage for debugging
  try {
    return localStorage.getItem(POSTHOG_LAST_ID_KEY);
  } catch (err) {
    // Ignore storage errors
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
      
      // Clear stored groups
      clearStoredGroups();
      
      // Clear last identified user
      try {
        localStorage.removeItem(POSTHOG_LAST_ID_KEY);
      } catch (err) {
        // Ignore storage errors
      }
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
