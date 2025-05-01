
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Plus, Check } from 'lucide-react';
import { Content } from '../data/mockData';
import { Button } from './ui/button';
import { getRandomVideo } from '../utils/videoUtils';
import { DEFAULT_IMAGES } from '../utils/imageUtils';
import { safeCapture } from '../utils/posthogUtils';

interface HeroSectionProps {
  content: Content;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddedToList, setIsAddedToList] = useState(false);
  const navigate = useNavigate();

  // Use backdrop if available, otherwise fall back to default image
  const backdropUrl = content.backdropUrl || DEFAULT_IMAGES.backdrop;
  
  const handlePlayClick = () => {
    setIsPlaying(true);
    
    // Track video play in PostHog
    safeCapture('hero_play_clicked', {
      contentId: content.id,
      contentTitle: content.title
    });
  };
  
  const handleMoreInfoClick = () => {
    setIsInfoModalOpen(true);
    
    // Track info modal open in PostHog
    safeCapture('hero_info_clicked', {
      contentId: content.id,
      contentTitle: content.title
    });
  };
  
  const handleMyListClick = () => {
    setIsAddedToList(!isAddedToList);
    
    // Track list action in PostHog
    safeCapture(isAddedToList ? 'remove_from_list' : 'add_to_list', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'hero'
    });
  };
  
  return (
    <div className="relative h-[80vh] min-h-[600px]">
      {/* Background image or video */}
      <div className="absolute inset-0">
        {isPlaying ? (
          <div className="w-full h-full">
            <iframe 
              src={getRandomVideo()}
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title={content.title}
            />
            <button 
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
              onClick={() => setIsPlaying(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <img 
              src={backdropUrl} 
              alt={content.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGES.backdrop;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-black/30" />
          </>
        )}
      </div>
      
      {/* Content */}
      {!isPlaying && (
        <div className="relative z-10 h-full flex flex-col justify-end px-4 md:px-8 lg:px-16 pb-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{content.title}</h1>
            <p className="text-sm md:text-base text-netflix-gray mb-6 line-clamp-3">{content.description}</p>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                className="bg-white hover:bg-white/90 text-black font-medium px-8"
                onClick={handlePlayClick}
              >
                <Play className="mr-2 h-5 w-5" /> Play
              </Button>
              
              <Button
                variant="outline" 
                className="border-gray-400 hover:bg-white/10"
                onClick={handleMoreInfoClick}
              >
                <Info className="mr-2 h-5 w-5" /> More Info
              </Button>
              
              <Button
                variant="outline" 
                className="border-gray-400 hover:bg-white/10"
                onClick={handleMyListClick}
              >
                {isAddedToList ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Added
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" /> My List
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-netflix-darkgray rounded-lg max-w-3xl w-full">
            <button 
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-netflix-red"
            >
              Close
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
                <Button 
                  onClick={() => {
                    setIsInfoModalOpen(false);
                    setIsPlaying(true);
                  }}
                  className="bg-white hover:bg-white/90 text-black"
                >
                  <Play className="mr-2 h-5 w-5" /> Play
                </Button>
                <Button
                  variant="outline" 
                  className="border-gray-400 hover:bg-white/10"
                  onClick={handleMyListClick}
                >
                  {isAddedToList ? (
                    <>
                      <Check className="mr-2 h-5 w-5" /> Added to List
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> Add to My List
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
