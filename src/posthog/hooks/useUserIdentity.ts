
/**
 * Hook for managing user identity in PostHog
 */

import { useCallback } from 'react';
import { safeIdentify, safeGetDistinctId, safeReset } from '../../utils/posthog';
import { supabase } from '../../integrations/supabase/client';

export function useUserIdentity() {
  /**
   * Identify a user in PostHog with full profile properties
   */
  const identifyUser = useCallback(async (
    userId: string, 
    properties?: Record<string, any>
  ): Promise<void> => {
    // If properties don't include language or is_kids_account, try to fetch from profile
    if (!properties?.language || properties?.is_kids_account === undefined) {
      try {
        // Check if is_kids exists in the profiles table by trying to query it
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('is_admin, name')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error.message);
          // Just use the provided properties since we had an error
          safeIdentify(userId, properties);
          return;
        }
        
        if (profileData) {
          // Use is_admin field as a fallback for is_kids (inverse logic)
          // Kids accounts typically aren't admin accounts
          const isKids = properties?.is_kids_account !== undefined ? 
            properties.is_kids_account : 
            (profileData.is_admin === false);
          
          // Merge profile data with provided properties
          const enhancedProperties = {
            ...properties,
            is_kids_account: isKids,
            language: properties?.language || 'English' // Default to English if not provided
          };
          
          safeIdentify(userId, enhancedProperties);
        } else {
          // Fall back to just using the provided properties
          safeIdentify(userId, properties);
        }
      } catch (err) {
        console.error("Error fetching profile for PostHog identification:", err);
        // Fall back to basic identification
        safeIdentify(userId, properties);
      }
    } else {
      // If all properties are provided, just identify directly
      safeIdentify(userId, properties);
    }
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
