
import { useCallback } from 'react';
import { safeIdentify, safeCapture } from '../../utils/posthogUtils';

export const usePostHogIdentity = () => {
  const identifyUserInPostHog = useCallback((userId: string, userEmail: string, displayName: string) => {
    if (!userEmail) {
      console.warn('Email is required for PostHog identification');
      return;
    }
    
    try {
      // Use email as primary identifier (more reliable for cross-platform identification)
      safeIdentify(userEmail, {
        email: userEmail,
        name: displayName,
        id: userId,
        supabase_id: userId
      });
      
      console.log(`User identified in PostHog with email: ${userEmail}`);
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
  
  return {
    identifyUserInPostHog,
    capturePostHogEvent
  };
};
