
import { useState } from 'react';
import { Play, Info, Plus } from 'lucide-react';
import { Content } from '../data/mockData';
import { Button } from './ui/button';
import { DEFAULT_IMAGES } from '../utils/imageUtils';
import { safeCapture } from '../utils/posthog';
import { useToast } from '../hooks/use-toast';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Dialog, DialogContent } from './ui/dialog';

interface HeroSectionProps {
  content: Content;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { toast } = useToast();
  const showMyListFeature = useFeatureFlagEnabled('show_my_list_feature');
  
  // Use backdrop if available, otherwise fall back to default image
  const backdropUrl = content.backdropUrl || DEFAULT_IMAGES.backdrop;
  
  // Get video URL - use content's specific URL or default
  const videoUrl = content.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  
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
  
  // Visual-only handler for My List button (no functionality)
  const handleMyListClick = () => {
    // Track the click event without actually adding to a list
    safeCapture('my_list_button_clicked', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'hero_section'
    });
    
    toast({
      title: 'Added to My List',
      description: `"${content.title}" has been added to My List.`,
    });
  };
  
  return (
    <div className="relative h-[80vh] min-h-[600px]">
      {/* Background image or video */}
      <div className="absolute inset-0">
        {isPlaying ? (
          <div className="w-full h-full">
            <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
              <DialogContent className="bg-black border-none max-w-5xl w-[90vw] p-0">
                <div className="relative aspect-video">
                  <button 
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                    aria-label="Close video"
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
                <Play className="mr-2 h-5 w-5" fill="black" /> Play
              </Button>
              
              <Button
                variant="outline" 
                className="border-gray-400 hover:bg-white/10"
                onClick={handleMoreInfoClick}
              >
                <Info className="mr-2 h-5 w-5" /> More Info
              </Button>
              
              {/* My List button - only show when feature flag is enabled */}
              {showMyListFeature && (
                <Button
                  variant="outline" 
                  className="border-gray-400 hover:bg-white/10"
                  onClick={handleMyListClick}
                >
                  <Plus className="mr-2 h-5 w-5" /> My List
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Info Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="bg-netflix-darkgray border-netflix-darkgray text-white max-w-3xl w-[90vw] p-0">
          <div className="relative">
            <button 
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="w-full h-[30vh] relative">
              <img 
                src={backdropUrl} 
                alt={content.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-darkgray via-netflix-darkgray/60 to-transparent"></div>
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
                <Button 
                  onClick={() => {
                    setIsInfoModalOpen(false);
                    setIsPlaying(true);
                  }}
                  className="bg-white hover:bg-white/90 text-black"
                >
                  <Play className="mr-2 h-5 w-5" fill="black" /> Play
                </Button>
                
                {/* My List button - only show when feature flag is enabled */}
                {showMyListFeature && (
                  <Button
                    variant="outline" 
                    className="border-gray-400 hover:bg-white/10"
                    onClick={handleMyListClick}
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add to My List
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
