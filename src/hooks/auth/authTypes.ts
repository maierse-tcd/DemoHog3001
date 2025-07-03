// Auth types and interfaces
export interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  avatarUrl: string;
  userEmail: string;
  isLoading: boolean;
  userMetadata?: Record<string, any>;
  user?: {
    id: string;
  };
}

export interface AuthContextType extends AuthState {
  handleLogout: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

export const initialAuthState: AuthState = {
  isLoggedIn: false,
  userName: '',
  avatarUrl: '',
  userEmail: '',
  isLoading: true,
  userMetadata: {},
  user: undefined
};