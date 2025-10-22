import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/use-toast';
import { SignUpFormData } from './signupSchema';
import { validateSignupData } from './signupValidation';
import { createSupabaseUser } from './signupSupabase';
import { trackSignupSuccess } from './signupTracking';
import { useDemoMode } from '../../../hooks/useDemoMode';
import { createDemoUser } from './signupDemo';

interface UseSignUpProps {
  selectedPlanId: string | null;
  planName: string;
  planCost: number;
}

export const useSignUp = ({ selectedPlanId, planName, planCost }: UseSignUpProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  const signUp = async (values: SignUpFormData) => {
    setIsLoading(true);
    
    try {
      // Validate signup data
      const validation = await validateSignupData(values, selectedPlanId);
      if (!validation.isValid || !validation.sanitizedEmail) {
        return false;
      }

      const signupDate = new Date().toISOString();
      
      let data;
      
      // Demo mode: Skip Supabase authentication
      if (isDemoMode) {
        console.log(`🎭 [${new Date().toISOString()}] Demo mode: Creating fake user`);
        data = await createDemoUser(validation.sanitizedEmail, values, {
          selectedPlanId: selectedPlanId!,
          planName,
          planCost,
          signupDate
        });
      } else {
        // Production mode: Create user in Supabase
        data = await createSupabaseUser(validation.sanitizedEmail, values, {
          selectedPlanId: selectedPlanId!,
          planName,
          planCost,
          signupDate
        });
      }

      // Track signup success in PostHog
      if (data?.user) {
        trackSignupSuccess(values, {
          selectedPlanId: selectedPlanId!,
          planName,
          planCost,
          signupDate,
          userId: data.user.id
        });
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