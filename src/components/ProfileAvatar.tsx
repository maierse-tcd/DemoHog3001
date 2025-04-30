
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
  
  // Show user initials as fallback when no image
  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';
  
  return (
    <>
      <Avatar className="w-8 h-8 bg-netflix-red">
        <AvatarImage 
          src={imageError || !avatarUrl ? fallbackImage : avatarUrl}
          alt={`${userName}'s avatar`}
          onError={() => setImageError(true)}
        />
        <AvatarFallback className="bg-netflix-darkgray text-netflix-white">
          {userInitial}
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
