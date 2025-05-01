
/**
 * PostHog utility functions for safer and more consistent usage
 */

import { PostHog } from '../types/posthog';

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
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
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
 */
export const safeIdentify = (distinctId: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.identify(distinctId, properties);
        console.log(`PostHog: User identified with ID: ${distinctId}`, properties);
      }
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }
};

/**
 * Get the current anonymous ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.get_distinct_id === 'function') {
        const currentId = window.posthog.get_distinct_id();
        console.log(`PostHog: Current distinct ID: ${currentId}`);
        return currentId;
      }
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  }
  return null;
};

/**
 * Merge anonymous identity with user's actual identity (email)
 * This properly connects anonymous activity with the identified user
 */
export const safeMergeIdentity = (userEmail: string): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        const anonymousId = safeGetDistinctId();
        
        // Only perform alias if we have both IDs and they're different
        if (anonymousId && userEmail && anonymousId !== userEmail) {
          console.log(`PostHog: Merging identities - anonymous ID ${anonymousId} to user email ${userEmail}`);
          
          // Use the alias method to merge the identities
          if (typeof window.posthog.alias === 'function') {
            window.posthog.alias(userEmail, anonymousId);
            console.log(`PostHog: Alias created from ${anonymousId} to ${userEmail}`);
          } else {
            console.warn('PostHog alias method not available');
          }
        }
      }
    } catch (err) {
      console.error("PostHog identity merge error:", err);
    }
  }
};

/**
 * Reset PostHog identity (for logout)
 */
export const safeReset = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        console.log("PostHog: Resetting user identity");
        window.posthog.reset();
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
  if (typeof window !== 'undefined' && window.posthog) {
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
  if (typeof window !== 'undefined' && window.posthog) {
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

/**
 * Override feature flags (for debugging)
 */
export const safeOverrideFeatureFlags = (flags: Record<string, boolean | string>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && window.posthog.featureFlags) {
        window.posthog.featureFlags.override(flags);
      }
    } catch (err) {
      console.error("Error overriding feature flags:", err);
    }
  }
};

/**
 * Remove all feature flag overrides
 */
export const safeRemoveFeatureFlags = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && window.posthog.featureFlags) {
        // Reset all overrides by passing an empty object
        window.posthog.featureFlags.override({});
      }
    } catch (err) {
      console.error("Error removing feature flag overrides:", err);
    }
  }
};
