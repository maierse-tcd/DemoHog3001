
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockContent } from '../data/mockData';

export const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockContent>([]);
  const navigate = useNavigate();

  const handleSearchToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 1) {
      const filteredResults = mockContent.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.genre.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filteredResults);
      console.log('Analytics Event: Search', { query, resultCount: filteredResults.length });
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (id: string) => {
    setIsExpanded(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/content/${id}`);
    console.log('Analytics Event: Search Result Selected', { contentId: id });
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
        <button onClick={handleSearchToggle}>
          <Search size={20} className="text-netflix-gray hover:text-netflix-white" />
        </button>
        
        {isExpanded && (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Titles, hedgehogs, genres"
              className="bg-transparent text-netflix-white ml-2 pr-8 py-1 outline-none w-40 text-sm"
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
      {isExpanded && searchResults.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-black border border-netflix-gray/20 rounded py-2 max-h-96 overflow-y-auto z-50">
          {searchResults.map(item => (
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
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-netflix-white text-sm truncate font-medium">{item.title}</p>
                <p className="text-netflix-gray text-xs truncate">{item.genre.join(' • ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
