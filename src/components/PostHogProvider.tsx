
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset, 
  safeReloadFeatureFlags, 
  safeCapture, 
  safeMergeIdentity, 
  safeGetDistinctId 
} from '../utils/posthogUtils';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.posthog.com';

/**
 * A simplified PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Configure PostHog with best practices
  const options = {
    api_host: POSTHOG_HOST,
    persistence: 'localStorage' as const, // Use localStorage for more reliable persistence
    capture_pageview: true,
    autocapture: true,
    loaded: (posthog: any) => {
      console.log('PostHog loaded successfully');
      // Log current distinct ID for debugging
      const currentId = safeGetDistinctId();
      console.log(`PostHog initial distinct ID: ${currentId}`);
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
        
        console.log(`Identifying user in PostHog using email: ${userEmail}`);
        
        // Get the current distinct ID before we do anything
        const currentAnonymousId = safeGetDistinctId();
        console.log(`Current anonymous ID before identification: ${currentAnonymousId}`);
        
        // IMPORTANT: First merge the anonymous ID with the user email
        // This links all previous anonymous activity to the identified user
        setTimeout(() => {
          // First merge identities to connect anonymous activity with the user
          safeMergeIdentity(userEmail);
          
          // Then identify the user with their email as the primary identifier
          setTimeout(() => {
            safeIdentify(userEmail, {
              email: userEmail,
              name: session.user.user_metadata?.name || userEmail?.split('@')[0],
              supabase_id: session.user.id
            });
            
            // Reload feature flags after identification
            setTimeout(() => {
              safeReloadFeatureFlags().then(() => {
                // Verify the identity after everything is done
                const finalId = safeGetDistinctId();
                console.log(`Final distinct ID after complete identification flow: ${finalId}`);
              });
            }, 100);
          }, 100);
        }, 100);
      } 
      else if (event === 'SIGNED_OUT') {
        // Capture logout event before resetting
        safeCapture('user_logged_out');
        
        // Reset PostHog identity when user signs out
        console.log('User signed out, resetting PostHog identity');
        safeReset();
        
        // Reload feature flags with anonymous identity
        setTimeout(() => {
          safeReloadFeatureFlags();
        }, 100);
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
