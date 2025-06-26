
/**
 * PostHog groups management utilities - Simplified
 */

import { getPostHogInstance, isPostHogAvailable } from './core';

/**
 * Get the last identified groups - PostHog doesn't provide group retrieval
 * so we return empty object as groups are write-only in PostHog
 */
export const getLastGroups = (): Record<string, string> => {
  // PostHog groups are write-only, no retrieval API available
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
 * PostHog doesn't provide group retrieval, so this returns null
 */
export const getLastIdentifiedGroup = (groupType: string): string | null => {
  // PostHog groups are write-only, no retrieval API available
  return null;
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
