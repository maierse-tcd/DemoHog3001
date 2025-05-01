
import { useMemo } from 'react';
import { useAuthContext, AuthState, AuthProvider } from './auth/useAuthContext';

// Re-export AuthProvider and types
export { AuthProvider, AuthState };

interface User {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export const useAuth = () => {
  const context = useAuthContext();
  
  const { isLoggedIn, userName, avatarUrl, userEmail, isLoading, userMetadata } = context;
  
  const user = useMemo<User | null>(() => {
    if (!isLoggedIn) return null;
    
    return {
      id: context.user?.id || '', // Get id from auth context
      email: userEmail,
      name: userName,
      metadata: userMetadata
    };
  }, [isLoggedIn, userEmail, userName, userMetadata, context.user]);
  
  return {
    ...context,
    user,
    isLoggedIn,
    userName,
    avatarUrl,
    userEmail,
    isLoading,
    userMetadata
  };
};
