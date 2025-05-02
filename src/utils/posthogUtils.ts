
/**
 * PostHog utility functions for safer and more consistent usage
 */

import { PostHog } from '../types/posthog';
import posthog from 'posthog-js';

// Consistent host configuration
export const POSTHOG_HOST = 'https://ph.hogflix.dev';

// Local storage keys for caching
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';

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
 * Get the stored last identified groups
 */
const getLastGroups = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(LAST_GROUPS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error("Error reading stored groups:", err);
    return {};
  }
};

/**
 * Store the last identified group
 */
const setLastGroup = (groupType: string, groupKey: string): void => {
  try {
    const groups = getLastGroups();
    groups[groupType] = groupKey;
    localStorage.setItem(LAST_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error("Error storing group:", err);
  }
};

/**
 * Get the last identified group of a specific type
 */
export const getLastIdentifiedGroup = (groupType: string): string | null => {
  const groups = getLastGroups();
  return groups[groupType] || null;
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
      if (isPostHogInstance(window.posthog)) {
        // Get current distinct ID to check if we need to identify
        const currentId = window.posthog.get_distinct_id?.();
        
        // Only log if different
        if (currentId !== distinctId) {
          console.log(`Current PostHog distinct ID: ${currentId}, identifying as: ${distinctId}`);
        }
        
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
  // Skip if this is the same group as last time
  const lastGroup = getLastIdentifiedGroup(groupType);
  if (lastGroup === groupKey) {
    console.log(`PostHog: User already identified with ${groupType} group: ${groupKey}, skipping`);
    return;
  }

  if (isPostHogAvailable()) {
    try {
      // Associate user with group and set properties
      posthog.group(groupType, groupKey, properties);
      console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
      
      // Update the stored group
      setLastGroup(groupType, groupKey);
      
      // Also capture an event with the group information for better tracking
      posthog.capture('group_identified', {
        $groups: {
          [groupType]: groupKey
        },
        group_type: groupType,
        group_key: groupKey
      });
      
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:`, err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.group === 'function') {
        window.posthog.group(groupType, groupKey, properties);
        console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
        
        // Update the stored group
        setLastGroup(groupType, groupKey);
        
        // Also capture an event with the group information for better tracking
        window.posthog.capture('group_identified', {
          $groups: {
            [groupType]: groupKey
          },
          group_type: groupType,
          group_key: groupKey
        });
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
      return currentId;
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.get_distinct_id === 'function') {
        const currentId = window.posthog.get_distinct_id();
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
      // Also clear stored groups
      clearStoredGroups();
    } catch (err) {
      console.error("PostHog reset error:", err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        console.log("PostHog: Resetting user identity");
        window.posthog.reset();
        // Also clear stored groups
        clearStoredGroups();
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
