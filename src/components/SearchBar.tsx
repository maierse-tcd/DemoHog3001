
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadContentFromSupabase } from '../utils/contentUtils';
import { Content } from '../data/mockData';
import { safeCapture } from '../utils/posthog';

export const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load all content for search
  useEffect(() => {
    const loadAllContent = async () => {
      try {
        setIsLoading(true);
        const content = await loadContentFromSupabase();
        setAllContent(content);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading content for search:", error);
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

  const handleSearchToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 1) {
      const normalizedQuery = query.toLowerCase().trim();
      const filteredResults = allContent.filter(item => 
        item.title.toLowerCase().includes(normalizedQuery) || 
        (item.description?.toLowerCase() || '').includes(normalizedQuery) ||
        item.genre.some(genre => genre.toLowerCase().includes(normalizedQuery))
      );
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
    
    // Since we don't have a dedicated content page, we'll direct to Home for now
    // In the future, this could go to a specific content page: navigate(`/content/${id}`);
    navigate(`/`);
    
    safeCapture('search_result_selected', { contentId: id });
  };

  return (
    <div className="relative flex items-center">
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
        <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-black border border-netflix-gray/20 rounded py-2 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-2 text-netflix-gray text-center">Loading...</div>
          ) : searchQuery.length > 1 && searchResults.length === 0 ? (
            <div className="px-4 py-2 text-netflix-gray text-center">No results found</div>
          ) : searchResults.length > 0 && (
            searchResults.map(item => (
              <div 
                key={item.id} 
                className="px-4 py-2 hover:bg-netflix-darkgray cursor-pointer flex items-center"
                onClick={() => handleSelectResult(item.id)}
              >
                <div className="w-10 h-14 bg-netflix-darkgray rounded overflow-hidden flex-shrink-0 mr-2">
                  <img 
                    src={item.posterUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
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
