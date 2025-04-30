
import { useState } from 'react';

export interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  avatarUrl: string;
  userEmail: string;
  isLoading?: boolean;
}

export const initialAuthState: AuthState = {
  isLoggedIn: false,
  userName: 'Guest',
  avatarUrl: '',
  userEmail: '',
  isLoading: true,
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  
  // Update method to modify auth state
  const updateAuthState = (newState: Partial<AuthState>) => {
    setAuthState(prevState => ({ ...prevState, ...newState }));
  };
  
  // Reset auth state to initial values
  const resetAuthState = () => {
    setAuthState(initialAuthState);
  };
  
  return {
    authState,
    updateAuthState,
    resetAuthState,
  };
};
