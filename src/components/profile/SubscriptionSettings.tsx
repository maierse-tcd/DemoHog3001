import React, { useState, useEffect } from 'react';
import { toast } from '../../hooks/use-toast';
import { Plan, SubscriptionPlan } from '../SubscriptionPlan';
import { supabase } from '../../integrations/supabase/client';
import { useAuthContext } from '../../hooks/auth/useAuthContext';
import { Skeleton } from '../ui/skeleton';
import { safeCapture, captureEventWithGroup } from '../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { usePostHogSubscription } from '../../hooks/usePostHogFeatures';
import { slugifyGroupKey, formatSubscriptionGroupProps, extractPriceValue } from '../../utils/posthog/helpers';

interface SubscriptionSettingsProps {
  selectedPlanId: string;
  updateSelectedPlan: (planId: string) => void;
}

export const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({
  selectedPlanId: initialPlanId, 
  updateSelectedPlan 
}) => {
  const { isLoggedIn, userMetadata } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(initialPlanId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const posthog = usePostHog();
  const { updateSubscription } = usePostHogSubscription();
  
  // Use effect to sync with any external changes to the plan
  useEffect(() => {
    setCurrentPlanId(initialPlanId);
  }, [initialPlanId]);
  
  // Load plans from Supabase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price');
        
        if (error) {
          throw error;
        }

        if (data) {
          // Transform data to match Plan interface
          const formattedPlans: Plan[] = data.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            features: plan.features || [],
            recommended: plan.recommended || false,
            imageUrl: plan.image_url
          }));
          
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: "Error",
          description: "Could not load subscription plans.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = (planId: string) => {
    setCurrentPlanId(planId);
    
    toast({
      title: 'Plan selected',
      description: `You've selected the ${plans.find(plan => plan.id === planId)?.name}. Click "Save Changes" to confirm.`,
    });
  };

  const handleSaveChanges = async () => {
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
      const { error } = await supabase.auth.updateUser({
        data: { 
          selectedPlanId: currentPlanId,
          lastPlanChange: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      
      // Update the context only after successful DB update
      updateSelectedPlan(currentPlanId);
      
      // Track plan change in PostHog
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

    // For simulation purposes, we'll update the user's plan to a cancelled state
    setIsLoading(true);
    
    try {
      // Update user metadata to indicate cancelled subscription
      const { error } = await supabase.auth.updateUser({
        data: { 
          selectedPlanId: 'cancelled',
          subscriptionCancelledAt: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      
      // Update the context
      updateSelectedPlan('cancelled');
      setCurrentPlanId('cancelled');
      
      // Track cancellation in PostHog
      safeCapture('subscription_cancelled', {
        previous_plan_id: initialPlanId,
        cancelled_at: new Date().toISOString(),
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

  const hasChanges = currentPlanId !== initialPlanId;

  if (isLoadingPlans) {
    return (
      <div className="bg-netflix-darkgray rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
        <p className="text-netflix-gray mb-6">
          Choose the plan that's right for you. You can always change your plan later.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((_, index) => (
            <Skeleton key={index} className="h-[450px] w-full bg-netflix-gray/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
      <p className="text-netflix-gray mb-6">
        Choose the plan that's right for you. You can always change your plan later.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {plans.map(plan => (
          <div key={plan.id} className="relative">
            {plan.imageUrl && (
              <div className="absolute inset-0 z-0 opacity-10 rounded-lg overflow-hidden">
                <img
                  src={plan.imageUrl}
                  alt={plan.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <SubscriptionPlan
              key={plan.id}
              plan={plan}
              selectedPlanId={currentPlanId}
              onSelect={handlePlanSelect}
            />
          </div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={handleSaveChanges} 
          className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes to Save"}
        </button>
        
        <button 
          onClick={handleCancelSubscription}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};
