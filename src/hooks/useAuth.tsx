
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // First set up auth state listener (IMPORTANT: Do this before checking for existing session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          setAuthState(prev => ({ 
            ...prev, 
            isLoggedIn: true,
            isLoading: false
          }));
          
          // Identify user in PostHog whenever there's a valid session
          if (window.posthog) {
            window.posthog.identify(session.user.id, {
              email: session.user.email
            });
            
            // Only capture specific events
            if (event === 'SIGNED_IN') {
              window.posthog.capture('session_started');
            }
          }
          
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
          
          // Reset PostHog identification when logged out
          if (window.posthog && event === 'SIGNED_OUT') {
            window.posthog.reset();
          }
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoggedIn: true,
          isLoading: false 
        }));
        
        console.log("Found existing session for:", data.session.user.email);
        
        // Identify user in PostHog on initial load if they're logged in
        if (window.posthog) {
          window.posthog.identify(data.session.user.id, {
            email: data.session.user.email
          });
          window.posthog.capture('session_resumed');
        }
        
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
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add this effect to update the username when settings change
  useEffect(() => {
    if (settings?.name && authState.isLoggedIn) {
      setAuthState(prev => ({ ...prev, userName: settings.name }));
    }
  }, [settings, authState.isLoggedIn]);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profileData) {
        console.log("Profile data fetched:", profileData);
        
        setAuthState({
          isLoggedIn: true,
          userName: profileData.name || 'User',
          avatarUrl: profileData.avatar_url || '',
          isLoading: false
        });
        
        // Get user metadata for additional fields
        const { data: { user } } = await supabase.auth.getUser();
        const userMetadata = user?.user_metadata || {};
        
        // Update the profile settings with user data
        updateSettings({
          name: profileData.name || 'User',
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
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const handleLogout = async () => {
    try {
      // Capture logout event before clearing identification
      if (window.posthog) {
        window.posthog.capture('user_logout');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any user-specific settings from context
      updateSettings({
        name: 'Guest',
        email: '',
      });
      
      // Reset PostHog identification after logout
      if (window.posthog) {
        window.posthog.reset();
      }
      
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
