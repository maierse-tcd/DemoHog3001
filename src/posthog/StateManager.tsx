
/**
 * PostHog State Manager
 * Manages and tracks the state of PostHog integration
 */

import { useState, useRef, useCallback } from 'react';
import { getLastIdentifiedGroup } from '../utils/posthog';

export function usePostHogStateManager() {
  // Track if PostHog has been initialized
  const posthogLoadedRef = useRef(false);
  // Track the current user to avoid duplicate identifications
  const currentUserRef = useRef<string | null>(null);
  // Track the current user type to avoid duplicate group identifications
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  // Track the current subscription plan to avoid duplicate group identifications
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  // Store the original subscription name (unslugified)
  const [currentSubscriptionName, setCurrentSubscriptionName] = useState<string | null>(null);

  // Initialize state from localStorage on mount
  const initializeState = useCallback(() => {
    // Restore user type
    const savedUserType = getLastIdentifiedGroup('user_type');
    if (savedUserType) {
      console.log(`Restored user type from storage: ${savedUserType}`);
      setCurrentUserType(savedUserType);
    }
    
    // Restore subscription plan
    const savedSubscription = getLastIdentifiedGroup('subscription');
    if (savedSubscription) {
      console.log(`Restored subscription from storage: ${savedSubscription}`);
      setCurrentSubscription(savedSubscription);
    }
  }, []);

  return {
    posthogLoadedRef,
    currentUserRef,
    currentUserType,
    setCurrentUserType,
    currentSubscription,
    setCurrentSubscription,
    currentSubscriptionName,
    setCurrentSubscriptionName,
    initializeState
  };
}
