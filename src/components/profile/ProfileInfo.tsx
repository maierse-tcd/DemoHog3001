
import React from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';

interface ProfileInfoProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ settings, updateSettings }) => {
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    updateSettings({
      name,
      email
    });

    toast({
      title: 'Profile updated',
      description: 'Your profile information has been saved',
    });
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
            className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" 
          />
        </div>
        <button 
          type="submit" 
          className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};
