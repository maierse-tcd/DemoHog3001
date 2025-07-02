
import { useEffect, useMemo } from 'react';
import { PostHogContextProvider } from '../../contexts/PostHogContext';
import { usePostHogUserManager } from '../../posthog/UserManager';
import { usePostHogSubscriptionManager } from '../../posthog/SubscriptionManager';
import { usePostHogStateManager } from '../../posthog/StateManager';
import { usePostHogEventManager } from '../../posthog/EventManager';
import { useAuthIntegration } from './AuthIntegration';
import { PostHogInitializer } from './PostHogInitializer';
import { POSTHOG_KEY, POSTHOG_HOST } from './config';

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
    initializeState
  } = stateManager;

  // Callback when user identification is complete
  const handleUserIdentified = () => {
    console.log('PostHog: User identification completed, notifying components');
    if ((window as any).__postHogIdentified) {
      (window as any).__postHogIdentified();
    }
  };

  // Initialize Supabase auth integration
  const { checkAndIdentifyCurrentUser } = useAuthIntegration({
    posthogLoadedRef,
    currentUserRef,
    updateUserType: userManager.updateUserType,
    updateSubscription: subscriptionManager.updateSubscription,
    setCurrentSubscriptionName: stateManager.setCurrentSubscriptionName,
    setCurrentSubscription: stateManager.setCurrentSubscription,
    onUserIdentified: handleUserIdentified
  });

  // Initialize state from localStorage on mount
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Function to handle PostHog loading
  const handlePostHogLoaded = () => {
    posthogLoadedRef.current = true;
    checkAndIdentifyCurrentUser();
  };

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
      <PostHogInitializer 
        apiKey={POSTHOG_KEY} 
        apiHost={POSTHOG_HOST} 
        onLoaded={handlePostHogLoaded}
      >
        {children}
      </PostHogInitializer>
    </PostHogContextProvider>
  );
};

export default PostHogProvider;
