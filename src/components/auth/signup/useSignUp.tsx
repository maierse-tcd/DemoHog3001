import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/use-toast';
import { supabase } from '../../../integrations/supabase/client';
import { 
  identifyUserWithSubscription, 
  setUserType, 
  setSubscriptionPlan, 
  trackEvent,
  setSubscriptionStatus,
  trackSubscriptionStarted,
  type SubscriptionMetadata
} from '../../../utils/posthog/simple';
import { validateEmail, sanitizeInput, rateLimitCheck } from '../../../utils/inputValidation';
import { SignUpFormData } from './signupSchema';

interface UseSignUpProps {
  selectedPlanId: string | null;
  planName: string;
  planCost: number;
}

export const useSignUp = ({ selectedPlanId, planName, planCost }: UseSignUpProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const signUp = async (values: SignUpFormData) => {
    setIsLoading(true);
    
    try {
      // Rate limiting check - max 3 signup attempts per hour
      // Admins can override with higher limits for automation
      let adminOverride = undefined;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin_override')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.admin_override) {
          adminOverride = { limit: 1000, windowMs: 60 * 1000 };
        }
      }
      
      if (!rateLimitCheck('signup', 3, 60 * 60 * 1000, adminOverride)) {
        toast({
          title: "Too many attempts",
          description: "Please wait before trying to sign up again.",
          variant: "destructive",
        });
        return false;
      }
      
      // Additional email validation
      if (!validateEmail(values.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return false;
      }
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(values.email).toLowerCase();
      
      if (!selectedPlanId) {
        toast({
          title: "Plan not selected",
          description: "Please select a subscription plan before signing up.",
          variant: "destructive",
        });
        return false;
      }

      if (values.password !== values.confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "Please make sure the passwords match.",
          variant: "destructive",
        });
        return false;
      }

      const signupDate = new Date().toISOString();
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: values.password,
        options: {
          data: {
            selectedPlanId: selectedPlanId,
            isKidsAccount: values.isKidsAccount || false,
            language: values.language,
            signupDate: signupDate,
            planType: planName,
            planCost: planCost,
            lastPlanChange: signupDate
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        console.log(`PostHog: Identifying new user during signup: ${values.email}`);
        
        // Enhanced PostHog identification with subscription status
        const subscriptionStatus = planName ? 'active' : 'none';
        
        // Enhanced subscription metadata for better cohort analysis
        const subscriptionMetadata: SubscriptionMetadata = {
          planId: selectedPlanId,
          planName: planName,
          price: planCost.toString(),
          subscriptionStartDate: signupDate,
          subscriptionValue: planCost,
          reactivationCount: 0
        };
        
        identifyUserWithSubscription(
          values.email,
          {
            name: values.email.split('@')[0],
            is_kids_account: values.isKidsAccount || false,
            language: values.language,
            email: values.email,
            supabase_id: data.user.id,
            signup_date: signupDate,
            $set_once: { first_seen: signupDate }
          },
          subscriptionStatus,
          subscriptionMetadata
        );

        // Set user type
        setUserType(values.isKidsAccount || false);

        // Set subscription plan (for group analysis)
        if (planName) {
          console.log(`PostHog: Setting subscription for new user: ${planName}`);
          setSubscriptionPlan(planName, selectedPlanId, planCost.toString());
        }

        // Enhanced subscription status tracking with journey metadata
        setSubscriptionStatus(subscriptionStatus, subscriptionMetadata);

        // Track signup event
        trackEvent('user_signup', {
          user_id: data.user.id,
          email: values.email,
          plan_id: selectedPlanId,
          plan_type: planName || 'Unknown Plan',
          plan_cost: planCost,
          is_kids_account: values.isKidsAccount || false,
          signup_date: signupDate,
          subscription_status: subscriptionStatus
        });

        // Track subscription started with enhanced tracking
        if (planName) {
          trackSubscriptionStarted(selectedPlanId, planName, {
            user_id: data.user.id,
            plan_cost: planCost,
            source: 'signup',
            is_first_subscription: true
          });
        }

        console.log(`PostHog: Successfully identified and tracked signup for: ${values.email}`);
      }

      // If sign up is successful, navigate to profile page
      navigate('/profile');

      toast({
        title: "Sign up successful",
        description: "You have successfully signed up. Redirecting to your profile...",
      });
      
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    isLoading
  };
};