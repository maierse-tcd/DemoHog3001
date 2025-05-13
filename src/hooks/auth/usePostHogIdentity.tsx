
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
      // Fetch additional user properties from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_kids, language')
        .eq('id', userId)
        .maybeSingle();
      
      // PostHog identification is now centralized in PostHogProvider
      // This function is kept for backward compatibility
      console.log(`PostHog identity now managed by PostHogProvider for: ${userEmail}`);
      console.log(`Additional properties: language=${profileData?.language}, is_kids=${profileData?.is_kids}`);
      
      // If profile data exists, track it as properties
      if (profileData) {
        captureEvent('user_properties_fetched', {
          is_kids_account: profileData.is_kids,
          language: profileData.language || 'English'
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
