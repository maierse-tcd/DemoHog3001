
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset, 
  safeReloadFeatureFlags,
  safeRemoveFeatureFlags,
  safeCapture,
  safeOverrideFeatureFlags
} from '../utils/posthogUtils';

const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const PostHogProviderOfficial = ({ children }: { children: React.ReactNode }) => {
  const options = {
    api_host: 'https://eu-ph.livehog.com',
    ui_host: POSTHOG_HOST,
    persistence: 'localStorage' as const, // Changed back to localStorage for better persistence
    persistence_name: 'ph_hogflix_user',
    capture_pageview: true,
    autocapture: true,
    capture_pageleave: true,
    loaded: (posthog: any) => {
      if (posthog) {
        // Enable automatic feature flag retries with higher frequency
        if (posthog.featureFlags && posthog.featureFlags._startPolling) {
          try {
            posthog.featureFlags._startPolling(30000); // Poll every 30 seconds
          } catch (e) {
            console.error("Error starting feature flag polling:", e);
          }
        }
        console.log("PostHog loaded and feature flags requested");
      }
    },
    feature_flag_request_timeout_ms: 5000, // Increased timeout for flag requests
    bootstrap: { distinctID: 'anonymous' } // Start with anonymous ID until we identify
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
              // Use email as persistent identifier
              safeIdentify(userEmail, {
                email: userEmail,
                name: session.user.user_metadata?.name || userEmail.split('@')[0],
                id: session.user.id,
                $set: { // Ensure these properties are set on the user
                  email: userEmail,
                  name: session.user.user_metadata?.name || userEmail.split('@')[0],
                  id: session.user.id
                }
              });
              
              // Explicitly set isIdentified property we can check elsewhere
              safeOverrideFeatureFlags({
                isIdentified: true
              });
              
              // Capture login event
              safeCapture('user_logged_in', {
                distinct_id: userEmail, // Explicitly set the distinct_id
                $set: {
                  email: userEmail,
                  name: session.user.user_metadata?.name || userEmail.split('@')[0],
                  id: session.user.id
                }
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
            // Capture logout event before resetting identity
            safeCapture('user_logged_out');
            
            // Override feature flags to false before logout
            safeOverrideFeatureFlags({
              is_admin: false,
              isIdentified: false
            });
            
            // First reset identity and wait for it to complete before removing flags
            safeReset();
            console.log("PostHog: User signed out, identity reset");
            
            // Add a small delay to ensure the reset is processed before removing flags
            setTimeout(() => {
              // Then remove feature flags
              safeRemoveFeatureFlags();
              
              // Explicitly reload with the anonymous identity
              setTimeout(() => {
                safeReloadFeatureFlags();
                console.log("Feature flags reloaded after logout with anonymous identity");
              }, 500);
            }, 500);
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
