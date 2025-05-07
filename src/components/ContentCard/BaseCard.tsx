
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
      <div className="bg-black w-full h-full absolute inset-0"></div> {/* Add solid black background */}
      <img 
        src={imageUrl}
        alt={title}
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_IMAGES.backdrop;
        }}
        className="z-10 relative w-full h-full object-cover" /* Ensure image covers the area */
      />
      
      <div className="title-overlay">
        <div className="text-white text-sm font-medium line-clamp-1">{title}</div>
      </div>
    </div>
  );
};
