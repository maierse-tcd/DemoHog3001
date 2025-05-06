
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PlanFeatures } from '../components/plans/PlanFeatures';
import { SubscriptionPlansGrid } from '../components/plans/SubscriptionPlansGrid';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Plan } from '../components/SubscriptionPlan';
import { safeCapture, captureEventWithGroup } from '../utils/posthog';
import { useFeatureFlagVariantKey } from 'posthog-js/react';

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  // Get A/B test variant for analytics
  const ctaVariant = useFeatureFlagVariantKey('subscription_cta_test') as string | null;

  // Track page view with test variant information
  useEffect(() => {
    safeCapture('plans_page_viewed', {
      cta_variant: ctaVariant || 'control',
      timestamp: new Date().toISOString(),
      test_active: ctaVariant !== null
    });
  }, [ctaVariant]);

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

  // Extract numeric price value for analytics
  const extractPriceValue = (priceString: string): number => {
    const numericValue = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericValue) || 0;
  };

  // Handle plan selection - redirect to signup with selected plan
  const handleSelectPlan = (planId: string) => {
    // Find the selected plan to get its details
    const selectedPlan = plans.find(plan => plan.id === planId);
    
    if (selectedPlan) {
      // Track plan selection in PostHog with detailed properties and A/B test variant
      safeCapture('plan_selected', {
        plan_id: planId,
        plan_type: selectedPlan.name,
        plan_cost: extractPriceValue(selectedPlan.price),
        plan_features_count: selectedPlan.features.length,
        is_recommended: selectedPlan.recommended || false,
        selection_timestamp: new Date().toISOString(),
        cta_variant: ctaVariant || 'control',
        test_id: 'subscription_cta_test'
      });
      
      // Also track as group event for subscription analytics
      captureEventWithGroup(
        'subscription_plan_selected',
        'subscription',
        selectedPlan.name, 
        {
          plan_id: planId,
          variant: ctaVariant || 'control',
          from_page: 'plans'
        }
      );
      
      // Navigate to signup with plan ID
      navigate(`/signup?plan=${planId}`);
    } else {
      navigate(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />
      <main className="pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Perfect Hog Plan</h1>
            <p className="text-xl text-[#F1F0FB] max-w-3xl mx-auto">
              Unlock the full potential of HogFlix with our flexible subscription options. 
              Find the perfect plan for your hedgehog entertainment needs.
            </p>
          </div>

          <PlanFeatures />
          
          <SubscriptionPlansGrid plans={plans} isLoading={isLoading} onSelectPlan={handleSelectPlan} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plans;
