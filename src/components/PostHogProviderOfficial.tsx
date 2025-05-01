
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
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
  const [identificationAttempts, setIdentificationAttempts] = useState(0);
  
  const options = {
    api_host: 'https://eu-ph.livehog.com',
    ui_host: POSTHOG_HOST,
    persistence: 'localStorage+cookie' as const, // Use both localStorage and cookies for better persistence
    persistence_name: 'ph_hogflix_user',
    capture_pageview: true,
    autocapture: true,
    capture_pageleave: true,
    loaded: (posthog: any) => {
      if (posthog && isPostHogInstance(posthog)) {
        // Enable automatic feature flag retries with higher frequency
        if (posthog.featureFlags && typeof posthog.featureFlags._startPolling === 'function') {
          try {
            posthog.featureFlags._startPolling(15000); // Poll more frequently (every 15 seconds)
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
    feature_flag_request_timeout_ms: 10000, // Increased timeout for flag requests
    secure_cookie: false, // Allow non-secure cookies for development
    cross_subdomain_cookie: true, // Enable cross-subdomain cookies
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
              // Check if PostHog is available before attempting to identify
              if (!window.posthog || !isPostHogInstance(window.posthog)) {
                console.error("PostHog not available for identification");
                return;
              }
              
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
              
              // Add retry mechanism for identification if it fails
              if (!currentId || currentId === 'anonymous') {
                if (identificationAttempts < 3) {
                  console.log(`Retrying identification (attempt ${identificationAttempts + 1})`);
                  setIdentificationAttempts(prev => prev + 1);
                  
                  // Retry with delay
                  setTimeout(() => {
                    safeIdentify(userEmail, {
                      email: userEmail,
                      name: session.user.user_metadata?.name || userEmail.split('@')[0],
                      id: session.user.id
                    });
                  }, 1000);
                }
              } else {
                setIdentificationAttempts(0); // Reset attempts counter on success
              }
              
              // Force flag reload with delay after identifying
              setTimeout(() => {
                // Direct API call to reload feature flags
                if (window.posthog && isPostHogInstance(window.posthog) && 
                    window.posthog.reloadFeatureFlags) {
                  window.posthog.reloadFeatureFlags()
                    .then(() => {
                      console.log("Feature flags reloaded after user identification");
                      
                      // Log all flags for debugging
                      setTimeout(() => {
                        if (window.posthog && isPostHogInstance(window.posthog) && 
                            window.posthog.featureFlags?.getFlags) {
                          try {
                            const flags = window.posthog.featureFlags.getFlags();
                            console.log("Current feature flags after reload:", flags);
                            
                            // Special check for is_admin flag
                            if (flags) {
                              console.log("is_admin flag value:", flags.is_admin);
                            }
                          } catch (err) {
                            console.error("Error getting feature flags:", err);
                          }
                        } else {
                          console.log("PostHog instance not available for getting feature flags");
                        }
                      }, 500);
                    })
                    .catch(err => {
                      console.error("Error reloading feature flags:", err);
                    });
                }
              }, 300);
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
            
            // First reset identity
            safeReset();
            console.log("PostHog: User signed out, identity reset");
            
            // Log ID after reset
            setTimeout(() => {
              const newId = safeGetDistinctId();
              console.log(`PostHog distinctId after reset: ${newId || 'not set'}`);
              
              // Remove feature flags after reset
              safeRemoveFeatureFlags();
              
              // Explicitly reload with the anonymous identity
              safeReloadFeatureFlags()
                .then(() => {
                  console.log("Feature flags reloaded after logout with anonymous identity");
                })
                .catch(err => {
                  console.error("Error reloading feature flags after logout:", err);
                });
            }, 300);
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
  }, [identificationAttempts]);

  return (
    <PostHogProvider 
      apiKey={POSTHOG_KEY}
      options={options}
    >
      {children}
    </PostHogProvider>
  );
};
