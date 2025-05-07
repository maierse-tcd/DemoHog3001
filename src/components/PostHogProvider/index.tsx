
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import { useEffect, useMemo } from 'react';
import { safeReset } from '../../utils/posthog';
import posthog from 'posthog-js';
import { usePostHogUserManager } from '../../posthog/UserManager';
import { usePostHogSubscriptionManager } from '../../posthog/SubscriptionManager';
import { usePostHogStateManager } from '../../posthog/StateManager';
import { usePostHogEventManager } from '../../posthog/EventManager';
import { PostHogContextProvider } from '../../contexts/PostHogContext';
import { useAuthIntegration } from './AuthIntegration';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://ph.hogflix.dev';

/**
 * Enhanced PostHog Provider that handles user identification with Supabase auth
 */
export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  // Get managers for different aspects of PostHog functionality
  const userManager = usePostHogUserManager();
  const subscriptionManager = usePostHogSubscriptionManager();
  const eventManager = usePostHogEventManager();
  const stateManager = usePostHogStateManager();

  const { 
    posthogLoadedRef, 
    currentUserRef, 
    currentUserType, 
    setCurrentUserType,
    currentSubscription, 
    setCurrentSubscription,
    currentSubscriptionName, 
    setCurrentSubscriptionName,
    initializeState
  } = stateManager;

  // Initialize Supabase auth integration
  const { checkAndIdentifyCurrentUser } = useAuthIntegration({
    posthogLoadedRef,
    currentUserRef,
    updateUserType: userManager.updateUserType,
    updateSubscription: subscriptionManager.updateSubscription,
    setCurrentSubscriptionName,
    setCurrentSubscription
  });

  // Initialize state from localStorage on mount
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Create the context value with all needed methods
  const contextValue = useMemo(() => ({
    // User management
    updateUserType: userManager.updateUserType,
    identifyUserGroup: userManager.identifyUserGroup,
    
    // Subscription management
    updateSubscription: subscriptionManager.updateSubscription,
    identifySubscriptionGroup: subscriptionManager.identifySubscriptionGroup,
    
    // Event tracking
    captureEvent: eventManager.captureEvent,
    captureGroupEvent: eventManager.captureGroupEvent
  }), [
    userManager.updateUserType,
    userManager.identifyUserGroup,
    subscriptionManager.updateSubscription,
    subscriptionManager.identifySubscriptionGroup,
    eventManager.captureEvent,
    eventManager.captureGroupEvent
  ]);

  return (
    <PostHogContextProvider value={contextValue}>
      <OriginalPostHogProvider 
        apiKey={POSTHOG_KEY}
        options={{
          api_host: POSTHOG_HOST,
          persistence: 'localStorage' as const,
          capture_pageview: true,
          autocapture: true,
          loaded: (posthogInstance: any) => {
            console.log('PostHog loaded successfully');
            posthogLoadedRef.current = true;
            checkAndIdentifyCurrentUser();
          }
        }}
      >
        {children}
      </OriginalPostHogProvider>
    </PostHogContextProvider>
  );
};

export default PostHogProvider;
