
import React, { useState } from 'react';
import { Content } from '../data/mockData';
import { Play, Plus, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { safeCapture } from '../utils/posthog';
import { Dialog, DialogContent } from './ui/dialog';

interface ContentPreviewProps {
  content: Content;
  onClose: () => void;
}

export const ContentPreview = ({ content, onClose }: ContentPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  
  // Get video URL - use content's specific URL or default
  const videoUrl = content.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';

  // Visual-only handler for My List button (no functionality)
  const handleMyListClick = () => {
    // Track the click event without actually adding to a list
    safeCapture('my_list_button_clicked', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'content_preview'
    });
    
    toast({
      title: 'Feature not available',
      description: 'My List functionality is purely visual in this demo.',
    });
  };
  
  return (
    <>
      <div className="relative rounded-lg overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full z-50 hover:bg-black transition"
        >
          <X size={20} />
        </button>
        
        <div className="aspect-video w-full">
          {isPlaying ? (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={content.title}
            />
          ) : (
            <div className="relative w-full h-full">
              <img 
                src={content.backdropUrl || content.posterUrl}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            </div>
          )}
        </div>
        
        {!isPlaying && (
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">{content.title}</h3>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-green-500">{content.releaseYear}</span>
              <span className="text-gray-400">•</span>
              <span className="border border-gray-500 px-1 text-sm">{content.ageRating}</span>
              <span className="text-gray-400">•</span>
              <span>{content.duration}</span>
            </div>
            
            <p className="text-gray-300 mb-6 line-clamp-3">{content.description}</p>
            
            <div className="flex space-x-3">
              <button 
                className="bg-white hover:bg-white/90 text-black py-2 px-6 rounded-md flex items-center transition-colors"
                onClick={() => setIsPlaying(true)}
              >
                <Play className="mr-2 h-5 w-5" /> Play
              </button>
              
              <button 
                className="border border-gray-400 hover:bg-white/10 text-white py-2 px-6 rounded-md flex items-center transition-colors"
                onClick={handleMyListClick}
              >
                <Plus className="mr-2 h-5 w-5" /> My List
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Video Dialog for fullscreen view */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="bg-black border-none max-w-5xl w-[90vw] p-0">
          <div className="relative aspect-video">
            <button 
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/70 text-white rounded-full hover:bg-black"
            >
              <X size={24} />
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
    </>
  );
};
