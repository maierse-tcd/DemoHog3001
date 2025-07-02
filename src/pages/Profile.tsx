import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { ProfileInfo } from '../components/profile/ProfileInfo';
import { SubscriptionSettings } from '../components/profile/SubscriptionSettings';
import { AccountSettings } from '../components/profile/AccountSettings';
import { HelpCenter } from '../components/profile/HelpCenter';
import { SubscriptionNotification } from '../components/SubscriptionNotification';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const { settings, updateSettings, updateSelectedPlan } = useProfileSettings();
  const { isLoggedIn, isLoading: authLoading } = useAuth(); // Use auth state from useAuth
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState('none');
  
  useEffect(() => {
    // Check for tab in URL query params
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'subscription', 'settings', 'help'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If auth is still loading, wait
        if (authLoading) return;
        
        // If not logged in, redirect to login
        if (!isLoggedIn) {
          toast({
            title: "Authentication required",
            description: "Please log in to access your profile",
          });
          navigate('/login');
          return;
        }
        
        // Fetch user profile data
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.error('No session found');
          navigate('/login');
          return;
        }
        
        const userEmail = data.session.user.email;
        
        if (!userEmail) {
          console.error('No email found for user');
          navigate('/login');
          return;
        }
        
        // Get user metadata which contains selectedPlanId
        const { data: userData } = await supabase.auth.getUser();
        const userMetadata = userData?.user?.user_metadata || {};
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (profileData) {
          // Safe access with proper type handling
          const displayName = profileData?.name || userEmail.split('@')[0];
          
          console.log('Profile data:', profileData);
          console.log('Language from profile:', profileData.language);
          
          // Set subscription status from profile
          setSubscriptionStatus(profileData.subscription_status || 'none');
          
          // Update context with profile data
          updateSettings({
            name: displayName,
            email: profileData?.email || userEmail,
            // Use plan ID from metadata if available, otherwise use the one from context
            selectedPlanId: userMetadata.selectedPlanId || settings.selectedPlanId,
            isKidsAccount: profileData.is_kids || false,
            // Always use language from the database, fallback to settings or default
            language: profileData.language || settings.language || 'English',
            // Keep other settings from context
            notifications: settings.notifications,
            playbackSettings: settings.playbackSettings,
          });
        }
        
        // Important: Always set loading to false after fetching
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false); // Ensure loading state is cleared even on error
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate, toast, updateSettings, settings, isLoggedIn, authLoading]);

  const handleUpgrade = () => {
    setActiveTab('subscription');
  };

  // Show loading state only while fetching profile data and auth is still pending
  if (authLoading) {
    return (
      <div className="min-h-screen bg-netflix-black">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center">
          <div className="text-netflix-red text-2xl">Loading authentication...</div>
        </div>
      </div>
    );
  }
  
  // Show loading state while fetching profile data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center">
          <div className="text-netflix-red text-2xl">Loading profile data...</div>
        </div>
      </div>
    );
  }

  // Return the profile page when data is loaded
  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />

      <main className="pt-24 pb-12 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with profile navigation */}
          <ProfileSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userName={settings.name}
            userEmail={settings.email}
          />

          {/* Main content area that changes based on active tab */}
          <div className="flex-1">
            {/* Show subscription notification if not subscribed */}
            <SubscriptionNotification 
              isSubscribed={subscriptionStatus === 'active'}
              onUpgrade={handleUpgrade}
            />
            {activeTab === 'profile' && (
              <ProfileInfo settings={settings} updateSettings={updateSettings} />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionSettings 
                selectedPlanId={settings.selectedPlanId} 
                updateSelectedPlan={updateSelectedPlan}
              />
            )}

            {activeTab === 'settings' && (
              <AccountSettings settings={settings} updateSettings={updateSettings} />
            )}

            {activeTab === 'help' && <HelpCenter />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
