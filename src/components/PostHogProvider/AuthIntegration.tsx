
import { useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { safeIdentify, safeReset, clearStoredGroups } from '../../utils/posthog';
import { slugifyGroupKey, extractPriceValue } from '../../utils/posthog/helpers';
import posthog from 'posthog-js';

interface AuthIntegrationProps {
  posthogLoadedRef: React.MutableRefObject<boolean>;
  currentUserRef: React.MutableRefObject<string | null>;
  updateUserType: (isKid: boolean) => void;
  updateSubscription: (planName: string, planId: string, planPrice: string) => void;
  setCurrentSubscriptionName: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentSubscription: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useAuthIntegration = ({
  posthogLoadedRef,
  currentUserRef,
  updateUserType,
  updateSubscription,
  setCurrentSubscriptionName,
  setCurrentSubscription
}: AuthIntegrationProps) => {
  // Effect to identify current user when PostHog is loaded
  useEffect(() => {
    if (posthogLoadedRef.current) {
      checkAndIdentifyCurrentUser();
    }
  }, [posthogLoadedRef.current]);

  // Function to identify the current user in PostHog and set groups
  const checkAndIdentifyCurrentUser = () => {
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const user = data.session.user;
          const email = user.email;
          
          if (email) {
            // Always reset before identifying to ensure clean state
            safeReset();
            clearStoredGroups();
            
            // Give a small delay to ensure reset completes
            setTimeout(() => {
              identifyUser(email, user.id, user.user_metadata);
            }, 100);
          } else {
            console.warn('User has no email, cannot identify');
          }
        }
      });
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  };

  // Function to identify a user
  const identifyUser = (email: string, userId: string, metadata?: any) => {
    if (!posthogLoadedRef.current) {
      console.warn('PostHog not loaded yet, will identify when loaded');
      return;
    }

    // Always check if this is a different email than the currently identified one
    if (email === currentUserRef.current) {
      console.log(`User already identified with this email: ${email}, forcing reset and re-identify`);
      safeReset();
      clearStoredGroups();
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    
    try {
      // Initialize PostHog directly to ensure it's available
      if (typeof posthog !== 'undefined' && posthog.identify) {
        // Use email as the primary identifier (more consistent across platforms)
        posthog.identify(email, {
          email: email,
          name: metadata?.name || email?.split('@')[0],
          supabase_id: userId,
          $set_once: { first_seen: new Date().toISOString() }
        });
        
        // Force reload feature flags after identification
        posthog.reloadFeatureFlags();
        
        // Update current user reference
        currentUserRef.current = email;
        console.log(`PostHog: User identified with email: ${email}`);
        
        // Fetch user profile to get is_kids status and subscription info
        fetchUserProfile(userId, metadata);
      } else {
        console.error('PostHog is not properly initialized for identification');
      }
    } catch (err) {
      console.error('Error identifying user in PostHog:', err);
    }
  };
  
  // Fetch user profile and identify groups
  const fetchUserProfile = (userId: string, metadata?: any) => {
    supabase
      .from('profiles')
      .select('is_kids, created_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data: profileData, error }) => {
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        
        if (profileData) {
          // Determine user type (Kid or Adult)
          const isKid = profileData?.is_kids === true;
          
          // Update user type group
          updateUserType(isKid);
          
          // Check for subscription information in user metadata
          if (metadata?.selectedPlanId) {
            fetchAndIdentifySubscriptionGroup(metadata.selectedPlanId);
          }
        } else {
          console.log('No profile data found for user, skipping group identification');
        }
      });
  };
  
  // Fetch subscription details and identify subscription group
  const fetchAndIdentifySubscriptionGroup = (planId: string) => {
    // Get plan details from the database
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()
      .then(({ data: planData, error }) => {
        if (error) {
          console.error('Error fetching plan details:', error);
          return;
        }
        
        if (planData) {
          const planName = planData.name;
          // Store original name for reference
          setCurrentSubscriptionName(planName);
          
          // Call the subscription update with plan details
          updateSubscription(planName, planId, planData.price || '0');
          
          // Update subscription state
          setCurrentSubscription(slugifyGroupKey(planName));
          
          console.log(`PostHog: Fetched and identified subscription group: ${planName}`);
        }
      });
  };

  return { checkAndIdentifyCurrentUser };
};
