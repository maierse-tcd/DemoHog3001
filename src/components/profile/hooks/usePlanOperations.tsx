import { useState } from 'react';
import { toast } from '../../../hooks/use-toast';
import { Plan } from '../../SubscriptionPlan';
import { supabase } from '../../../integrations/supabase/client';
import { useAuthContext } from '../../../hooks/auth/useAuthContext';
import { safeCapture, captureEventWithGroup } from '../../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { usePostHogSubscription } from '../../../hooks/usePostHogFeatures';
import { slugifyGroupKey, formatSubscriptionGroupProps, extractPriceValue } from '../../../utils/posthog/helpers';
import { 
  setSubscriptionStatus, 
  trackSubscriptionCancelled,
  trackSubscriptionStarted
} from '../../../utils/posthog/simple';

interface UsePlanOperationsProps {
  plans: Plan[];
  initialPlanId: string;
  updateSelectedPlan: (planId: string) => void;
}

export const usePlanOperations = ({
  plans,
  initialPlanId,
  updateSelectedPlan
}: UsePlanOperationsProps) => {
  const { isLoggedIn, userMetadata } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const posthog = usePostHog();
  const { updateSubscription } = usePostHogSubscription();

  const handleSaveChanges = async (currentPlanId: string) => {
    if (!isLoggedIn) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to update your subscription plan',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Find the selected plan to get its details
      const selectedPlan = plans.find(plan => plan.id === currentPlanId);
      
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }
      
      // Update user metadata with the selected plan
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          selectedPlanId: currentPlanId,
          lastPlanChange: new Date().toISOString()
        }
      });
      
      if (authError) throw authError;

      // Update the profiles table with subscription status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan_id: currentPlanId,
          subscription_cancelled_at: null,
          subscription_expires_at: null
        })
        .eq('id', userMetadata?.sub);

      if (profileError) throw profileError;
      
      // Update the context only after successful DB update
      updateSelectedPlan(currentPlanId);
      
      // Update subscription status in PostHog (for cohort analysis)
      setSubscriptionStatus('active', {
        planId: currentPlanId,
        planName: selectedPlan.name,
        price: selectedPlan.price
      });
      
      // Track subscription plan change with enhanced data
      trackSubscriptionStarted(currentPlanId, selectedPlan.name, {
        plan_cost: extractPriceValue(selectedPlan.price),
        previous_plan_id: initialPlanId,
        source: 'profile_settings',
        is_plan_change: true,
        changed_at: new Date().toISOString()
      });
      
      // Track plan change in PostHog (legacy event)
      safeCapture('plan_changed', {
        plan_id: currentPlanId,
        plan_type: selectedPlan.name,
        plan_cost: extractPriceValue(selectedPlan.price),
        previous_plan_id: initialPlanId,
        last_plan_change: new Date().toISOString()
      });
      
      // Generate consistent subscription key
      const subscriptionKey = slugifyGroupKey(selectedPlan.name);
      
      // Use the centralized subscription group management
      console.log(`Updating subscription group to: ${selectedPlan.name} (key: ${subscriptionKey})`);
      updateSubscription(selectedPlan.name, selectedPlan.id, selectedPlan.price);
      
      // Direct reinforcement when posthog is available
      if (posthog) {
        console.log(`Direct PostHog reinforcement for subscription: ${selectedPlan.name} (key: ${subscriptionKey})`);
        
        // Format subscription properties consistently
        const groupProps = formatSubscriptionGroupProps(selectedPlan.name, selectedPlan.id, selectedPlan.price, {
          updated_at: new Date().toISOString(),
          method: 'settings_component'
        });
        
        // Direct PostHog calls for maximum reliability
        try {
          // Step 1: Use group method to directly associate
          posthog.group('subscription', subscriptionKey, groupProps);
          
          // Step 2: Send explicit $groupidentify event
          posthog.capture('$groupidentify', {
            $group_type: 'subscription',
            $group_key: subscriptionKey,
            $group_set: groupProps
          });
          
          // Step 3: Also capture an event with the group context
          posthog.capture('subscription_updated_settings', {
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            slug_key: subscriptionKey,
            $groups: {
              subscription: subscriptionKey
            }
          });
        } catch (err) {
          console.error('Direct PostHog subscription update error:', err);
        }
      }
      
      // Additional reinforcement with safe utilities - updated to use captureEventWithGroup
      captureEventWithGroup('subscription_update_confirmed', 'subscription', selectedPlan.name, {
        plan_id: selectedPlan.id,
        slug_key: subscriptionKey,
        set_method: 'settings_component',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Changes saved',
        description: `Your subscription plan has been updated to ${selectedPlan.name}`,
      });
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast({
        title: 'Error saving changes',
        description: error.message || 'Failed to save your subscription plan',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!isLoggedIn) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to cancel your subscription',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user metadata to indicate cancelled subscription
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          selectedPlanId: 'cancelled',
          subscriptionCancelledAt: new Date().toISOString()
        }
      });
      
      if (authError) throw authError;

      // Update the profiles table with subscription cancellation
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          subscription_plan_id: null,
          subscription_cancelled_at: new Date().toISOString(),
          subscription_expires_at: null
        })
        .eq('id', userMetadata?.sub);

      if (profileError) throw profileError;
      
      // Update the context
      updateSelectedPlan('cancelled');
      
      // Update subscription status in PostHog (for cohort analysis)
      const cancelledAt = new Date().toISOString();
      setSubscriptionStatus('cancelled', {
        cancelledAt: cancelledAt,
        reason: 'user_initiated'
      });
      
      // Track subscription cancellation with enhanced data
      trackSubscriptionCancelled('user_initiated', initialPlanId, undefined, {
        cancelled_at: cancelledAt,
        source: 'profile_settings'
      });
      
      // Track cancellation in PostHog (legacy event)
      safeCapture('subscription_cancelled', {
        previous_plan_id: initialPlanId,
        cancelled_at: cancelledAt,
        reason: 'user_initiated'
      });
      
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled successfully. You can reactivate it at any time.',
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: 'Error cancelling subscription',
        description: error.message || 'Failed to cancel your subscription',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSaveChanges,
    handleCancelSubscription
  };
};