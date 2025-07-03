import { 
  identifyUserWithSubscription, 
  setUserType, 
  setSubscriptionPlan, 
  trackEvent,
  setSubscriptionStatus,
  trackSubscriptionStarted,
  type SubscriptionMetadata
} from '../../../utils/posthog/simple';
import { SignUpFormData } from './signupSchema';

export interface TrackingData {
  selectedPlanId: string;
  planName: string;
  planCost: number;
  signupDate: string;
  userId: string;
}

export const trackSignupSuccess = (
  values: SignUpFormData,
  { selectedPlanId, planName, planCost, signupDate, userId }: TrackingData
) => {
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
      supabase_id: userId,
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
    user_id: userId,
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
      user_id: userId,
      plan_cost: planCost,
      source: 'signup',
      is_first_subscription: true
    });
  }

  console.log(`PostHog: Successfully identified and tracked signup for: ${values.email}`);
};