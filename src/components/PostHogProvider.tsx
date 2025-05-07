import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset,
  clearStoredGroups
} from '../utils/posthog';
import { slugifyGroupKey, extractPriceValue } from '../utils/posthog/helpers';
import posthog from 'posthog-js';
import { usePostHogUserManager } from '../posthog/UserManager';
import { usePostHogSubscriptionManager } from '../posthog/SubscriptionManager';
import { usePostHogStateManager } from '../posthog/StateManager';
import { usePostHogEventManager } from '../posthog/EventManager';
import { PostHogContextProvider } from '../contexts/PostHogContext';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://ph.hogflix.dev';

/**
 * Enhanced PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Get managers for different aspects of PostHog functionality
  const userManager = usePostHogUserManager();
  const subscriptionManager = usePostHogSubscriptionManager();
  const eventManager = usePostHogEventManager();
  const stateManager = usePostHogStateManager();

  const { 
    posthogLoadedRef, 
    currentUserRef, 
    currentUserType, 
    setCurrentUserType,
    currentSubscription, 
    setCurrentSubscription,
    currentSubscriptionName, 
    setCurrentSubscriptionName,
    initializeState
  } = stateManager;

  // Initialize state from localStorage on mount
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Create the context value with all needed methods
  const contextValue = useMemo(() => ({
    // User management
    updateUserType: userManager.updateUserType,
    identifyUserGroup: userManager.identifyUserGroup,
    
    // Subscription management
    updateSubscription: subscriptionManager.updateSubscription,
    identifySubscriptionGroup: subscriptionManager.identifySubscriptionGroup,
    
    // Event tracking
    captureEvent: eventManager.captureEvent,
    captureGroupEvent: eventManager.captureGroupEvent
  }), [
    userManager.updateUserType,
    userManager.identifyUserGroup,
    subscriptionManager.updateSubscription,
    subscriptionManager.identifySubscriptionGroup,
    eventManager.captureEvent,
    eventManager.captureGroupEvent
  ]);

  return (
    <PostHogContextProvider value={contextValue}>
      <OriginalPostHogProvider 
        apiKey={POSTHOG_KEY}
        options={{
          api_host: POSTHOG_HOST,
          persistence: 'localStorage' as const,
          capture_pageview: true,
          autocapture: true,
          loaded: (posthogInstance: any) => {
            console.log('PostHog loaded successfully');
            posthogLoadedRef.current = true;
            checkAndIdentifyCurrentUser();
          }
        }}
      >
        {children}
      </OriginalPostHogProvider>
    </PostHogContextProvider>
  );

  // Function to identify the current user in PostHog and set groups
  function checkAndIdentifyCurrentUser() {
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const user = data.session.user;
          const email = user.email;
          
          if (email) {
            identifyUser(email, user.id, user.user_metadata);
          } else {
            console.warn('User has no email, cannot identify');
          }
        }
      });
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  }

  // Function to identify a user
  function identifyUser(email: string, userId: string, metadata?: any) {
    if (!posthogLoadedRef.current) {
      console.warn('PostHog not loaded yet, will identify when loaded');
      return;
    }

    if (email === currentUserRef.current) {
      console.log('User already identified with this email, skipping');
      return;
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
  }
  
  // Fetch user profile and identify groups
  function fetchUserProfile(userId: string, metadata?: any) {
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
          // Get date joined from metadata or profile created_at
          const dateJoined = profileData?.created_at || new Date().toISOString();
          
          // Determine user type (Kid or Adult)
          const isKid = profileData?.is_kids === true;
          const userType = isKid ? 'Kid' : 'Adult';
          
          // Only identify group if the user type has changed
          if (userType !== currentUserType) {
            // Update UI state first
            setCurrentUserType(userType);
            
            // Identify group
            userManager.identifyUserGroup(userType, {
              name: userType,
              date_joined: dateJoined
            });
          }
          
          // Check for subscription information in user metadata
          if (metadata?.selectedPlanId) {
            fetchAndIdentifySubscriptionGroup(metadata.selectedPlanId);
          }
        } else {
          console.log('No profile data found for user, skipping group identification');
        }
      });
  }
  
  // Fetch subscription details and identify subscription group
  function fetchAndIdentifySubscriptionGroup(planId: string) {
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
          
          // Call the subscription group identification with plan details
          subscriptionManager.identifySubscriptionGroup(planName, {
            plan_id: planId,
            plan_cost: extractPriceValue(planData.price),
            features_count: planData.features?.length || 0,
            last_updated: new Date().toISOString()
          });
          
          // Update subscription state
          setCurrentSubscription(slugifyGroupKey(planName));
          
          console.log(`PostHog: Fetched and identified subscription group: ${planName}`);
        }
      });
  }
};
