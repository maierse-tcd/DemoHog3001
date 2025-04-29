
import React from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';

interface AccountSettingsProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  settings, 
  updateSettings 
}) => {
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    updateSettings({
      language: formData.get('language') as string,
      playbackSettings: {
        autoplayNext: formData.get('autoplayNext') === 'on',
        autoplayPreviews: formData.get('autoplayPreviews') === 'on',
      },
      notifications: {
        email: formData.get('emailNotifications') === 'on',
      },
    });

    toast({
      title: 'Settings updated',
      description: 'Your account settings have been saved',
    });
  };

  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
      <form onSubmit={handleSettingsSave} className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Playback Settings</h3>
          <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
            <span>Autoplay next episode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="autoplayNext"
                className="sr-only peer" 
                defaultChecked={settings.playbackSettings.autoplayNext} 
              />
              <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
            <span>Autoplay previews</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="autoplayPreviews"
                className="sr-only peer" 
                defaultChecked={settings.playbackSettings.autoplayPreviews} 
              />
              <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
            </label>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Language Settings</h3>
          <select 
            name="language"
            defaultValue={settings.language}
            className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Notifications</h3>
          <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
            <span>Email Notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="emailNotifications"
                className="sr-only peer" 
                defaultChecked={settings.notifications.email} 
              />
              <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
            </label>
          </div>
        </div>
        
        <button 
          type="submit"
          className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
