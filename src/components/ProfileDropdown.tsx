
import { useState, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { placeholderImages } from '../utils/imagePlaceholders';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { useToast } from '../hooks/use-toast';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSettings } = useProfileSettings();
  
  useEffect(() => {
    // Check if user is logged in
    const loginStatus = localStorage.getItem('hogflixIsLoggedIn') === 'true';
    setIsLoggedIn(loginStatus);
    
    // Get username if available
    if (loginStatus) {
      const userData = localStorage.getItem('hogflixUser');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'User');
      } else {
        setUserName(settings?.name || 'User');
      }
    }
  }, [settings?.name]);
  
  const handleLogout = () => {
    localStorage.setItem('hogflixIsLoggedIn', 'false');
    
    // Clear any user-specific settings from context
    updateSettings({
      name: 'Guest',
      email: '',
    });
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    
    console.log('Analytics Event: Logout');
    
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-[#555] flex items-center justify-center">
          <img 
            src={placeholderImages.userAvatar} 
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
        {isLoggedIn && userName && (
          <span className="text-sm hidden md:inline-block text-netflix-white truncate max-w-[100px]">
            {userName}
          </span>
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
