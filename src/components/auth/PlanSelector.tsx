import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, Plan } from '../SubscriptionPlan';
import { supabase } from '../../integrations/supabase/client';
import { Skeleton } from '../ui/skeleton';

interface PlanSelectorProps {
  plans?: Plan[];
  selectedPlanId: string | null;
  onPlanSelect: (planId: string) => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  plans: providedPlans, 
  selectedPlanId, 
  onPlanSelect 
}) => {
  const [plans, setPlans] = useState<Plan[]>(providedPlans || []);
  const [isLoading, setIsLoading] = useState(!providedPlans);

  useEffect(() => {
    // If plans are provided via props, use them
    if (providedPlans && providedPlans.length > 0) {
      setPlans(providedPlans);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from Supabase
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [providedPlans]);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-xl font-medium mb-4">Choose your plan</h3>
        <p className="text-netflix-gray mb-4">Select the subscription plan that works for you.</p>
        <div className="space-y-4">
          {[1, 2, 3].map(index => (
            <Skeleton key={index} className="h-[200px] w-full bg-netflix-darkgray/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Choose your plan</h3>
      <p className="text-netflix-gray mb-4">Select the subscription plan that works for you.</p>
      <div className="space-y-4">
        {plans.map(plan => (
          <SubscriptionPlan
            key={plan.id}
            plan={plan}
            selectedPlanId={selectedPlanId}
            onSelect={onPlanSelect}
          />
        ))}
      </div>
    </div>
  );
};
