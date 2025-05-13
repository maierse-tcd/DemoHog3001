
import React, { forwardRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { KidsAccountToggle } from './KidsAccountToggle';
import { LanguageSelector } from './LanguageSelector';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';

interface ProfileFormProps {
  settings: ProfileSettings;
  isLoading: boolean;
  handleKidsAccountChange: (checked: boolean) => void;
  handleLanguageChange: (value: string) => void;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const ProfileForm = forwardRef<HTMLFormElement, ProfileFormProps>(({
  settings,
  isLoading,
  handleKidsAccountChange,
  handleLanguageChange,
  handleNameChange,
  handleEmailChange,
  handleSubmit
}, ref) => {
  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-netflix-gray">
            Name
          </label>
          <Input
            id="name"
            name="name"
            value={settings.name}
            onChange={handleNameChange}
            className="mt-1 block w-full"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-netflix-gray">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={settings.email}
            onChange={handleEmailChange}
            className="mt-1 block w-full"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <LanguageSelector 
            selectedLanguage={settings.language}
            onLanguageChange={handleLanguageChange}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <KidsAccountToggle 
            isKidsAccount={settings.isKidsAccount}
            onToggle={handleKidsAccountChange} 
            disabled={isLoading}
            immediate={false} // Make sure updates only happen on save
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-netflix-red hover:bg-netflix-red-dark"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
});

ProfileForm.displayName = 'ProfileForm';
