
/**
 * PostHog User Manager
 * Manages user-related features and analytics
 */

import { useCallback, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { safeGroupIdentify, captureEventWithGroup } from '../utils/posthog';

export function usePostHogUserManager() {
  // Debounce timer for group identification
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Identify user type (Kid or Adult) with debouncing
  const identifyUserGroup = useCallback((userType: string, properties?: Record<string, any>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Always ensure name property is present (required for groups to be visible in PostHog UI)
      const groupProperties = {
        name: userType,
        ...(properties || {})
      };
      
      safeGroupIdentify('user_type', userType, groupProperties);
      debounceTimerRef.current = null;
    }, 100); // Reduced from 300ms for faster automation response
  }, []);

  // Update user type (exposed to other components through context)
  const updateUserType = useCallback((isKid: boolean) => {
    const newUserType = isKid ? 'Kid' : 'Adult';
    
    console.log(`[PostHog UserManager] updateUserType called: ${newUserType}`);
    console.log(`[PostHog UserManager] Current timestamp: ${new Date().toISOString()}`);
    
    // Get user info from Supabase to include in group properties
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const userId = data.user.id;
        console.log(`[PostHog UserManager] Fetching profile for user: ${userId}`);
        
        // Fetch profile info
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .maybeSingle()
          .then(({ data: profileData }) => {
            const dateJoined = profileData?.created_at || new Date().toISOString();
            
            console.log(`[PostHog UserManager] Profile fetched, calling identifyUserGroup`);
            
            // Identify the group with relevant properties
            identifyUserGroup(newUserType, {
              name: newUserType, // REQUIRED for UI visibility
              update_time: new Date().toISOString(),
              date_joined: dateJoined
            });
            
            console.log(`[PostHog UserManager] Group identified, capturing event`);
            
            // Also capture an event with the new group
            captureEventWithGroup('user_type_changed', 'user_type', newUserType, {
              changed_at: new Date().toISOString()
            });
            
            console.log(`[PostHog UserManager] updateUserType complete for: ${newUserType}`);
          });
      } else {
        console.warn(`[PostHog UserManager] No user data available, group identification skipped`);
      }
    });
  }, [identifyUserGroup]);

  return { 
    updateUserType,
    identifyUserGroup 
  };
}
