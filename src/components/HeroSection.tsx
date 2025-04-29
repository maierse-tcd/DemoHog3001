
import { Play, Info } from 'lucide-react';
import { Content } from '../data/mockData';

interface HeroSectionProps {
  content: Content;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  // Use a real placeholder image URL
  const heroBackdropUrl = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80";
  
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
          <button className="btn-primary flex items-center justify-center px-6 py-2 rounded bg-white hover:bg-white/80 text-black transition-colors">
            <Play size={20} className="mr-2" /> Play
          </button>
          <button className="flex items-center justify-center px-6 py-2 rounded bg-gray-500/40 hover:bg-gray-600/40 text-white transition-colors">
            <Info size={20} className="mr-2" /> More Info
          </button>
        </div>
      </div>
    </div>
  );
};
