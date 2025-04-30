
import React, { useState } from 'react';
import { User } from 'lucide-react';
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
  const [imageError, setImageError] = useState(false);
  // Use local placeholder image to prevent network errors
  const fallbackImage = '/placeholder.svg';
  
  // Always render the avatar, to ensure visibility of profile info
  return (
    <>
      <Avatar className="w-8 h-8 bg-[#555]">
        <AvatarImage 
          src={imageError || !avatarUrl ? fallbackImage : avatarUrl}
          alt={`${userName}'s avatar`}
          onError={() => setImageError(true)}
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
