
import React, { useState, useEffect } from 'react';
import { toast } from '../../hooks/use-toast';
import { Plan, SubscriptionPlan } from '../SubscriptionPlan';
import { supabase } from '../../integrations/supabase/client';
import { useAuthContext } from '../../hooks/auth/useAuthContext';
import { Skeleton } from '../ui/skeleton';
import { safeCapture, safeGroupIdentify, safeCaptureWithGroup } from '../../utils/posthogUtils';
import { usePostHog } from 'posthog-js/react';

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
  
  // Use effect to sync with any external changes to the plan
  useEffect(() => {
    setCurrentPlanId(initialPlanId);
  }, [initialPlanId]);
  
  // Extract numeric price value for analytics
  const extractPriceValue = (priceString: string): number => {
    const numericValue = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericValue) || 0;
  };

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

  // Function to explicitly identify user with a subscription group
  const identifyUserWithSubscriptionGroup = (planName: string, planId: string, planPrice: string) => {
    try {
      // 1. Prepare group properties with name being MANDATORY for PostHog UI visibility
      const groupProperties = {
        name: planName, // REQUIRED: This is critical for group to show in PostHog UI
        plan_id: planId,
        plan_cost: extractPriceValue(planPrice),
        features_count: plans.find(p => p.id === planId)?.features.length || 0,
        last_updated: new Date().toISOString()
      };
      
      console.log('Identifying with subscription group:', planName, groupProperties);
      
      // 2. Use direct PostHog instance if available (most reliable method)
      if (posthog) {
        // Method 1: Use group method
        posthog.group('subscription', planName, groupProperties);
        
        // Method 2: Send explicit $groupidentify event (essential for UI visibility)
        posthog.capture('$groupidentify', {
          $group_type: 'subscription',
          $group_key: planName,
          $group_set: groupProperties
        });
        
        // Method 3: Also associate event with the group
        posthog.capture('subscription_associated', {
          plan_name: planName,
          plan_id: planId,
          $groups: {
            subscription: planName
          }
        });
        
        console.log(`PostHog Direct: User associated with subscription group: ${planName}`);
      }
      
      // 3. Use safe utility methods as backup approach
      safeGroupIdentify('subscription', planName, groupProperties);
      
      // 4. Send explicit event with group context
      safeCaptureWithGroup('subscription_group_set', 'subscription', planName, {
        plan_id: planId,
        plan_price: extractPriceValue(planPrice),
        set_method: 'enhanced_direct',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error identifying subscription group:', error);
    }
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
      
      // Call enhanced subscription group identification
      identifyUserWithSubscriptionGroup(
        selectedPlan.name,
        selectedPlan.id, 
        selectedPlan.price
      );
      
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
      
      <button 
        onClick={handleSaveChanges} 
        className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !hasChanges}
      >
        {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes to Save"}
      </button>
    </div>
  );
};
