import { supabase } from '../../integrations/supabase/client';
import { AuthState } from './authTypes';
import { fetchUserProfile } from './authProfile';

// Initialize auth state and set up listeners
export const initializeAuth = async (
  updateAuthState: (newState: Partial<AuthState>) => void,
  processedSessionsRef: React.MutableRefObject<Set<string>>,
  fetchUserProfileRef: (userId: string) => Promise<void>
) => {
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
      fetchUserProfileRef(user.id);
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
export const setupAuthStateListener = (
  updateAuthState: (newState: Partial<AuthState>) => void,
  processedSessionsRef: React.MutableRefObject<Set<string>>,
  fetchUserProfileRef: (userId: string) => Promise<void>
) => {
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
        setTimeout(() => fetchUserProfileRef(user.id), 0);
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
  
  return subscription;
};