
import { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';
import { useCallback } from 'react';
import { safeGroupIdentify, safeCaptureWithGroup } from '../utils/posthogUtils';

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

// Enhanced hook for group operations
export const usePostHogGroups = () => {
  const posthog = usePostHog();
  
  const identifyGroup = useCallback((groupType: string, groupKey: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      // Ensure the name property is always present - CRITICAL for UI visibility
      const groupProps = {
        name: groupKey, // This is mandatory for the group to appear in the UI
        ...(properties || {})
      };
      
      console.log(`Identifying PostHog group: ${groupType}:${groupKey}`, groupProps);
      
      // Step 1: Use the direct group method
      posthog.group(groupType, groupKey, groupProps);
      
      // Step 2: Send an explicit group identify event (critical for UI visibility)
      posthog.capture('$groupidentify', {
        $group_type: groupType,
        $group_key: groupKey,
        $group_set: groupProps
      });
      
      // Step 3: Capture an event with group context to reinforce the association
      posthog.capture('group_association_reinforced', {
        group_type: groupType,
        group_key: groupKey,
        timestamp: new Date().toISOString(),
        $groups: {
          [groupType]: groupKey
        }
      });
      
      console.log(`PostHog: Group identified: ${groupType}:${groupKey}`);
    } catch (err) {
      console.error("PostHog group identify error:", err);
    }
  }, [posthog]);
  
  return { identifyGroup };
};

// Helper function for capturing events
export const usePostHogEvent = () => {
  const posthog = usePostHog();
  
  const captureEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      posthog.capture(eventName, properties);
    } catch (err) {
      console.error("PostHog event error:", err);
    }
  }, [posthog]);
  
  const captureGroupEvent = useCallback((
    eventName: string, 
    groupType: string, 
    groupKey: string, 
    properties?: Record<string, any>
  ) => {
    if (!posthog) return;
    
    try {
      // Include the group property in the event
      const eventProps = {
        ...properties,
        $groups: {
          [groupType]: groupKey
        }
      };
      
      posthog.capture(eventName, eventProps);
    } catch (err) {
      console.error("PostHog group event error:", err);
    }
  }, [posthog]);
  
  return { captureEvent, captureGroupEvent };
};

// Helper for identity management
export const usePostHogIdentity = () => {
  const posthog = usePostHog();
  
  const identifyUser = useCallback((userId: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      posthog.identify(userId, properties);
    } catch (err) {
      console.error("PostHog identify error:", err);
    }
  }, [posthog]);
  
  return { identifyUser };
};
