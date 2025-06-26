
/**
 * PostHog utilities index file
 * Now exports simplified, clean utilities
 */

// Export simplified utilities (recommended)
export * from './simple';

// Export legacy utilities for backward compatibility
export { 
  POSTHOG_HOST,
  isPostHogInstance,
  isPostHogAvailable,
  getPostHogInstance
} from './core';

// Legacy exports - these will be deprecated
export {
  safeCapture,
  captureEventWithGroup,
  captureTestEvent,
  safeReloadFeatureFlags,
  safeIsFeatureEnabled
} from './events';

export {
  safeIdentify,
  safeGetDistinctId,
  safeReset,
  clearStoredGroups
} from './identity';

export {
  getLastGroups,
  setLastGroup,
  getLastIdentifiedGroup,
  safeGroupIdentify
} from './groups';

export {
  slugifyGroupKey,
  extractPriceValue,
  formatSubscriptionGroupProps
} from './helpers';
