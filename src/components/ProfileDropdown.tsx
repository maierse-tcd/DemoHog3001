
import { useState } from 'react';
import { ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileDropdownMenu } from './ProfileDropdownMenu';
import { useAuth } from '../hooks/useAuth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, userName, avatarUrl, userEmail, handleLogout } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
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
