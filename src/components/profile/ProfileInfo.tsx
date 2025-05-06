import React, { useState, useEffect, useRef } from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';
import { supabase } from '../../integrations/supabase/client';
import { safeIdentify } from '../../utils/posthogUtils';
import { Checkbox } from '../ui/checkbox';
import { usePostHogContext } from '../../contexts/PostHogContext';

interface ProfileInfoProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ settings, updateSettings }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isKidsAccount, setIsKidsAccount] = useState<boolean>(settings.isKidsAccount);
  // Use a ref to track if this is the initial render
  const initialRenderRef = useRef(true);
  // Track if an update is already in progress
  const updateInProgressRef = useRef(false);
  // Get PostHog context instead of using window object
  const { updateUserType } = usePostHogContext();

  // Sync local state with settings when they change from context
  useEffect(() => {
    if (!initialRenderRef.current || settings.isKidsAccount !== isKidsAccount) {
      console.log(`Syncing kids account state from settings: ${settings.isKidsAccount}`);
      setIsKidsAccount(settings.isKidsAccount);
    }
    initialRenderRef.current = false;
  }, [settings.isKidsAccount, isKidsAccount]);

  // Handle checkbox change directly
  const handleKidsAccountChange = (checked: boolean) => {
    console.log(`Kids account checkbox changed to: ${checked}`);
    setIsKidsAccount(checked);
  };

  // Update PostHog group when the kids account status changes
  useEffect(() => {
    // Skip on initial render to prevent unnecessary API calls
    if (initialRenderRef.current) {
      return;
    }
    
    // Only update PostHog if the value differs from settings
    if (isKidsAccount !== settings.isKidsAccount) {
      console.log(`Updating PostHog with new kids account status: ${isKidsAccount}`);
      
      // Use context method instead of window.__posthogMethods
      try {
        updateUserType(isKidsAccount);
      } catch (err) {
        console.error('Error updating PostHog user type:', err);
      }
    }
  }, [isKidsAccount, settings.isKidsAccount, updateUserType]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent concurrent updates
    if (updateInProgressRef.current) {
      console.log('Update already in progress, skipping');
      return;
    }
    
    updateInProgressRef.current = true;
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;

      // Use React state instead of form data for checkbox
      // This ensures we always have the correct state

      // Get current user to get the ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Create an object to track what's changing
      const changes: Record<string, any> = {};
      let hasChanges = false;

      if (name !== settings.name) {
        changes.name = name;
        hasChanges = true;
      }

      if (email !== settings.email) {
        changes.email = email;
        hasChanges = true;
      }

      // Only include is_kids in the update if it actually changed
      if (isKidsAccount !== settings.isKidsAccount) {
        console.log(`Kids account changed from ${settings.isKidsAccount} to ${isKidsAccount}`);
        changes.is_kids = isKidsAccount;
        hasChanges = true;
      } else {
        console.log('Kids account status unchanged, skipping update');
      }

      // Skip database update if nothing changed
      if (hasChanges) {
        // Set updated_at only when we're actually updating
        changes.updated_at = new Date().toISOString();

        console.log('Updating profile with changes:', changes);

        // Update user's profile in the database using the changes object
        const { error } = await supabase
          .from('profiles')
          .update(changes)
          .eq('id', user.id);

        if (error) throw error;
      }

      // Store the name in PostHog for better identification
      if (email && email !== settings.email) {
        safeIdentify(email, { name });
      }

      // Update the context only if something changed
      const settingsChanges: Partial<ProfileSettings> = {};
      let hasSettingsChanges = false;

      if (name !== settings.name) {
        settingsChanges.name = name;
        hasSettingsChanges = true;
      }
      
      if (email !== settings.email) {
        settingsChanges.email = email;
        hasSettingsChanges = true;
      }
      
      if (isKidsAccount !== settings.isKidsAccount) {
        settingsChanges.isKidsAccount = isKidsAccount;
        hasSettingsChanges = true;
        
        // Also update PostHog if we have direct access to the method
        try {
          updateUserType(isKidsAccount);
        } catch (err) {
          console.error('Error updating PostHog user type:', err);
        }
      }

      // Only update settings if something actually changed
      if (hasSettingsChanges) {
        console.log('Updating settings context with changes:', settingsChanges);
        updateSettings(settingsChanges);
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
      updateInProgressRef.current = false;
    }
  };

  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      <form onSubmit={handleProfileSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-netflix-gray mb-1">Name</label>
          <input 
            type="text" 
            name="name"
            defaultValue={settings.name} 
            className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-netflix-gray mb-1">Email</label>
          <input 
            type="email" 
            name="email"
            defaultValue={settings.email} 
            className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-netflix-gray mb-1">Password</label>
          <input 
            type="password" 
            defaultValue="********" 
            disabled
            className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2 opacity-50" 
          />
          <p className="text-sm text-netflix-gray mt-1">To change your password, use the "Reset Password" option</p>
        </div>
        
        {/* Kids Account Toggle - Now controlled by React state */}
        <div className="flex items-center space-x-3">
          <Checkbox 
            id="isKidsAccount" 
            name="isKidsAccount" 
            checked={isKidsAccount}
            onCheckedChange={handleKidsAccountChange}
            className="h-5 w-5 border border-netflix-gray" 
          />
          <label htmlFor="isKidsAccount" className="text-sm font-medium text-netflix-gray">
            This is a kids account
          </label>
        </div>
        <p className="text-sm text-netflix-gray mt-1">
          Kids accounts have restricted content and simplified controls
        </p>
        
        <div className="flex space-x-4">
          <button 
            type="submit" 
            className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="border border-netflix-gray text-white px-4 py-2 rounded hover:bg-netflix-black transition-colors"
            onClick={async () => {
              try {
                const { error } = await supabase.auth.resetPasswordForEmail(settings.email, {
                  redirectTo: window.location.origin + '/profile'
                });
                
                if (error) throw error;
                
                toast({
                  title: 'Password reset email sent',
                  description: 'Check your email for a link to reset your password',
                });
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to send password reset email',
                  variant: 'destructive'
                });
              }
            }}
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
};
