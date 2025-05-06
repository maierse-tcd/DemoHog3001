
import { useCallback } from 'react';
import { safeIdentify, safeCapture, safeGroupIdentify } from '../../utils/posthog';
import { usePostHogContext } from '../../contexts/PostHogContext';

export const usePostHogIdentity = () => {
  const { updateUserType } = usePostHogContext();

  const identifyUserInPostHog = useCallback((userId: string, userEmail: string, displayName: string) => {
    if (!userEmail) {
      console.warn('Email is required for PostHog identification');
      return;
    }
    
    try {
      // PostHog identification is now centralized in PostHogProvider
      // This function is kept for backward compatibility, but actual identification
      // should now happen through the PostHogProvider's auth listener
      console.log(`PostHog identity now managed by PostHogProvider for: ${userEmail}`);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, []);
  
  const capturePostHogEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      safeCapture(eventName, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }, []);
  
  // New method to identify user's group - now uses the direct context method
  const identifyUserGroup = useCallback((groupType: string, groupKey: string, properties?: Record<string, any>) => {
    try {
      // For user_type groups, use the central method
      if (groupType === 'user_type' && (groupKey === 'Kid' || groupKey === 'Adult')) {
        updateUserType(groupKey === 'Kid');
        return;
      }
      
      // For other group types, use the safe method
      const groupProps = {
        name: groupKey, // Required for group to appear in UI
        ...(properties || {})
      };
      
      safeGroupIdentify(groupType, groupKey, groupProps);
    } catch (err) {
      console.error("PostHog group identify error:", err);
    }
  }, [updateUserType]);
  
  return {
    identifyUserInPostHog,
    capturePostHogEvent,
    identifyUserGroup
  };
};
