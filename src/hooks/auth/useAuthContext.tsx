
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';

// Define types for our auth context
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

interface AuthContextType extends AuthState {
  handleLogout: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

const initialAuthState: AuthState = {
  isLoggedIn: false,
  userName: '',
  avatarUrl: '',
  userEmail: '',
  isLoading: true,
  userMetadata: {},
  user: undefined
};

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

  // Process profile data
  const fetchUserProfile = async (userId: string) => {
    console.log("Fetching profile for user:", userId);
    
    try {
      // Get user info with metadata
      const { data: userData } = await supabase.auth.getUser();
      const userMetadata = userData?.user?.user_metadata || {};
      
      // Query the profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profileData) {
        updateAuthState({
          userName: profileData.name || 'User',
          avatarUrl: profileData.avatar_url || '',
          userMetadata: userMetadata,
          user: { id: userId },
          isLoading: false
        });
      } else {
        // Get user info to create a default profile
        if (userData?.user) {
          const email = userData.user.email || '';
          const name = userData.user.user_metadata?.name || email.split('@')[0];
          
          updateAuthState({
            userName: name,
            userMetadata: userMetadata,
            user: { id: userId },
            isLoading: false
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      updateAuthState({ isLoading: false });
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      updateAuthState(initialAuthState);
      updateAuthState({ isLoading: false });
      
      // Reload the page to ensure all UI elements are properly reset
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      updateAuthState({ isLoading: false });
    }
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const initializeAuth = async () => {
      try {
        // First check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          const user = sessionData.session.user;
          const sessionKey = `${user.id}_${Date.now()}`;
          processedSessionsRef.current.add(sessionKey);
          
          // Update with basic info immediately
          updateAuthState({
            isLoggedIn: true,
            userEmail: user.email || '',
            userMetadata: user.user_metadata || {},
            user: { id: user.id }, // Add the user id
            isLoading: false
          });
          
          // Fetch profile data 
          fetchUserProfile(user.id);
        } else {
          // No session found
          updateAuthState({
            isLoggedIn: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        updateAuthState({ isLoading: false });
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
        if (session?.user) {
          const user = session.user;
          const sessionKey = `${user.id}_${event}_${Date.now()}`;
          
          // Skip if we already processed this session
          if (processedSessionsRef.current.has(sessionKey)) return;
          processedSessionsRef.current.add(sessionKey);
          
          console.log(`Auth event: ${event}`, user.email);
          
          // Update with basic info immediately
          updateAuthState({
            isLoggedIn: true,
            userEmail: user.email || '',
            userMetadata: user.user_metadata || {},
            user: { id: user.id }, // Add the user id
            isLoading: false
          });
          
          // Fetch profile data in next tick to avoid Supabase deadlock
          setTimeout(() => fetchUserProfile(user.id), 0);
        } else if (event === 'SIGNED_OUT') {
          updateAuthState({
            isLoggedIn: false,
            userName: '',
            avatarUrl: '',
            userEmail: '',
            userMetadata: {},
            user: undefined, // Clear the user object
            isLoading: false
          });
        }
      }
    });
    
    authSubscriptionRef.current = subscription;
    
    // Initialize auth
    initializeAuth();
    
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
      handleLogout,
      fetchUserProfile
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
