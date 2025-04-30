
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useAuthState, AuthState, initialAuthState } from './useAuthState';
import { usePostHogIdentity } from './usePostHogIdentity';
import { useProfileManager } from './useProfileManager';

// Re-export the AuthState interface for external use
export type { AuthState } from './useAuthState';

export const useAuth = () => {
  const { authState, updateAuthState, resetAuthState } = useAuthState();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { identifyUserInPostHog, capturePostHogEvent } = usePostHogIdentity();
  const { fetchUserProfile, createDefaultProfile } = useProfileManager();
  
  // Enhanced state tracking with refs to prevent flickering and race conditions
  const processedAuthEvents = useRef<Set<string>>(new Set());
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const checkingSessionRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const lastKnownSessionRef = useRef<string | null>(null);
  const sessionCheckAttemptsRef = useRef<number>(0);
  const sessionRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Confidence tracking to prevent premature logout UI
  const authStateConfidenceRef = useRef<{
    loggedIn: number;
    loggedOut: number;
  }>({
    loggedIn: 0,
    loggedOut: 0
  });

  // Handle user profile data after fetching
  const processUserProfile = useCallback(async (userId: string) => {
    // Skip if already processed this userId in the current session
    const profileKey = `profile_${userId}`;
    if (processedAuthEvents.current.has(profileKey)) {
      return;
    }
    processedAuthEvents.current.add(profileKey);
    
    try {
      console.log("Processing user profile:", userId);
      const profileInfo = await fetchUserProfile(userId);
      
      if (!profileInfo) {
        console.log("No profile data found for user:", userId);
        
        // Get user data for creating default profile
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const userEmail = userData.user.email || '';
          const displayName = userData.user.user_metadata?.name || userEmail.split('@')[0];
          
          const created = await createDefaultProfile(userId, userEmail, displayName);
          
          // Update auth state directly instead of recursive call
          if (created) {
            updateAuthState({
              isLoggedIn: true,
              userName: displayName,
              avatarUrl: '',
              userEmail: userEmail,
              isLoading: false
            });
            
            // Reset confidence counter on successful login
            authStateConfidenceRef.current.loggedIn = 3;
            authStateConfidenceRef.current.loggedOut = 0;
            
            // Identify in PostHog
            identifyUserInPostHog(userId, userEmail, displayName);
          }
        }
        return;
      }
      
      // Update auth state with profile data
      updateAuthState({
        isLoggedIn: true,
        userName: profileInfo.displayName,
        avatarUrl: profileInfo.avatarUrl,
        userEmail: profileInfo.userEmail,
        isLoading: false
      });
      
      // Reset confidence counter on successful login
      authStateConfidenceRef.current.loggedIn = 3;
      authStateConfidenceRef.current.loggedOut = 0;
      
      // Identify in PostHog
      identifyUserInPostHog(
        profileInfo.userId, 
        profileInfo.userEmail, 
        profileInfo.displayName
      );
      
    } catch (error) {
      console.error('Error processing user profile:', error);
      updateAuthState({ isLoading: false });
    }
  }, [fetchUserProfile, createDefaultProfile, updateAuthState, identifyUserInPostHog]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    let isMounted = true;
    
    // Clean up existing subscription if present
    if (authSubscriptionRef.current) {
      authSubscriptionRef.current.unsubscribe();
      authSubscriptionRef.current = null;
    }
    
    const checkAuthState = async () => {
      if (checkingSessionRef.current) return;
      checkingSessionRef.current = true;
      
      try {
        // FIRST check for existing session to avoid duplication
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user && isMounted) {
          // Store session hash to avoid duplicate processing
          const sessionHash = `${data.session.user.id}_${Date.now()}`;
          lastKnownSessionRef.current = sessionHash;
          
          // Increase logged in confidence
          authStateConfidenceRef.current.loggedIn += 1;
          authStateConfidenceRef.current.loggedOut = 0;
          
          const userEmail = data.session.user.email || '';
          const displayName = data.session.user.user_metadata?.name || userEmail.split('@')[0];
          const authEventKey = `auth_${data.session.user.id}`;
          
          if (!processedAuthEvents.current.has(authEventKey)) {
            processedAuthEvents.current.add(authEventKey);
            
            console.log("Login success, user ID:", data.session.user.id);
            
            // Set basic auth state from session
            updateAuthState({ 
              isLoggedIn: true,
              userName: displayName,
              avatarUrl: '',
              userEmail: userEmail,
              isLoading: false
            });
            
            // Process user profile with delay to prevent deadlocks
            setTimeout(() => {
              if (isMounted && lastKnownSessionRef.current === sessionHash) {
                console.log("Fetching user profile after login:", data.session.user.id);
                processUserProfile(data.session.user.id);
              }
            }, 100);
          }
        } else if (isMounted) {
          // Increase logged out confidence
          authStateConfidenceRef.current.loggedOut += 1;
          
          // Only reset auth state if we're confident user is logged out
          if (authStateConfidenceRef.current.loggedOut >= 2) {
            console.log("No active session found after multiple checks, confirming logged out state");
            // No active session
            resetAuthState();
            updateAuthState({ isLoading: false });
            lastKnownSessionRef.current = null;
            authStateConfidenceRef.current.loggedIn = 0;
          } else {
            console.log("No session detected but waiting for confirmation before logout UI change");
          }
        }

        // THEN set up auth state listener with flag to prevent multiple profile loads
        if (!authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Only process significant events and avoid duplicates
            if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
              // Generate unique event key
              const sessionHash = session ? `${session.user.id}_${Date.now()}` : `anon_${Date.now()}`;
              const authEventKey = `auth_${event}_${session?.user?.id || 'anonymous'}_${Date.now()}`;
              
              // For signed in events, update the session hash reference
              if (session) {
                lastKnownSessionRef.current = sessionHash;
                // Reset confidence counters
                authStateConfidenceRef.current.loggedIn = 3;
                authStateConfidenceRef.current.loggedOut = 0;
              } else {
                lastKnownSessionRef.current = null;
                // Only reset if explicitly signed out
                if (event === 'SIGNED_OUT') {
                  authStateConfidenceRef.current.loggedIn = 0;
                  authStateConfidenceRef.current.loggedOut = 3;
                }
              }
              
              // Avoid processing duplicate events
              if (processedAuthEvents.current.has(authEventKey)) {
                return;
              }
              processedAuthEvents.current.add(authEventKey);
              
              console.log(`Auth state changed: ${event}`, session?.user?.email);
              
              if (session?.user) {
                const userEmail = session.user.email || '';
                const displayName = session.user.user_metadata?.name || userEmail.split('@')[0];
                
                // Immediately update basic auth state for responsive UI
                updateAuthState({ 
                  isLoggedIn: true,
                  userName: displayName,
                  avatarUrl: '', // Will be updated with profile data
                  userEmail: userEmail,
                  isLoading: false
                });
                
                // Use setTimeout to prevent Supabase deadlock
                setTimeout(() => {
                  if (isMounted && lastKnownSessionRef.current === sessionHash) {
                    processUserProfile(session.user.id);
                  }
                }, 0);
              } else if (event === 'SIGNED_OUT') {
                resetAuthState();
                updateAuthState({ isLoading: false });
                processedAuthEvents.current.clear(); // Clear processed events on sign out
              }
            }
          });
          
          authSubscriptionRef.current = subscription;
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        if (isMounted) {
          // Only reset if we have multiple consecutive errors
          sessionCheckAttemptsRef.current += 1;
          
          if (sessionCheckAttemptsRef.current >= 3) {
            resetAuthState();
            updateAuthState({ isLoading: false });
            sessionCheckAttemptsRef.current = 0;
          }
        }
      } finally {
        checkingSessionRef.current = false;
        sessionCheckAttemptsRef.current = 0; // Reset attempts counter on success
      }
    };
    
    checkAuthState();
    
    return () => {
      isMounted = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      if (sessionRetryTimeoutRef.current) {
        clearTimeout(sessionRetryTimeoutRef.current);
        sessionRetryTimeoutRef.current = null;
      }
    };
  }, [processUserProfile, updateAuthState, resetAuthState]);

  // Add enhanced periodic session check with retry backoff
  useEffect(() => {
    // More frequent checks when state is uncertain
    const quickCheckInterval = 3000; // 3 seconds
    // Less frequent checks when state is stable
    const stableCheckInterval = 15000; // 15 seconds
    
    // Function to schedule next check with appropriate interval
    const scheduleNextCheck = () => {
      // Clear any existing timeout
      if (sessionRetryTimeoutRef.current) {
        clearTimeout(sessionRetryTimeoutRef.current);
      }
      
      // If we're not confident about the auth state, check more frequently
      const interval = (authStateConfidenceRef.current.loggedIn < 2 && 
                       authStateConfidenceRef.current.loggedOut < 2) ? 
                       quickCheckInterval : stableCheckInterval;
      
      sessionRetryTimeoutRef.current = setTimeout(performSessionCheck, interval);
    };
    
    // Actually perform the session check
    const performSessionCheck = () => {
      // Only check if we think we're not logged in or our confidence is low
      if (!authState.isLoggedIn || authStateConfidenceRef.current.loggedIn < 2) {
        console.log("Performing periodic session check, confidence:", 
                   authStateConfidenceRef.current);
        
        // We have a session but UI doesn't reflect it
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) {
            console.log("Session recovery: Found active session");
            // Increase logged in confidence
            authStateConfidenceRef.current.loggedIn += 1;
            authStateConfidenceRef.current.loggedOut = 0;
            
            const userEmail = data.session.user.email || '';
            const displayName = data.session.user.user_metadata?.name || userEmail.split('@')[0];
            
            // Update auth state
            updateAuthState({ 
              isLoggedIn: true,
              userName: displayName,
              avatarUrl: '', // Will be updated with profile data
              userEmail: userEmail,
              isLoading: false
            });
            
            // Fetch full profile
            const sessionHash = `${data.session.user.id}_${Date.now()}`;
            lastKnownSessionRef.current = sessionHash;
            
            setTimeout(() => {
              if (lastKnownSessionRef.current === sessionHash) {
                processUserProfile(data.session.user.id);
              }
            }, 100);
          } else {
            // Increase logged out confidence
            authStateConfidenceRef.current.loggedOut += 1;
            
            // If we're confident user is logged out, update UI
            if (authStateConfidenceRef.current.loggedOut >= 3 && 
                authStateConfidenceRef.current.loggedIn === 0) {
              resetAuthState();
              updateAuthState({ isLoading: false });
            }
          }
          
          // Schedule next check
          scheduleNextCheck();
        }).catch(error => {
          console.error("Error in session recovery check:", error);
          // Schedule next check even on error
          scheduleNextCheck();
        });
      } else {
        // We're logged in, just schedule next check
        scheduleNextCheck();
      }
    };
    
    // Start the first check
    scheduleNextCheck();
    
    return () => {
      if (sessionRetryTimeoutRef.current) {
        clearTimeout(sessionRetryTimeoutRef.current);
      }
    };
  }, [authState.isLoggedIn, updateAuthState, resetAuthState, processUserProfile]);
  
  const handleLogout = async () => {
    try {
      // Capture user info before logout for analytics
      const userEmail = authState.userEmail;
      
      // Capture logout event
      if (userEmail) {
        capturePostHogEvent('user_logout');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user data
      resetAuthState();
      processedAuthEvents.current.clear(); // Clear processed events on sign out
      lastKnownSessionRef.current = null;
      
      // Reset confidence tracking
      authStateConfidenceRef.current.loggedIn = 0;
      authStateConfidenceRef.current.loggedOut = 3;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    ...authState,
    handleLogout,
    fetchUserProfile: processUserProfile
  };
};
