
import { useState } from 'react';
import { Content } from '../data/mockData';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';

interface ContentCardProps {
  content: Content;
}

export const ContentCard = ({ content }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="content-card w-[180px] md:w-[240px] h-[130px] md:h-[160px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={content.posterUrl}
        alt={content.title}
        className="w-full h-full object-cover rounded-md"
      />
      
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 rounded-md p-3 flex flex-col justify-between animate-fade-in">
          <div className="text-white text-sm font-medium line-clamp-1">{content.title}</div>
          
          <div>
            <div className="flex space-x-1 mb-2">
              {content.genre.slice(0, 2).map((genre, index) => (
                <span key={index} className="text-xs text-netflix-white/80">{genre}{index < Math.min(content.genre.length, 2) - 1 ? ' •' : ''}</span>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button className="p-1 bg-white rounded-full hover:bg-white/90">
                <Play size={16} className="text-black" />
              </button>
              <button className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray">
                <Plus size={16} className="text-white" />
              </button>
              <button className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray">
                <ThumbsUp size={16} className="text-white" />
              </button>
              <div className="flex-grow"></div>
              <button className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray">
                <ChevronDown size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
