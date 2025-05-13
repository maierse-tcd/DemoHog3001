
/**
 * Hook for managing PostHog groups
 */

import { useCallback } from 'react';
import { safeGroupIdentify, getLastIdentifiedGroup } from '../../utils/posthog';
import { usePostHogContext } from '../../contexts/PostHogContext';

export function useGroupManagement() {
  const { 
    identifyUserGroup, 
    identifySubscriptionGroup 
  } = usePostHogContext();
  
  /**
   * Identify a user with a group
   */
  const identifyGroup = useCallback((
    groupType: string, 
    groupKey: string, 
    properties?: Record<string, any>
  ): void => {
    safeGroupIdentify(groupType, groupKey, properties);
  }, []);
  
  /**
   * Identify user type (Kid or Adult)
   */
  const setUserType = useCallback((
    isKid: boolean, 
    properties?: Record<string, any>
  ): void => {
    const userType = isKid ? 'Kid' : 'Adult';
    identifyUserGroup(userType, properties);
  }, [identifyUserGroup]);
  
  /**
   * Identify a user's subscription plan
   */
  const setSubscriptionPlan = useCallback((
    planName: string, 
    planId: string, 
    planPrice: string, 
    properties?: Record<string, any>
  ): void => {
    identifySubscriptionGroup(planName, {
      plan_id: planId,
      price: planPrice,
      ...properties
    });
  }, [identifySubscriptionGroup]);
  
  /**
   * Get the last identified group of a specific type
   */
  const getLastGroup = useCallback((groupType: string): string | null => {
    return getLastIdentifiedGroup(groupType);
  }, []);
  
  return {
    identifyGroup,
    setUserType,
    setSubscriptionPlan,
    getLastGroup
  };
}
