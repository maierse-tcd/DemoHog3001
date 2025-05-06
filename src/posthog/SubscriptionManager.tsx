
import { useCallback, useRef } from 'react';
import { safeGroupIdentify, captureEventWithGroup } from '../utils/posthog';
import { slugifyGroupKey, extractPriceValue } from '../utils/posthog/helpers';
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
      const groupProperties = {
        name: slugKey, // CRITICAL for UI visibility
        display_name: planName,
        plan_id: properties?.plan_id || '',
        plan_cost: properties?.plan_cost || extractPriceValue(properties?.price || '0'),
        updated_at: new Date().toISOString(),
        ...(properties || {})
      };
      
      // Method 1: Direct PostHog API call
      if (typeof posthog !== 'undefined') {
        try {
          // Step 1: Direct group method
          posthog.group('subscription', slugKey, groupProperties);
          
          // Step 2: Explicit $groupidentify event (critical for UI visibility)
          posthog.capture('$groupidentify', {
            $group_type: 'subscription',
            $group_key: slugKey,
            $group_set: groupProperties
          });
          
          // Step 3: Reinforcement event
          captureEventWithGroup(
            'subscription_identified', 
            'subscription', 
            slugKey, 
            { original_name: planName }
          );
        } catch (err) {
          console.error('PostHog subscription identify error:', err);
        }
      }
      
      // Method 2: Use safe utility as backup
      safeGroupIdentify('subscription', planName, groupProperties);
      
      subscriptionDebounceRef.current = null;
    }, 300);
  }, []);

  // Update subscription - exposed through context
  const updateSubscription = useCallback((planName: string, planId: string, planPrice: string) => {
    console.log(`Updating subscription plan: ${planName} (${planId}, ${planPrice})`);
    
    // Extract numeric price
    const planCost = extractPriceValue(planPrice);
    
    // Process through central identification
    identifySubscriptionGroup(planName, {
      plan_id: planId,
      plan_cost: planCost,
      price: planPrice, 
      last_updated: new Date().toISOString()
    });
  }, [identifySubscriptionGroup]);

  return {
    updateSubscription,
    identifySubscriptionGroup
  };
}
