
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

// Storage key for identification debounce
const LAST_AUTH_CHECK_KEY = 'ph_last_auth_check';

export const useAuthIntegration = ({
  posthogLoadedRef,
  currentUserRef,
  updateUserType,
  updateSubscription,
  setCurrentSubscriptionName,
  setCurrentSubscription
}: AuthIntegrationProps) => {
  // Track if auth check is in progress to prevent loops
  const authCheckInProgressRef = useRef<boolean>(false);
  // Last identified user to prevent redundant operations
  const lastIdentifiedUserRef = useRef<string | null>(null);
  // Track when the last auth check was performed
  const lastAuthCheckTimeRef = useRef<number>(0);
  // Track if component is mounted
  const isMountedRef = useRef<boolean>(true);

  // Helper to check if an identification was recent
  const wasRecentlyChecked = (): boolean => {
    try {
      const lastCheck = localStorage.getItem(LAST_AUTH_CHECK_KEY);
      if (!lastCheck) return false;
      
      const { timestamp } = JSON.parse(lastCheck);
      return Date.now() - timestamp < 30000; // 30 second throttle
    } catch (err) {
      return false;
    }
  };
  
  // Helper to record a check time
  const recordCheckTime = (): void => {
    try {
      localStorage.setItem(LAST_AUTH_CHECK_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
    } catch (err) {
      // Ignore storage errors
    }
  };

  // Effect to identify current user when PostHog is loaded
  useEffect(() => {
    // Only check if PostHog is loaded and no check is in progress
    if (posthogLoadedRef.current && !authCheckInProgressRef.current) {
      // Avoid excessive checks
      if (wasRecentlyChecked()) {
        return;
      }
      
      const now = Date.now();
      // Limit checks to at most once every 10 seconds
      if (now - lastAuthCheckTimeRef.current > 10000) {
        lastAuthCheckTimeRef.current = now;
        recordCheckTime();
        checkAndIdentifyCurrentUser();
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [posthogLoadedRef.current]);

  // Function to identify the current user in PostHog and set groups
  const checkAndIdentifyCurrentUser = () => {
    // Prevent concurrent checks
    if (authCheckInProgressRef.current || !isMountedRef.current) {
      console.log("Auth check already in progress or component unmounted, skipping");
      return;
    }
    
    authCheckInProgressRef.current = true;
    
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (!isMountedRef.current) {
          authCheckInProgressRef.current = false;
          return;
        }
        
        if (data.session?.user) {
          const user = data.session.user;
          const email = user.email;
          
          if (email) {
            // Check if this is the same user we've already identified
            if (email === lastIdentifiedUserRef.current) {
              console.log(`User ${email} already identified, skipping redundant identification`);
              authCheckInProgressRef.current = false;
              return;
            }
            
            // If different user than the currently identified one
            if (currentUserRef.current && currentUserRef.current !== email) {
              console.log(`User already identified with this email: ${email}, forcing reset and re-identify`);
              
              // Ensure we don't reidentify too soon
              setTimeout(() => {
                if (!isMountedRef.current) {
                  authCheckInProgressRef.current = false;
                  return;
                }
                
                safeReset();
                clearStoredGroups();
                
                // Brief delay to ensure reset completes
                setTimeout(() => {
                  if (!isMountedRef.current) {
                    authCheckInProgressRef.current = false;
                    return;
                  }
                  
                  identifyUser(email, user.id, user.user_metadata);
                  authCheckInProgressRef.current = false;
                }, 300);
              }, 100);
            } else {
              // No user currently identified
              identifyUser(email, user.id, user.user_metadata);
              authCheckInProgressRef.current = false;
            }
          } else {
            console.warn('User has no email, cannot identify');
            authCheckInProgressRef.current = false;
          }
        } else {
          // No session, nothing to do
          console.log('No authenticated user found');
          authCheckInProgressRef.current = false;
        }
      }).catch(err => {
        console.error('Error checking session:', err);
        authCheckInProgressRef.current = false;
      });
    } catch (error) {
      console.error('Error checking current user:', error);
      authCheckInProgressRef.current = false;
    }
  };

  // Function to identify a user
  const identifyUser = (email: string, userId: string, metadata?: any) => {
    if (!posthogLoadedRef.current || !isMountedRef.current) {
      console.warn('PostHog not loaded yet or component unmounted');
      return;
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    lastIdentifiedUserRef.current = email;
    currentUserRef.current = email;
    
    try {
      // Always identify with email as the distinct ID for consistency
      safeIdentify(email, {
        email: email,
        supabase_id: userId,
        $set_once: { first_seen: new Date().toISOString() }
      });
      
      // Then fetch additional profile data in a separate operation
      // Use setTimeout to avoid render cycle conflicts
      setTimeout(() => {
        if (!isMountedRef.current) return;
        fetchUserProfileAndIdentify(userId, email, metadata);
      }, 500);
    } catch (err) {
      console.error('Error identifying user in PostHog:', err);
    }
  };
  
  // Fetch user profile and identify with all properties
  const fetchUserProfileAndIdentify = (userId: string, email: string, metadata?: any) => {
    if (!posthogLoadedRef.current || !isMountedRef.current) return;
    
    supabase
      .from('profiles')
      .select('is_admin, created_at, name, language, is_kids')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data: profileData, error }) => {
        if (!isMountedRef.current) return;
        
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        
        if (profileData) {
          console.log('Profile data:', profileData);
          console.log('Language from profile:', profileData.language || 'English');
          
          // Now we have both is_kids and is_admin fields
          const isKid = profileData.is_kids === true || 
                        (profileData.is_admin === false && profileData.is_kids !== false);
          
          // Create complete user properties object with profile data
          const userProperties = {
            name: profileData.name || metadata?.name || email?.split('@')[0],
            is_kids_account: isKid,
            language: profileData.language || 'English',
            // Add this to ensure proper feature flag evaluation
            is_admin_user: profileData.is_admin === true || email.endsWith('@posthog.com'),
            email: email // Always include email for consistency
          };
          
          // Re-identify with complete properties after sufficient delay
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            // Always use email as the identifier for consistency
            safeIdentify(email, userProperties);
            
            // Wait before updating user type
            setTimeout(() => {
              if (!isMountedRef.current) return;
              updateUserType(isKid);
              
              // Check for subscription information after user is identified
              if (metadata?.selectedPlanId) {
                setTimeout(() => {
                  if (!isMountedRef.current) return;
                  fetchAndIdentifySubscriptionGroup(metadata.selectedPlanId);
                }, 1000);
              }
            }, 800);
          }, 800);
        }
      });
  };
  
  // Fetch subscription details and identify subscription group
  const fetchAndIdentifySubscriptionGroup = (planId: string) => {
    if (!isMountedRef.current) return;
    
    // Get plan details from the database
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
          // Store original name for reference
          setCurrentSubscriptionName(planName);
          
          // Significant delay before updating subscription to avoid race conditions
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            // Call the subscription update with plan details
            updateSubscription(planName, planId, planData.price || '0');
            
            // Update subscription state
            setCurrentSubscription(slugifyGroupKey(planName));
            
            console.log(`PostHog: Fetched and identified subscription group: ${planName}`);
          }, 1200);
        }
      });
  };

  return { checkAndIdentifyCurrentUser };
};
