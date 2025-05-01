
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
 * Get the current distinct ID from PostHog
 */
export const safeGetDistinctId = (): string | null => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog) && typeof window.posthog.get_distinct_id === 'function') {
        return window.posthog.get_distinct_id();
      }
    } catch (err) {
      console.error("Error getting PostHog distinct ID:", err);
    }
  }
  return null;
};

/**
 * Safely capture an event in PostHog
 */
export const safeCapture = (event: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      // First ensure posthog is an object with the capture method
      if (isPostHogInstance(window.posthog)) {
        // Log distinct ID when capturing events for debugging
        const distinctId = window.posthog.get_distinct_id?.() || 'unknown';
        console.log(`Capturing event '${event}' for distinctId: ${distinctId}`);
        
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
        // Force immediate identification by direct API call
        window.posthog.identify(distinctId, properties);
        console.log(`PostHog user identified: ${distinctId}`);
        
        // After identifying, always force a reload of feature flags
        if (window.posthog.featureFlags && typeof window.posthog.reloadFeatureFlags === 'function') {
          try {
            window.posthog.reloadFeatureFlags()
              .then(() => {
                console.log("Feature flags reloaded immediately after identify");
              })
              .catch(err => {
                console.error("Error reloading feature flags after identify:", err);
              });
          } catch (e) {
            console.error("Error refreshing feature flags after identify:", e);
          }
        }
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
        // Direct API call to check flag
        const result = window.posthog.isFeatureEnabled(flag);
        return result === true; // Ensure we return a boolean true, not truthy values
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
        // Log who is reloading flags
        const distinctId = safeGetDistinctId();
        console.log(`Reloading feature flags for user: ${distinctId || 'unknown'}`);
        
        // Direct API call to reload
        await window.posthog.reloadFeatureFlags();
        
        // Log the current flags after reload
        if (window.posthog.featureFlags && 
            typeof window.posthog.featureFlags.getFlags === 'function') {
          try {
            const flags = window.posthog.featureFlags.getFlags();
            console.log("Feature flags reloaded successfully:", flags);
            
            // Check specific flags of interest
            if (flags) {
              console.log("is_admin flag:", flags.is_admin);
            }
          } catch (err) {
            console.error("Error getting flags after reload:", err);
          }
        } else {
          console.log("Feature flags reloaded but getFlags not available");
        }
      }
    } catch (err) {
      console.error("Error reloading feature flags:", err);
      throw err; // Re-throw for promise chaining
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
          
          // Safely access the flags
          if (window.posthog.featureFlags.getFlags && 
              typeof window.posthog.featureFlags.getFlags === 'function') {
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
            console.log("All feature flags overridden to false:", resetFlags);
          }
        }
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
      if (isPostHogInstance(window.posthog) && 
          window.posthog.featureFlags && 
          typeof window.posthog.featureFlags.override === 'function') {
        // Log who is overriding flags
        const distinctId = safeGetDistinctId();
        console.log(`Overriding feature flags for user: ${distinctId || 'unknown'}`, flags);
        
        window.posthog.featureFlags.override(flags);
        console.log("Feature flags overridden:", flags);
      }
    } catch (err) {
      console.error("Error overriding feature flags:", err);
    }
  }
};

// Additional utility to force refresh cookies/local storage
export const forceRefreshPersistence = (): void => {
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      if (isPostHogInstance(window.posthog)) {
        // Try to access the persistence layer
        const distinctId = safeGetDistinctId();
        console.log(`Attempting to refresh persistence for: ${distinctId || 'unknown'}`);
        
        // Force a persistence update by setting a property
        safePeopleSet({
          last_persistence_refresh: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error refreshing persistence:", err);
    }
  }
};
