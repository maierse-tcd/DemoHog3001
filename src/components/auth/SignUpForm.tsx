
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
import { identifyUser, setUserType, setSubscriptionPlan, trackEvent } from '../../utils/posthog/simple';
import { PlanProvider, usePlanContext } from './signup/PlanContext';
import { PasswordFields, passwordSchema } from './signup/PasswordFields';
import { KidsAccountToggle, kidsAccountSchema } from './signup/KidsAccountToggle';
import { validateEmail, sanitizeInput, rateLimitCheck, auditLog } from '../../utils/inputValidation';

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
    
    // Rate limiting check - max 3 signup attempts per hour
    // Admins can override with higher limits for automation
    const adminOverrideEnabled = localStorage.getItem('adminRateOverride') === 'true';
    const adminOverride = adminOverrideEnabled ? { limit: 1000, windowMs: 60 * 1000 } : undefined;
    if (!rateLimitCheck('signup', 3, 60 * 60 * 1000, adminOverride)) {
      toast({
        title: "Too many attempts",
        description: "Please wait before trying to sign up again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Additional email validation
    if (!validateEmail(values.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(values.email).toLowerCase();
    
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

      if (data?.user) {
        console.log(`PostHog: Identifying new user during signup: ${values.email}`);
        
        // Immediate PostHog identification with simplified utilities
        identifyUser(values.email, {
          name: values.email.split('@')[0],
          is_kids_account: values.isKidsAccount || false,
          language: 'English',
          email: values.email,
          supabase_id: data.user.id,
          signup_date: signupDate,
          $set_once: { first_seen: signupDate }
        });

        // Set user type
        setUserType(values.isKidsAccount || false);

        // Set subscription if available
        if (planName) {
          console.log(`PostHog: Setting subscription for new user: ${planName}`);
          setSubscriptionPlan(planName, selectedPlanId, planCost.toString());
        }

        // Track signup event
        trackEvent('user_signup', {
          user_id: data.user.id,
          email: values.email,
          plan_id: selectedPlanId,
          plan_type: planName || 'Unknown Plan',
          plan_cost: planCost,
          is_kids_account: values.isKidsAccount || false,
          signup_date: signupDate
        });

        console.log(`PostHog: Successfully identified and tracked signup for: ${values.email}`);
      }

      // If sign up is successful, navigate to profile page
      navigate('/profile');

      toast({
        title: "Sign up successful",
        description: "You have successfully signed up. Redirecting to your profile...",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
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
