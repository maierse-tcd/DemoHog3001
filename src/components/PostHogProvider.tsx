
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset, 
  safeCapture, 
  safeGroupIdentify, 
  getLastIdentifiedGroup,
  safeCaptureWithGroup,
  clearStoredGroups
} from '../utils/posthog';
import { slugifyGroupKey, formatSubscriptionGroupProps, extractPriceValue } from '../utils/posthog/helpers';
import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://ph.hogflix.dev'; // Updated to use proper URL format with https

/**
 * A simplified PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
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
  // Debounce timer for group identification
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce timer for subscription identification
  const subscriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Initialize currentUserType and currentSubscription from localStorage on mount
  useEffect(() => {
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
          
          // Wait for any pending debounce
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }

          // Only identify group if the user type has changed
          if (userType !== currentUserType) {
            // Update UI state first
            setCurrentUserType(userType);
            
            // Identify group with debounce
            identifyUserGroup(userType, {
              name: userType, // REQUIRED: Name property is essential for group to appear in UI
              date_joined: dateJoined
            });
            
            // Also capture an event with the group context to help establish the connection
            safeCaptureWithGroup('user_group_identified', 'user_type', userType, {
              method: 'initial_identification',
              user_email: email
            });
            
            console.log(`PostHog: User identified as ${userType}`);
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

  // Debounced group identification with persistent caching for user type
  const identifyUserGroup = (userType: string, properties?: Record<string, any>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Make sure the name property is always present (required for groups to be visible in PostHog UI)
      const groupProperties = {
        name: userType,
        ...(properties || {})
      };
      
      safeGroupIdentify('user_type', userType, groupProperties);
      debounceTimerRef.current = null;
      
      // After successful group identification, update state
      setCurrentUserType(userType);
    }, 300);
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
        identifySubscriptionGroup(planName, {
          plan_id: planId,
          plan_cost: extractPriceValue(planData.price),
          features_count: planData.features?.length || 0,
          last_updated: new Date().toISOString()
        });
        
        console.log(`PostHog: Fetched and identified subscription group: ${planName}`);
      }
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
    }
  };
  
  // Debounced subscription group identification with persistent caching
  const identifySubscriptionGroup = (planName: string, properties?: Record<string, any>) => {
    // Process the subscription name to get a consistent key
    const slugKey = slugifyGroupKey(planName);
    
    // Skip if this is the same subscription as last time (using slugified key)
    if (slugKey === currentSubscription) {
      console.log(`PostHog: User already identified with subscription: ${slugKey} (${planName}), skipping`);
      return;
    }

    if (subscriptionDebounceRef.current) {
      clearTimeout(subscriptionDebounceRef.current);
    }
    
    subscriptionDebounceRef.current = setTimeout(() => {
      console.log(`PostHog: Identifying subscription group: ${planName} (key: ${slugKey})`);
      
      // Format subscription properties consistently
      const groupProperties = formatSubscriptionGroupProps(planName, properties?.plan_id || '', 
                                                          properties?.plan_cost || 0, {
        method: 'provider_central',
        original_name: planName,
        ...(properties || {})
      });
      
      // Method 1: Use direct PostHog instance for maximum reliability
      if (posthogLoadedRef.current && typeof posthog !== 'undefined') {
        try {
          console.log(`Direct PostHog call: group('subscription', '${slugKey}')`, groupProperties);
          
          // Step 1: Direct group method
          posthog.group('subscription', slugKey, groupProperties);
          
          // Step 2: Explicit $groupidentify event (critical for UI visibility)
          posthog.capture('$groupidentify', {
            $group_type: 'subscription',
            $group_key: slugKey,
            $group_set: groupProperties
          });
          
          // Step 3: Reinforcement event associated with the group
          posthog.capture('subscription_identified', {
            plan_name: planName,
            slug_key: slugKey,
            $groups: {
              subscription: slugKey
            }
          });
          
          console.log(`PostHog Direct: User associated with subscription group: ${slugKey} (${planName})`);
        } catch (err) {
          console.error('PostHog direct subscription identify error:', err);
        }
      }
      
      // Method 2: Use safe utility as backup
      safeGroupIdentify('subscription', planName, groupProperties);
      
      // Method 3: Send explicit event with group context
      safeCaptureWithGroup('subscription_plan_associated', 'subscription', planName, {
        set_method: 'provider_central',
        timestamp: new Date().toISOString()
      });
      
      // Additional reinforcement event with subscription info
      safeCapture('subscription_group_reinforced', {
        group_key: slugKey,
        original_name: planName,
        timestamp: new Date().toISOString(),
        $groups: {
          subscription: slugKey
        }
      });
      
      subscriptionDebounceRef.current = null;
      
      // Update state after successful identification
      setCurrentSubscription(slugKey);
      setCurrentSubscriptionName(planName);
      
      console.log(`PostHog: Subscription group identified: ${slugKey} (${planName})`);
    }, 300);
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
      console.log(`Auth state changed: ${event} ${session?.user?.email}`);
      
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

  // Method to update the user group from outside components
  const updateUserType = (isKid: boolean) => {
    const newUserType = isKid ? 'Kid' : 'Adult';
    
    // Skip if already the same
    if (newUserType === currentUserType) {
      console.log(`User type unchanged (${newUserType}), skipping update`);
      return;
    }
    
    console.log(`Updating user type to: ${newUserType}`);
    
    // Get user info from Supabase to include in group properties
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const userId = data.user.id;
        
        // Fetch profile info
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .maybeSingle()
          .then(({ data: profileData }) => {
            const dateJoined = profileData?.created_at || new Date().toISOString();
            
            // Identify the group with relevant properties
            identifyUserGroup(newUserType, {
              name: newUserType, // REQUIRED for UI visibility
              update_time: new Date().toISOString(),
              date_joined: dateJoined
            });
            
            // Also capture an event with the new group
            safeCaptureWithGroup('user_type_changed', 'user_type', newUserType, {
              previous_type: currentUserType,
              changed_at: new Date().toISOString()
            });
          });
      }
    });
  };
  
  // Method to update the subscription plan from outside components
  const updateSubscription = (planName: string, planId: string, planPrice: string) => {
    console.log(`Updating subscription plan: ${planName} (${planId}, ${planPrice})`);
    
    // Format subscription properties
    const groupProperties = {
      plan_id: planId,
      plan_cost: extractPriceValue(planPrice),
      last_updated: new Date().toISOString()
    };
    
    // Process through central identification
    identifySubscriptionGroup(planName, groupProperties);
  };

  // Expose the methods through a ref that can be accessed by other components
  const posthogMethodsRef = useRef({ 
    updateUserType,
    updateSubscription
  });

  // Attach the methods to the window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__posthogMethods = posthogMethodsRef.current;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__posthogMethods;
      }
    };
  }, []);

  return (
    <OriginalPostHogProvider 
      apiKey={POSTHOG_KEY}
      options={options}
    >
      {children}
    </OriginalPostHogProvider>
  );
};

