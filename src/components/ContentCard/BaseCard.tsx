
import React from 'react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';

interface BaseCardProps {
  title: string;
  imageUrl: string;
  onClick: (e: React.MouseEvent) => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({ title, imageUrl, onClick }) => {
  return (
    <div className="base-card" onClick={onClick}>
      <img 
        src={imageUrl}
        alt={title}
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_IMAGES.backdrop;
        }}
        className="z-10 relative" /* Ensure image is above the background */
      />
      
      <div className="title-overlay">
        <div className="text-white text-sm font-medium line-clamp-1">{title}</div>
      </div>
    </div>
  );
};
