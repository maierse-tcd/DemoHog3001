
import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { KidsAccountToggle } from './KidsAccountToggle';
import { LanguageSelector } from './LanguageSelector';
import { ProfileButtons } from './ProfileButtons';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';

interface ProfileFormProps {
  settings: ProfileSettings;
  isLoading: boolean;
  isKidsAccount: boolean;
  selectedLanguage: string;
  handleKidsAccountChange: (checked: boolean) => void;
  handleLanguageChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  settings,
  isLoading,
  isKidsAccount,
  selectedLanguage,
  handleKidsAccountChange,
  handleLanguageChange,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="block text-sm font-medium text-netflix-gray mb-1">Name</Label>
        <Input 
          type="text" 
          name="name"
          defaultValue={settings.name} 
          className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" 
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-netflix-gray mb-1">Email</Label>
        <Input 
          type="email" 
          name="email"
          defaultValue={settings.email} 
          className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" 
        />
      </div>
      
      <LanguageSelector 
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      <div>
        <Label className="block text-sm font-medium text-netflix-gray mb-1">Password</Label>
        <Input 
          type="password" 
          defaultValue="********" 
          disabled
          className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2 opacity-50" 
        />
        <p className="text-sm text-netflix-gray mt-1">To change your password, use the "Reset Password" option</p>
      </div>
      
      <KidsAccountToggle 
        isKidsAccount={isKidsAccount}
        onToggle={handleKidsAccountChange}
      />
      
      <ProfileButtons 
        isLoading={isLoading} 
        email={settings.email}
      />
    </form>
  );
};
