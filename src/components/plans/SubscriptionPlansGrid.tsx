
import React from 'react';
import { SubscriptionPlan, Plan } from '../SubscriptionPlan';
import { Skeleton } from '../ui/skeleton';

interface SubscriptionPlansGridProps {
  plans: Plan[];
  isLoading: boolean;
  onSelectPlan: (planId: string) => void;
}

export const SubscriptionPlansGrid: React.FC<SubscriptionPlansGridProps> = ({ 
  plans, 
  isLoading,
  onSelectPlan 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {[1, 2, 3].map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden">
            <Skeleton className="h-[450px] w-full bg-[#1A1F2C]/50" />
          </div>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-[#8E9196]">
        <p>No subscription plans available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      {plans.map((plan) => (
        <div key={plan.id} className="flex">
          <SubscriptionPlan
            plan={plan}
            selectedPlanId={null}
            onSelect={onSelectPlan}
          />
        </div>
      ))}
    </div>
  );
};
