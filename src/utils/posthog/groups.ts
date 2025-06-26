
/**
 * PostHog groups management utilities - Simplified
 */

import { getPostHogInstance, isPostHogAvailable } from './core';

/**
 * Get the last identified groups from PostHog itself (not localStorage)
 */
export const getLastGroups = (): Record<string, string> => {
  const posthogInstance = getPostHogInstance();
  
  if (posthogInstance && typeof posthogInstance.getGroups === 'function') {
    try {
      return posthogInstance.getGroups() || {};
    } catch (err) {
      console.error("Error getting groups from PostHog:", err);
    }
  }
  
  return {};
};

/**
 * Set a group for the current user - Simplified
 */
export const setLastGroup = (groupType: string, groupKey: string): void => {
  console.log(`PostHog: Group ${groupType}:${groupKey} will be managed by PostHog internally`);
  // Let PostHog handle group persistence
};

/**
 * Get the last identified group of a specific type
 */
export const getLastIdentifiedGroup = (groupType: string): string | null => {
  const groups = getLastGroups();
  return groups[groupType] || null;
};

/**
 * Safely identify a group in PostHog - Simplified
 */
export const safeGroupIdentify = (
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
): void => {
  if (isPostHogAvailable()) {
    try {
      const posthogInstance = getPostHogInstance();
      
      if (posthogInstance && typeof posthogInstance.group === 'function') {
        console.log(`PostHog: Identifying group ${groupType}:${groupKey}`, properties);
        posthogInstance.group(groupType, groupKey, properties);
        console.log(`PostHog: Successfully identified group ${groupType}:${groupKey}`);
      } else {
        console.warn("PostHog group method not available");
      }
    } catch (err) {
      console.error(`PostHog group identify error for ${groupType}:${groupKey}:`, err);
    }
  } else {
    console.warn("PostHog not available, group identification skipped");
  }
};
