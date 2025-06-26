/**
 * PostHog identity management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Local storage keys for caching
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';
const POSTHOG_LAST_ID_KEY = 'posthog_last_identified_user';
const POSTHOG_EMAIL_CACHE_KEY = 'posthog_email_cache';

// Prevent overly frequent identifications
const MIN_IDENTIFY_INTERVAL = 10000; // 10 seconds
let lastIdentifyTime = 0;

/**
 * Check if a string looks like a valid email
 */
const isValidEmailFormat = (value: string): boolean => {
  return typeof value === 'string' && 
         value.includes('@') && 
         value.split('@').length === 2 && 
         value.split('@')[1].includes('.');
};

/**
 * Get cached email from localStorage if available
 */
const getCachedEmail = (): string | null => {
  try {
    return localStorage.getItem(POSTHOG_EMAIL_CACHE_KEY);
  } catch (err) {
    return null;
  }
};

/**
 * Cache email in localStorage
 */
const cacheEmail = (email: string): void => {
  if (!isValidEmailFormat(email)) return;
  
  try {
    localStorage.setItem(POSTHOG_EMAIL_CACHE_KEY, email);
  } catch (err) {
    // Ignore storage errors
  }
};

/**
 * Safely identify a user in PostHog
 * FIXED: Always prioritize the provided distinctId if it's a valid email
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (!distinctId) {
    console.error("Cannot identify with empty distinctId");
    return;
  }

  // FIXED: Always use the provided distinctId if it's a valid email
  let identifierId = distinctId;
  
  // Only fall back to cached email if distinctId is NOT an email format (like a UUID)
  if (!isValidEmailFormat(distinctId)) {
    const cachedEmail = getCachedEmail();
    if (cachedEmail) {
      console.log(`Using cached email for non-email distinctId: ${cachedEmail}`);
      identifierId = cachedEmail;
    }
  } else {
    // If the provided distinctId is an email, cache it and use it
    console.log(`Using provided email for identification: ${distinctId}`);
    cacheEmail(distinctId);
    identifierId = distinctId;
  }

  // Rate limit identify calls to prevent loops
  const now = Date.now();
  if (now - lastIdentifyTime < MIN_IDENTIFY_INTERVAL) {
    // Check if we're trying to identify the same user
    try {
      const lastId = localStorage.getItem(POSTHOG_LAST_ID_KEY);
      if (lastId === identifierId) {
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
      if (currentId !== identifierId) {
        console.log(`Identifying PostHog user: ${identifierId}`);
        
        // Store the last identified user in localStorage for debugging
        try {
          localStorage.setItem(POSTHOG_LAST_ID_KEY, identifierId);
        } catch (err) {
          // Ignore storage errors
        }
        
        // Ensure properties include email when possible
        const finalProperties = {
          ...(properties || {}),
          // Make sure to prioritize any provided values but include defaults if missing
          is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
          language: properties?.language || 'English', // Default to English if not provided
          email: isValidEmailFormat(identifierId) ? identifierId : properties?.email || identifierId
        };
        
        // Identify the user
        posthog.identify(identifierId, finalProperties);
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
        if (currentId !== identifierId) {
          console.log(`Identifying PostHog user: ${identifierId}`);
          
          // Store the last identified user in localStorage for debugging
          try {
            localStorage.setItem(POSTHOG_LAST_ID_KEY, identifierId);
          } catch (err) {
            // Ignore storage errors
          }
          
          // Ensure properties include email when possible
          const finalProperties = {
            ...(properties || {}),
            // Make sure to prioritize any provided values but include defaults if missing
            is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
            language: properties?.language || 'English', // Default to English if not provided
            email: isValidEmailFormat(identifierId) ? identifierId : properties?.email || identifierId
          };
          
          // Identify the user
          instance.identify(identifierId, finalProperties);
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
 * FIXED: Only fall back to cached email when PostHog doesn't have an email-format ID
 */
export const safeGetDistinctId = (): string | null => {
  // First try to get from PostHog instance
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.get_distinct_id === 'function') {
    try {
      const currentId = posthogInstance.get_distinct_id();
      
      // If the current ID is an email format, cache and return it
      if (isValidEmailFormat(currentId)) {
        cacheEmail(currentId);
        return currentId;
      }
      
      // If PostHog ID is not an email, check if we have a cached email
      const cachedEmail = getCachedEmail();
      if (cachedEmail && isValidEmailFormat(cachedEmail)) {
        return cachedEmail;
      }
      
      // Otherwise return the PostHog ID as is
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
 * Enhanced reset PostHog identity (for logout)
 */
export const safeReset = (): void => {
  console.log("PostHog: Starting identity reset");
  
  try {
    // Clear all PostHog-related localStorage keys first
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('posthog_') ||
        key === POSTHOG_LAST_ID_KEY ||
        key === POSTHOG_EMAIL_CACHE_KEY ||
        key === LAST_GROUPS_STORAGE_KEY
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`PostHog: Removed localStorage key: ${key}`);
    });
  } catch (err) {
    console.error("Error clearing PostHog localStorage:", err);
  }
  
  // Reset the PostHog instance
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.reset === 'function') {
    try {
      console.log("PostHog: Calling reset() on instance");
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
