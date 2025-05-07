
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Content } from '../data/mockData';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import { DEFAULT_IMAGES } from '../utils/imageUtils';
import { safeCapture } from '../utils/posthog';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent } from './ui/dialog';
import './ContentCard.css';

interface ContentCardProps {
  content: Content;
}

export const ContentCard = ({ content }: ContentCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const { toast } = useToast();
  
  // Use backdrop image if available, otherwise fallback to poster, then default image
  const displayImage = content.backdropUrl || content.posterUrl || DEFAULT_IMAGES.backdrop;
  
  // Get video URL - use content's specific URL or default
  const videoUrl = content.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  
  // Visual-only handler for My List button (no functionality)
  const handleMyListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Track the click event without actually adding to a list
    safeCapture('my_list_button_clicked', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'content_card'
    });
    
    toast({
      title: 'Added to My List',
      description: `"${content.title}" has been added to My List.`
    });
  };
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowVideo(true);
    
    safeCapture('content_play_clicked', { 
      contentId: content.id,
      contentTitle: content.title
    });
  };
  
  const handleThumbsUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast({
      title: "Liked",
      description: "We'll recommend more like this."
    });
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    // Don't need to prevent default or stop propagation here,
    // as we want the Link to navigate to the content detail page
    safeCapture('content_details_opened', { 
      contentId: content.id,
      contentTitle: content.title
    });
  };

  return (
    <>
      <div className="content-card">
        <div className="card-container">
          {/* Base card - always visible */}
          <Link to={`/content/${content.id}`} onClick={handleDetailClick}>
            <div className="base-card">
              <img 
                src={displayImage}
                alt={content.title}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                }}
              />
              {/* Title overlay on base card */}
              <div className="title-overlay">
                <div className="title-text text-white text-sm font-medium line-clamp-1">{content.title}</div>
              </div>
            </div>
            
            {/* Expanded content - shown on hover */}
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
              
              {/* Control buttons */}
              <div className="button-controls">
                <button 
                  className="control-button play-button"
                  onClick={handlePlayClick}
                  aria-label="Play"
                >
                  <Play size={16} />
                </button>
                
                <button 
                  className="control-button"
                  onClick={handleMyListClick}
                  aria-label="Add to My List"
                >
                  <Plus size={16} />
                </button>
                
                <button 
                  className="control-button"
                  onClick={handleThumbsUp}
                  aria-label="Like"
                >
                  <ThumbsUp size={16} />
                </button>
                
                <div className="flex-grow"></div>
                
                <button 
                  className="control-button"
                  onClick={handleDetailClick}
                  aria-label="More Info"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              
              {/* Content info */}
              <div className="content-info p-3">
                <div className="text-white text-sm font-medium mb-2 line-clamp-1">{content.title}</div>
                
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
          </Link>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="bg-black border-none max-w-4xl w-[90vw] p-0">
          <div className="relative aspect-video">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/70 text-white rounded-full hover:bg-black"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <iframe 
              src={`${videoUrl}?autoplay=1`}
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title={content.title}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
