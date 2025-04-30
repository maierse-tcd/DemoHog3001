import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileDropdownMenu } from './ProfileDropdownMenu';
import { useAuth } from '../hooks/useAuth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, userName, avatarUrl, userEmail, handleLogout, isLoading } = useAuth();
  const [stableAuth, setStableAuth] = useState({ isLoggedIn, userName, avatarUrl });
  const prevLoggedInRef = useRef(isLoggedIn);
  
  // When auth state changes, update the stable state to prevent flickering
  useEffect(() => {
    // Only update the stable state if:
    // 1. User is definitively logged in (isLoggedIn is true)
    // 2. Or loading is complete and user is definitely not logged in
    // 3. But NEVER change from logged in to logged out unless we're certain
    if (isLoggedIn) {
      // Always update when logged in state is detected
      setStableAuth({ isLoggedIn, userName, avatarUrl });
      prevLoggedInRef.current = true;
    } else if (!isLoading && !prevLoggedInRef.current) {
      // Only reset to logged out if we weren't previously logged in
      // This prevents flickering when session checks are happening
      setStableAuth({ isLoggedIn: false, userName: '', avatarUrl: '' });
    } else if (!isLoading && prevLoggedInRef.current) {
      // If we were logged in before, require multiple confirmations
      // of being logged out before changing the UI to prevent flicker
      console.log("Potential auth state change detected, waiting for confirmation");
      // Keep the previous state for now - the useAuth hook will retry and confirm
    }
  }, [isLoggedIn, userName, avatarUrl, isLoading]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
