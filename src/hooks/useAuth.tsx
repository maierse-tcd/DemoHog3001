import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { supabase } from '../integrations/supabase/client';

export interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  avatarUrl: string;
  isLoading?: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userName: 'Guest',
    avatarUrl: '',
    isLoading: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, updateSettings } = useProfileSettings();

  // Create a stable fetchUserProfile function that won't change on each render
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // Fetch profile data from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // If profile exists, update the auth state
      if (profileData) {
        console.log("Profile data fetched:", profileData);
        
        setAuthState(prev => ({
          ...prev,
          isLoggedIn: true,
          userName: profileData.name || prev.userName,
          avatarUrl: profileData.avatar_url || prev.avatarUrl,
          isLoading: false
        }));
        
        // Get user metadata for additional fields
        const { data: { user } } = await supabase.auth.getUser();
        const userMetadata = user?.user_metadata || {};
        
        // Update the profile settings
        updateSettings({
          name: profileData.name || userMetadata.name || 'User',
          email: profileData.email,
          selectedPlanId: userMetadata.selectedPlanId || settings?.selectedPlanId || 'premium',
          language: settings?.language || 'English',
          notifications: settings?.notifications || { email: true },
          isKidsAccount: userMetadata.isKidsAccount || settings?.isKidsAccount || false,
          playbackSettings: settings?.playbackSettings || {
            autoplayNext: true,
            autoplayPreviews: true,
          }
        });
        
        // Ensure PostHog knows who the user is
        if (window.posthog && userId) {
          try {
            window.posthog.identify(userId, {
              name: profileData.name,
              email: profileData.email
            });
          } catch (err) {
            console.error("PostHog identify error:", err);
          }
        }
      } else {
        console.log("No profile data found for user:", userId);
        
        // For demo purposes, create a profile if it doesn't exist
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: insertError } = await supabase.from('profiles').upsert({
            id: userId,
            name: user.user_metadata?.name || 'User',
            email: user.email
          });
          
          if (insertError) {
            console.error("Error creating default profile:", insertError);
          } else {
            console.log("Created default profile for user");
            // Retry fetch after creating
            fetchUserProfile(userId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [settings, updateSettings]);

  useEffect(() => {
    // Check for stored user ID first (for persisting across browser refreshes)
    const storedUserId = localStorage.getItem('hogflix_user_id');
    if (storedUserId) {
      console.log("Found stored user ID:", storedUserId);
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          // Use localStorage to maintain persistent identification
          localStorage.setItem('hogflix_user_id', session.user.id);
          
          setAuthState(prev => ({ 
            ...prev, 
            isLoggedIn: true,
            userName: session.user.user_metadata?.name || 'User',
            isLoading: false
          }));
          
          // Use timeout to prevent Supabase deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          // Don't clear the stored ID on initial check - we'll use it to try re-authentication
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      }
    );
    
    // THEN check for existing session
    const checkExistingSession = async () => {
      // First try to get the session from Supabase
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        localStorage.setItem('hogflix_user_id', data.session.user.id);
        
        setAuthState(prev => ({ 
          ...prev, 
          isLoggedIn: true,
          userName: data.session.user.user_metadata?.name || 'User',
          isLoading: false 
        }));
        
        console.log("Found existing session for:", data.session.user.email);
        
        // Delay the fetch to avoid Supabase lock
        setTimeout(() => {
          fetchUserProfile(data.session.user.id);
        }, 0);
      } else if (storedUserId) {
        // No active session but we have a stored ID - try to use it
        setAuthState(prev => ({ 
          ...prev, 
          isLoggedIn: true,
          isLoading: false
        }));
        
        console.log("No active session but found stored ID, fetching profile:", storedUserId);
        setTimeout(() => {
          fetchUserProfile(storedUserId);
        }, 0);
      } else {
        // No session or stored ID
        setAuthState({
          isLoggedIn: false,
          userName: 'Guest',
          avatarUrl: '',
          isLoading: false
        });
      }
    };
    
    checkExistingSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Keep username updated when settings change
  useEffect(() => {
    if (settings?.name && authState.isLoggedIn) {
      setAuthState(prev => ({ ...prev, userName: settings.name }));
    }
  }, [settings, authState.isLoggedIn]);
  
  const handleLogout = async () => {
    try {
      // First store user ID for analytics
      const userId = localStorage.getItem('hogflix_user_id');
      
      // Capture logout event
      if (window.posthog && userId) {
        try {
          window.posthog.capture('user_logout');
        } catch (err) {
          console.error("PostHog event error:", err);
        }
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any user-specific settings from context
      updateSettings({
        name: 'Guest',
        email: '',
      });
      
      // Reset all user data
      setAuthState({
        isLoggedIn: false,
        userName: 'Guest',
        avatarUrl: '',
        isLoading: false
      });
      
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
    fetchUserProfile
  };
};
