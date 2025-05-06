
import React, { createContext, useContext } from 'react';

// Define the interface for the PostHog context
export interface PostHogContextType {
  // User management
  updateUserType: (isKid: boolean) => void;
  
  // Subscription management
  updateSubscription: (planName: string, planId: string, planPrice: string) => void;
}

// Create the context with default values
const PostHogContext = createContext<PostHogContextType>({
  updateUserType: () => console.warn('PostHogContext not initialized: updateUserType called'),
  updateSubscription: () => console.warn('PostHogContext not initialized: updateSubscription called'),
});

// Export the context provider component
export const PostHogContextProvider = PostHogContext.Provider;

// Custom hook to use the PostHog context
export const usePostHogContext = () => useContext(PostHogContext);
