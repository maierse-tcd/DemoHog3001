
import { useCallback } from 'react';
import { 
  trackEvent, 
  trackGroupEvent, 
  identifyUser, 
  setUserType, 
  setSubscriptionPlan,
  getCurrentUserId,
  resetIdentity
} from '../utils/posthog/simple';

/**
 * Simplified PostHog React hook
 * Clean interface for common PostHog operations
 */
export function useSimplePostHog() {
  
  const captureEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  }, []);
  
  const captureGroupEvent = useCallback((
    eventName: string, 
    groupType: string, 
    groupKey: string, 
    properties?: Record<string, any>
  ) => {
    trackGroupEvent(eventName, groupType, groupKey, properties);
  }, []);
  
  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    identifyUser(userId, properties);
  }, []);
  
  const updateUserType = useCallback((isKid: boolean) => {
    setUserType(isKid);
  }, []);
  
  const updateSubscription = useCallback((planName: string, planId?: string, price?: string) => {
    setSubscriptionPlan(planName, planId, price);
  }, []);
  
  const getUserId = useCallback(() => {
    return getCurrentUserId();
  }, []);
  
  const reset = useCallback(() => {
    resetIdentity();
  }, []);
  
  return {
    captureEvent,
    captureGroupEvent,
    identify,
    updateUserType,
    updateSubscription,
    getUserId,
    reset
  };
}

export default useSimplePostHog;
