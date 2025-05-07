import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../integrations/supabase/client';
import { Skeleton } from '../components/ui/skeleton';
import { Play, Plus, ChevronLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) {
    return (
      <div className="bg-netflix-black min-h-screen">
        <Navbar />
        <div className="pt-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-[50vh] w-full mb-8" />
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-netflix-black min-h-screen">
        <Navbar />
        <div className="pt-32 px-4 md:px-8 text-center">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="relative pt-16">
        <div className="w-full h-[70vh] relative">
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
          
          {/* Content details */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{content.title}</h1>
              
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
              
              <div className="flex space-x-4 mb-8">
                <button className="bg-netflix-red hover:bg-netflix-red/90 text-white py-2 px-6 rounded flex items-center gap-2">
                  <Play size={20} />
                  Play
                </button>
                
                {/* Purely visual My List button with no functionality */}
                <button 
                  className="bg-[#333] hover:bg-[#444] text-white py-2 px-6 rounded flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add to My List
                </button>
              </div>
              
              <p className="text-netflix-white max-w-3xl">{content.description}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional content sections can be added here */}
      
      <Footer />
    </div>
  );
};

export default ContentDetail;
