
import React, { createContext, useContext, useState } from 'react';
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
}

export const PlanProvider: React.FC<PlanProviderProps> = ({ children, initialPlanId }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planCost, setPlanCost] = useState<number>(0);

  // Extract numeric price value from price string for analytics
  const loadPlanDetails = async (planId: string): Promise<void> => {
    try {
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
    setSelectedPlanId,
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
