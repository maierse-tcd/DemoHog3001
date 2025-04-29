
import { useState } from 'react';
import { Play, Info, X } from 'lucide-react';
import { Content } from '../data/mockData';

interface HeroSectionProps {
  content: Content;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Use a real placeholder image URL
  const heroBackdropUrl = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80";
  
  // Define video URLs (including one rickroll)
  const videoUrls: Record<string, string> = {
    default: "https://www.youtube.com/embed/fPdfHUr_c_s", // PostHog video
    rickroll: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Rickroll
    product: "https://www.youtube.com/embed/gM_SeJo3E6A", // PostHog product video
  };
  
  // Select video URL based on content ID - if ID number ends with 3, play rickroll
  const contentIdNum = parseInt(content.id);
  const videoUrl = contentIdNum % 3 === 0 ? videoUrls.rickroll : videoUrls.default;
  
  return (
    <div className="relative h-[80vh] w-full">
      {/* Background Image with placeholder */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${content.backdropUrl || heroBackdropUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-black/30" />
      </div>
      
      {/* Content */}
      <div className="absolute bottom-32 md:bottom-48 left-8 md:left-16 w-full md:w-1/2 z-10 text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{content.title}</h1>
        
        <div className="flex space-x-4 text-sm mb-6">
          <span className="text-netflix-red font-bold">{content.trending ? 'Trending' : 'New'}</span>
          <span>{content.releaseYear}</span>
          <span className="border px-1 text-xs">{content.ageRating}</span>
          <span>{content.duration}</span>
        </div>
        
        <p className="text-md md:text-lg mb-8 line-clamp-3">{content.description}</p>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowVideo(true)}
            className="btn-primary flex items-center justify-center px-6 py-2 rounded bg-white hover:bg-white/80 text-black transition-colors"
          >
            <Play size={20} className="mr-2" /> Play
          </button>
          <button 
            onClick={() => setShowDetails(true)}
            className="flex items-center justify-center px-6 py-2 rounded bg-gray-500/40 hover:bg-gray-600/40 text-white transition-colors"
          >
            <Info size={20} className="mr-2" /> More Info
          </button>
        </div>
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
              
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-netflix-gray">
                  {content.type === 'movie' ? 
                    `This ${content.genre[0]} film was released in ${content.releaseYear} and has captivated audiences with its ${content.trending ? 'trending storyline' : 'unique perspective'}.` :
                    `This ${content.genre[0]} series began in ${content.releaseYear} and continues to engage viewers with its ${content.trending ? 'viral appeal' : 'compelling narrative'}.`
                  }
                </p>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
