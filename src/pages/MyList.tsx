
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { Content } from '../data/mockData';
import { loadContentFromSupabase } from '../utils/contentUtils';
import { useMyList } from '../utils/posthog/myList';
import { toast } from '../hooks/use-toast';
import { safeCapture } from '../utils/posthog';

const MyList = () => {
  const [myListContent, setMyListContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { myList, isLoading: isMyListLoading } = useMyList();
  
  // Load content for My List
  useEffect(() => {
    const loadMyListContent = async () => {
      if (isMyListLoading) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        if (myList.length === 0) {
          setMyListContent([]);
          setIsLoading(false);
          return;
        }
        
        // Load all content from Supabase
        const allContent = await loadContentFromSupabase();
        console.log('MyList: Loaded all content, count:', allContent.length);
        console.log('MyList: My list IDs:', myList);
        
        // Filter for items in My List
        const myContent = allContent.filter(item => myList.includes(item.id));
        console.log('MyList: Filtered content for my list, count:', myContent.length);
        setMyListContent(myContent);
        
        // Track page view
        safeCapture('page_view', { 
          page: 'my_list',
          item_count: myContent.length 
        });
      } catch (error) {
        console.error("Error loading My List content:", error);
        setError("There was a problem loading your saved content. Please try again later.");
        toast({
          title: "Error loading My List",
          description: "There was a problem loading your saved content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMyListContent();
    
    // Listen for My List updates
    window.addEventListener('my-list-updated', loadMyListContent);
    // Listen for content updates
    window.addEventListener('content-updated', loadMyListContent);
    
    return () => {
      window.removeEventListener('my-list-updated', loadMyListContent);
      window.removeEventListener('content-updated', loadMyListContent);
    };
  }, [myList, isMyListLoading]);
  
  // Group content by type (movies and series)
  const movies = myListContent.filter(item => item.type === 'movie');
  const series = myListContent.filter(item => item.type === 'series');
  
  const isContentLoading = isLoading || isMyListLoading;
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-left">My List</h1>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-md mb-6">
              <p className="text-white">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}
          
          {isContentLoading ? (
            <div className="text-netflix-gray text-xl text-center py-12">Loading your list...</div>
          ) : myListContent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-netflix-gray text-xl">Your list is empty.</p>
              <p className="text-netflix-gray mt-2">
                Add movies and shows to your list to watch them later.
              </p>
            </div>
          ) : (
            <>
              {movies.length > 0 && (
                <ContentRow title="Movies" contentList={movies} />
              )}
              
              {series.length > 0 && (
                <ContentRow title="TV Shows" contentList={series} />
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyList;
