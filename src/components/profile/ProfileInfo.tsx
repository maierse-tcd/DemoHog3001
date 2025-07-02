
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
  // Store local state for form fields
  const [localKidsAccount, setLocalKidsAccount] = useState<boolean>(settings.isKidsAccount);
  const [localLanguage, setLocalLanguage] = useState<string>(settings.language || 'English');
  const [localName, setLocalName] = useState<string>(settings.name || '');
  const [localEmail, setLocalEmail] = useState<string>(settings.email || '');
  
  const initialRenderRef = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Sync from settings when they change externally
  useEffect(() => {
    if (!initialRenderRef.current) {
      setLocalKidsAccount(settings.isKidsAccount);
      setLocalLanguage(settings.language || 'English');
      setLocalName(settings.name || '');
      setLocalEmail(settings.email || '');
    }
    initialRenderRef.current = false;
  }, [settings]);

  // Only update local state without triggering PostHog updates
  const handleKidsAccountChange = (checked: boolean) => {
    setLocalKidsAccount(checked);
    // We don't update settings here to prevent PostHog updates until Save is clicked
  };

  const handleLanguageChange = (value: string) => {
    setLocalLanguage(value);
    // Similarly, don't update settings directly
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEmail(e.target.value);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Create an object to track what's changing
      const changes: Record<string, any> = {};
      let hasChanges = false;

      if (localName !== settings.name) {
        changes.name = localName;
        hasChanges = true;
      }

      if (localEmail !== settings.email) {
        changes.email = localEmail;
        hasChanges = true;
      }

      if (localKidsAccount !== settings.isKidsAccount) {
        console.log(`Kids account changed from ${settings.isKidsAccount} to ${localKidsAccount}`);
        changes.is_kids = localKidsAccount;
        hasChanges = true;
      }
      
      if (localLanguage !== settings.language) {
        console.log(`Language changed from ${settings.language} to ${localLanguage}`);
        changes.language = localLanguage;
        hasChanges = true;
      }

      if (hasChanges) {
        changes.updated_at = new Date().toISOString();
        
        // Hash password if it's being updated and not empty
        if (changes.access_password && changes.access_password.trim() !== '') {
          const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
            password: changes.access_password
          });
          
          if (hashError) {
            console.error('Password hashing error:', hashError);
            throw new Error('Failed to secure password');
          }
          
          changes.access_password = hashedPassword;
        }
        
        console.log('Updating profile with changes:', changes);
        const { error } = await supabase
          .from('profiles')
          .update(changes)
          .eq('id', user.id);

        if (error) throw error;
        
        // Now update the context with all changes
        const settingsChanges: Partial<ProfileSettings> = {};
        
        if (localName !== settings.name) {
          settingsChanges.name = localName;
        }
        
        if (localEmail !== settings.email) {
          settingsChanges.email = localEmail;
        }
        
        if (localKidsAccount !== settings.isKidsAccount) {
          settingsChanges.isKidsAccount = localKidsAccount;
        }
        
        if (localLanguage !== settings.language) {
          settingsChanges.language = localLanguage;
        }

        console.log('Updating settings context with changes:', settingsChanges);
        updateSettings(settingsChanges);

        toast({
          title: 'Profile updated',
          description: 'Your profile information has been saved',
        });
      } else {
        toast({
          title: 'No changes',
          description: 'No changes were made to your profile',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      <ProfileForm
        ref={formRef}
        settings={{
          ...settings,
          name: localName,
          email: localEmail,
          isKidsAccount: localKidsAccount,
          language: localLanguage,
        }}
        isLoading={isLoading}
        handleKidsAccountChange={handleKidsAccountChange}
        handleLanguageChange={handleLanguageChange}
        handleNameChange={handleNameChange}
        handleEmailChange={handleEmailChange}
        handleSubmit={handleProfileSave}
      />
    </div>
  );
};
