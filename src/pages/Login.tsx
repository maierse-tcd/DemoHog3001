
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { supabase } from '../integrations/supabase/client';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const { updateSettings } = useProfileSettings();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect to homepage
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        // Get user metadata from auth to supplement profile data
        const { data: { user } } = await supabase.auth.getUser();
        const userMetadata = user?.user_metadata || {};
        
        // Update the profile settings context with user data
        updateSettings({
          name: profileData.name || 'User',
          email: profileData.email,
          language: 'English',
          notifications: { email: true },
          // Use metadata for fields not in the profile table
          selectedPlanId: userMetadata.selectedPlanId || 'premium',
          isKidsAccount: userMetadata.isKidsAccount || false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return (
    <AuthLayout title="Sign In">
      <LoginForm fetchUserProfile={fetchUserProfile} />
      
      <div className="text-center">
        <p className="text-netflix-gray">
          New to Hogflix? <Link to="/signup" className="text-white hover:underline">Sign up now</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
