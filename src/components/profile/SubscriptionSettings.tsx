import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { useSubscriptionSettings } from './hooks/useSubscriptionSettings';
import { SubscriptionPlansGrid } from './SubscriptionPlansGrid';
import { SubscriptionActions } from './SubscriptionActions';

interface SubscriptionSettingsProps {
  selectedPlanId: string;
  updateSelectedPlan: (planId: string) => void;
}

export const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({
  selectedPlanId: initialPlanId, 
  updateSelectedPlan 
}) => {
  const {
    isLoading,
    currentPlanId,
    plans,
    isLoadingPlans,
    hasChanges,
    handlePlanSelect,
    handleSaveChanges,
    handleCancelSubscription
  } = useSubscriptionSettings({
    selectedPlanId: initialPlanId,
    updateSelectedPlan
  });

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
      
      <SubscriptionPlansGrid
        plans={plans}
        currentPlanId={currentPlanId}
        onPlanSelect={handlePlanSelect}
      />
      
      <SubscriptionActions
        onSaveChanges={handleSaveChanges}
        onCancelSubscription={handleCancelSubscription}
        isLoading={isLoading}
        hasChanges={hasChanges}
      />
    </div>
  );
};
