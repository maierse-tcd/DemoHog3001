import React from 'react';
import { Plan, SubscriptionPlan } from '../SubscriptionPlan';

interface SubscriptionPlansGridProps {
  plans: Plan[];
  currentPlanId: string;
  onPlanSelect: (planId: string) => void;
}

export const SubscriptionPlansGrid: React.FC<SubscriptionPlansGridProps> = ({
  plans,
  currentPlanId,
  onPlanSelect
}) => {
  return (
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
            onSelect={onPlanSelect}
          />
        </div>
      ))}
    </div>
  );
};