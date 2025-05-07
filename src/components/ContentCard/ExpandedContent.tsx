
import React from 'react';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { Content } from '../../data/mockData';

interface ExpandedContentProps {
  content: Content;
  onPlayClick: (e: React.MouseEvent) => void;
  onMyListClick: (e: React.MouseEvent) => void;
  onThumbsUp: (e: React.MouseEvent) => void;
  onDetailClick: (e: React.MouseEvent) => void;
}

export const ExpandedContent: React.FC<ExpandedContentProps> = ({ 
  content, 
  onPlayClick, 
  onMyListClick, 
  onThumbsUp, 
  onDetailClick 
}) => {
  // Use backdrop image if available, otherwise fallback to poster or default
  const displayImage = content.backdropUrl || content.posterUrl || DEFAULT_IMAGES.backdrop;
  
  return (
    <div className="expanded-content">
      {/* Preview image */}
      <img 
        src={displayImage}
        alt={content.title} 
        className="w-full h-[135px] object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_IMAGES.backdrop;
        }}
      />
      
      {/* Control buttons - centered on content */}
      <div className="button-controls">
        <button 
          className="play-button"
          onClick={onPlayClick}
          aria-label="Play"
        >
          <Play />
        </button>
        
        <button 
          className="control-button"
          onClick={onMyListClick}
          aria-label="Add to My List"
        >
          <Plus size={16} />
        </button>
        
        <button 
          className="control-button"
          onClick={onThumbsUp}
          aria-label="Like"
        >
          <ThumbsUp size={16} />
        </button>
        
        <button 
          className="control-button"
          onClick={onDetailClick}
          aria-label="More Info"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      {/* Content info - shown at the bottom of expanded card */}
      <div className="content-info">
        <div className="text-white text-sm font-bold mb-2 line-clamp-1">{content.title}</div>
        
        <div className="flex space-x-1 mb-2 text-xs">
          <span className="text-green-500 font-medium">{content.releaseYear}</span>
          {content.ageRating && (
            <>
              <span className="text-white/50">•</span>
              <span className="border border-white/30 px-1 text-[10px] leading-4">{content.ageRating}</span>
            </>
          )}
          {content.duration && (
            <>
              <span className="text-white/50">•</span>
              <span>{content.duration}</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 text-xs text-white/70">
          {content.genre.slice(0, 3).map((genre, index) => (
            <span key={index}>
              {genre}{index < Math.min(content.genre.length, 3) - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
