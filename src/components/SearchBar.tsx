
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setSearchQuery('');
    }
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Titles, people, genres"
              className="bg-transparent text-netflix-white ml-2 pr-8 py-1 outline-none w-40 text-sm"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2"
              >
                <X size={16} className="text-netflix-gray hover:text-netflix-white" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
