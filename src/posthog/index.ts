
/**
 * PostHog integration for the application
 * Provides centralized access to all PostHog functionality
 */

// Export hooks for component usage
export * from './hooks';

// Export core utilities
export * from './core';

// Export context provider components
export { PostHogProvider } from '../components/PostHogProvider';

// Export types
export type { PostHogContextType } from '../contexts/PostHogContext';
