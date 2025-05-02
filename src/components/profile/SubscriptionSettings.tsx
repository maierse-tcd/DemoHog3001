
import React, { useState, useEffect } from 'react';
import { toast } from '../../hooks/use-toast';
import { Plan, SubscriptionPlan } from '../SubscriptionPlan';
import { supabase } from '../../integrations/supabase/client';
import { useAuthContext } from '../../hooks/auth/useAuthContext';
import { Skeleton } from '../ui/skeleton';
import { safeCapture, safeGroupIdentify } from '../../utils/posthogUtils';

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
      if (selectedPlan) {
        safeCapture('plan_changed', {
          plan_id: currentPlanId,
          plan_type: selectedPlan.name,
          plan_cost: extractPriceValue(selectedPlan.price),
          previous_plan_id: initialPlanId,
          last_plan_change: new Date().toISOString()
        });
        
        // Update group attributes with new plan info
        safeGroupIdentify('subscription', selectedPlan.name, {
          plan_id: selectedPlan.id,
          plan_cost: extractPriceValue(selectedPlan.price),
          features_count: selectedPlan.features.length,
          last_updated: new Date().toISOString()
        });
      }
      
      toast({
        title: 'Changes saved',
        description: `Your subscription plan has been updated to ${plans.find(plan => plan.id === currentPlanId)?.name}`,
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
