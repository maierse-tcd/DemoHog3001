
import React from 'react';
import { User, CreditCard, Settings, HelpCircle } from 'lucide-react';

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userEmail: string;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeTab,
  setActiveTab,
  userName,
  userEmail
}) => {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="bg-netflix-darkgray rounded-lg p-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-netflix-gray flex items-center justify-center">
            <User size={32} className="text-netflix-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{userName}</h2>
            <p className="text-netflix-gray text-sm">{userEmail}</p>
          </div>
        </div>

        <nav>
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full text-left px-4 py-2 rounded flex items-center space-x-2 ${activeTab === 'profile' ? 'bg-netflix-red text-white' : 'text-netflix-gray hover:text-white'}`}
              >
                <User size={18} />
                <span>Profile</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('subscription')} 
                className={`w-full text-left px-4 py-2 rounded flex items-center space-x-2 ${activeTab === 'subscription' ? 'bg-netflix-red text-white' : 'text-netflix-gray hover:text-white'}`}
              >
                <CreditCard size={18} />
                <span>Subscription</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`w-full text-left px-4 py-2 rounded flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-netflix-red text-white' : 'text-netflix-gray hover:text-white'}`}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('help')} 
                className={`w-full text-left px-4 py-2 rounded flex items-center space-x-2 ${activeTab === 'help' ? 'bg-netflix-red text-white' : 'text-netflix-gray hover:text-white'}`}
              >
                <HelpCircle size={18} />
                <span>Help</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};
