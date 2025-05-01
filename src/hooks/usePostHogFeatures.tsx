
import { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';

// Re-export all official hooks for consistency in our app
export { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
};

// Alias for backward compatibility with our existing code
// This makes migration easier as components won't need to change their imports right away
export const useFeatureFlag = useFeatureFlagEnabled;

// Helper function for capturing events
export const usePostHogEvent = () => {
  const posthog = usePostHog();
  
  return (eventName: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      posthog.capture(eventName, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  };
};

// Helper for identity management
export const usePostHogIdentity = () => {
  const posthog = usePostHog();
  
  const identifyUser = (userId: string, userEmail: string, displayName: string) => {
    if (!posthog || !userEmail) return;
    
    try {
      posthog.identify(userEmail, {
        email: userEmail,
        name: displayName,
        id: userId
      });
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  };
  
  return { identifyUser };
};
