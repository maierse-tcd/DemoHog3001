import React, { useState, useEffect } from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { safeIdentify } from '../../utils/posthog';
import { usePostHog } from 'posthog-js/react';
import { supabase } from '../../integrations/supabase/client';

interface AccountSettingsProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  settings, 
  updateSettings 
}) => {
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminRateOverride, setAdminRateOverride] = useState(false);
  const posthog = usePostHog();
  
  // Load admin rate override setting from database
  useEffect(() => {
    const loadAdminOverride = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin_override')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setAdminRateOverride(profile.admin_override || false);
        }
      }
    };
    
    loadAdminOverride();
  }, []);
  
  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Get the new language setting
    const language = formData.get('language') as string;
    const languageChanged = language !== settings.language;
    
    const updatedSettings: Partial<ProfileSettings> = {
      language: language,
      playbackSettings: {
        autoplayNext: formData.get('autoplayNext') === 'on',
        autoplayPreviews: formData.get('autoplayPreviews') === 'on',
      },
      notifications: {
        email: formData.get('emailNotifications') === 'on',
      },
    };
    
    // Only update password if admin feature flag is enabled
    if (isAdmin) {
      const password = formData.get('accessPassword') as string;
      updatedSettings.accessPassword = password;
    }
    
    try {
      await updateSettings(updatedSettings);
      
      // Update PostHog with language if it changed
      if (languageChanged && settings.email) {
        console.log(`Updating PostHog with language: ${language}`);
        
        // Also update the language in the profiles table in Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ language })
            .eq('id', user.id);
            
          if (error) {
            console.error('Error updating language in database:', error);
          }
        }
        
        safeIdentify(settings.email, {
          language: language,
          is_kids_account: settings.isKidsAccount
        });
        
        // Also use direct PostHog call as backup
        if (posthog) {
          posthog.capture('language_changed', {
            previous_language: settings.language || 'English',
            new_language: language
          });
        }
      }
      
      toast({
        title: 'Settings updated',
        description: 'Your account settings have been saved',
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
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
        
        {/* Password protection settings - only visible to admins */}
        {isAdmin && (
          <div>
            <h3 className="font-medium mb-2">Site Access Protection</h3>
            <div className="space-y-2">
              <label className="text-sm text-netflix-gray">Site Access Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="accessPassword"
                  defaultValue={settings.accessPassword}
                  className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2 pr-10" 
                  placeholder="Set site access password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-netflix-gray"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-netflix-gray mt-1">
                When the access_password feature flag is enabled, this password will be required to access Hogflix.
                The password is stored securely in the database and applies to all site visitors.
              </p>
            </div>
          </div>
        )}
        
        {/* Admin rate limiting override - only visible to admins */}
        {isAdmin && (
          <div>
            <h3 className="font-medium mb-2">
              <Settings className="inline mr-2" size={16} />
              Rate Limiting Override
            </h3>
            <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
              <div>
                <span>Enable high-rate automation</span>
                <p className="text-xs text-netflix-gray mt-1">
                  When enabled, allows 1000 login/signup attempts per minute for automation scripts
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={adminRateOverride}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    setAdminRateOverride(enabled);
                    
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ admin_override: enabled })
                          .eq('id', user.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: enabled ? 'Rate override enabled' : 'Rate override disabled',
                          description: enabled 
                            ? 'High-rate automation mode is now active' 
                            : 'Normal rate limits restored'
                        });
                      }
                    } catch (error) {
                      console.error('Error updating admin override:', error);
                      setAdminRateOverride(!enabled); // Revert on error
                      toast({
                        title: 'Error',
                        description: 'Failed to update rate override setting',
                        variant: 'destructive'
                      });
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
              </label>
            </div>
          </div>
        )}
        
        <button 
          type="submit"
          className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};
