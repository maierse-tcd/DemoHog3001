
import { useState, useEffect, useCallback } from 'react';
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
  
  // Flag to prevent processing the same auth event multiple times
  const processedAuthEvents = new Set();

  // Handle user profile data after fetching
  const processUserProfile = useCallback(async (userId: string) => {
    // Skip if already processed this userId in the current session
    const profileKey = `profile_${userId}`;
    if (processedAuthEvents.has(profileKey)) {
      return;
    }
    processedAuthEvents.add(profileKey);
    
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
    let isMounted = true;
    let authSubscription = null;
    
    // Create a flag to avoid duplicate processing
    let checkingSession = false;
    
    const checkAuthState = async () => {
      if (checkingSession) return;
      checkingSession = true;
      
      try {
        // FIRST check for existing session to avoid duplication
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user && isMounted) {
          const userEmail = data.session.user.email || '';
          const displayName = data.session.user.user_metadata?.name || userEmail.split('@')[0];
          const authEventKey = `auth_${data.session.user.id}`;
          
          if (!processedAuthEvents.has(authEventKey)) {
            processedAuthEvents.add(authEventKey);
            
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
              if (isMounted) {
                processUserProfile(data.session.user.id);
              }
            }, 100);
          }
        } else if (isMounted) {
          // No active session
          resetAuthState();
          updateAuthState({ isLoading: false });
        }

        // THEN set up auth state listener with flag to prevent multiple profile loads
        if (!authSubscription) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Only log significant events, not just any state change
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
              console.log("Auth state changed:", event, session?.user?.email);
            }
            
            if (session?.user) {
              const userEmail = session.user.email || '';
              const displayName = session.user.user_metadata?.name || userEmail.split('@')[0];
              const authEventKey = `auth_${session.user.id}_${event}`;
              
              // Avoid processing duplicate events
              if (processedAuthEvents.has(authEventKey)) {
                return;
              }
              processedAuthEvents.add(authEventKey);
              
              // Update auth state
              updateAuthState({ 
                isLoggedIn: true,
                userName: displayName,
                avatarUrl: '', // Will be updated with profile data
                userEmail: userEmail,
                isLoading: false
              });
              
              // Use setTimeout to prevent Supabase deadlock
              setTimeout(() => {
                if (isMounted) {
                  processUserProfile(session.user.id);
                }
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              // Only reset auth state if not already processed
              const logoutEventKey = 'auth_logout';
              if (!processedAuthEvents.has(logoutEventKey)) {
                processedAuthEvents.add(logoutEventKey);
                resetAuthState();
                updateAuthState({ isLoading: false });
              }
            }
          });
          
          authSubscription = subscription;
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        if (isMounted) {
          resetAuthState();
          updateAuthState({ isLoading: false });
        }
      } finally {
        checkingSession = false;
      }
    };
    
    checkAuthState();
    
    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [processUserProfile, updateAuthState, resetAuthState]);
  
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
