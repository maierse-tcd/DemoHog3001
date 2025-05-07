
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Content } from '../data/mockData';
import { Play, Plus, ThumbsUp, ChevronDown, X, Info } from 'lucide-react';
import { getRandomVideo } from '../utils/videoUtils';
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
  const [showDetails, setShowDetails] = useState(false);
  const [videoUrl] = useState(getRandomVideo());
  const { toast } = useToast();
  
  // Use backdrop image if available, otherwise fallback to poster, then default image
  const displayImage = content.backdropUrl || content.posterUrl || DEFAULT_IMAGES.backdrop;
  
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
      title: 'Feature not available',
      description: 'My List functionality is purely visual in this demo.',
    });
  };

  return (
    <>
      <div className="content-card">
        <div className="card-container">
          {/* Base card - always visible */}
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
              <div className="text-white text-sm font-medium line-clamp-1">{content.title}</div>
            </div>
          </div>
          
          {/* Expanded content - shown on hover */}
          <div className="expanded-content">
            {/* Preview image */}
            <Link to={`/content/${content.id}`}>
              <img 
                src={displayImage}
                alt={content.title} 
                className="w-full h-[135px] md:h-[135px] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGES.backdrop;
                }}
              />
            </Link>
            
            {/* Control buttons */}
            <div className="button-controls">
              <button 
                className="control-button play-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                  safeCapture('content_play_clicked', { 
                    contentId: content.id,
                    contentTitle: content.title
                  });
                }}
              >
                <Play size={16} />
              </button>
              
              <button 
                className="control-button"
                onClick={handleMyListClick}
              >
                <Plus size={16} />
              </button>
              
              <button 
                className="control-button"
              >
                <ThumbsUp size={16} />
              </button>
              
              <div className="flex-grow"></div>
              
              <button 
                className="control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowDetails(true);
                  safeCapture('content_details_opened', { 
                    contentId: content.id,
                    contentTitle: content.title
                  });
                }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            
            {/* Content info */}
            <div className="p-3">
              <div className="text-white text-sm font-medium mb-2 line-clamp-1">{content.title}</div>
              
              <div className="flex space-x-1 mb-2 text-xs">
                <span className="text-green-500 font-medium">{content.releaseYear}</span>
                <span className="text-white/50">•</span>
                <span className="border border-white/30 px-1 text-[10px] leading-4">{content.ageRating}</span>
                <span className="text-white/50">•</span>
                <span>{content.duration}</span>
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
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="bg-black border-none max-w-4xl w-[90vw] p-0">
          <div className="relative aspect-video">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/70 text-white rounded-full hover:bg-black"
            >
              <X size={20} />
            </button>
            <iframe 
              src={videoUrl}
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title={content.title}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-netflix-darkgray border-netflix-darkgray text-white max-w-3xl w-[90vw]">
          <div className="relative">
            <div className="w-full h-[30vh] relative">
              {content.backdropUrl ? (
                <img 
                  src={content.backdropUrl} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <img 
                  src={content.posterUrl || DEFAULT_IMAGES.backdrop} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-darkgray via-netflix-darkgray/70 to-transparent"></div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm bg-netflix-red px-2 py-1 rounded">{content.releaseYear}</span>
                <span className="text-sm border border-netflix-gray px-2 py-1 rounded">{content.ageRating}</span>
                <span className="text-sm border border-netflix-gray px-2 py-1 rounded">{content.duration}</span>
                {content.trending && (
                  <span className="text-sm bg-netflix-gray/30 px-2 py-1 rounded">Trending</span>
                )}
              </div>
              
              <p className="text-netflix-gray mb-4">{content.description}</p>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {content.genre.map((genreName) => (
                    <span key={genreName} className="text-sm bg-netflix-gray/20 px-2 py-1 rounded">
                      {genreName}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-4">
                <button 
                  onClick={() => {
                    setShowDetails(false);
                    setShowVideo(true);
                  }}
                  className="bg-white hover:bg-white/90 text-black py-2 px-6 rounded flex items-center gap-2 transition-colors"
                >
                  <Play size={20} />
                  Play
                </button>
                
                {/* Purely visual My List button with no functionality */}
                <button 
                  className="bg-[#333] hover:bg-[#444] text-white py-2 px-6 rounded flex items-center gap-2 transition-colors"
                  onClick={handleMyListClick}
                >
                  <Plus size={20} />
                  Add to My List
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
