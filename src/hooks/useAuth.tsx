
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { supabase } from '../integrations/supabase/client';

export interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  avatarUrl: string;
  userEmail: string;
  isLoading?: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userName: 'Guest',
    avatarUrl: '',
    userEmail: '',
    isLoading: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, updateSettings } = useProfileSettings();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // Get user data from auth
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      
      // Fetch profile data from profiles table - fixed to use email instead of id for the query
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // If profile exists, update the auth state
      if (profileData) {
        console.log("Profile data fetched:", profileData);
        
        // Safe access to profile data with null checks
        const displayName = profileData.name || userEmail.split('@')[0];
        const avatarUrl = profileData.avatar_url || '';
        
        setAuthState({
          isLoggedIn: true,
          userName: displayName,
          avatarUrl: avatarUrl,
          userEmail: userEmail,
          isLoading: false
        });
        
        // Get user metadata
        const userMetadata = userData?.user?.user_metadata || {};
        
        // Update the profile settings
        updateSettings({
          name: displayName,
          email: userEmail,
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
        if (window.posthog && userEmail) {
          try {
            window.posthog.identify(userEmail, {
              name: displayName,
              id: userId
            });
          } catch (err) {
            console.error("PostHog identify error:", err);
          }
        }
      } else {
        console.log("No profile data found for user:", userId);
        
        // For demo purposes, create a profile if it doesn't exist
        if (userData?.user) {
          const displayName = userData.user.user_metadata?.name || userEmail.split('@')[0];
          
          // Create profile without manually specifying the ID field
          const { error: insertError } = await supabase.from('profiles').upsert({
            name: displayName,
            email: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          if (insertError) {
            console.error("Error creating default profile:", insertError);
          } else {
            console.log("Created default profile for user");
            // Set auth state directly instead of recursive call
            setAuthState({
              isLoggedIn: true,
              userName: displayName,
              avatarUrl: '',
              userEmail: userEmail,
              isLoading: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [settings, updateSettings]);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event, session?.user?.email);
          
          if (session?.user) {
            const userEmail = session.user.email || '';
            const displayName = session.user.user_metadata?.name || userEmail.split('@')[0];
            
            // Update auth state
            setAuthState({ 
              isLoggedIn: true,
              userName: displayName,
              avatarUrl: '',
              userEmail: userEmail,
              isLoading: false
            });
            
            // Use timeout to prevent Supabase deadlock
            setTimeout(() => {
              fetchUserProfile(session.user.id);
            }, 0);
          } else {
            setAuthState({
              isLoggedIn: false,
              userName: 'Guest',
              avatarUrl: '',
              userEmail: '',
              isLoading: false
            });
          }
        });
        
        // THEN check for existing session
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const userEmail = data.session.user.email || '';
          const displayName = data.session.user.user_metadata?.name || userEmail.split('@')[0];
          
          // Set basic auth state from session
          setAuthState({ 
            isLoggedIn: true,
            userName: displayName,
            avatarUrl: '',
            userEmail: userEmail,
            isLoading: false
          });
          
          // Delay the fetch to avoid Supabase lock
          setTimeout(() => {
            fetchUserProfile(data.session.user.id);
          }, 0);
        } else {
          // No active session
          setAuthState({
            isLoggedIn: false,
            userName: 'Guest',
            avatarUrl: '',
            userEmail: '',
            isLoading: false
          });
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking auth state:", error);
        setAuthState({
          isLoggedIn: false,
          userName: 'Guest',
          avatarUrl: '',
          userEmail: '',
          isLoading: false
        });
      }
    };
    
    checkAuthState();
  }, [fetchUserProfile]);
  
  const handleLogout = async () => {
    try {
      // Capture user info before logout for analytics
      const userEmail = authState.userEmail;
      
      // Capture logout event
      if (window.posthog && userEmail) {
        try {
          window.posthog.capture('user_logout');
        } catch (err) {
          console.error("PostHog event error:", err);
        }
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user data
      setAuthState({
        isLoggedIn: false,
        userName: 'Guest',
        avatarUrl: '',
        userEmail: '',
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
