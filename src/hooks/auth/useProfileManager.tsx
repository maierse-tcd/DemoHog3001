
import { useCallback } from 'react';
import { useProfileSettings } from '../../contexts/ProfileSettingsContext';
import { supabase } from '../../integrations/supabase/client';

export const useProfileManager = () => {
  const { settings, updateSettings } = useProfileSettings();

  // Track profile load attempts to prevent redundant calls
  // Use a ref to track fetched profiles in the current render cycle
  const fetchedProfiles = new Set();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Skip redundant fetches in the same render cycle
      if (fetchedProfiles.has(userId)) {
        console.log("Skipping redundant profile fetch for user:", userId);
        return null;
      }
      
      fetchedProfiles.add(userId);
      console.log("Fetching profile for user:", userId);
      
      // Get user data from auth
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      
      // Fetch profile data from profiles table using id, now including language
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      // Extract profile info
      const profileInfo = {
        displayName: profileData?.name || userEmail.split('@')[0],
        avatarUrl: profileData?.avatar_url || '',
        userEmail: userEmail,
        userId: userId,
        userMetadata: userData?.user?.user_metadata || {}
      };
      
      // Update profile settings context
      updateSettings({
        name: profileInfo.displayName,
        email: userEmail,
        selectedPlanId: profileInfo.userMetadata.selectedPlanId || settings?.selectedPlanId || 'premium',
        language: profileData?.language || settings?.language || 'English',
        notifications: settings?.notifications || { email: true },
        isKidsAccount: profileInfo.userMetadata.isKidsAccount || settings?.isKidsAccount || false,
        playbackSettings: settings?.playbackSettings || {
          autoplayNext: true,
          autoplayPreviews: true,
        }
      });
      
      return profileInfo;
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, [settings, updateSettings]);
  
  const createDefaultProfile = useCallback(async (userId: string, userEmail: string, displayName: string) => {
    try {
      // Create profile with the user ID from auth.users
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: displayName,
          email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error creating default profile:", insertError);
        return false;
      }
      
      console.log("Created default profile for user");
      return true;
    } catch (err) {
      console.error("Profile creation error:", err);
      return false;
    }
  }, []);
  
  return {
    fetchUserProfile,
    createDefaultProfile
  };
};
