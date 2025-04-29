
import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded bg-[#555] flex items-center justify-center">
          <User size={16} className="text-netflix-gray" />
        </div>
        <ChevronDown size={16} className={`text-netflix-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-netflix-gray/20 rounded py-2 shadow-lg animate-scale-in">
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Profile 1
          </div>
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Profile 2
          </div>
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Manage Profiles
          </div>
          <hr className="my-2 border-netflix-gray/20" />
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Account
          </div>
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Help Center
          </div>
          <div className="px-4 py-2 text-netflix-white text-sm hover:bg-netflix-darkgray cursor-pointer">
            Sign out
          </div>
        </div>
      )}
    </div>
  );
};
