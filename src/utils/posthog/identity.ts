
/**
 * PostHog identity management utilities - Simplified
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

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
 * Safely identify a user in PostHog - Simplified approach
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (!distinctId) {
    console.error("Cannot identify with empty distinctId");
    return;
  }

  if (isPostHogAvailable()) {
    try {
      // Get current distinct ID to check if we need to identify
      const currentId = posthog.get_distinct_id?.();
      
      // Only identify if different to avoid unnecessary operations
      if (currentId !== distinctId) {
        console.log(`PostHog: Identifying user with distinct ID: ${distinctId}`);
        console.log(`PostHog: Properties:`, properties);
        
        // Ensure properties include email when possible
        const finalProperties = {
          ...(properties || {}),
          is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
          language: properties?.language || 'English',
          email: isValidEmailFormat(distinctId) ? distinctId : properties?.email || distinctId
        };
        
        // Identify the user
        posthog.identify(distinctId, finalProperties);
        console.log(`PostHog: Successfully identified user: ${distinctId}`);
      } else {
        console.log(`PostHog: User already identified as: ${distinctId}`);
      }
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      const instance = window.posthog;
      if (isPostHogInstance(instance)) {
        const currentId = instance.get_distinct_id?.();
        
        if (currentId !== distinctId) {
          console.log(`PostHog: Identifying user with distinct ID: ${distinctId}`);
          console.log(`PostHog: Properties:`, properties);
          
          const finalProperties = {
            ...(properties || {}),
            is_kids_account: properties?.is_kids_account !== undefined ? properties.is_kids_account : properties?.isKidsAccount,
            language: properties?.language || 'English',
            email: isValidEmailFormat(distinctId) ? distinctId : properties?.email || distinctId
          };
          
          instance.identify(distinctId, finalProperties);
          console.log(`PostHog: Successfully identified user: ${distinctId}`);
        } else {
          console.log(`PostHog: User already identified as: ${distinctId}`);
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
 * Get the current user ID from PostHog - Simplified
 */
export const safeGetDistinctId = (): string | null => {
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.get_distinct_id === 'function') {
    try {
      return posthogInstance.get_distinct_id();
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  }
  
  return null;
};

/**
 * Reset PostHog identity (for logout) - Simplified
 */
export const safeReset = (): void => {
  console.log("PostHog: Starting identity reset");
  
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
 * Clear the stored groups (e.g., on logout) - Simplified
 */
export const clearStoredGroups = (): void => {
  console.log("PostHog: Groups will be cleared by reset()");
  // Let PostHog's reset() handle group clearing
};
