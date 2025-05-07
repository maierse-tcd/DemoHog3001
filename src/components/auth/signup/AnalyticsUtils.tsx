
import { safeCapture, captureEventWithGroup } from '../../../utils/posthog';
import { PostHog } from '../../../types/posthog';

// Analytics helper functions for the signup process
export const trackSignup = (
  userId: string,
  email: string,
  planId: string,
  planName: string,
  planCost: number,
  isKidsAccount: boolean
): void => {
  const signupDate = new Date().toISOString();
  
  // Track signup event with plan details
  safeCapture('user_signup', {
    user_id: userId,
    email: email,
    plan_id: planId,
    plan_type: planName,
    plan_cost: planCost,
    is_kids_account: isKidsAccount || false,
    signup_date: signupDate
  });
};

// Direct PostHog reinforcement for subscription identification
export const identifySubscription = (
  posthog: PostHog | null,
  planName: string, 
  planId: string, 
  planCost: number
): void => {
  if (!posthog) return;
  
  const signupDate = new Date().toISOString();
  console.log(`Direct PostHog subscription identification for new user: ${planName}`);
  
  // Prepare group properties with name
  const groupProps = {
    name: planName, // REQUIRED for UI visibility
    plan_id: planId,
    plan_cost: planCost,
    signup_date: signupDate
  };
  
  try {
    // Step 1: Direct group method
    posthog.group('subscription', planName, groupProps);
    
    // Step 2: Explicit $groupidentify event
    posthog.capture('$groupidentify', {
      $group_type: 'subscription',
      $group_key: planName,
      $group_set: groupProps
    });
    
    // Step 3: Reinforcement event with group context
    posthog.capture('signup_with_subscription', {
      plan_name: planName,
      plan_id: planId,
      $groups: {
        subscription: planName
      }
    });
    
    console.log(`PostHog: New user associated with subscription: ${planName}`);
    
    // Additional reinforcement with safe utilities
    captureEventWithGroup('signup_with_subscription_event', 'subscription', planName, {
      plan_id: planId,
      plan_cost: planCost,
      set_method: 'signup_process',
      timestamp: signupDate
    });
  } catch (err) {
    console.error("PostHog direct subscription identify error at signup:", err);
  }
};
