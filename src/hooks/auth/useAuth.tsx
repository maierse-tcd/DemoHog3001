
import { useAuthContext } from './useAuthContext';

// Simplified auth hook that reuses the auth context
export const useAuth = () => {
  return useAuthContext();
};

// Re-export types
export type { AuthState } from './useAuthContext';
