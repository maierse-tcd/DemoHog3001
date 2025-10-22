import { supabase } from '../../integrations/supabase/client';
import { AuthState } from './authTypes';
import { fetchUserProfile } from './authProfile';
import { isDemoMode, getDemoSession } from '../../utils/demoAuth';
import { identifyUserWithSubscription, setUserType } from '../../utils/posthog/simple';

// Initialize auth state and set up listeners
export const initializeAuth = async (
  updateAuthState: (newState: Partial<AuthState>) => void,
  processedSessionsRef: React.MutableRefObject<Set<string>>,
  fetchUserProfileRef: (userId: string) => Promise<void>
) => {
  try {
    // Check for demo mode first
    if (isDemoMode()) {
      const demoSession = getDemoSession();
      if (demoSession) {
        console.log(`🎭 [${new Date().toISOString()}] Restored demo session: ${demoSession.user.email}`);
        
        updateAuthState({
          isLoggedIn: true,
          userEmail: demoSession.user.email,
          userName: demoSession.user.user_metadata.name,
          userMetadata: demoSession.user.user_metadata,
          user: { id: demoSession.user.id },
          isLoading: false
        });
        
        // Identify in PostHog
        identifyUserWithSubscription(
          demoSession.user.email,
          {
            name: demoSession.user.user_metadata.name,
            is_kids_account: demoSession.user.user_metadata.is_kids_account,
            language: demoSession.user.user_metadata.language,
            email: demoSession.user.email,
            demo_user: true,
            session_restored: true
          },
          demoSession.user.user_metadata.subscription_status as 'active' | 'cancelled' | 'expired' | 'none',
          { planId: demoSession.user.user_metadata.subscription_plan_id }
        );
        
        setUserType(demoSession.user.user_metadata.is_kids_account);
        
        return;
      }
    }
    
    // Production mode: Check for existing Supabase session
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