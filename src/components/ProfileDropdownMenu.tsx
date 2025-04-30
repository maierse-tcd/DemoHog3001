
import React from 'react';
import { Link } from 'react-router-dom';
import { AuthState } from '../hooks/useAuth';

interface ProfileDropdownMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  handleLogout: () => Promise<void>;
}

export const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  isOpen,
  isLoggedIn,
  handleLogout
}) => {
  if (!isOpen) return null;
  
  return (
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
  );
};
