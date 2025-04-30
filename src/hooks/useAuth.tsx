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
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profileData) {
        console.log("Profile data fetched:", profileData);
        
        // Update auth state with profile data
        setAuthState(prev => ({
          ...prev,
          isLoggedIn: true,
          userName: profileData.name || prev.userName,
          avatarUrl: profileData.avatar_url || prev.avatarUrl
        }));
        
        // Get user metadata for additional fields
        const { data: { user } } = await supabase.auth.getUser();
        const userMetadata = user?.user_metadata || {};
        
        // Update the profile settings with user data
        updateSettings({
          name: profileData.name || userMetadata.name || 'User',
          email: profileData.email,
          // Use metadata for fields not in the profiles table
          selectedPlanId: userMetadata.selectedPlanId || settings?.selectedPlanId || 'premium',
          language: settings?.language || 'English',
          notifications: settings?.notifications || { email: true },
          isKidsAccount: userMetadata.isKidsAccount || settings?.isKidsAccount || false,
          playbackSettings: settings?.playbackSettings || {
            autoplayNext: true,
            autoplayPreviews: true,
          }
        });
      } else {
        console.log("No profile data found for user:", userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [settings, updateSettings]);

  useEffect(() => {
    // First set up auth state listener before checking for existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
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
          setAuthState({
            isLoggedIn: false,
            userName: 'Guest',
            avatarUrl: '',
            isLoading: false
          });
        }
      }
    );
    
    // THEN check for existing session
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
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
      } else {
        console.log("No existing session found");
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
      // Capture logout event before clearing identification
      if (window.posthog) {
        window.posthog.capture('user_logout');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Remove the persistent identifier
      localStorage.removeItem('hogflix_user_id');
      
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
    handleLogout
  };
};
