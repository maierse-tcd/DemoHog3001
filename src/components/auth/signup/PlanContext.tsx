
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../integrations/supabase/client';

interface PlanContextType {
  selectedPlanId: string | null;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string | null>>;
  planName: string | null;
  planCost: number;
  loadPlanDetails: (planId: string) => Promise<void>;
}

// Create context with default values
const PlanContext = createContext<PlanContextType>({
  selectedPlanId: null,
  setSelectedPlanId: () => {},
  planName: null,
  planCost: 0,
  loadPlanDetails: async () => {}
});

export const usePlanContext = () => useContext(PlanContext);

interface PlanProviderProps {
  children: React.ReactNode;
  initialPlanId: string | null;
  onPlanChange?: (planId: string | null) => void;
}

export const PlanProvider: React.FC<PlanProviderProps> = ({ 
  children, 
  initialPlanId, 
  onPlanChange 
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planCost, setPlanCost] = useState<number>(0);

  // Sync with parent's initialPlanId when it changes
  useEffect(() => {
    if (initialPlanId !== selectedPlanId) {
      console.log(`PlanContext: Updating selected plan from parent: ${initialPlanId}`);
      setSelectedPlanId(initialPlanId);
      
      if (initialPlanId) {
        loadPlanDetails(initialPlanId);
      }
    }
  }, [initialPlanId]);

  // Custom setSelectedPlanId function that also calls onPlanChange callback
  const handleSetSelectedPlanId = (planId: React.SetStateAction<string | null>) => {
    const newPlanId = typeof planId === 'function' ? planId(selectedPlanId) : planId;
    
    setSelectedPlanId(newPlanId);
    
    // Notify parent component if callback is provided
    if (onPlanChange && newPlanId !== selectedPlanId) {
      console.log(`PlanContext: Notifying parent of plan change: ${newPlanId}`);
      onPlanChange(newPlanId);
    }
    
    // Load details for the new plan
    if (newPlanId) {
      loadPlanDetails(newPlanId);
    }
  };

  // Extract numeric price value from price string for analytics
  const loadPlanDetails = async (planId: string): Promise<void> => {
    try {
      console.log(`PlanContext: Loading details for plan: ${planId}`);
      const { data } = await supabase
        .from('subscription_plans')
        .select('name, price')
        .eq('id', planId)
        .single();
      
      if (data) {
        setPlanName(data.name);
        
        if (data.price) {
          const numericValue = data.price.replace(/[^\d.]/g, '');
          setPlanCost(parseFloat(numericValue) || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    }
  };

  const value = {
    selectedPlanId,
    setSelectedPlanId: handleSetSelectedPlanId,
    planName,
    planCost,
    loadPlanDetails
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};
