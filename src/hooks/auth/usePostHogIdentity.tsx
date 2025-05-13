
import { useCallback } from 'react';
import { safeCapture } from '../../utils/posthog';
import { usePostHogContext } from '../../contexts/PostHogContext';
import { supabase } from '../../integrations/supabase/client';

export const usePostHogIdentity = () => {
  const { updateUserType, captureEvent, identifyUserGroup: contextIdentifyUserGroup } = usePostHogContext();

  const identifyUserInPostHog = useCallback(async (userId: string, userEmail: string, displayName: string) => {
    if (!userEmail) {
      console.warn('Email is required for PostHog identification');
      return;
    }
    
    try {
      // Fetch profile data - now including the language field
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('is_admin, name, language')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile data:", error.message);
      }
      
      // PostHog identification is now centralized in PostHogProvider
      // This function is kept for backward compatibility
      console.log(`PostHog identity now managed by PostHogProvider for: ${userEmail}`);
      
      // If profile data exists, track it as properties
      if (profileData) {
        // We'll use is_admin as a proxy for determining if it's a kids account
        // Typically kids accounts aren't admin accounts
        const isKidsAccount = !profileData.is_admin; // Default assumption
        
        captureEvent('user_properties_fetched', {
          is_kids_account: isKidsAccount,
          language: profileData.language || 'English' // Now we can use the actual language value
        });
      }
      
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, [captureEvent]);
  
  const capturePostHogEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      captureEvent(eventName, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }, [captureEvent]);
  
  // Method to identify user's group - now uses the context methods
  const identifyGroup = useCallback((groupType: string, groupKey: string, properties?: Record<string, any>) => {
    try {
      // For user_type groups, use the central method
      if (groupType === 'user_type' && (groupKey === 'Kid' || groupKey === 'Adult')) {
        updateUserType(groupKey === 'Kid');
        return;
      }
      
      // Otherwise fall back to the general method
      contextIdentifyUserGroup(groupKey, properties);
    } catch (err) {
      console.error("PostHog group identify error:", err);
    }
  }, [updateUserType, contextIdentifyUserGroup]);
  
  return {
    identifyUserInPostHog,
    capturePostHogEvent,
    identifyUserGroup: identifyGroup
  };
};
