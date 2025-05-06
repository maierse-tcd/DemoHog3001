
import { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';
import { useCallback } from 'react';
import { safeGroupIdentify, captureEventWithGroup } from '../utils/posthog';
import { formatSubscriptionGroupProps, slugifyGroupKey } from '../utils/posthog/helpers';
import { usePostHogContext } from '../contexts/PostHogContext';

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

// Enhanced hook for group operations - now uses the standard captureEventWithGroup
export const usePostHogGroups = () => {
  const posthog = usePostHog();
  
  const identifyGroup = useCallback((groupType: string, groupKey: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    try {
      // Apply slugify for subscription group type
      const processedKey = groupType === 'subscription' 
        ? slugifyGroupKey(groupKey) 
        : groupKey;
      
      // Ensure the name property is always present - CRITICAL for UI visibility
      const groupProps = {
        name: processedKey, // This is mandatory for the group to appear in the UI
        ...(processedKey !== groupKey ? { display_name: groupKey } : {}),
        ...(properties || {})
      };
      
      console.log(`Identifying PostHog group: ${groupType}:${processedKey}`, groupProps);
      
      // Step 1: Use the direct group method
      posthog.group(groupType, processedKey, groupProps);
      
      // Step 2: Send an explicit group identify event (critical for UI visibility)
      posthog.capture('$groupidentify', {
        $group_type: groupType,
        $group_key: processedKey,
        $group_set: groupProps
      });
      
      // Step 3: Capture an event with group context to reinforce the association
      posthog.capture('group_association_reinforced', {
        group_type: groupType,
        group_key: processedKey,
        timestamp: new Date().toISOString(),
        $groups: {
          [groupType]: processedKey
        }
      });
      
      console.log(`PostHog: Group identified: ${groupType}:${processedKey}`);
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
      // Apply slugify for subscription group type
      const processedKey = groupType === 'subscription' 
        ? slugifyGroupKey(groupKey) 
        : groupKey;
        
      // Include the group property in the event
      const eventProps = {
        ...properties,
        $groups: {
          [groupType]: processedKey
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

// New hook specifically for subscription management - now uses the context
export const usePostHogSubscription = () => {
  const { updateSubscription } = usePostHogContext();
  
  return { updateSubscription };
};

// New hook to access common PostHog methods
export const usePostHogHelper = () => {
  const { updateUserType, updateSubscription } = usePostHogContext();
  
  return { updateUserType, updateSubscription };
};
