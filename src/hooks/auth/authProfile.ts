import { supabase } from '../../integrations/supabase/client';
import { AuthState } from './authTypes';

// Process profile data
export const fetchUserProfile = async (
  userId: string,
  updateAuthState: (newState: Partial<AuthState>) => void
) => {
  console.log("Fetching profile for user:", userId);
  
  try {
    // Get user info with metadata
    const { data: userData } = await supabase.auth.getUser();
    const userMetadata = userData?.user?.user_metadata || {};
    
    // Query the profiles table
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (profileData) {
      updateAuthState({
        userName: profileData.name || 'User',
        avatarUrl: profileData.avatar_url || '',
        userMetadata: userMetadata,
        user: { id: userId },
        isLoading: false
      });
    } else {
      // Get user info to create a default profile
      if (userData?.user) {
        const email = userData.user.email || '';
        const name = userData.user.user_metadata?.name || email.split('@')[0];
        
        updateAuthState({
          userName: name,
          userMetadata: userMetadata,
          user: { id: userId },
          isLoading: false
        });
      }
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    updateAuthState({ isLoading: false });
  }
};