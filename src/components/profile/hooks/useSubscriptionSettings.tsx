import { useState, useEffect } from 'react';
import { toast } from '../../../hooks/use-toast';
import { usePlans } from './usePlans';
import { usePlanOperations } from './usePlanOperations';

interface UseSubscriptionSettingsProps {
  selectedPlanId: string;
  updateSelectedPlan: (planId: string) => void;
}

export const useSubscriptionSettings = ({
  selectedPlanId: initialPlanId,
  updateSelectedPlan
}: UseSubscriptionSettingsProps) => {
  const [currentPlanId, setCurrentPlanId] = useState(initialPlanId);
  const { plans, isLoadingPlans } = usePlans();
  const { isLoading, handleSaveChanges, handleCancelSubscription } = usePlanOperations({
    plans,
    initialPlanId,
    updateSelectedPlan
  });

  // Use effect to sync with any external changes to the plan
  useEffect(() => {
    setCurrentPlanId(initialPlanId);
  }, [initialPlanId]);

  const handlePlanSelect = (planId: string) => {
    setCurrentPlanId(planId);
    
    toast({
      title: 'Plan selected',
      description: `You've selected the ${plans.find(plan => plan.id === planId)?.name}. Click "Save Changes" to confirm.`,
    });
  };

  const handleSaveChangesWrapper = async () => {
    await handleSaveChanges(currentPlanId);
  };

  const handleCancelSubscriptionWrapper = async () => {
    await handleCancelSubscription();
    setCurrentPlanId('cancelled');
  };

  const hasChanges = currentPlanId !== initialPlanId;

  return {
    isLoading,
    currentPlanId,
    plans,
    isLoadingPlans,
    hasChanges,
    handlePlanSelect,
    handleSaveChanges: handleSaveChangesWrapper,
    handleCancelSubscription: handleCancelSubscriptionWrapper
  };
};