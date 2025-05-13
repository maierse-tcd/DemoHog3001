
/**
 * PostHog identity management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Local storage keys for caching
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';
const POSTHOG_LAST_ID_KEY = 'posthog_last_identified_user';

// Prevent overly frequent identifications
const MIN_IDENTIFY_INTERVAL = 10000; // 10 seconds
let lastIdentifyTime = 0;

/**
 * Safely identify a user in PostHog
 * Uses email as the primary identifier for consistent cross-platform identification
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (!distinctId) {
    console.error("Cannot identify with empty distinctId");
    return;
  }

  // Rate limit identify calls to prevent loops
  const now = Date.now();
  if (now - lastIdentifyTime < MIN_IDENTIFY_INTERVAL) {
    // Check if we're trying to identify the same user
    try {
      const lastId = localStorage.getItem(POSTHOG_LAST_ID_KEY);
      if (lastId === distinctId) {
        // Skip redundant identification
        return;
      }
    } catch (err) {
      // Ignore storage errors
    }
  }

  lastIdentifyTime = now;

  if (isPostHogAvailable()) {
    try {
      // Get current distinct ID to check if we need to identify
      const currentId = posthog.get_distinct_id?.();
      
      // Only identify if different to avoid unnecessary operations
      if (currentId !== distinctId) {
        console.log(`Identifying PostHog user: ${distinctId}`);
        
        // Store the last identified user in localStorage for debugging
        try {
          localStorage.setItem(POSTHOG_LAST_ID_KEY, distinctId);
        } catch (err) {
          // Ignore storage errors
        }
        
        // Ensure is_kids_account and language are included in properties if available
        const finalProperties = {
          ...(properties || {}),
          // Make sure to prioritize any provided values but include defaults if missing
          is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
          language: properties?.language || 'English' // Default to English if not provided
        };
        
        // Identify the user
        posthog.identify(distinctId, finalProperties);
        
        // Don't reload flags immediately - this causes loops
        // A separate, debounced call will handle flag reloads
      }
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
        
        // Only identify if different
        if (currentId !== distinctId) {
          console.log(`Identifying PostHog user: ${distinctId}`);
          
          // Store the last identified user in localStorage for debugging
          try {
            localStorage.setItem(POSTHOG_LAST_ID_KEY, distinctId);
          } catch (err) {
            // Ignore storage errors
          }
          
          // Ensure is_kids_account and language are included in properties if available
          const finalProperties = {
            ...(properties || {}),
            // Make sure to prioritize any provided values but include defaults if missing
            is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
            language: properties?.language || 'English' // Default to English if not provided
          };
          
          // Identify the user
          instance.identify(distinctId, finalProperties);
          
          // Don't reload flags immediately - this causes loops
          // A separate, debounced call will handle flag reloads
        }
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
      
      // Clear stored IDs before reset
      try {
        localStorage.removeItem(POSTHOG_LAST_ID_KEY);
      } catch (err) {
        // Ignore storage errors
      }
      
      // Clear stored groups
      clearStoredGroups();
      
      // Reset the PostHog identity
      posthogInstance.reset();
      console.log("PostHog: Identity reset complete");
      
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  } else {
    console.warn("PostHog reset function not available");
  }
};

/**
 * Clear the stored groups (e.g., on logout)
 */
export const clearStoredGroups = (): void => {
  try {
    localStorage.removeItem(LAST_GROUPS_STORAGE_KEY);
    console.log("PostHog: Cleared stored groups");
  } catch (err) {
    console.error("Error clearing stored groups:", err);
  }
};
