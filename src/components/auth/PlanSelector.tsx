
import React from 'react';
import { SubscriptionPlan, Plan } from '../SubscriptionPlan';

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlanId: string | null;
  onPlanSelect: (planId: string) => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  plans, 
  selectedPlanId, 
  onPlanSelect 
}) => {
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
