
/**
 * Simplified PostHog group management
 * Direct group identification without complex state management
 */

import posthog from 'posthog-js';

/**
 * Identify a group - simple and direct
 */
export const identifyGroup = (
  groupType: string, 
  groupKey: string, 
  properties?: Record<string, any>
) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.group) {
      // Ensure name property for UI visibility
      const groupProperties = {
        name: groupKey,
        ...properties
      };
      
      posthog.group(groupType, groupKey, groupProperties);
    }
  } catch (error) {
    console.error('PostHog group identify error:', error);
  }
};

/**
 * Set user type (Kid/Adult)
 */
export const setUserType = (isKid: boolean) => {
  const userType = isKid ? 'Kid' : 'Adult';
  identifyGroup('user_type', userType, {
    is_kids_account: isKid,
    updated_at: new Date().toISOString()
  });
};

/**
 * Set subscription plan
 */
export const setSubscriptionPlan = (planName: string, planId?: string, price?: string) => {
  identifyGroup('subscription', planName, {
    plan_id: planId,
    price: price,
    updated_at: new Date().toISOString()
  });
};
