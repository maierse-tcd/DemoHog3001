
/**
 * PostHog group management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';

// Local storage key for caching groups
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';

/**
 * Get the stored last identified groups
 */
export const getLastGroups = (): Record<string, string> => {
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
export const setLastGroup = (groupType: string, groupKey: string): void => {
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

  // Ensure essential properties are included
  const groupProperties = {
    name: groupKey, // Essential for group to appear in UI
    ...(properties || {})
  };

  if (isPostHogAvailable()) {
    try {
      // Step 1: Use group method to associate user with group
      posthog.group(groupType, groupKey, groupProperties);
      console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
      
      // Step 2: Send explicit $groupidentify event with $group_set
      // This is REQUIRED for groups to appear in the PostHog UI
      posthog.capture('$groupidentify', {
        $group_type: groupType,
        $group_key: groupKey,
        $group_set: groupProperties
      });
      
      console.log(`PostHog: Group identify event sent for ${groupType}:${groupKey}`);
      
      // Update the stored group
      setLastGroup(groupType, groupKey);
      
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:`, err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      const instance = window.posthog;
      // Check if posthog is an instance with the required methods
      if (isPostHogInstance(instance)) {
        // Step 1: Use group method to associate user with group
        instance.group(groupType, groupKey, groupProperties);
        console.log(`PostHog: User associated with ${groupType} group: ${groupKey}`);
        
        // Step 2: Send explicit $groupidentify event with $group_set
        instance.capture('$groupidentify', {
          $group_type: groupType,
          $group_key: groupKey,
          $group_set: groupProperties
        });
        
        console.log(`PostHog: Group identify event sent for ${groupType}:${groupKey}`);
        
        // Update the stored group
        setLastGroup(groupType, groupKey);
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
