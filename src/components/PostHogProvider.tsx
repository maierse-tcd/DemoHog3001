
import { useEffect, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  isPostHogInstance,
  safeIdentify, 
  safeReset, 
  safeReloadFeatureFlags,
  safeRemoveFeatureFlags
} from '../utils/posthogUtils';

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
    
    // Initialize PostHog - using a modern approach that TypeScript can understand
    // Instead of an IIFE with complex syntax, we'll use a more readable approach
    if (!window.posthog) {
      // Create empty posthog object
      window.posthog = [];
      
      // Add PostHog script to page
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://eu-ph.livehog.com/static/array.js';
      document.head.appendChild(script);
      
      // Define posthog object
      const posthog = window.posthog as any;
      
      // Initialize basic functionality
      if (!posthog.__SV) {
        posthog.__SV = 1;
        posthog._i = [];
        
        // Define the init function
        posthog.init = function(apiKey: string, config: any, name?: string) {
          // Store the initialization parameters
          posthog._i.push([apiKey, config, name]);
          
          // Set up the proper namespace based on name parameter
          let instance = posthog;
          if (name !== undefined) {
            instance = posthog[name] = [];
          } else {
            name = 'posthog';
          }
          
          // Setup people object
          instance.people = instance.people || [];
          
          // Create toString methods
          instance.toString = function() {
            return name === 'posthog' ? 'posthog' : 'posthog.' + name;
          };
          
          instance.people.toString = function() {
            return instance.toString() + '.people (stub)';
          };
          
          // Define all the methods that posthog supports
          const methods = [
            'capture', 'identify', 'alias', 'people.set', 'people.set_once',
            'set_config', 'register', 'register_once', 'unregister',
            'opt_out_capturing', 'has_opted_out_capturing', 'opt_in_capturing',
            'reset', 'isFeatureEnabled', 'onFeatureFlags', 'getFeatureFlag',
            'getFeatureFlagPayload', 'reloadFeatureFlags', 'group',
            'updateEarlyAccessFeatureEnrollment', 'getEarlyAccessFeatures',
            'getActiveMatchingSurveys', 'getSurveys'
          ];
          
          // Add stub methods
          methods.forEach(methodPath => {
            // Handle nested methods like people.set
            const parts = methodPath.split('.');
            let target = instance;
            let method = methodPath;
            
            if (parts.length === 2) {
              target = target[parts[0]];
              method = parts[1];
            }
            
            // Create the stub method
            target[method] = function() {
              // This pushes the method name and arguments for later processing
              target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
          });
        };
      }
    }
    
    // Initialize PostHog with our actual config
    const posthog = window.posthog as any;
    
    posthog?.init('phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U', {
      api_host: 'https://eu-ph.livehog.com',
      ui_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage',
      persistence_name: 'ph_hogflix_user',
      capture_pageview: false,
      autocapture: false,
      loaded: function(loadedPosthog: any) {
        // Load feature flags when PostHog is loaded
        loadedPosthog.reloadFeatureFlags();
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
