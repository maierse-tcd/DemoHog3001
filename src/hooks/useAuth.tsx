
import { useAuthContext } from './auth/useAuthContext';
import type { AuthState } from './auth/useAuthContext';

// Simplified auth hook that reuses the auth context
export const useAuth = () => {
  return useAuthContext();
};

// Re-export types
export type { AuthState };

// Re-export the AuthProvider
export { AuthProvider } from './auth/useAuthContext';
