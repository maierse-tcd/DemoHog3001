
/**
 * PostHog groups management utilities - Simplified
 */

import { getPostHogInstance, isPostHogAvailable } from './core';

// Store last identified groups in memory (not localStorage to avoid persistence issues)
const lastIdentifiedGroups = new Map<string, string>();

/**
 * Get the last identified groups - PostHog doesn't provide group retrieval
 * so we return empty object as groups are write-only in PostHog
 */
export const getLastGroups = (): Record<string, string> => {
  // PostHog groups are write-only, no retrieval API available
  return {};
};

/**
 * Set a group for the current user - with in-memory cache
 */
export const setLastGroup = (groupType: string, groupKey: string): void => {
  lastIdentifiedGroups.set(groupType, groupKey);
  console.log(`PostHog: Cached group ${groupType}:${groupKey}`);
};

/**
 * Get the last identified group of a specific type from in-memory cache
 */
export const getLastIdentifiedGroup = (groupType: string): string | null => {
  return lastIdentifiedGroups.get(groupType) || null;
};

/**
 * Safely identify a group in PostHog - with duplicate prevention
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
        // Check if already identified to prevent duplicates
        const lastGroup = getLastIdentifiedGroup(groupType);
        if (lastGroup === groupKey) {
          console.log(`PostHog: Group ${groupType}:${groupKey} already identified, skipping`);
          return;
        }
        
        console.log(`PostHog: Identifying group ${groupType}:${groupKey}`, properties);
        posthogInstance.group(groupType, groupKey, properties);
        setLastGroup(groupType, groupKey); // Cache after successful identification
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
