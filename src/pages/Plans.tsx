
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PlanFeatures } from '../components/plans/PlanFeatures';
import { SubscriptionPlansGrid } from '../components/plans/SubscriptionPlansGrid';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Plan } from '../components/SubscriptionPlan';

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
            imageUrl: plan.image_url || undefined
          }));
          
          setPlans(formattedPlans);
        }
      } catch (error: any) {
        console.error('Error fetching plans:', error);
        toast({
          title: 'Error',
          description: 'Could not load subscription plans.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />
      <main className="pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Perfect Plan</h1>
            <p className="text-xl text-netflix-gray max-w-3xl mx-auto">
              Unlock the full potential of Hogflix with our flexible subscription options. 
              Find the perfect plan for your entertainment needs.
            </p>
          </div>

          <PlanFeatures />
          
          <SubscriptionPlansGrid plans={plans} isLoading={isLoading} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plans;
