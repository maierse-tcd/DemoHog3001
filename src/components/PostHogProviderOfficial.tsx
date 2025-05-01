
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset, 
  safeReloadFeatureFlags,
  safeRemoveFeatureFlags
} from '../utils/posthogUtils';

const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const PostHogProviderOfficial = ({ children }: { children: React.ReactNode }) => {
  const options = {
    api_host: 'https://eu-ph.livehog.com',
    ui_host: POSTHOG_HOST,
    persistence: 'localStorage' as const,
    persistence_name: 'ph_hogflix_user',
    capture_pageview: false,
    autocapture: false,
    loaded: (posthog: any) => {
      // Load feature flags when PostHog is loaded
      posthog.reloadFeatureFlags();
      console.log("PostHog loaded and feature flags requested");
    },
    feature_flag_request_timeout_ms: 3000
  };

  // Auth state effect
  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    const handleAuthChange = (event: string, session: any) => {
      if (!isMounted) return;
      
      // Only process significant events
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
        console.log(`Auth state changed: ${event} ${session?.user?.email || 'undefined'}`);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userEmail = session.user.email;
          
          if (userEmail) {
            console.log("PostHog: Identifying user with email:", userEmail);
            
            try {
              // Use email as identifier
              safeIdentify(userEmail, {
                email: userEmail,
                name: session.user.user_metadata?.name || userEmail.split('@')[0],
                id: session.user.id
              });
              
              // Force flag reload with delay after identifying
              setTimeout(() => {
                // Reload feature flags
                safeReloadFeatureFlags();
                console.log("Feature flags reloaded after user identification");
              }, 500);
            } catch (err) {
              console.error("PostHog event error:", err);
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          try {
            // Reset identity after sign out and clear feature flags
            safeReset();
            safeRemoveFeatureFlags();
            console.log("PostHog: User signed out, identity reset and feature flags cleared");
          } catch (err) {
            console.error("PostHog event error:", err);
          }
        }
      }
    };
    
    // Set up auth listener
    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(handleAuthChange);
      authSubscription = data.subscription;
    };
    
    setupAuthListener();
    
    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <PostHogProvider 
      apiKey={POSTHOG_KEY}
      options={options}
    >
      {children}
    </PostHogProvider>
  );
};
