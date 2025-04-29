
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { ProfileInfo } from '../components/profile/ProfileInfo';
import { SubscriptionSettings } from '../components/profile/SubscriptionSettings';
import { AccountSettings } from '../components/profile/AccountSettings';
import { HelpCenter } from '../components/profile/HelpCenter';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const { settings, updateSettings, updateSelectedPlan } = useProfileSettings();

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
