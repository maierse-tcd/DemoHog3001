
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { safeIdentify, safeReset, safeCapture } from '../utils/posthogUtils';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.posthog.com';

/**
 * A simplified PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Track if PostHog has been initialized
  const posthogLoadedRef = useRef(false);
  // Track the current user to avoid duplicate identifications
  const currentUserRef = useRef<string | null>(null);

  // Configure PostHog with best practices
  const options = {
    api_host: POSTHOG_HOST,
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

  // Function to identify the current user in PostHog
  const identifyUser = (email: string, userId: string, metadata?: any) => {
    if (!posthogLoadedRef.current) {
      console.warn('PostHog not loaded yet, identification will be skipped');
      return;
    }

    if (email === currentUserRef.current) {
      console.log('User already identified with this email, skipping');
      return;
    }

    console.log(`Identifying user in PostHog with email: ${email}`);
    
    // Use email as the primary identifier (more consistent across platforms)
    safeIdentify(email, {
      email: email,
      name: metadata?.name || email?.split('@')[0],
      supabase_id: userId,
      $set_once: { first_seen: new Date().toISOString() }
    });
    
    // Capture login event
    safeCapture('user_identified');
    
    // Update current user reference
    currentUserRef.current = email;
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
      console.log(`Auth state changed: ${event}`, session?.user?.email);
      
      // Handle sign in event
      if (event === 'SIGNED_IN' && session?.user) {
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
        }
      } 
      else if (event === 'SIGNED_OUT') {
        // Capture logout event before resetting
        safeCapture('user_logged_out');
        
        // Reset PostHog identity when user signs out
        console.log('User signed out, resetting PostHog identity');
        safeReset();
        
        // Update current user reference
        currentUserRef.current = null;
      }
    });
    
    return () => {
      subscription.unsubscribe();
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
