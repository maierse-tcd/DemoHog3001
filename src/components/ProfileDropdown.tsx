
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileDropdownMenu } from './ProfileDropdownMenu';
import { useAuth } from '../hooks/useAuth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, userName, avatarUrl, handleLogout, isLoading } = useAuth();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) setIsOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="w-8 h-8 bg-[#333] rounded-full"></div>
          <div className="w-16 h-4 bg-[#333] rounded hidden md:block"></div>
          <ChevronDown size={16} className="text-netflix-white" />
        </div>
      </div>
    );
  }

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
