
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.posthog.com';

/**
 * A simplified PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Configure PostHog with best practices
  const options = {
    api_host: POSTHOG_HOST, // Use the standard PostHog API host
    persistence: 'localStorage', // Use localStorage for persistence (more reliable than mixed mode)
    capture_pageview: true,
    autocapture: true,
    loaded: (posthog: any) => {
      console.log('PostHog loaded successfully');
    }
  };

  // Set up auth state listener for proper user identification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state changed: ${event}`, session?.user?.email);
      
      if (!window.posthog) {
        console.log('PostHog not available yet');
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Identify user with their Supabase ID (more reliable than email)
        const userId = session.user.id;
        const userEmail = session.user.email;
        
        console.log(`Identifying user in PostHog: ${userId}`);
        
        // Use the Supabase user ID as the PostHog distinct ID
        window.posthog.identify(userId, {
          email: userEmail,
          name: session.user.user_metadata?.name || userEmail?.split('@')[0],
          supabase_id: userId
        });
        
        // Force reload feature flags
        window.posthog.reloadFeatureFlags();
      } 
      else if (event === 'SIGNED_OUT') {
        // Reset PostHog identity when user signs out
        console.log('User signed out, resetting PostHog identity');
        window.posthog.reset();
        
        // Wait a short time then reload flags with anonymous identity
        setTimeout(() => {
          window.posthog.reloadFeatureFlags();
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
