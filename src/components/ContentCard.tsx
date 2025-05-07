import { useState, useEffect } from 'react';
import { Content } from '../data/mockData';
import { Play, Plus, ThumbsUp, ChevronDown, X, Info, Check } from 'lucide-react';
import { getRandomVideo } from '../utils/videoUtils';
import { DEFAULT_IMAGES } from '../utils/imageUtils';
import { safeCapture } from '../utils/posthog';
import { useMyList, isInMyList } from '../utils/posthog/myList';

interface ContentCardProps {
  content: Content;
}

export const ContentCard = ({ content }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [videoUrl] = useState(getRandomVideo());
  const [isInList, setIsInList] = useState(false);
  const { addToList, removeFromList } = useMyList();
  
  // Check if content is in My List (visual only)
  useEffect(() => {
    const checkMyList = async () => {
      const inList = await isInMyList(content.id);
      setIsInList(inList);
    };
    
    checkMyList();
    
    // Listen for my list updates
    const handleMyListUpdate = () => checkMyList();
    window.addEventListener('my-list-updated', handleMyListUpdate);
    
    return () => {
      window.removeEventListener('my-list-updated', handleMyListUpdate);
    };
  }, [content.id]);
  
  // Use backdrop image if available, otherwise fallback to poster, then default image
  const displayImage = content.backdropUrl || content.posterUrl || DEFAULT_IMAGES.backdrop;

  const handleMyListToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInList) {
      await removeFromList(content.id);
    } else {
      await addToList(content.id);
    }
    
    // Track the action
    safeCapture(isInList ? 'remove_from_list' : 'add_to_list', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'content_card'
    });
  };
  
  return (
    <>
      <div 
        className="content-card w-[180px] md:w-[240px] h-[130px] md:h-[160px] relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={displayImage}
          alt={content.title}
          className="w-full h-full object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_IMAGES.backdrop;
          }}
        />
        
        {/* Always visible title overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 rounded-b-md">
          <div className="text-white text-sm font-medium line-clamp-1">{content.title}</div>
        </div>
        
        {isHovered && (
          <div className="absolute inset-0 bg-black/70 rounded-md p-3 flex flex-col justify-between animate-fade-in z-10">
            <div className="text-white text-sm font-medium line-clamp-1">{content.title}</div>
            
            <div>
              <div className="flex space-x-1 mb-2">
                {content.genre.slice(0, 2).map((genre, index) => (
                  <span key={index} className="text-xs text-netflix-white/80">{genre}{index < Math.min(content.genre.length, 2) - 1 ? ' •' : ''}</span>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="p-1 bg-white rounded-full hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                    safeCapture('content_play_clicked', { 
                      contentId: content.id,
                      contentTitle: content.title
                    });
                  }}
                >
                  <Play size={16} className="text-black" />
                </button>
                <button 
                  className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray"
                  onClick={handleMyListToggle}
                >
                  {isInList ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <Plus size={16} className="text-white" />
                  )}
                </button>
                <button className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray">
                  <ThumbsUp size={16} className="text-white" />
                </button>
                <div className="flex-grow"></div>
                <button 
                  className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                    safeCapture('content_details_opened', { 
                      contentId: content.id,
                      contentTitle: content.title
                    });
                  }}
                >
                  <ChevronDown size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-white hover:text-netflix-red"
            >
              <X size={24} />
            </button>
            <div className="aspect-video">
              <iframe 
                src={videoUrl}
                className="w-full h-full" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                title={content.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-netflix-darkgray rounded-lg max-w-2xl w-full">
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 text-white hover:text-netflix-red"
            >
              <X size={24} />
            </button>
            
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
                  className="btn-primary flex items-center justify-center px-6 py-2 rounded bg-white hover:bg-white/80 text-black transition-colors"
                >
                  <Play size={20} className="mr-2" /> Play
                </button>
                
                <button 
                  onClick={handleMyListToggle}
                  className="flex items-center justify-center px-6 py-2 rounded border border-white/30 hover:bg-white/10 text-white transition-colors"
                >
                  {isInList ? (
                    <>
                      <Check size={20} className="mr-2" /> Remove from My List
                    </>
                  ) : (
                    <>
                      <Plus size={20} className="mr-2" /> Add to My List
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
