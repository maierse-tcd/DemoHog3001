import { useState, useEffect } from 'react';
import { toast } from '../../../hooks/use-toast';
import { Plan } from '../../SubscriptionPlan';
import { supabase } from '../../../integrations/supabase/client';

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

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

  return {
    plans,
    isLoadingPlans
  };
};