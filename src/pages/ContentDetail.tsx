
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Skeleton } from '../components/ui/skeleton';
import { Play, Plus, ChevronLeft, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { safeCapture } from '../utils/posthog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load content details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [id, toast]);

  // Visual-only handler for My List button (no functionality)
  const handleMyListClick = () => {
    // Track the click event without actually adding to a list
    safeCapture('my_list_button_clicked', {
      contentId: content?.id,
      contentTitle: content?.title,
      location: 'content_detail'
    });
    
    toast({
      title: 'Feature not available',
      description: 'My List functionality is purely visual in this demo.',
    });
  };

  // Close modal and navigate back
  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-netflix-darkgray border-netflix-darkgray text-white max-w-4xl w-[90vw]">
          <Skeleton className="h-[50vh] w-full mb-8" />
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-32 w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!content) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-netflix-darkgray border-netflix-darkgray text-white max-w-4xl w-[90vw]">
          <div className="text-center py-8">
            <h1 className="text-netflix-red text-3xl font-bold mb-4">Content Not Found</h1>
            <p className="text-netflix-gray mb-8">The content you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-netflix-white hover:text-netflix-red"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="bg-netflix-darkgray border-netflix-darkgray text-white max-w-4xl w-[90vw] p-0 overflow-hidden">
        {/* Hero Banner */}
        <div className="relative">
          <div className="w-full h-[40vh] relative">
            {content.backdrop_url ? (
              <img 
                src={content.backdrop_url} 
                alt={content.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : content.poster_url ? (
              <img 
                src={content.poster_url} 
                alt={content.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-netflix-darkgray/50"></div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent"></div>
            
            {/* Close button */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 bg-netflix-black/80 rounded-full text-white hover:bg-netflix-black z-50"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content details */}
          <div className="p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{content.title}</h1>
            
            <div className="flex items-center space-x-4 text-sm text-netflix-gray mb-4">
              <span>{content.release_year}</span>
              {content.age_rating && <span>{content.age_rating}</span>}
              {content.duration && <span>{content.duration}</span>}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {content.genre && content.genre.map((g: string) => (
                <span 
                  key={g}
                  className="px-3 py-1 bg-[#333] text-white text-xs rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
            
            <div className="flex space-x-4 mb-6">
              <button className="bg-netflix-red hover:bg-netflix-red/90 text-white py-2 px-6 rounded flex items-center gap-2">
                <Play size={20} />
                Play
              </button>
              
              {/* Purely visual My List button with no functionality */}
              <button 
                className="bg-[#333] hover:bg-[#444] text-white py-2 px-6 rounded flex items-center gap-2"
                onClick={handleMyListClick}
              >
                <Plus size={20} />
                Add to My List
              </button>
            </div>
            
            <p className="text-netflix-white max-w-3xl">{content.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentDetail;
