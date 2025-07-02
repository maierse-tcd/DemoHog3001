
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../hooks/use-toast';
import { safeGroupIdentify, getLastIdentifiedGroup } from '../utils/posthog';
import { identifyUser } from '../utils/posthog/simple';

export interface ProfileSettings {
  name: string;
  email: string;
  selectedPlanId: string;
  language: string;
  isKidsAccount: boolean;
  accessPassword: string;
  notifications: {
    email: boolean;
  };
  playbackSettings: {
    autoplayNext: boolean;
    autoplayPreviews: boolean;
  };
}

const defaultSettings: ProfileSettings = {
  name: 'Max Hedgehog',
  email: 'max@hogflix.com',
  selectedPlanId: 'premium',
  language: 'English',
  isKidsAccount: false,
  accessPassword: '',
  notifications: {
    email: true,
  },
  playbackSettings: {
    autoplayNext: true,
    autoplayPreviews: true,
  }
};

interface ProfileSettingsContextType {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
  updateSelectedPlan: (planId: string) => void;
  siteAccessPassword: string | null;
}

const ProfileSettingsContext = createContext<ProfileSettingsContextType | undefined>(undefined);

export const ProfileSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ProfileSettings>(defaultSettings);
  const [siteAccessPassword, setSiteAccessPassword] = useState<string | null>(null);
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn || false;
  const user = auth?.user || null;
  
  // Track last known database kids account status
  const dbKidsAccountRef = useRef<boolean | null>(null);
  
  // Track if an update is in progress
  const updateInProgressRef = useRef(false);
  
  // Debounce timer for group updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Used to prevent loops and multiple updates
  const pendingUpdatesRef = useRef<Partial<ProfileSettings>>({});
  const initializedRef = useRef(false);

  // Load settings from database when authenticated or localStorage as fallback
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!initializedRef.current && isLoggedIn) {
          console.log("Loading profile settings from database");
          
          // Fetch site-wide access password from profiles (if available)
          const { data, error } = await supabase
            .from('profiles')
            .select('access_password')
            .not('access_password', 'is', null)
            .limit(1);

          if (!error && data && data.length > 0 && data[0].access_password) {
            setSiteAccessPassword(data[0].access_password);
          } else {
            setSiteAccessPassword(null);
          }

          // If the user has their own profile, load personal settings
          if (user?.id) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (!profileError && profileData) {
              // Save the database kids account status in the ref
              dbKidsAccountRef.current = !!profileData.is_kids;
              
              console.log(`Loading profile from database, isKidsAccount: ${!!profileData.is_kids}`);
              
              // Get userMetadata from auth if available
              const { data: userData } = await supabase.auth.getUser();
              const userMetadata = userData?.user?.user_metadata || {};
              
              // Update settings with data from database
              setSettings(prev => ({
                ...prev,
                name: profileData.name || prev.name,
                email: profileData.email || prev.email,
                isKidsAccount: !!profileData.is_kids,
                language: profileData.language || prev.language,
                playbackSettings: prev.playbackSettings,
                notifications: prev.notifications,
                // Use the selectedPlanId from metadata if it exists
                selectedPlanId: userMetadata?.selectedPlanId || prev.selectedPlanId,
              }));
              
              initializedRef.current = true;
            }
          }
        } else if (!initializedRef.current) {
          // Fall back to localStorage for non-authenticated users
          const savedSettings = localStorage.getItem('profileSettings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
          initializedRef.current = true;
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // Still mark as initialized to prevent endless retries
        initializedRef.current = true;
      }
    };

    loadSettings();
  }, [isLoggedIn, user]);

  // Save settings to both database (if authenticated) and localStorage
  const updateSettings = async (newSettings: Partial<ProfileSettings>) => {
    // Prevent concurrent updates with a simple debounce
    if (updateInProgressRef.current) {
      console.log('Settings update already in progress, ignoring duplicate update');
      return;
    }
    
    updateInProgressRef.current = true;
    
    try {
      // Update local state immediately
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        
        // Always update localStorage for immediate access
        localStorage.setItem('profileSettings', JSON.stringify(updated));
        
        // If authenticated and user has ID, also update database
        if (isLoggedIn && user?.id) {
          // If kids account status is being updated, separate handling
          if (newSettings.isKidsAccount !== undefined && 
              newSettings.isKidsAccount !== prev.isKidsAccount) {
            
            // Queue update to database and PostHog 
            // This uses the debounce approach to avoid excessive API calls
            queueKidsAccountUpdate(newSettings.isKidsAccount);
          }
          
          // Update other user-specific settings
          if (newSettings.name !== undefined || newSettings.email !== undefined || 
              newSettings.language !== undefined) {
            queueUserProfileUpdate(updated);
            
            // Update PostHog person properties if language changed
            if (newSettings.language !== undefined && newSettings.language !== prev.language) {
              queuePostHogPersonUpdate(updated);
            }
          }
          
          // If selectedPlanId is being updated, update it in user metadata
          if (newSettings.selectedPlanId !== undefined &&
              newSettings.selectedPlanId !== prev.selectedPlanId) {
            queueSelectedPlanUpdate(newSettings.selectedPlanId);
          }
          
          // For site-wide access password, special handling
          if (newSettings.accessPassword !== undefined) {
            queueAccessPasswordUpdate(newSettings.accessPassword);
          }
        }
        
        return updated;
      });
    } finally {
      // Clear update flag after a short delay
      setTimeout(() => {
        updateInProgressRef.current = false;
      }, 1000); // Longer delay to prevent rapid successive updates
    }
  };

  // Queue an update to the user profile - minimizes unnecessary database calls
  const queueUserProfileUpdate = (updatedSettings: ProfileSettings) => {
    if (!isLoggedIn || !user?.id) return;
    
    // Use a debounce to batch updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Only update fields that we actually store in the profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updatedSettings.name,
            email: updatedSettings.email,
            language: updatedSettings.language,
            // Note: We don't update is_kids here as it's handled separately
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating user profile:', error);
        }
      } catch (error) {
        console.error('Error in queueUserProfileUpdate:', error);
      } finally {
        debounceTimerRef.current = null;
      }
    }, 500); // Debounce for half a second
  };

  // Queue an update to the site-wide access password
  const queueAccessPasswordUpdate = (password: string) => {
    if (!isLoggedIn || !user?.id) return;
    
    // Use a debounce to avoid rapid updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Update the access_password in the user's profile
        const { error } = await supabase
          .from('profiles')
          .update({ access_password: password })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating access password:', error);
          toast({
            title: "Error saving password",
            description: "There was a problem saving the access password.",
            variant: "destructive"
          });
        } else {
          setSiteAccessPassword(password);
        }
      } catch (error) {
        console.error('Error in queueAccessPasswordUpdate:', error);
      } finally {
        debounceTimerRef.current = null;
      }
    }, 500);
  };
  
  // Queue an update to the selectedPlanId in user metadata
  const queueSelectedPlanUpdate = (planId: string) => {
    if (!isLoggedIn) return;
    
    // Use a debounce to avoid rapid updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { selectedPlanId: planId }
        });
        
        if (error) {
          console.error('Error updating plan in user metadata:', error);
          toast({
            title: "Error saving plan",
            description: "There was a problem saving your subscription plan.",
            variant: "destructive"
          });
        } else {
          console.log(`Subscription plan updated to ${planId} in user metadata`);
        }
      } catch (error) {
        console.error('Error in queueSelectedPlanUpdate:', error);
      } finally {
        debounceTimerRef.current = null;
      }
    }, 500);
  };

  // Queue an update to the is_kids flag in the database and PostHog group
  const queueKidsAccountUpdate = (isKids: boolean) => {
    if (!isLoggedIn || !user?.id) return;
  
    // Skip update if the value is the same as database state
    if (isKids === dbKidsAccountRef.current) {
      console.log('Kids account status unchanged, skipping update');
      return;
    }
  
    // Debounce the update to prevent rapid changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    dbKidsAccountRef.current = isKids; // Update ref immediately
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Update the is_kids flag in the user's profile
        const { error } = await supabase
          .from('profiles')
          .update({ is_kids: isKids })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating is_kids status:', error);
          toast({
            title: "Error saving kids account status",
            description: "There was a problem updating your account type.",
            variant: "destructive"
          });
          
          // Reset the ref on error
          dbKidsAccountRef.current = null;
        } else {
          console.log(`Database updated: is_kids = ${isKids}`);
          
          // Update PostHog group for user type
          const userType = isKids ? 'Kid' : 'Adult';
          
          // Use a timeout to avoid PostHog operation during render
          setTimeout(() => {
            // First check if we already have this group identified
            const currentGroup = getLastIdentifiedGroup('user_type');
            if (currentGroup === userType) {
              console.log(`PostHog: User already identified as ${userType}, skipping group update`);
              return;
            }
            
            console.log(`Updating PostHog with new kids account status: ${isKids}`);
            safeGroupIdentify('user_type', userType, {
              name: userType,
              update_time: new Date().toISOString()
            });
            
            toast({
              title: "Account type updated",
              description: `Your account is now set as a ${isKids ? 'kids' : 'adult'} account.`,
            });
          }, 200);
        }
      } catch (error) {
        console.error('Error in queueKidsAccountUpdate:', error);
        // Reset the ref on error
        dbKidsAccountRef.current = null;
      } finally {
        // Clear debounce timer reference
        debounceTimerRef.current = null;
      }
    }, 1000); // Longer debounce for kids account changes
  };

  // Queue an update to PostHog person properties
  const queuePostHogPersonUpdate = (updatedSettings: ProfileSettings) => {
    if (!isLoggedIn || !updatedSettings.email) return;
    
    // Use a debounce to avoid rapid updates
    setTimeout(() => {
      try {
        console.log(`PostHog: Updating person properties - language: ${updatedSettings.language}`);
        identifyUser(updatedSettings.email, {
          name: updatedSettings.name,
          language: updatedSettings.language,
          is_kids_account: updatedSettings.isKidsAccount,
          email: updatedSettings.email,
          supabase_id: user?.id,
        });
      } catch (error) {
        console.error('Error updating PostHog person properties:', error);
      }
    }, 300); // Short delay to ensure database update completes first
  };

  // Update selected plan - public facing method
  const updateSelectedPlan = (planId: string) => {
    updateSettings({ selectedPlanId: planId });
  };

  return (
    <ProfileSettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      updateSelectedPlan,
      siteAccessPassword 
    }}>
      {children}
    </ProfileSettingsContext.Provider>
  );
};

export const useProfileSettings = () => {
  const context = useContext(ProfileSettingsContext);
  if (!context) {
    throw new Error('useProfileSettings must be used within a ProfileSettingsProvider');
  }
  return context;
};
