
import React from 'react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from '../../hooks/use-toast';

interface ProfileButtonsProps {
  isLoading: boolean;
  email: string;
}

export const ProfileButtons: React.FC<ProfileButtonsProps> = ({ isLoading, email }) => {
  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
  };

  return (
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
        onClick={handleResetPassword}
      >
        Reset Password
      </button>
    </div>
  );
};
