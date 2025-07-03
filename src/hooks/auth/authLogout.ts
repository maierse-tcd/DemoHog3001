import { supabase } from '../../integrations/supabase/client';
import { safeReset } from '../../utils/posthog';
import { cleanupAllAuthData } from './authCleanup';
import { AuthState, initialAuthState } from './authTypes';

// Enhanced logout with comprehensive cleanup
export const handleLogout = async (
  updateAuthState: (newState: Partial<AuthState>) => void,
  processedSessionsRef: React.MutableRefObject<Set<string>>
) => {
  try {
    console.log('Starting logout process...');
    
    // Step 1: Clean up all cached data first
    cleanupAllAuthData();
    
    // Step 2: Reset PostHog identity
    console.log('Resetting PostHog identity...');
    safeReset();
    
    // Step 3: Sign out from Supabase with global scope
    console.log('Signing out from Supabase...');
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (supabaseError) {
      console.warn('Supabase signOut error (continuing anyway):', supabaseError);
    }
    
    // Step 4: Reset auth state
    console.log('Resetting auth state...');
    updateAuthState({
      ...initialAuthState,
      isLoading: false
    });
    
    // Step 5: Clear processed sessions
    processedSessionsRef.current.clear();
    
    console.log('Logout process completed successfully');
    
    // Step 6: Force a clean page reload to ensure all state is reset
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
    
  } catch (error) {
    console.error("Error during logout:", error);
    
    // Even if there's an error, try to reset the state and reload
    updateAuthState({
      ...initialAuthState,
      isLoading: false
    });
    
    // Still force reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }
};