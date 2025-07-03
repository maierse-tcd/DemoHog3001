import { supabase } from '../../../integrations/supabase/client';
import { SignUpFormData } from './signupSchema';

export interface SignupSupabaseData {
  selectedPlanId: string;
  planName: string;
  planCost: number;
  signupDate: string;
}

export const createSupabaseUser = async (
  sanitizedEmail: string,
  values: SignUpFormData,
  { selectedPlanId, planName, planCost, signupDate }: SignupSupabaseData
) => {
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

  return data;
};