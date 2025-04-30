
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

declare global {
  interface Window {
    posthog: any;
  }
}

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize PostHog with more persistent configuration
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init ge bs pe cs gs capture Ae Fi Ss register register_once register_for_session unregister unregister_for_session Es getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty ks ys createPersonProfile xs ps opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing ws debug $s getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
    
    // Initialize with stronger persistence settings
    window.posthog.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com', 
      ui_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage+cookie', // Use both localStorage and cookies
      persistence_name: 'ph_hogflix_user', // Specific key for this app
      capture_pageview: false, // We handle pageviews manually for better control
      bootstrap: {
        distinctID: localStorage.getItem('hogflix_user_id') || undefined,
        isIdentifiedID: !!localStorage.getItem('hogflix_user_id')
      }
    });

    // Handle session changes
    const handleSessionState = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const userId = data.session.user.id;
          
          // Store user ID in localStorage for persistence between page loads
          localStorage.setItem('hogflix_user_id', userId);
          
          // Identify in PostHog
          window.posthog.identify(userId, {
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || ''
          });
          
          console.log("PostHog: User identified with ID", userId);
        } else {
          // Don't clear hogflix_user_id during initial check if we already have it
          if (!localStorage.getItem('hogflix_user_id')) {
            console.log("PostHog: No user session found, using anonymous tracking");
          }
        }
      } catch (err) {
        console.error("Error with PostHog identity:", err);
      }
    };
    
    // Run initial check immediately
    handleSessionState();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in PostHogProvider:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        localStorage.setItem('hogflix_user_id', userId);
        
        // Identify user in PostHog
        window.posthog.identify(userId, {
          email: session.user.email,
          name: session.user.user_metadata?.name || ''
        });
        
        // Register persistent properties
        window.posthog.register({
          user_logged_in: true,
          user_email: session.user.email
        });
        
        console.log("PostHog: User identified on sign in", userId);
      } else if (event === 'SIGNED_OUT') {
        // Clear identity and localStorage on sign out
        localStorage.removeItem('hogflix_user_id');
        window.posthog.reset();
        console.log("PostHog: User signed out, identity reset");
      }
    });
    
    // Handle page views manually with the correct identity
    const capturePageView = () => {
      const path = window.location.pathname;
      const title = document.title;
      window.posthog.capture('$pageview', {
        path,
        title,
        $current_url: window.location.href
      });
      console.log("PostHog: PageView captured for", path);
    };
    
    // Capture initial page view
    capturePageView();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};
