
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
  if (!isLoggedIn) {
    return null;
  }
  
  return (
    <>
      <Avatar className="w-8 h-8 bg-[#555]">
        <AvatarImage 
          src={avatarUrl || placeholderImages.userAvatar} 
          alt={`${userName}'s avatar`}
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
