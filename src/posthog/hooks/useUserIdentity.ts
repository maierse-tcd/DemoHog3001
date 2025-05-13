
/**
 * Hook for managing user identity in PostHog
 */

import { useCallback } from 'react';
import { safeIdentify, safeGetDistinctId, safeReset } from '../../utils/posthog';

export function useUserIdentity() {
  /**
   * Identify a user in PostHog
   */
  const identifyUser = useCallback((
    userId: string, 
    properties?: Record<string, any>
  ): void => {
    safeIdentify(userId, properties);
  }, []);
  
  /**
   * Get the current user's distinct ID
   */
  const getUserId = useCallback((): string | null => {
    return safeGetDistinctId();
  }, []);
  
  /**
   * Reset the current user's identity
   */
  const resetIdentity = useCallback((): void => {
    safeReset();
  }, []);
  
  /**
   * Check if the user is identified
   */
  const isIdentified = useCallback((): boolean => {
    const userId = getUserId();
    return userId !== null && userId.length > 0;
  }, [getUserId]);
  
  return {
    identifyUser,
    getUserId,
    resetIdentity,
    isIdentified
  };
}
