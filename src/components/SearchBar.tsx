
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadContentFromSupabase } from '../utils/contentUtils';
import { Content } from '../data/mockData';
import { safeCapture } from '../utils/posthog';
import { toast } from '../hooks/use-toast';

export const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load all content for search
  useEffect(() => {
    const loadAllContent = async () => {
      try {
        setIsLoading(true);
        const content = await loadContentFromSupabase();
        console.log("Loaded content for search:", content.length, "items");
        setAllContent(content);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading content for search:", error);
        toast({
          title: "Search Error",
          description: "Could not load search content. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    loadAllContent();
    
    // Listen for content updates
    window.addEventListener('content-updated', loadAllContent);
    
    return () => {
      window.removeEventListener('content-updated', loadAllContent);
    };
  }, []);

  // Handle clicks outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Improved search algorithm
      const filteredResults = allContent.filter(item => {
        // Search in title with higher priority
        const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
        
        // Search in description
        const descMatch = item.description?.toLowerCase().includes(normalizedQuery);
        
        // Search in genres
        const genreMatch = item.genre.some(genre => 
          genre.toLowerCase().includes(normalizedQuery)
        );
        
        return titleMatch || descMatch || genreMatch;
      });
      
      // Sort results by relevance (title matches first)
      filteredResults.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(normalizedQuery);
        const bTitleMatch = b.title.toLowerCase().includes(normalizedQuery);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
      });
      
      setSearchResults(filteredResults);
      
      safeCapture('search_performed', { 
        query, 
        resultCount: filteredResults.length 
      });
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (id: string) => {
    setIsExpanded(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Navigate to the content item (for now we'll go to home page)
    // In the future this could go to a specific content page
    navigate(`/`);
    
    safeCapture('search_result_selected', { contentId: id });
    
    // Show a toast notification that the content was selected
    toast({
      title: "Selected content",
      description: "Content details page coming soon!",
      variant: "default"
    });
  };

  return (
    <div className="relative flex items-center" ref={searchContainerRef}>
      <div 
        className={`flex items-center ${
          isExpanded 
            ? 'bg-black border border-netflix-white rounded-md' 
            : ''
        }`}
      >
        <button onClick={handleSearchToggle} className="p-2">
          <Search size={20} className="text-netflix-gray hover:text-netflix-white" />
        </button>
        
        {isExpanded && (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Titles, genres, keywords"
              className="bg-transparent text-netflix-white ml-2 pr-8 py-1 outline-none w-40 md:w-64 text-sm"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="absolute right-2"
              >
                <X size={16} className="text-netflix-gray hover:text-netflix-white" />
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-netflix-black border border-netflix-gray/20 rounded py-2 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-2 text-netflix-gray text-center">Loading...</div>
          ) : searchQuery.length > 0 && searchResults.length === 0 ? (
            <div className="px-4 py-2 text-netflix-gray text-center">No results found</div>
          ) : searchResults.length > 0 && (
            searchResults.map(item => (
              <div 
                key={item.id} 
                className="px-4 py-2 hover:bg-netflix-darkgray cursor-pointer flex items-center"
                onClick={() => handleSelectResult(item.id)}
              >
                <div className="w-10 h-14 bg-netflix-darkgray rounded overflow-hidden flex-shrink-0 mr-2">
                  {item.posterUrl || item.backdropUrl ? (
                    <img 
                      src={item.posterUrl || item.backdropUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Set a default placeholder image on error
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-netflix-darkgray">
                      <span className="text-netflix-gray text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-netflix-white text-sm truncate font-medium">{item.title}</p>
                  <p className="text-netflix-gray text-xs truncate">{item.genre.join(' • ')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
