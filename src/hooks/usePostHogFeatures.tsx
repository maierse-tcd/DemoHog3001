
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

// Alias for backward compatibility with existing components
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
  
  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      posthog.identify(userId, properties);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  };
  
  return { identifyUser };
};
