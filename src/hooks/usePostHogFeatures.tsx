
import { 
  usePostHog, 
  useFeatureFlagEnabled, 
  useFeatureFlagPayload, 
  useFeatureFlagVariantKey,
  useActiveFeatureFlags
} from 'posthog-js/react';
import { useCallback, useEffect } from 'react';
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

// New hook specifically for subscription management
export const usePostHogSubscription = () => {
  const posthog = usePostHog();
  
  // Access the centrally managed subscription update method
  const updateSubscription = useCallback((planName: string, planId: string, planPrice: string) => {
    if (!posthog) return;
    
    try {
      // Check if window.__posthogMethods exists (our central methods)
      if (typeof window !== 'undefined' && (window as any).__posthogMethods?.updateSubscription) {
        // Use the centralized method
        (window as any).__posthogMethods.updateSubscription(planId);
        return;
      }
      
      // Fallback to direct implementation
      console.log(`Directly identifying subscription group: ${planName}`);
      
      // Extract numeric price value
      const extractPriceValue = (priceString: string): number => {
        const numericValue = priceString.replace(/[^\d.]/g, '');
        return parseFloat(numericValue) || 0;
      };
      
      // CRITICAL: Ensure name property is included
      const groupProps = {
        name: planName, // REQUIRED for UI visibility
        plan_id: planId,
        plan_cost: extractPriceValue(planPrice),
        last_updated: new Date().toISOString()
      };
      
      // Direct PostHog calls
      posthog.group('subscription', planName, groupProps);
      
      posthog.capture('$groupidentify', {
        $group_type: 'subscription',
        $group_key: planName,
        $group_set: groupProps
      });
      
      // Explicit event with group association
      posthog.capture('subscription_updated', {
        plan_name: planName,
        plan_id: planId,
        $groups: {
          subscription: planName
        }
      });
      
      // Backup through utilities
      safeGroupIdentify('subscription', planName, groupProps);
      safeCaptureWithGroup('subscription_fallback_set', 'subscription', planName, {
        plan_id: planId,
        plan_price: extractPriceValue(planPrice),
        method: 'direct_hook',
        timestamp: new Date().toISOString()
      });
      
      console.log(`PostHog: Subscription identified: ${planName}`);
    } catch (err) {
      console.error("PostHog subscription group error:", err);
    }
  }, [posthog]);

  return { updateSubscription };
};
