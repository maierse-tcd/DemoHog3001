
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { safeGroupIdentify } from '../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { usePostHogContext } from '../../contexts/PostHogContext';
import { PlanProvider, usePlanContext } from './signup/PlanContext';
import { PasswordFields, passwordSchema } from './signup/PasswordFields';
import { KidsAccountToggle, kidsAccountSchema } from './signup/KidsAccountToggle';
import { trackSignup, identifySubscription } from './signup/AnalyticsUtils';

// Define the schema for the form
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  ...passwordSchema.shape,
  ...kidsAccountSchema.shape
});

interface SignUpFormProps {
  selectedPlanId: string | null;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string | null>>;
}

const SignUpFormInner: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get PostHog context and instance
  const { updateSubscription } = usePostHogContext();
  const posthog = usePostHog();
  
  // Get plan context
  const { selectedPlanId, planName, planCost, loadPlanDetails } = usePlanContext();
  
  // Load plan details when plan ID changes
  useEffect(() => {
    if (selectedPlanId) {
      loadPlanDetails(selectedPlanId);
    }
  }, [selectedPlanId, loadPlanDetails]);

  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      isKidsAccount: false
    },
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    setIsLoading(true);
    
    if (!selectedPlanId) {
      toast({
        title: "Plan not selected",
        description: "Please select a subscription plan before signing up.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (values.password !== values.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure the passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const signupDate = new Date().toISOString();
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            selectedPlanId: selectedPlanId,
            isKidsAccount: values.isKidsAccount || false,
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

      // Create PostHog group for user type
      const userType = values.isKidsAccount ? 'Kid' : 'Adult';
      safeGroupIdentify('user_type', userType, {
        name: userType, // Explicitly set name for UI visibility
        date_joined: signupDate,
        subscription_plan: selectedPlanId
      });
      
      // Use the centralized subscription update method
      if (planName) {
        console.log(`Registering new user with subscription: ${planName}`);
        updateSubscription(planName, selectedPlanId, planCost.toString());
        
        // Direct PostHog reinforcement for maximum reliability
        identifySubscription(posthog, planName, selectedPlanId, planCost);
      }
      
      // Track signup analytics
      if (data?.user) {
        trackSignup(
          data.user.id, 
          values.email, 
          selectedPlanId, 
          planName || 'Unknown Plan',
          planCost,
          values.isKidsAccount || false
        );
      }

      // If sign up is successful, navigate to profile page
      navigate('/profile');

      toast({
        title: "Sign up successful",
        description: "You have successfully signed up. Redirecting to your profile...",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Password fields component */}
        <PasswordFields form={form} />
        
        {/* Kids account toggle component */}
        <KidsAccountToggle form={form} />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};

// Wrapper component that provides the PlanContext
export const SignUpForm: React.FC<SignUpFormProps> = ({ selectedPlanId, setSelectedPlanId }) => {
  return (
    <PlanProvider initialPlanId={selectedPlanId}>
      <SignUpFormInner />
    </PlanProvider>
  );
};
