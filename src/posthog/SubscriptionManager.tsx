
import { useCallback, useRef } from 'react';
import { safeGroupIdentify, captureEventWithGroup } from '../utils/posthog';
import { slugifyGroupKey, formatSubscriptionGroupProps, extractPriceValue } from '../utils/posthog/helpers';
import posthog from 'posthog-js';

export function usePostHogSubscriptionManager() {
  // Debounce timer for subscription identification
  const subscriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Identify subscription group with debouncing
  const identifySubscriptionGroup = useCallback((planName: string, properties?: Record<string, any>) => {
    // Process the subscription name to get a consistent key
    const slugKey = slugifyGroupKey(planName);
    
    if (subscriptionDebounceRef.current) {
      clearTimeout(subscriptionDebounceRef.current);
    }
    
    subscriptionDebounceRef.current = setTimeout(() => {
      console.log(`PostHog: Identifying subscription group: ${planName} (key: ${slugKey})`);
      
      // Format subscription properties consistently
      const groupProperties = formatSubscriptionGroupProps(planName, properties?.plan_id || '', 
                                                        properties?.plan_cost || 0, {
        method: 'provider_central',
        original_name: planName,
        ...(properties || {})
      });
      
      // Method 1: Use direct PostHog instance for maximum reliability
      if (typeof posthog !== 'undefined') {
        try {
          console.log(`Direct PostHog call: group('subscription', '${slugKey}')`, groupProperties);
          
          // Step 1: Direct group method
          posthog.group('subscription', slugKey, groupProperties);
          
          // Step 2: Explicit $groupidentify event (critical for UI visibility)
          posthog.capture('$groupidentify', {
            $group_type: 'subscription',
            $group_key: slugKey,
            $group_set: groupProperties
          });
          
          // Step 3: Reinforcement event associated with the group
          posthog.capture('subscription_identified', {
            plan_name: planName,
            slug_key: slugKey,
            $groups: {
              subscription: slugKey
            }
          });
          
          console.log(`PostHog Direct: User associated with subscription group: ${slugKey} (${planName})`);
        } catch (err) {
          console.error('PostHog direct subscription identify error:', err);
        }
      }
      
      // Method 2: Use safe utility as backup
      safeGroupIdentify('subscription', planName, groupProperties);
      
      // Method 3: Send explicit event with group context
      captureEventWithGroup('subscription_plan_associated', 'subscription', planName, {
        set_method: 'provider_central',
        timestamp: new Date().toISOString()
      });
      
      // Additional reinforcement event with subscription info
      posthog.capture('subscription_group_reinforced', {
        group_key: slugKey,
        original_name: planName,
        timestamp: new Date().toISOString(),
        $groups: {
          subscription: slugKey
        }
      });
      
      subscriptionDebounceRef.current = null;
      
    }, 300);
  }, []);

  // Update subscription (exposed to other components)
  const updateSubscription = useCallback((planName: string, planId: string, planPrice: string) => {
    console.log(`Updating subscription plan: ${planName} (${planId}, ${planPrice})`);
    
    // Format subscription properties
    const groupProperties = {
      plan_id: planId,
      plan_cost: extractPriceValue(planPrice),
      last_updated: new Date().toISOString()
    };
    
    // Process through central identification
    identifySubscriptionGroup(planName, groupProperties);
  }, [identifySubscriptionGroup]);

  return {
    updateSubscription,
    identifySubscriptionGroup
  };
}
