import { toast } from '../../../hooks/use-toast';
import { supabase } from '../../../integrations/supabase/client';
import { validateEmail, sanitizeInput, rateLimitCheck } from '../../../utils/inputValidation';
import { SignUpFormData } from './signupSchema';

export interface ValidationResult {
  isValid: boolean;
  sanitizedEmail?: string;
}

export const validateSignupData = async (
  values: SignUpFormData,
  selectedPlanId: string | null
): Promise<ValidationResult> => {
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
    return { isValid: false };
  }
  
  // Additional email validation
  if (!validateEmail(values.email)) {
    toast({
      title: "Invalid email",
      description: "Please enter a valid email address.",
      variant: "destructive",
    });
    return { isValid: false };
  }
  
  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(values.email).toLowerCase();
  
  if (!selectedPlanId) {
    toast({
      title: "Plan not selected",
      description: "Please select a subscription plan before signing up.",
      variant: "destructive",
    });
    return { isValid: false };
  }

  if (values.password !== values.confirmPassword) {
    toast({
      title: "Passwords do not match",
      description: "Please make sure the passwords match.",
      variant: "destructive",
    });
    return { isValid: false };
  }

  return { isValid: true, sanitizedEmail };
};