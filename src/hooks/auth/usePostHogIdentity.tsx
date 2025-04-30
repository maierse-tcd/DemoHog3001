
import { useCallback } from 'react';

export const usePostHogIdentity = () => {
  const identifyUserInPostHog = useCallback((userId: string, userEmail: string, displayName: string) => {
    if (!window.posthog || !userEmail) {
      return;
    }
    
    try {
      // Use email as primary identifier
      window.posthog.identify(userEmail, {
        email: userEmail,
        name: displayName,
        id: userId
      });
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, []);
  
  const capturePostHogEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!window.posthog) {
      return;
    }
    
    try {
      window.posthog.capture(eventName, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }, []);
  
  return {
    identifyUserInPostHog,
    capturePostHogEvent
  };
};
