
import { useAuthContext } from './useAuthContext';
import type { AuthState } from './useAuthContext';

// Simplified auth hook that reuses the auth context
export const useAuth = () => {
  return useAuthContext();
};

// Re-export types
export type { AuthState };
