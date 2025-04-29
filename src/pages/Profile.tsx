
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Plan, SubscriptionPlan } from '../components/SubscriptionPlan';
import { toast } from '../hooks/use-toast';
import { User, Settings, CreditCard, HelpCircle } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('premium');
  
  const availablePlans: Plan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Enjoy a limited selection of movies and shows for free.',
      price: '$0/month',
      features: [
        'Limited library of content',
        'Standard definition streaming',
        'Ad-supported viewing',
        'Watch on one device at a time'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Access to all movies and shows, including premium content.',
      price: '$12.99/month',
      features: [
        'Full library access',
        'HD streaming',
        'Ad-free viewing',
        'Watch on two devices at a time',
        'Download content for offline viewing'
      ],
      recommended: true
    },
    {
      id: 'maximal',
      name: 'Max-imal Plan',
      description: 'Get everything in Premium plus exclusive content and features.',
      price: '$19.99/month',
      features: [
        'Full library access plus exclusive content',
        '4K Ultra HD streaming',
        'Ad-free viewing',
        'Watch on four devices at a time',
        'Download content for offline viewing',
        'Early access to new releases',
        'Exclusive hedgehog documentaries'
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    toast({
      title: 'Plan selection updated',
      description: `You've selected the ${availablePlans.find(plan => plan.id === planId)?.name}`,
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: 'Changes saved',
      description: `Your subscription plan has been updated to ${availablePlans.find(plan => plan.id === selectedPlanId)?.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />

      <main className="pt-24 pb-12 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-netflix-darkgray rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-netflix-gray flex items-center justify-center">
                  <User size={32} className="text-netflix-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Max Hedgehog</h2>
                  <p className="text-netflix-gray text-sm">max@hogflix.com</p>
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

          {/* Main content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray mb-1">Name</label>
                    <input type="text" defaultValue="Max Hedgehog" className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray mb-1">Email</label>
                    <input type="email" defaultValue="max@hogflix.com" className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray mb-1">Password</label>
                    <input type="password" defaultValue="********" className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2" />
                  </div>
                  <button className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
                <p className="text-netflix-gray mb-6">
                  Choose the plan that's right for you. You can always change your plan later.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {availablePlans.map(plan => (
                    <SubscriptionPlan
                      key={plan.id}
                      plan={plan}
                      selectedPlanId={selectedPlanId}
                      onSelect={handlePlanSelect}
                    />
                  ))}
                </div>
                
                <button onClick={handleSaveChanges} className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Playback Settings</h3>
                    <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
                      <span>Autoplay next episode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-netflix-gray/30">
                      <span>Autoplay previews</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Language Settings</h3>
                    <select className="w-full bg-netflix-black border border-netflix-gray rounded px-3 py-2">
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
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-netflix-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>
                  
                  <button className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="bg-netflix-darkgray rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Help Center</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      <div className="border border-netflix-gray/30 rounded-lg p-4">
                        <h4 className="font-medium">How do I change my plan?</h4>
                        <p className="text-netflix-gray mt-2">You can change your plan by going to your Subscription tab in your Profile.</p>
                      </div>
                      <div className="border border-netflix-gray/30 rounded-lg p-4">
                        <h4 className="font-medium">How do I cancel my subscription?</h4>
                        <p className="text-netflix-gray mt-2">To cancel your subscription, go to your Subscription tab and click on "Cancel Subscription".</p>
                      </div>
                      <div className="border border-netflix-gray/30 rounded-lg p-4">
                        <h4 className="font-medium">What devices can I watch on?</h4>
                        <p className="text-netflix-gray mt-2">You can watch on any device that supports a web browser, including your smart TV, game consoles, streaming media players, phones, and tablets.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Contact Support</h3>
                    <p className="text-netflix-gray mb-4">Need more help? Contact our support team.</p>
                    <button className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
