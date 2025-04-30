
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
  const sessionCheckCountRef = useRef(0);
  
  // When auth state changes, update the stable state to prevent flickering
  useEffect(() => {
    // Only update the stable state if:
    // 1. User is definitively logged in (isLoggedIn is true)
    // 2. Or we're certain user is logged out (after multiple checks)
    if (isLoggedIn) {
      // Always update when logged in state is detected
      setStableAuth({ isLoggedIn, userName, avatarUrl });
      prevLoggedInRef.current = true;
      sessionCheckCountRef.current = 0; // Reset counter when logged in
    } else if (!isLoading && prevLoggedInRef.current) {
      // If we were previously logged in but now appear logged out,
      // we need multiple confirmations to prevent flickering
      sessionCheckCountRef.current += 1;
      
      // Only update UI after receiving multiple logged-out signals
      if (sessionCheckCountRef.current >= 3) {
        console.log("Multiple confirmations of logout received, updating UI");
        setStableAuth({ isLoggedIn: false, userName: '', avatarUrl: '' });
        prevLoggedInRef.current = false;
        sessionCheckCountRef.current = 0;
      } else {
        console.log(`Potential logout detected (${sessionCheckCountRef.current}/3), waiting for confirmation`);
      }
    } else if (!isLoading && !isLoggedIn && !prevLoggedInRef.current) {
      // If we were already logged out and still are, just update
      setStableAuth({ isLoggedIn: false, userName: '', avatarUrl: '' });
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
