
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '../ui/form';
import { Button } from '../ui/button';
import { PlanProvider, usePlanContext } from './signup/PlanContext';
import { SignUpFields } from './signup/SignUpFields';
import { useSignUp } from './signup/useSignUp';
import { signupFormSchema, SignUpFormData } from './signup/signupSchema';

interface SignUpFormProps {
  selectedPlanId: string | null;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string | null>>;
}

const SignUpFormInner: React.FC = () => {
  // Get plan context
  const { selectedPlanId, planName, planCost, loadPlanDetails } = usePlanContext();
  
  // Custom hook for signup logic
  const { signUp, isLoading } = useSignUp({ 
    selectedPlanId, 
    planName, 
    planCost 
  });
  
  // Load plan details when plan ID changes
  useEffect(() => {
    if (selectedPlanId) {
      loadPlanDetails(selectedPlanId);
    }
  }, [selectedPlanId, loadPlanDetails]);

  // Initialize react-hook-form
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      language: "English",
      password: "",
      confirmPassword: "",
      isKidsAccount: false
    },
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<SignUpFormData> = async (values) => {
    await signUp(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SignUpFields form={form} />
        
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
