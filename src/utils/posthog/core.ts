
/**
 * Core PostHog utility functions
 */

import { PostHog } from '../../types/posthog';
import posthog from 'posthog-js';

// Consistent host configuration
export const POSTHOG_HOST = 'https://ph.hogflix.dev';

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
 * Check if PostHog is available and initialized
 */
export const isPostHogAvailable = (): boolean => {
  return typeof posthog !== 'undefined' && 
         typeof posthog.capture === 'function';
};

/**
 * Get the PostHog instance, either from global posthog or window.posthog
 */
export const getPostHogInstance = (): PostHog | null => {
  if (isPostHogAvailable()) {
    return posthog;
  } else if (typeof window !== 'undefined' && window.posthog && isPostHogInstance(window.posthog)) {
    return window.posthog;
  }
  return null;
};
