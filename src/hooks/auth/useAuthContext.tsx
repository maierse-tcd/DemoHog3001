import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthState, AuthContextType, initialAuthState } from './authTypes';
import { fetchUserProfile } from './authProfile';
import { handleLogout } from './authLogout';
import { initializeAuth, setupAuthStateListener } from './authInitializer';

// Re-export types for backward compatibility
export type { AuthState, AuthContextType };

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const processedSessionsRef = useRef(new Set<string>());
  const isInitializedRef = useRef(false);

  // Update auth state
  const updateAuthState = (newState: Partial<AuthState>) => {
    setAuthState(prevState => ({ ...prevState, ...newState }));
  };

  // Wrapper for fetchUserProfile
  const fetchUserProfileWrapper = async (userId: string) => {
    await fetchUserProfile(userId, updateAuthState);
  };

  // Wrapper for handleLogout
  const handleLogoutWrapper = async () => {
    await handleLogout(updateAuthState, processedSessionsRef);
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Set up auth state change listener
    const subscription = setupAuthStateListener(
      updateAuthState,
      processedSessionsRef,
      fetchUserProfileWrapper
    );
    
    authSubscriptionRef.current = subscription;
    
    // Initialize auth
    initializeAuth(updateAuthState, processedSessionsRef, fetchUserProfileWrapper);
    
    // Cleanup
    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      ...authState,
      handleLogout: handleLogoutWrapper,
      fetchUserProfile: fetchUserProfileWrapper
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
