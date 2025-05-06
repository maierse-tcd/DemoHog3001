
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
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
import { PostHogContextProvider } from '../contexts/PostHogContext';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://ph.hogflix.dev'; // Updated to use proper URL format with https

/**
 * A simplified PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Get managers for different aspects of PostHog functionality
  const userManager = usePostHogUserManager();
  const subscriptionManager = usePostHogSubscriptionManager();
  const stateManager = usePostHogStateManager();

  const { 
    posthogLoadedRef, currentUserRef, 
    currentUserType, setCurrentUserType,
    currentSubscription, setCurrentSubscription,
    currentSubscriptionName, setCurrentSubscriptionName,
    initializeState
  } = stateManager;

  // Configure PostHog with best practices
  const options = {
    api_host: POSTHOG_HOST, // Using the full host URL with protocol
    persistence: 'localStorage' as const,
    capture_pageview: true,
    autocapture: true,
    loaded: (posthog: any) => {
      console.log('PostHog loaded successfully');
      posthogLoadedRef.current = true;

      // Check if user is already logged in when PostHog loads
      checkAndIdentifyCurrentUser();
    }
  };

  // Initialize state from localStorage on mount
  useEffect(() => {
    initializeState();
  }, []);

  // Function to identify the current user in PostHog and set groups
  const identifyUser = async (email: string, userId: string, metadata?: any) => {
    if (!posthogLoadedRef.current) {
      console.warn('PostHog not loaded yet, will identify when loaded');
      return;
    }

    if (email === currentUserRef.current) {
      console.log('User already identified with this email, skipping');
      return;
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    
    // Initialize PostHog directly to ensure it's available
    if (typeof posthog !== 'undefined' && posthog.identify) {
      // Use email as the primary identifier (more consistent across platforms)
      posthog.identify(email, {
        email: email,
        name: metadata?.name || email?.split('@')[0],
        supabase_id: userId,
        $set_once: { first_seen: new Date().toISOString() }
      });
      
      // Fetch user profile to get is_kids status and subscription info
      try {
        // Check if data exists before trying to access properties
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('is_kids, created_at')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        
        // Only proceed if we have valid data
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
              name: userType, // REQUIRED: Name property is essential for group to appear in UI
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
      } catch (error) {
        console.error('Error fetching profile for group identification:', error);
      }
      
      console.log(`PostHog: User identified with email: ${email}`);
      
      // Update current user reference
      currentUserRef.current = email;
    } else {
      console.error('PostHog is not properly initialized for identification');
    }
  };
  
  // Fetch subscription details and identify subscription group
  const fetchAndIdentifySubscriptionGroup = async (planId: string) => {
    try {
      // Get plan details from the database
      const { data: planData, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
        
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
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
    }
  };

  // Check if user is already logged in and identify them
  const checkAndIdentifyCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        const user = data.session.user;
        const email = user.email;
        
        if (email) {
          identifyUser(email, user.id, user.user_metadata);
        } else {
          console.warn('User has no email, cannot identify');
        }
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  };

  // Set up auth state listener for proper user identification
  useEffect(() => {
    console.log('Setting up PostHog auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event} ${session?.user?.email}`);
      
      // Handle sign in event
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userEmail = session.user.email;
        
        if (!userEmail) {
          console.warn('User email is missing, cannot identify in PostHog');
          return;
        }
        
        // Only identify if PostHog is loaded
        if (posthogLoadedRef.current) {
          identifyUser(userEmail, session.user.id, session.user.user_metadata);
        } else {
          console.log('PostHog not loaded yet, will identify when loaded');
          // Store the email to identify later when PostHog is loaded
          setTimeout(() => {
            if (posthogLoadedRef.current) {
              identifyUser(userEmail, session.user.id, session.user.user_metadata);
            }
          }, 1000); // Try again after a delay
        }
      } 
      else if (event === 'SIGNED_OUT') {
        // Reset PostHog identity when user signs out
        if (posthogLoadedRef.current && typeof posthog !== 'undefined' && posthog.reset) {
          // Capture logout event before resetting
          posthog.capture('user_logged_out');
          
          console.log('User signed out, resetting PostHog identity');
          posthog.reset();
          
          // Update current user reference
          currentUserRef.current = null;
          // Reset user type and subscription
          setCurrentUserType(null);
          setCurrentSubscription(null);
          setCurrentSubscriptionName(null);
          // Clear stored groups
          clearStoredGroups();
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create the context value
  const contextValue = {
    updateUserType: userManager.updateUserType,
    updateSubscription: subscriptionManager.updateSubscription
  };

  return (
    <PostHogContextProvider value={contextValue}>
      <OriginalPostHogProvider 
        apiKey={POSTHOG_KEY}
        options={options}
      >
        {children}
      </OriginalPostHogProvider>
    </PostHogContextProvider>
  );
};
