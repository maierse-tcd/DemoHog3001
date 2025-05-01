
import { useCallback } from 'react';
import { safeIdentify, safeCapture } from '../../utils/posthogUtils';

export const usePostHogIdentity = () => {
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
  
  return {
    identifyUserInPostHog,
    capturePostHogEvent
  };
};
