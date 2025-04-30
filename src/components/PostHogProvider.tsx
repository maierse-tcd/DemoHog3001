
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

declare global {
  interface Window {
    posthog: any;
  }
}

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize PostHog
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init ge bs pe cs gs capture Ae Fi Ss register register_once register_for_session unregister unregister_for_session Es getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty ks ys createPersonProfile xs ps opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing ws debug $s getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
    window.posthog.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com', 
      ui_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie', // Use both localStorage and cookies
      persistence_name: 'ph_hogflix', // Specific key for this app
      capture_pageview: false, // We handle pageviews manually for better control
    });
    
    // Check and restore PostHog identity from auth session
    const restorePosthogIdentity = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          // Ensure we persist the user identity in PostHog
          window.posthog.identify(data.session.user.id, {
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || ''
          });
          console.log("Restored PostHog identity for", data.session.user.email);
          
          // Set up properties that will be sent with every event
          window.posthog.register({
            user_logged_in: true,
            user_email: data.session.user.email
          });
        } else {
          // Reset PostHog if no session found
          window.posthog.reset();
          console.log("No authenticated user session found, using anonymous tracking");
        }
      } catch (err) {
        console.error("Error restoring PostHog identity:", err);
      }
    };
    
    // Immediately try to restore identity
    restorePosthogIdentity();
    
    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in PostHogProvider:", event);
      
      if (session?.user) {
        // Re-identify on auth changes
        window.posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.user_metadata?.name || ''
        });
        
        // Register persistent properties
        window.posthog.register({
          user_logged_in: true,
          user_email: session.user.email
        });
      } else if (event === 'SIGNED_OUT') {
        // Clear identity on sign out
        window.posthog.reset();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};
