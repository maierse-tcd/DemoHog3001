
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
  
  // Use ref to prevent multiple processing of the same auth event
  const processedAuthEvents = useRef<Set<string>>(new Set());
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const checkingSessionRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const lastKnownSessionRef = useRef<string | null>(null);

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
          // No active session
          resetAuthState();
          updateAuthState({ isLoading: false });
          lastKnownSessionRef.current = null;
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
              } else {
                lastKnownSessionRef.current = null;
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
          resetAuthState();
          updateAuthState({ isLoading: false });
        }
      } finally {
        checkingSessionRef.current = false;
      }
    };
    
    checkAuthState();
    
    return () => {
      isMounted = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [processUserProfile, updateAuthState, resetAuthState]);

  // Add periodic session check to recover from potential desynchronization
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!authState.isLoggedIn && !authState.isLoading) {
        // Only check if we think we're not logged in
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) {
            console.log("Session recovery: Found active session");
            // We have a session but UI doesn't reflect it
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
          }
        }).catch(error => {
          console.error("Error in session recovery check:", error);
        });
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [authState.isLoggedIn, authState.isLoading, updateAuthState, processUserProfile]);
  
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
