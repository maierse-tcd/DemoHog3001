/**
 * Demo Mode Signup Handler
 * Creates mock user sessions without Supabase authentication
 */

import { createDemoSession, DemoSession } from '../../../utils/demoAuth';
import { SignUpFormData } from './signupSchema';
import { SignupSupabaseData } from './signupSupabase';

export const createDemoUser = async (
  sanitizedEmail: string,
  values: SignUpFormData,
  { selectedPlanId, planName, planCost, signupDate }: SignupSupabaseData
): Promise<{ user: DemoSession['user']; session: DemoSession }> => {
  console.log(`🎭 [${new Date().toISOString()}] Demo mode: Creating fake user ${sanitizedEmail}`);
  
  // Create demo session with user data
  const session = createDemoSession(sanitizedEmail, {
    name: sanitizedEmail.split('@')[0],
    is_kids_account: values.isKidsAccount || false,
    language: values.language,
    subscription_status: 'active',
    subscription_plan_id: selectedPlanId
  });
  
  console.log(`🎭 [${new Date().toISOString()}] Demo user created:`, {
    id: session.user.id,
    email: session.user.email,
    plan: planName
  });
  
  return {
    user: session.user,
    session
  };
};
