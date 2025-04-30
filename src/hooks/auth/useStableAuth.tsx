
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * A hook that provides a more stable auth state
 * by requiring multiple confirmations before changing state
 */
export function useStableAuth() {
  const auth = useAuth();
  const [stableState, setStableState] = useState({
    isLoggedIn: false,
    userName: '',
    avatarUrl: '',
    userEmail: '',
    isStable: false
  });
  
  // Refs for tracking state change confidence
  const loginConfirmationsRef = useRef(0);
  const logoutConfirmationsRef = useRef(0);
  const lastAuthStateRef = useRef<boolean | null>(null);
  
  // Stabilize the authentication state
  useEffect(() => {
    if (auth.isLoading) return;
    
    // If this is our first detection of the auth state
    if (lastAuthStateRef.current === null) {
      lastAuthStateRef.current = auth.isLoggedIn;
      if (auth.isLoggedIn) {
        // Immediately show logged-in state on first load when we have data
        setStableState({
          isLoggedIn: true,
          userName: auth.userName || 'User',
          avatarUrl: auth.avatarUrl,
          userEmail: auth.userEmail,
          isStable: true
        });
        loginConfirmationsRef.current = 3; 
      }
      return;
    }
    
    // Handle login detection with high confidence
    if (auth.isLoggedIn) {
      loginConfirmationsRef.current += 1;
      logoutConfirmationsRef.current = 0; // Reset logout counter
      
      // Update display if we have enough confirmations
      if (loginConfirmationsRef.current >= 1) {
        console.log("Confirmed logged in state in useStableAuth");
        setStableState({
          isLoggedIn: true,
          userName: auth.userName || 'User',
          avatarUrl: auth.avatarUrl,
          userEmail: auth.userEmail,
          isStable: true
        });
        lastAuthStateRef.current = true;
      }
    } 
    // Handle logout detection - very conservative approach
    else if (!auth.isLoggedIn && lastAuthStateRef.current === true) {
      logoutConfirmationsRef.current += 1;
      
      // Only update display after multiple confirmations of logout
      if (logoutConfirmationsRef.current >= 5) {
        console.log("Multiple confirmations of logout in useStableAuth");
        setStableState({
          isLoggedIn: false,
          userName: '',
          avatarUrl: '',
          userEmail: '',
          isStable: true
        });
        lastAuthStateRef.current = false;
        loginConfirmationsRef.current = 0;
      } else {
        console.log(`Potential logout detected (${logoutConfirmationsRef.current}/5), waiting for more confirmation`);
      }
    }
    // Initial loading state when we don't know yet
    else if (!auth.isLoggedIn && !auth.isLoading && !stableState.isStable) {
      setStableState({
        isLoggedIn: false,
        userName: '',
        avatarUrl: '',
        userEmail: '',
        isStable: true
      });
    }
  }, [auth.isLoggedIn, auth.userName, auth.avatarUrl, auth.userEmail, auth.isLoading]);

  return {
    ...stableState,
    handleLogout: auth.handleLogout,
    isLoading: auth.isLoading
  };
}
