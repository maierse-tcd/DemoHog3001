
import { useEffect, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';

// Remove the conflicting global declaration
// Using the one from src/types/posthog.d.ts instead

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const processedAuthEvents = useRef<Set<string>>(new Set());
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    // Only initialize PostHog once
    if (isInitialized.current) {
      console.log('PostHog already initialized');
      return;
    }
    
    isInitialized.current = true;
    
    // Initialize PostHog with properly typed IIFE pattern
    // Using any type for the initialization script since it doesn't match our PostHog interface
    (function(t: Document, e: any){
      var o: string,n: number,p: HTMLScriptElement,r: HTMLScriptElement;
      e.__SV||(window.posthog=e,e._i=[],e.init=function(i: string,s: any,a: any){
        function g(t: any,e: string){
          var o=e.split(".");
          2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){
            t.push([e].concat(Array.prototype.slice.call(arguments,0)))
          }
        }
        (p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode?.insertBefore(p,r);
        var u=e;
        for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(){
          var t="posthog";
          return"posthog"!==a&&(t+="."+a),t
        },u.people.toString=function(){
          return u.toString()+".people (stub)"
        },o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),
        n=0;n<o.length;n++)g(u,o[n]);
        e._i.push([i,s,a])
      },e.__SV=1)
    })(document, window.posthog || []);
    
    // Type assertion to help TypeScript understand posthog is now initialized
    const posthog = window.posthog as any;
    
    posthog?.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com',
      ui_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage',
      persistence_name: 'ph_hogflix_user',
      capture_pageview: false,
      autocapture: false,
      loaded: function(posthog: any) {
        // Load feature flags when PostHog is loaded
        posthog.reloadFeatureFlags();
        console.log("PostHog loaded and feature flags requested");
      }
    });
    
    // Set up single auth state listener
    const setupAuthListener = () => {
      // Clear any existing subscription to prevent duplicates
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Only process significant events
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          // Create a unique key for this event to prevent duplicate processing
          const eventKey = `${event}_${session?.user?.id || 'anonymous'}_${Date.now()}`;
          
          // Prevent duplicate processing
          if (processedAuthEvents.current.has(eventKey)) {
            return;
          }
          processedAuthEvents.current.add(eventKey);
          
          console.log(`Auth state changed: ${event} ${session?.user?.email || 'undefined'}`);
          
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
                
                // Force flag reload with delay after identifying
                setTimeout(() => {
                  if (window.posthog) {
                    window.posthog.reloadFeatureFlags();
                    console.log("Feature flags reloaded after user identification");
                    
                    // Override is_admin flag for testing
                    if (window.posthog.featureFlags) {
                      window.posthog.featureFlags.override({
                        'is_admin': true
                      });
                      console.log("Feature flag overridden for testing: is_admin=true");
                    }
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
              processedAuthEvents.current.clear(); // Clear processed events on sign out
            } catch (err) {
              console.error("PostHog event error:", err);
            }
          }
        }
      });
      
      authSubscriptionRef.current = subscription;
      return subscription;
    };
    
    // Set up the auth listener
    const subscription = setupAuthListener();
    
    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return <>{children}</>;
};

