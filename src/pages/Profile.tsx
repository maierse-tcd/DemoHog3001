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
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const { settings, updateSettings, updateSelectedPlan } = useProfileSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
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
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          toast({
            title: "Authentication required",
            description: "Please log in to access your profile",
          });
          navigate('/login');
          return;
        }
        
        // Fetch user profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (profileData) {
          // Update context with profile data
          updateSettings({
            name: profileData.name || 'User',
            email: profileData.email,
            // Keep other settings from context
            language: settings.language,
            notifications: settings.notifications,
            playbackSettings: settings.playbackSettings,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, toast, updateSettings, settings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-netflix-red text-2xl">Loading...</div>
      </div>
    );
  }

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
