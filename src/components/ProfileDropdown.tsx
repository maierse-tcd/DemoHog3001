
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileDropdownMenu } from './ProfileDropdownMenu';
import { useStableAuth } from '../hooks/useAuth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, userName, avatarUrl, handleLogout, isLoading } = useStableAuth();
  const lastAuthStateRef = useRef<boolean | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) setIsOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Log auth state changes for debugging
  useEffect(() => {
    if (lastAuthStateRef.current !== isLoggedIn) {
      console.log(`ProfileDropdown: Auth state changed to ${isLoggedIn ? 'logged in' : 'logged out'}`);
      lastAuthStateRef.current = isLoggedIn;
    }
  }, [isLoggedIn]);

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
        {isLoggedIn ? (
          <ProfileAvatar 
            isLoggedIn={isLoggedIn}
            avatarUrl={avatarUrl}
            userName={userName || 'User'}
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
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
      />
    </div>
  );
};
