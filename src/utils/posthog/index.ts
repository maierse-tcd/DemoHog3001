
/**
 * PostHog utilities index file
 * Re-exports all PostHog utilities for easy consumption
 */

// Re-export from core
export { 
  POSTHOG_HOST,
  isPostHogInstance,
  isPostHogAvailable,
  getPostHogInstance
} from './core';

// Re-export from events
export {
  safeCapture,
  // Export safeCaptureWithGroup as captureEventWithGroup consistently
  safeCaptureWithGroup as captureEventWithGroup,
  safeReloadFeatureFlags,
  safeIsFeatureEnabled
} from './events';

// Re-export from identity
export {
  safeIdentify,
  safeGetDistinctId,
  safeReset,
  clearStoredGroups
} from './identity';

// Re-export from groups
export {
  getLastGroups,
  setLastGroup,
  getLastIdentifiedGroup,
  safeGroupIdentify
} from './groups';

// Re-export from helpers
export {
  slugifyGroupKey,
  extractPriceValue,
  formatSubscriptionGroupProps
} from './helpers';
