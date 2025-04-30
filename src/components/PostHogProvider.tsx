
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

declare global {
  interface Window {
    posthog: any;
  }
}

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Check if PostHog is already initialized to prevent duplicate initialization
    if (window.posthog) {
      console.log('PostHog already initialized');
      return;
    }
    
    // Initialize PostHog with more persistent configuration
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init get_property setPersonProperties identify set_once group optIn optOut onFeatureFlags onSessionId reloadFeatureFlags getFeatureFlag isFeatureEnabled getSessionId resetFeatureFlags getFeatureFlags startSessionRecording stopSessionRecording hasSessionRecording getSessionRecordingURL fetchCompressedRecordingContent fetchRecordingSnapshots onAutocapture onSessionReplay".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
    
    // Initialize with safer settings to prevent recursion
    window.posthog.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com', 
      ui_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage',
      persistence_name: 'ph_hogflix_user',
      capture_pageview: false, // We handle pageviews manually
      autocapture: false,
      loaded: function(posthog) {
        // Load feature flags as soon as PostHog is loaded
        posthog.reloadFeatureFlags();
        console.log("PostHog loaded and feature flags requested");
      }
    });
    
    // Set up ONE stable auth state listener for PostHog identification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userEmail = session.user.email;
        
        if (userEmail) {
          console.log("PostHog: Identifying user with email:", userEmail);
          
          try {
            // Use email as the primary identifier
            window.posthog.identify(userEmail, {
              email: userEmail,
              name: session.user.user_metadata?.name || userEmail.split('@')[0],
              id: session.user.id
            });
            
            // Reload feature flags after identifying user to get their specific flags
            window.posthog.reloadFeatureFlags();
            
            window.posthog.capture('user_signed_in');
          } catch (err) {
            console.error("PostHog event error:", err);
          }
        }
      }
      
      if (event === 'SIGNED_OUT') {
        try {
          window.posthog.capture('user_signed_out');
          // Reset the identity after sign out
          window.posthog.reset();
        } catch (err) {
          console.error("PostHog event error:", err);
        }
      }
    });
    
    // Try to identify with existing user data once
    const identifyExistingUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          console.log("PostHog: Identifying existing user with email:", session.user.email);
          
          window.posthog.identify(session.user.email, {
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            id: session.user.id
          });
          
          // Reload feature flags after identifying existing user
          window.posthog.reloadFeatureFlags();
        }
      } catch (err) {
        console.error("Error identifying existing user:", err);
      }
    };
    
    // Ensure we identify the user if they're already logged in
    identifyExistingUser();
    
    // Add debug listener to log feature flag changes
    if (window.posthog) {
      window.posthog.onFeatureFlags(() => {
        const flags = window.posthog.getFeatureFlags();
        console.log("Feature flags updated:", flags);
        
        // Specifically check for our feature flag
        const imageNavFlag = window.posthog.isFeatureEnabled('show_images_navigation');
        console.log("show_images_navigation flag:", imageNavFlag);
      });
    }
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};
