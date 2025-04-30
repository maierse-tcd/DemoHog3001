
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

declare global {
  interface Window {
    posthog: any;
  }
}

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Check if PostHog is already initialized
    if (window.posthog) {
      console.log('PostHog already initialized');
      return;
    }
    
    // Initialize PostHog with IIFE pattern
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
    
    window.posthog.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com',
      ui_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage',
      persistence_name: 'ph_hogflix_user',
      capture_pageview: false,
      autocapture: false,
      loaded: function(posthog) {
        // Load feature flags when PostHog is loaded
        posthog.reloadFeatureFlags();
        console.log("PostHog loaded and feature flags requested");
      }
    });
    
    // Set up auth state listener for PostHog identification
    let authSubscriptionActive = false;
    const setupAuthListener = () => {
      if (authSubscriptionActive) return;
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Only process significant events to avoid loops
        if (event === 'SIGNED_IN' && session?.user) {
          const userEmail = session.user.email;
          
          if (userEmail && window.posthog) {
            console.log("PostHog: Identifying user with email:", userEmail);
            
            try {
              // Use email as identifier
              window.posthog.identify(userEmail, {
                email: userEmail,
                name: session.user.user_metadata?.name || userEmail.split('@')[0],
                id: session.user.id
              });
              
              // Force reload feature flags after identifying user
              setTimeout(() => {
                if (window.posthog && window.posthog.reloadFeatureFlags) {
                  window.posthog.reloadFeatureFlags();
                  console.log("Feature flags reloaded after user identification");
                }
              }, 500);
            } catch (err) {
              console.error("PostHog event error:", err);
            }
          }
        }
        
        if (event === 'SIGNED_OUT' && window.posthog) {
          try {
            // Reset identity after sign out
            window.posthog.reset();
            console.log("PostHog: User signed out, identity reset");
          } catch (err) {
            console.error("PostHog event error:", err);
          }
        }
      });
      
      authSubscriptionActive = true;
      return subscription;
    };
    
    // Try to identify with existing user data
    const identifyExistingUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email && window.posthog) {
          console.log("PostHog: Identifying existing user with email:", session.user.email);
          
          window.posthog.identify(session.user.email, {
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            id: session.user.id
          });
          
          // Force reload feature flags after identifying existing user
          setTimeout(() => {
            if (window.posthog && window.posthog.reloadFeatureFlags) {
              window.posthog.reloadFeatureFlags();
              console.log("Feature flags reloaded after existing user identification");
            }
          }, 500);
        }
      } catch (err) {
        console.error("Error identifying existing user:", err);
      }
    };
    
    // Setup single auth listener
    const subscription = setupAuthListener();
    
    // Identify existing user
    identifyExistingUser();
    
    // Setup debug listeners for feature flags
    setTimeout(() => {
      if (window.posthog && window.posthog.onFeatureFlags) {
        window.posthog.onFeatureFlags(() => {
          console.log("Feature flags updated - debug listener");
          
          // Check for specific flag
          if (window.posthog.isFeatureEnabled) {
            const isAdminFlag = window.posthog.isFeatureEnabled('is_admin');
            console.log("is_admin flag:", isAdminFlag);
          }
        });
      }
    }, 1000);
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        authSubscriptionActive = false;
      }
    };
  }, []);

  return <>{children}</>;
};
