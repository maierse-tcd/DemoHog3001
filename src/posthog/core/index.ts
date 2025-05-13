
/**
 * Core PostHog functionality
 * Provides initialization and basic PostHog instance management
 */

import { POSTHOG_HOST } from '../../components/PostHogProvider/config';
import { getPostHogInstance } from '../../utils/posthog/core';

/**
 * Check if PostHog is properly loaded and available
 */
export const isPostHogReady = (): boolean => {
  const instance = getPostHogInstance();
  return instance !== null;
};

/**
 * Get the PostHog API host URL
 */
export const getPostHogHost = (): string => {
  return POSTHOG_HOST;
};

// Re-export core utilities for convenience
export { getPostHogInstance } from '../../utils/posthog/core';
