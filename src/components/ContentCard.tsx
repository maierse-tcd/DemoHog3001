
import { useState } from 'react';
import { Content } from '../data/mockData';
import { Play, Plus, ThumbsUp, ChevronDown, X, Info } from 'lucide-react';

interface ContentCardProps {
  content: Content;
}

export const ContentCard = ({ content }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Define video URLs (including one rickroll)
  const videoUrls: Record<string, string> = {
    default: "https://www.youtube.com/embed/fPdfHUr_c_s", // PostHog video
    rickroll: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Rickroll
    product: "https://www.youtube.com/embed/gM_SeJo3E6A", // PostHog product video
  };
  
  // Select video URL - if content.id is divisible by 5, play rickroll
  const videoUrl = content.id % 5 === 0 ? videoUrls.rickroll : videoUrls.product;
  
  return (
    <>
      <div 
        className="content-card w-[180px] md:w-[240px] h-[130px] md:h-[160px] relative"
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
                <button 
                  className="p-1 bg-white rounded-full hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                >
                  <Play size={16} className="text-black" />
                </button>
                <button className="p-1 bg-netflix-darkgray/80 rounded-full hover:bg-netflix-darkgray">
                  <Plus size={16} className="text-white" />
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

      {/* Details Modal - similar to the one in HeroSection */}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
