
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
  // Track if auth check is in progress to prevent loops
  const authCheckInProgressRef = useRef<boolean>(false);
  // Last identified user to prevent redundant operations
  const lastIdentifiedUserRef = useRef<string | null>(null);

  // Effect to identify current user when PostHog is loaded
  useEffect(() => {
    if (posthogLoadedRef.current && !authCheckInProgressRef.current) {
      checkAndIdentifyCurrentUser();
    }
  }, [posthogLoadedRef.current]);

  // Function to identify the current user in PostHog and set groups
  const checkAndIdentifyCurrentUser = () => {
    // Prevent concurrent checks
    if (authCheckInProgressRef.current) {
      console.log("Auth check already in progress, skipping");
      return;
    }
    
    authCheckInProgressRef.current = true;
    
    try {
      supabase.auth.getSession().then(({ data }) => {
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
              safeReset();
              clearStoredGroups();
              
              // Brief delay to ensure reset completes
              setTimeout(() => {
                identifyUser(email, user.id, user.user_metadata);
                authCheckInProgressRef.current = false;
              }, 200);
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
    if (!posthogLoadedRef.current) {
      console.warn('PostHog not loaded yet, will identify when loaded');
      return;
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    lastIdentifiedUserRef.current = email;
    
    try {
      // First try to identify with just the essential info to ensure quick identification
      // This minimizes race conditions by getting the user identified ASAP
      setTimeout(() => {
        safeIdentify(email, {
          email: email,
          supabase_id: userId,
          $set_once: { first_seen: new Date().toISOString() }
        });
        
        // Then fetch additional profile data to enhance the user properties
        fetchUserProfileAndIdentify(userId, email, metadata);
      }, 0);
    } catch (err) {
      console.error('Error identifying user in PostHog:', err);
    }
  };
  
  // Fetch user profile and identify with all properties
  const fetchUserProfileAndIdentify = (userId: string, email: string, metadata?: any) => {
    if (!posthogLoadedRef.current) return;
    
    supabase
      .from('profiles')
      .select('is_admin, created_at, name, language, is_kids')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data: profileData, error }) => {
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
          };
          
          // Don't update PostHog right away - use setTimeout to avoid blocking the render cycle
          setTimeout(() => {
            // Only update with additional properties, don't re-identify
            if (posthog && typeof posthog.people === 'object' && posthog.people.set) {
              posthog.people.set(userProperties);
              console.log("PostHog: User properties updated:", userProperties);
            }
            
            // Update user type group after a small delay to allow property updates to complete
            setTimeout(() => {
              // Update user type group
              updateUserType(isKid);
              
              // Check for subscription information in user metadata
              if (metadata?.selectedPlanId) {
                fetchAndIdentifySubscriptionGroup(metadata.selectedPlanId);
              }
            }, 300);
          }, 0);
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
          
          // Update in own event cycle to avoid blocking render
          setTimeout(() => {
            // Call the subscription update with plan details
            updateSubscription(planName, planId, planData.price || '0');
            
            // Update subscription state
            setCurrentSubscription(slugifyGroupKey(planName));
            
            console.log(`PostHog: Fetched and identified subscription group: ${planName}`);
          }, 0);
        }
      });
  };

  return { checkAndIdentifyCurrentUser };
};
