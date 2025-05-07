
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface ProfileAvatarProps {
  isLoggedIn: boolean;
  avatarUrl?: string;
  userName: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  isLoggedIn,
  avatarUrl,
  userName
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Get first name if there's a space in the username
  const firstName = userName?.includes(' ') ? userName.split(' ')[0] : userName;
  
  // Show first initial of first name as fallback
  const userInitial = firstName?.charAt(0)?.toUpperCase() || 'U';
  
  return (
    <>
      <Avatar className="w-8 h-8 bg-netflix-red">
        {avatarUrl && !imageError ? (
          <AvatarImage 
            src={avatarUrl}
            alt={`${userName}'s avatar`}
            onError={() => setImageError(true)}
          />
        ) : (
          <AvatarFallback className="bg-netflix-darkgray text-netflix-white">
            {userInitial}
          </AvatarFallback>
        )}
      </Avatar>
      {userName && (
        <span className="text-sm hidden md:inline-block text-netflix-white truncate max-w-[100px]">
          {userName}
        </span>
      )}
    </>
  );
};
