
import { useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { safeIdentify, safeReset, clearStoredGroups } from '../../utils/posthog';
import { slugifyGroupKey } from '../../utils/posthog/helpers';

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
  // Track if component is mounted
  const isMountedRef = useRef<boolean>(true);

  // Effect to identify current user when PostHog is loaded
  useEffect(() => {
    if (posthogLoadedRef.current) {
      checkAndIdentifyCurrentUser();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [posthogLoadedRef.current]);

  // Function to identify the current user in PostHog and set groups
  const checkAndIdentifyCurrentUser = () => {
    if (!isMountedRef.current) return;
    
    supabase.auth.getSession().then(({ data }) => {
      if (!isMountedRef.current) return;
      
      if (data.session?.user) {
        const user = data.session.user;
        const email = user.email;
        
        if (email) {
          // If different user than the currently identified one, reset first
          if (currentUserRef.current && currentUserRef.current !== email) {
            console.log(`Different user detected, resetting PostHog identity before identifying: ${email}`);
            safeReset();
            clearStoredGroups();
          }
          
          // Always identify with the current session email
          identifyUser(email, user.id, user.user_metadata);
        } else {
          console.warn('User has no email, cannot identify');
        }
      } else {
        console.log('No authenticated user found');
      }
    }).catch(err => {
      console.error('Error checking session:', err);
    });
  };

  // Function to identify a user - simplified
  const identifyUser = (email: string, userId: string, metadata?: any) => {
    if (!posthogLoadedRef.current || !isMountedRef.current) {
      console.warn('PostHog not loaded yet or component unmounted');
      return;
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    currentUserRef.current = email;
    
    // Fetch profile data and identify
    fetchUserProfileAndIdentify(userId, email, metadata);
  };
  
  // Fetch user profile and identify with all properties
  const fetchUserProfileAndIdentify = (userId: string, email: string, metadata?: any) => {
    if (!posthogLoadedRef.current || !isMountedRef.current) return;
    
    supabase
      .from('profiles')
      .select('is_admin, admin_override, created_at, name, language, is_kids')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data: profileData, error }) => {
        if (!isMountedRef.current) return;
        
        if (error) {
          console.error('Error fetching profile data:', error);
          // Identify with basic properties if profile fetch fails
          safeIdentify(email, {
            email: email,
            supabase_id: userId,
            name: metadata?.name || email?.split('@')[0],
            $set_once: { first_seen: new Date().toISOString() }
          });
          return;
        }
        
        if (profileData) {
          console.log('Profile data fetched:', profileData);
          
          // Determine user type
          const isKid = profileData.is_kids === true || 
                        (profileData.is_admin === false && profileData.is_kids !== false);
          
          // Check for admin override
          const hasAdminOverride = profileData.admin_override === true;
          
          // Create complete user properties object
          const userProperties = {
            name: profileData.name || metadata?.name || email?.split('@')[0],
            is_kids_account: isKid,
            language: profileData.language || 'English',
            is_admin_user: hasAdminOverride === true || profileData.is_admin === true,
            has_admin_override: hasAdminOverride,
            email: email,
            supabase_id: userId,
            $set_once: { first_seen: new Date().toISOString() }
          };
          
          // Identify with complete properties - use email as distinct ID
          console.log(`PostHog: Identifying user with properties:`, userProperties);
          safeIdentify(email, userProperties);
          
          // Update user type in context
          updateUserType(isKid);
          
          // Check for subscription information
          if (metadata?.selectedPlanId) {
            fetchAndIdentifySubscriptionGroup(metadata.selectedPlanId);
          }
        } else {
          // No profile data, identify with basic properties
          safeIdentify(email, {
            email: email,
            supabase_id: userId,
            name: metadata?.name || email?.split('@')[0],
            $set_once: { first_seen: new Date().toISOString() }
          });
        }
      });
  };
  
  // Fetch subscription details and identify subscription group
  const fetchAndIdentifySubscriptionGroup = (planId: string) => {
    if (!isMountedRef.current) return;
    
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()
      .then(({ data: planData, error }) => {
        if (!isMountedRef.current) return;
        
        if (error) {
          console.error('Error fetching plan details:', error);
          return;
        }
        
        if (planData) {
          const planName = planData.name;
          setCurrentSubscriptionName(planName);
          updateSubscription(planName, planId, planData.price || '0');
          setCurrentSubscription(slugifyGroupKey(planName));
          
          console.log(`PostHog: Identified subscription group: ${planName}`);
        }
      });
  };

  return { checkAndIdentifyCurrentUser };
};
