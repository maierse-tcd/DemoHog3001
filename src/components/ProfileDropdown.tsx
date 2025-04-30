
import { useState, useEffect } from 'react';
import { ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileDropdownMenu } from './ProfileDropdownMenu';
import { useAuth } from '../hooks/useAuth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, userName, avatarUrl, userEmail, handleLogout, isLoading } = useAuth();
  const [stableAuth, setStableAuth] = useState({ isLoggedIn, userName, avatarUrl });
  
  // When auth state changes, update the stable state to prevent flickering
  useEffect(() => {
    // Only update the stable state if:
    // 1. User is definitively logged in (isLoggedIn is true)
    // 2. Or loading is complete and user is definitely not logged in
    if (isLoggedIn) {
      setStableAuth({ isLoggedIn, userName, avatarUrl });
    } else if (!isLoading) {
      setStableAuth({ isLoggedIn: false, userName: '', avatarUrl: '' });
    }
  }, [isLoggedIn, userName, avatarUrl, isLoading]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) setIsOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent the outside click handler from firing
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {stableAuth.isLoggedIn ? (
          <ProfileAvatar 
            isLoggedIn={stableAuth.isLoggedIn}
            avatarUrl={stableAuth.avatarUrl}
            userName={stableAuth.userName || 'User'}
          />
        ) : (
          <>
            <LogIn size={16} className="text-netflix-white" />
            <span className="text-sm hidden md:inline-block text-netflix-white">
              Sign In
            </span>
          </>
        )}
        <ChevronDown 
          size={16} 
          className={`text-netflix-white transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <ProfileDropdownMenu 
        isOpen={isOpen}
        isLoggedIn={stableAuth.isLoggedIn}
        handleLogout={handleLogout}
      />
    </div>
  );
};
