
import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placeholderImages } from '../utils/imagePlaceholders';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  // In a real app, you would check if the user is logged in
  const isLoggedIn = true; // Changed to true for demo purposes

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-[#555] flex items-center justify-center">
          {/* Use the placeholder avatar image */}
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
        <ChevronDown size={16} className={`text-netflix-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-netflix-gray/20 rounded py-2 shadow-lg animate-scale-in z-50">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Profile
              </Link>
              <Link to="/profile" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Account
              </Link>
              <Link to="/profile" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Help Center
              </Link>
              <hr className="my-2 border-netflix-gray/20" />
              <Link to="/" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Sign out
              </Link>
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
              <Link to="/help" className="block px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray">
                Help Center
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};
