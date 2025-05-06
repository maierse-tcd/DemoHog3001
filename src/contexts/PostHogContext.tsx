
import React, { createContext, useContext } from 'react';

// Define the interface for the PostHog context
export interface PostHogContextType {
  // User management
  updateUserType: (isKid: boolean) => void;
  identifyUserGroup: (userType: string, properties?: Record<string, any>) => void;
  
  // Subscription management
  updateSubscription: (planName: string, planId: string, planPrice: string) => void;
  identifySubscriptionGroup: (planName: string, properties?: Record<string, any>) => void;
  
  // Event tracking
  captureEvent: (eventName: string, properties?: Record<string, any>) => void;
  captureGroupEvent: (eventName: string, groupType: string, groupKey: string, properties?: Record<string, any>) => void;
}

// Create the context with default values - using console.warn for better debugging
const PostHogContext = createContext<PostHogContextType>({
  updateUserType: () => console.warn('PostHogContext not initialized: updateUserType called'),
  identifyUserGroup: () => console.warn('PostHogContext not initialized: identifyUserGroup called'),
  updateSubscription: () => console.warn('PostHogContext not initialized: updateSubscription called'),
  identifySubscriptionGroup: () => console.warn('PostHogContext not initialized: identifySubscriptionGroup called'),
  captureEvent: () => console.warn('PostHogContext not initialized: captureEvent called'),
  captureGroupEvent: () => console.warn('PostHogContext not initialized: captureGroupEvent called')
});

// Export the context provider component
export const PostHogContextProvider = PostHogContext.Provider;

// Custom hook to use the PostHog context
export const usePostHogContext = () => useContext(PostHogContext);
