
import { useState, useEffect } from 'react';
import { ChevronDown, User, LogIn } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { placeholderImages } from '../utils/imagePlaceholders';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { settings, updateSettings } = useProfileSettings();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const loggedIn = !!session;
        setIsLoggedIn(loggedIn);
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
          
          // Track user identification in PostHog when session changes
          if (window.posthog && event === 'SIGNED_IN') {
            window.posthog.identify(session.user.id, {
              email: session.user.email
            });
          }
        } else {
          setUserName('Guest');
          setAvatarUrl('');
          
          // Reset PostHog identification when logged out
          if (window.posthog && event === 'SIGNED_OUT') {
            window.posthog.reset();
          }
        }
      }
    );
    
    // Check for existing session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      
      if (data.session?.user) {
        fetchUserProfile(data.session.user.id);
        
        // Identify user in PostHog on initial load if they're logged in
        if (window.posthog) {
          window.posthog.identify(data.session.user.id, {
            email: data.session.user.email
          });
        }
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add this effect to update the username when settings change
  useEffect(() => {
    if (settings?.name) {
      setUserName(settings.name);
    }
  }, [settings]);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        setUserName(profileData.name || 'User');
        setAvatarUrl(profileData.avatar_url || '');
        
        // Update the profile settings with user data
        updateSettings({
          name: profileData.name || 'User',
          email: profileData.email,
          selectedPlanId: settings?.selectedPlanId,
          language: settings?.language || 'English',
          notifications: settings?.notifications || { email: true },
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any user-specific settings from context
      updateSettings({
        name: 'Guest',
        email: '',
      });
      
      // Track logout in PostHog
      if (window.posthog) {
        window.posthog.capture('user_logout');
        window.posthog.reset(); // Clear user identification after logout
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      console.log('Analytics Event: Logout');
      
      setIsOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        {isLoggedIn ? (
          <>
            <div className="w-8 h-8 rounded overflow-hidden bg-[#555] flex items-center justify-center">
              <img 
                src={avatarUrl || placeholderImages.userAvatar} 
                alt="User avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.classList.add('hidden');
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <User size={16} className="text-netflix-gray hidden" />
            </div>
            {userName && (
              <span className="text-sm hidden md:inline-block text-netflix-white truncate max-w-[100px]">
                {userName}
              </span>
            )}
          </>
        ) : (
          <>
            <LogIn size={16} className="text-netflix-white" />
            <span className="text-sm hidden md:inline-block text-netflix-white">
              Sign In
            </span>
          </>
        )}
        <ChevronDown size={16} className={`text-netflix-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-netflix-gray/20 rounded py-2 shadow-lg animate-scale-in z-50">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Profile
              </Link>
              <Link to="/profile?tab=help" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Help Center
              </Link>
              <hr className="my-2 border-netflix-gray/20" />
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Sign In
              </Link>
              <Link to="/signup" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Sign Up
              </Link>
              <hr className="my-2 border-netflix-gray/20" />
              <Link to="/profile?tab=help" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Help Center
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};
