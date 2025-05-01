
/**
 * Utility functions for safely interacting with PostHog
 */

import type { PostHog } from '../types/posthog.d';

/**
 * Type guard to check if an object is a fully initialized PostHog instance
 */
export const isPostHogInstance = (obj: any): obj is PostHog => {
  return obj && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         typeof obj.capture === 'function';
};

/**
 * Check if PostHog is properly initialized
 */
export const isPostHogReady = (): boolean => {
  return typeof window !== 'undefined' && 
         window.posthog !== undefined && 
         isPostHogInstance(window.posthog);
};

/**
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      // First ensure posthog is an object with the capture method
      if (isPostHogInstance(window.posthog)) {
        window.posthog.capture(event, properties);
      }
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }
};

/**
 * Safely identify a user in PostHog
 */
export const safeIdentify = (
  distinctId: string, 
  properties?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.identify(distinctId, properties);
      }
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }
};

/**
 * Safely reset user identity in PostHog
 */
export const safeReset = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        // Reset completely clears the identity and all associated data
        window.posthog.reset();
        console.log("PostHog identity reset complete");
      }
    } catch (err) {
      console.error("PostHog reset error:", err);
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
        return window.posthog.isFeatureEnabled(flag);
      }
    } catch (err) {
      console.error(`Error checking feature flag ${flag}:`, err);
    }
  }
  return false;
};

/**
 * Safely reload feature flags
 */
export const safeReloadFeatureFlags = async (): Promise<void> => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        await window.posthog.reloadFeatureFlags();
        console.log("Feature flags reloaded successfully");
      }
    } catch (err) {
      console.error("Error reloading feature flags:", err);
    }
  }
};

/**
 * Safely remove all feature flags (clear cache)
 * This is useful on logout to ensure no feature flags persist
 */
export const safeRemoveFeatureFlags = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && window.posthog.featureFlags) {
        // The most reliable way to clear feature flags is to override them all to false
        if (typeof window.posthog.featureFlags.override === 'function') {
          let currentFlags: Record<string, boolean | string> = {};
          
          // Safely access the getFlags method if it exists
          if (typeof window.posthog.featureFlags.getFlags === 'function') {
            try {
              currentFlags = window.posthog.featureFlags.getFlags() || {};
            } catch (err) {
              console.error("Error getting feature flags:", err);
              // If we can't get the flags, try to access currentFlags directly
              currentFlags = window.posthog.featureFlags.currentFlags || {};
            }
          } else if (window.posthog.featureFlags.currentFlags) {
            // Fall back to accessing currentFlags property directly
            currentFlags = window.posthog.featureFlags.currentFlags;
          }
          
          if (Object.keys(currentFlags).length > 0) {
            // Create an object with all flags set to false
            const resetFlags: Record<string, boolean> = {};
            Object.keys(currentFlags).forEach(flag => {
              resetFlags[flag] = false;
            });
            
            // Override all flags to false
            window.posthog.featureFlags.override(resetFlags);
            console.log("All feature flags overridden to false");
          }
        }
        
        // Additionally attempt to clear the feature flag cache if method exists
        if (window.posthog.featureFlags._refresh && 
            typeof window.posthog.featureFlags._refresh === 'function') {
          try {
            window.posthog.featureFlags._refresh();
          } catch (err) {
            console.error("Error refreshing feature flags:", err);
          }
        }
        
        console.log("Feature flags cleared");
      }
    } catch (err) {
      console.error("Error clearing feature flags:", err);
    }
  }
};

/**
 * Safely register a callback for feature flag changes
 */
export const safeOnFeatureFlags = (callback: () => void): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        window.posthog.onFeatureFlags(callback);
      }
    } catch (err) {
      console.error("Error setting feature flag callback:", err);
    }
  }
};

/**
 * Safely set user properties
 */
export const safePeopleSet = (properties: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && window.posthog.people) {
        window.posthog.people.set(properties);
      }
    } catch (err) {
      console.error("Error setting people properties:", err);
    }
  }
};

/**
 * Safely override feature flags
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
