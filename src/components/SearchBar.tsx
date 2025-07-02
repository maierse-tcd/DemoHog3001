
import { useState, useEffect, useRef } from 'react';
import { Search, X, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { trackEvent } from '../utils/posthog/simple';

export const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle clicks outside of search to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search content when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchContent();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const searchContent = async () => {
    try {
      setIsLoading(true);
      
      // Track search event
      trackEvent('search_performed', {
        query: query.trim(),
        query_length: query.trim().length
      });
      
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(5);
      
      if (error) {
        console.error('Error searching content:', error);
        return;
      }
      
      // Track search results
      trackEvent('search_results', {
        query: query.trim(),
        results_count: data?.length || 0
      });
      
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (id: string, title: string) => {
    // Track search result click
    trackEvent('search_result_clicked', {
      content_id: id,
      content_title: title,
      query: query.trim()
    });
    
    // Reset search
    setQuery('');
    setIsExpanded(false);
    setResults([]);
    
    // Navigate to content detail page
    navigate(`/content/${id}`);
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
      setQuery('');
      setResults([]);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={toggleSearch}
        className="text-netflix-gray hover:text-netflix-white transition-colors p-1"
      >
        <Search size={20} />
      </button>
      
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-64 md:w-80 bg-[#141414] rounded-md shadow-lg border border-netflix-gray/20 overflow-hidden z-50">
          <div className="flex items-center p-2 border-b border-netflix-gray/20">
            <Search size={16} className="text-netflix-gray" />
            <input
              id="search-input"
              type="text"
              placeholder="Search titles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full p-2 text-sm"
              autoComplete="off"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-netflix-gray hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
          
          {isLoading && (
            <div className="p-4 text-center text-netflix-gray text-sm">
              Searching...
            </div>
          )}
          
          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-netflix-gray text-sm">
              No results found
            </div>
          )}
          
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {results.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleContentClick(item.id, item.title)}
                  className="flex items-center p-2 hover:bg-netflix-gray/20 cursor-pointer transition-colors"
                >
                  {item.poster_url || item.backdrop_url ? (
                    <div className="w-12 h-16 mr-3 overflow-hidden rounded">
                      <img 
                        src={item.poster_url || item.backdrop_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-16 mr-3 bg-netflix-gray/20 flex items-center justify-center rounded">
                      <Film size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-netflix-white text-sm font-medium">{item.title}</h4>
                    <p className="text-netflix-gray text-xs">
                      {item.type === 'movie' ? 'Movie' : 'TV Show'} • {item.release_year || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
