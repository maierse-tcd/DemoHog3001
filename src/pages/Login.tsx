
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
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("User already logged in, redirecting to homepage");
          // User is already logged in, redirect to homepage
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile after login:", userId);
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || '';
      
      // Fetch profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      if (profileData) {
        console.log("Profile data fetched:", profileData);
        
        // Safe access with null checks
        const displayName = profileData.name || userEmail.split('@')[0];
        
        // Update the profile settings context with user data
        updateSettings({
          name: displayName,
          email: userEmail,
          language: 'English',
          notifications: { email: true },
          selectedPlanId: user?.user_metadata?.selectedPlanId || 'premium',
          isKidsAccount: user?.user_metadata?.isKidsAccount || false
        });
        
        console.log("Profile settings updated after login");
        
        // Make sure PostHog has the correct identity
        if (window.posthog && userEmail) {
          window.posthog.identify(userEmail, {
            name: displayName,
            id: userId
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (isCheckingSession) {
    return (
      <AuthLayout title="Checking session...">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-netflix-red"></div>
        </div>
      </AuthLayout>
    );
  }

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
