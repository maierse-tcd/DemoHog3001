
import React from 'react';
import { User } from 'lucide-react';
import { placeholderImages } from '../utils/imagePlaceholders';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface ProfileAvatarProps {
  isLoggedIn: boolean;
  avatarUrl: string;
  userName: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  isLoggedIn,
  avatarUrl,
  userName
}) => {
  // Use local placeholder image to prevent network errors
  const fallbackImage = '/placeholder.svg';
  
  // Always render the avatar, to ensure visibility of profile info
  return (
    <>
      <Avatar className="w-8 h-8 bg-[#555]">
        <AvatarImage 
          src={avatarUrl || fallbackImage}
          alt={`${userName}'s avatar`}
          onError={(e) => {
            // Fallback to local image on error
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop
            target.src = fallbackImage;
          }}
        />
        <AvatarFallback>
          <User size={16} className="text-netflix-gray" />
        </AvatarFallback>
      </Avatar>
      {userName && (
        <span className="text-sm hidden md:inline-block text-netflix-white truncate max-w-[100px]">
          {userName}
        </span>
      )}
    </>
  );
};
