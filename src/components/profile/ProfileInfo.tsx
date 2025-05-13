
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';
import { supabase } from '../../integrations/supabase/client';
import { ProfileForm } from './ProfileForm';

interface ProfileInfoProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ settings, updateSettings }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Store local state for kids account that's only pushed to context on save
  const [isKidsAccount, setIsKidsAccount] = useState<boolean>(settings.isKidsAccount);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(settings.language || 'English');
  const initialRenderRef = useRef(true);
  const updateInProgressRef = useRef(false);
  
  // Sync from settings when they change externally
  useEffect(() => {
    if (!initialRenderRef.current || settings.isKidsAccount !== isKidsAccount) {
      console.log(`Syncing kids account state from settings: ${settings.isKidsAccount}`);
      setIsKidsAccount(settings.isKidsAccount);
    }
    initialRenderRef.current = false;
  }, [settings.isKidsAccount, isKidsAccount]);

  // Sync language from settings
  useEffect(() => {
    if (settings.language !== selectedLanguage) {
      console.log(`Syncing language from settings: ${settings.language}`);
      setSelectedLanguage(settings.language || 'English');
    }
  }, [settings.language]);

  // Only update local state without triggering PostHog updates
  const handleKidsAccountChange = (checked: boolean) => {
    console.log(`Kids account checkbox changed to: ${checked}`);
    setIsKidsAccount(checked);
    // We intentionally don't update settings here to prevent the loop
  };

  const handleLanguageChange = (value: string) => {
    console.log(`Language changed to: ${value}`);
    setSelectedLanguage(value);
    // Similarly, don't update settings directly
  };

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

      if (isKidsAccount !== settings.isKidsAccount) {
        console.log(`Kids account changed from ${settings.isKidsAccount} to ${isKidsAccount}`);
        changes.is_kids = isKidsAccount;
        hasChanges = true;
      } else {
        console.log('Kids account status unchanged, skipping update');
      }
      
      // Get language from state
      if (selectedLanguage !== settings.language) {
        console.log(`Language changed from ${settings.language} to ${selectedLanguage}`);
        changes.language = selectedLanguage;
        hasChanges = true;
      } else {
        console.log('Language unchanged, skipping update');
      }

      if (hasChanges) {
        changes.updated_at = new Date().toISOString();
        console.log('Updating profile with changes:', changes);
        const { error } = await supabase
          .from('profiles')
          .update(changes)
          .eq('id', user.id);

        if (error) throw error;
      }

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
      }
      
      // Handle language changes in settings
      if (selectedLanguage !== settings.language) {
        settingsChanges.language = selectedLanguage;
        hasSettingsChanges = true;
      }

      if (hasSettingsChanges) {
        console.log('Updating settings context with changes:', settingsChanges);
        // Now update the context after database save is successful
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
      <ProfileForm
        settings={settings}
        isLoading={isLoading}
        isKidsAccount={isKidsAccount}
        selectedLanguage={selectedLanguage}
        handleKidsAccountChange={handleKidsAccountChange}
        handleLanguageChange={handleLanguageChange}
        handleSubmit={handleProfileSave}
      />
    </div>
  );
};
