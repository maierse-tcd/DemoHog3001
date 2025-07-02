
import React from 'react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { LazyImage } from '../ui/lazy-image';
import { ImageIcon } from 'lucide-react';

interface BaseCardProps {
  title: string;
  imageUrl: string;
  onClick: (e: React.MouseEvent) => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({ title, imageUrl, onClick }) => {
  return (
    <div 
      className="base-card relative overflow-hidden rounded-xl transition-all duration-300 hover:transform hover:scale-[1.03] hover:shadow-xl"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black"></div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"></div>
      
      <LazyImage
        src={imageUrl}
        alt={title}
        fallbackSrc={DEFAULT_IMAGES.backdrop}
        placeholder={<ImageIcon className="h-8 w-8 text-muted-foreground" />}
        className="relative w-full h-full object-cover z-0" 
      />
      
      <div className="title-overlay absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black to-transparent">
        <div className="text-white text-sm font-medium line-clamp-1">{title}</div>
      </div>
    </div>
  );
};
