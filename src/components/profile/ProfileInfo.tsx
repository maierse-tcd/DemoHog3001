
import React, { useState } from 'react';
import { toast } from '../../hooks/use-toast';
import { ProfileSettings } from '../../contexts/ProfileSettingsContext';
import { supabase } from '../../integrations/supabase/client';

interface ProfileInfoProps {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ settings, updateSettings }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;

      // Get current user to get the ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Update user's profile in the database - using email for the query
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) throw error;

      // Store the name in PostHog for better identification
      if (window.posthog && email) {
        window.posthog.identify(email, { name });
      }

      // Update the context
      updateSettings({
        name,
        email
      });

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
