
/**
 * PostHog group management utilities
 */

import { getPostHogInstance, isPostHogAvailable, isPostHogInstance } from './core';
import posthog from 'posthog-js';
import { slugifyGroupKey } from './helpers';

// Local storage key for caching groups
const LAST_GROUPS_STORAGE_KEY = 'posthog_last_groups';

// List of group types that should use slugified keys
const SLUGIFY_GROUP_TYPES = ['subscription'];

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
  // Process the group key - slugify for certain group types
  const processedKey = SLUGIFY_GROUP_TYPES.includes(groupType) 
    ? slugifyGroupKey(groupKey)
    : groupKey;
    
  // Skip if this is the same group as last time
  const lastGroup = getLastIdentifiedGroup(groupType);
  if (lastGroup === processedKey) {
    console.log(`PostHog: User already identified with ${groupType} group: ${processedKey}, skipping`);
    return;
  }

  // CRITICAL: Ensure name property matches the processed key exactly
  const groupProperties = {
    name: processedKey, // CRITICAL for group to appear in UI
    // Store original value as display_name if we slugified
    ...(processedKey !== groupKey ? { display_name: groupKey } : {}),
    ...(properties || {})
  };

  if (isPostHogAvailable()) {
    try {
      console.log(`PostHog: Identifying user with ${groupType} group: ${processedKey}`);
      
      // Step 1: Use group method to associate user with group
      posthog.group(groupType, processedKey, groupProperties);
      console.log(`PostHog: User associated with ${groupType} group: ${processedKey}`);
      
      // Step 2: Send explicit $groupidentify event with $group_set
      // This is REQUIRED for groups to appear in the PostHog UI
      posthog.capture('$groupidentify', {
        $group_type: groupType,
        $group_key: processedKey,
        $group_set: groupProperties
      });
      
      // Step 3: Send a reinforcement event with group context
      posthog.capture(`${groupType}_identified`, {
        group_type: groupType,
        group_key: processedKey,
        timestamp: new Date().toISOString(),
        $groups: {
          [groupType]: processedKey
        }
      });
      
      console.log(`PostHog: Group identify event sent for ${groupType}:${processedKey}`);
      
      // Update the stored group
      setLastGroup(groupType, processedKey);
      
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:`, err);
    }
  } else if (typeof window !== 'undefined' && window.posthog) {
    try {
      const instance = window.posthog;
      // Check if posthog is an instance with the required methods
      if (isPostHogInstance(instance)) {
        console.log(`PostHog: Identifying user with ${groupType} group: ${processedKey}`);
        
        // Step 1: Use group method to associate user with group
        instance.group(groupType, processedKey, groupProperties);
        console.log(`PostHog: User associated with ${groupType} group: ${processedKey}`);
        
        // Step 2: Send explicit $groupidentify event with $group_set
        instance.capture('$groupidentify', {
          $group_type: groupType,
          $group_key: processedKey,
          $group_set: groupProperties
        });
        
        // Step 3: Send a reinforcement event with group context
        instance.capture(`${groupType}_identified`, {
          group_type: groupType,
          group_key: processedKey,
          timestamp: new Date().toISOString(),
          $groups: {
            [groupType]: processedKey
          }
        });
        
        console.log(`PostHog: Group identify event sent for ${groupType}:${processedKey}`);
        
        // Update the stored group
        setLastGroup(groupType, processedKey);
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
 * Safely capture an event with group context
 * @param eventName The name of the event to capture
 * @param groupType The type of group to associate the event with
 * @param groupKey The identifier for the specific group
 * @param properties Additional event properties
 */
export const safeCaptureWithGroup = (
  eventName: string, 
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
): void => {
  // Process the group key - slugify for certain group types
  const processedKey = SLUGIFY_GROUP_TYPES.includes(groupType) 
    ? slugifyGroupKey(groupKey)
    : groupKey;
    
  const eventProperties = {
    ...properties,
    $groups: {
      [groupType]: processedKey
    }
  };
  
  try {
    if (isPostHogAvailable()) {
      posthog.capture(eventName, eventProperties);
    } else if (typeof window !== 'undefined' && window.posthog) {
      const instance = window.posthog;
      if (isPostHogInstance(instance)) {
        instance.capture(eventName, eventProperties);
      }
    }
  } catch (err) {
    console.error(`Error capturing event with group context: ${eventName}`, err);
  }
};

