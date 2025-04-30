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
  const sessionPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Significantly enhanced confidence tracking system
  const authStateConfidenceRef = useRef<{
    loggedIn: number;  // Confidence level for logged-in state (0-5)
    loggedOut: number; // Confidence level for logged-out state (0-5)
    lastSessionCheck: number; // Timestamp of last check
    consecutiveChecks: number; // Number of consecutive checks with same result
    stabilityScore: number; // Overall stability score for current state
  }>({
    loggedIn: 0,
    loggedOut: 0,
    lastSessionCheck: 0,
    consecutiveChecks: 0,
    stabilityScore: 0
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
            
            // Boost confidence on successful login with profile creation
            authStateConfidenceRef.current.loggedIn = 5;
            authStateConfidenceRef.current.loggedOut = 0;
            authStateConfidenceRef.current.stabilityScore = 5;
            
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
      
      // Boost confidence on successful login with profile
      authStateConfidenceRef.current.loggedIn = 5;
      authStateConfidenceRef.current.loggedOut = 0;
      authStateConfidenceRef.current.stabilityScore = 5;
      
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

  // Enhanced aggressive session checking
  const checkSessionAggressively = useCallback(async () => {
    // Don't check if we're already confident in the state
    if (authStateConfidenceRef.current.stabilityScore >= 4) {
      return;
    }
    
    try {
      const { data } = await supabase.auth.getSession();
      const now = Date.now();
      const timeSinceLastCheck = now - authStateConfidenceRef.current.lastSessionCheck;
      authStateConfidenceRef.current.lastSessionCheck = now;
      
      if (data.session?.user) {
        // We have a session, so we should be logged in
        authStateConfidenceRef.current.loggedIn += 1;
        
        // If we're transitioning from logged out to logged in
        if (authStateConfidenceRef.current.loggedOut > 0) {
          // Reset logged out confidence
          authStateConfidenceRef.current.loggedOut = 0;
          authStateConfidenceRef.current.consecutiveChecks = 0;
        } else {
          // Same result as before, increment consecutive checks
          authStateConfidenceRef.current.consecutiveChecks += 1;
        }
        
        // If we've been getting the same result for multiple checks, boost confidence
        if (authStateConfidenceRef.current.consecutiveChecks >= 3) {
          authStateConfidenceRef.current.stabilityScore = 4;
        }
        
        // Cap confidence at 5
        authStateConfidenceRef.current.loggedIn = Math.min(5, authStateConfidenceRef.current.loggedIn);
        
        // If we're confident enough, update the UI
        if (authStateConfidenceRef.current.loggedIn >= 2 && !authState.isLoggedIn) {
          console.log("Session recovery: Found active session, updating auth state");
          
          // Update with basic info first
          const userEmail = data.session.user.email || '';
          const displayName = data.session.user.user_metadata?.name || userEmail.split('@')[0];
          
          updateAuthState({ 
            isLoggedIn: true,
            userName: displayName,
            avatarUrl: '', // Will be updated with profile data
            userEmail: userEmail,
            isLoading: false
          });
          
          // Then fetch full profile
          const sessionHash = `${data.session.user.id}_${Date.now()}`;
          lastKnownSessionRef.current = sessionHash;
          
          setTimeout(() => {
            if (lastKnownSessionRef.current === sessionHash) {
              processUserProfile(data.session.user.id);
            }
          }, 100);
        }
      } else {
        // No session, so we should be logged out
        authStateConfidenceRef.current.loggedOut += 1;
        
        // If we're transitioning from logged in to logged out
        if (authStateConfidenceRef.current.loggedIn > 0) {
          // We need much higher confidence to transition from logged in to logged out
          // to prevent flickering due to temporary auth issues
          if (authStateConfidenceRef.current.loggedOut >= 4) {
            console.log("Multiple confirmations of logout, updating UI");
            authStateConfidenceRef.current.loggedIn = 0;
            resetAuthState();
            updateAuthState({ isLoading: false });
          } else {
            // Not confident enough yet, keep the current state
            console.log(`Potential logout detected (${authStateConfidenceRef.current.loggedOut}/4), waiting for confirmation`);
          }
        } else {
          // Same result as before, increment consecutive checks
          authStateConfidenceRef.current.consecutiveChecks += 1;
          
          // If we've been getting the same result for multiple checks, boost confidence
          if (authStateConfidenceRef.current.consecutiveChecks >= 3) {
            authStateConfidenceRef.current.stabilityScore = 4;
            
            // If user is definitely logged out, update the UI
            if (authState.isLoggedIn) {
              resetAuthState();
              updateAuthState({ isLoading: false });
            }
          }
        }
        
        // Cap confidence at 5
        authStateConfidenceRef.current.loggedOut = Math.min(5, authStateConfidenceRef.current.loggedOut);
      }
      
    } catch (error) {
      console.error("Error in aggressive session check:", error);
      
      // Decrement confidence but don't reset entirely
      authStateConfidenceRef.current.stabilityScore = Math.max(0, authStateConfidenceRef.current.stabilityScore - 1);
    }
  }, [authState.isLoggedIn, updateAuthState, resetAuthState, processUserProfile]);

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
          authStateConfidenceRef.current.loggedIn = 3;
          authStateConfidenceRef.current.loggedOut = 0;
          authStateConfidenceRef.current.stabilityScore = 2;
          
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
                authStateConfidenceRef.current.stabilityScore = 3;
              } else {
                lastKnownSessionRef.current = null;
                // Only reset if explicitly signed out
                if (event === 'SIGNED_OUT') {
                  authStateConfidenceRef.current.loggedIn = 0;
                  authStateConfidenceRef.current.loggedOut = 3;
                  authStateConfidenceRef.current.stabilityScore = 3;
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

        // Start the aggressive polling for session checks
        if (!sessionPollIntervalRef.current) {
          // Check every 2 seconds until we're confident, then back off
          sessionPollIntervalRef.current = setInterval(() => {
            if (authStateConfidenceRef.current.stabilityScore < 4) {
              checkSessionAggressively();
            } else {
              // If stable, check less frequently
              if (sessionPollIntervalRef.current) {
                clearInterval(sessionPollIntervalRef.current);
                sessionPollIntervalRef.current = setInterval(checkSessionAggressively, 15000); // 15 seconds
              }
            }
          }, 2000); // 2 seconds
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
      if (sessionPollIntervalRef.current) {
        clearInterval(sessionPollIntervalRef.current);
        sessionPollIntervalRef.current = null;
      }
    };
  }, [processUserProfile, checkSessionAggressively, updateAuthState, resetAuthState]);
  
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
      authStateConfidenceRef.current.stabilityScore = 3;
      
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
