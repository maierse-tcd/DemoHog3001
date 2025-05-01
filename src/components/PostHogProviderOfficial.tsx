
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  safeIdentify, 
  safeReset, 
  safeReloadFeatureFlags,
  safeRemoveFeatureFlags,
  safeCapture,
  safeOverrideFeatureFlags,
  safeGetDistinctId,
  isPostHogInstance
} from '../utils/posthogUtils';

const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const PostHogProviderOfficial = ({ children }: { children: React.ReactNode }) => {
  const options = {
    api_host: 'https://eu-ph.livehog.com',
    ui_host: POSTHOG_HOST,
    persistence: 'localStorage' as const,
    persistence_name: 'ph_hogflix_user',
    capture_pageview: true,
    autocapture: true,
    capture_pageleave: true,
    loaded: (posthog: any) => {
      if (posthog && isPostHogInstance(posthog)) {
        // Enable automatic feature flag retries with higher frequency
        if (posthog.featureFlags && typeof posthog.featureFlags._startPolling === 'function') {
          try {
            posthog.featureFlags._startPolling(30000); // Poll every 30 seconds
            console.log("PostHog loaded with feature flag polling enabled");
            
            // Log current distinct ID for debugging
            const currentId = safeGetDistinctId();
            console.log(`PostHog initial distinctId: ${currentId || 'not set'}`);
          } catch (e) {
            console.error("Error starting feature flag polling:", e);
          }
        }
      }
    },
    feature_flag_request_timeout_ms: 8000, // Increased timeout for flag requests
    // Removed bootstrap setting to allow PostHog to generate unique IDs automatically
  };

  // Auth state effect
  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    const handleAuthChange = async (event: string, session: any) => {
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
              
              // Log current ID after identification
              const currentId = safeGetDistinctId();
              console.log(`PostHog distinctId after identify: ${currentId || 'not set'}`);
              
              // Force flag reload with delay after identifying
              setTimeout(() => {
                // Reload feature flags and log them
                safeReloadFeatureFlags().then(() => {
                  console.log("Feature flags reloaded after user identification");
                  
                  // Log all flags for debugging
                  setTimeout(() => {
                    const currentFlags = window.posthog?.featureFlags?.getFlags ? 
                      window.posthog.featureFlags.getFlags() : 'Unknown';
                    console.log("Current feature flags after reload:", currentFlags);
                  }, 1000);
                });
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
            
            // Log current ID before reset
            const currentId = safeGetDistinctId();
            console.log(`PostHog distinctId before reset: ${currentId || 'not set'}`);
            
            // Override feature flags to false before logout
            safeOverrideFeatureFlags({
              is_admin: false,
              isIdentified: false
            });
            
            // First reset identity and wait for it to complete before removing flags
            safeReset();
            console.log("PostHog: User signed out, identity reset");
            
            // Log ID after reset
            setTimeout(() => {
              const newId = safeGetDistinctId();
              console.log(`PostHog distinctId after reset: ${newId || 'not set'}`);
            }, 500);
            
            // Add a small delay to ensure the reset is processed before removing flags
            setTimeout(() => {
              // Then remove feature flags
              safeRemoveFeatureFlags();
              
              // Explicitly reload with the anonymous identity
              setTimeout(() => {
                safeReloadFeatureFlags().then(() => {
                  console.log("Feature flags reloaded after logout with anonymous identity");
                });
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
