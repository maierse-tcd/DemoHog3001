import { useCallback } from 'react';
import { safeCapture } from '../../utils/posthog';
import { usePostHogContext } from '../../contexts/PostHogContext';

export const usePostHogIdentity = () => {
  const { updateUserType, captureEvent, identifyUserGroup: contextIdentifyUserGroup } = usePostHogContext();

  const identifyUserInPostHog = useCallback((userId: string, userEmail: string, displayName: string) => {
    if (!userEmail) {
      console.warn('Email is required for PostHog identification');
      return;
    }
    
    try {
      // PostHog identification is now centralized in PostHogProvider
      // This function is kept for backward compatibility
      console.log(`PostHog identity now managed by PostHogProvider for: ${userEmail}`);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, []);
  
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
