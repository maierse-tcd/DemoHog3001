
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { safeGroupIdentify } from '../../utils/posthogUtils';

// Define the schema for the form
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  isKidsAccount: z.boolean().optional()
});

interface SignUpFormProps {
  selectedPlanId: string | null;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ selectedPlanId, setSelectedPlanId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            selectedPlanId: selectedPlanId,
            isKidsAccount: values.isKidsAccount || false,
            signupDate: new Date().toISOString()
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create PostHog group for user type
      const userType = values.isKidsAccount ? 'Kid' : 'Adult';
      safeGroupIdentify('user_type', userType, {
        name: userType,
        date_joined: new Date().toISOString(),
        subscription_plan: selectedPlanId
      });

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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="Enter your password" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input placeholder="Confirm your password" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Kids Account Checkbox */}
        <FormField
          control={form.control}
          name="isKidsAccount"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-netflix-gray/30">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isKidsAccount"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="isKidsAccount">
                  This is a kids account
                </FormLabel>
                <FormDescription>
                  Kids accounts have restricted content and simplified controls.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};
