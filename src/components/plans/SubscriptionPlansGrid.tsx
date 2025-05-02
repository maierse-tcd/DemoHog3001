
import React from 'react';
import { SubscriptionPlan, Plan } from '../SubscriptionPlan';
import { Skeleton } from '../ui/skeleton';

interface SubscriptionPlansGridProps {
  plans: Plan[];
  isLoading: boolean;
  onSelectPlan?: (planId: string) => void;
}

export const SubscriptionPlansGrid: React.FC<SubscriptionPlansGridProps> = ({ 
  plans, 
  isLoading,
  onSelectPlan 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
        {[1, 2, 3].map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden">
            <Skeleton className="h-[450px] w-full bg-netflix-darkgray/50" />
          </div>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-netflix-gray">
        <p>No subscription plans available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
      {plans.map((plan) => (
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
            plan={plan}
            selectedPlanId={null}
            onSelect={onSelectPlan || (() => {})}
          />
        </div>
      ))}
    </div>
  );
};
