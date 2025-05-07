
import React from 'react';
import { Genre } from '../../data/mockData';
import { Label } from '../ui/label';
import { Check } from 'lucide-react';

interface GenreSelectorProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

export const GenreSelector: React.FC<GenreSelectorProps> = ({ 
  selectedGenres, 
  onChange 
}) => {
  // Available genres based on the mockData
  const AVAILABLE_GENRES: Genre[] = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Technology',
    'Design', 'Arts', 'Creativity', 'Data', 'Science', 
    'Biography', 'Sports', 'Reality', 'Fashion', 'Ethics', 
    'Business', 'Finance', 'Entrepreneurship', 'Inspiration'
  ];

  const toggleGenre = (genre: Genre) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter(g => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {AVAILABLE_GENRES.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => toggleGenre(genre)}
          className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5 ${
            selectedGenres.includes(genre)
              ? 'bg-netflix-red text-white shadow-lg shadow-netflix-red/20'
              : 'bg-gray-800/60 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-700/30'
          }`}
        >
          {selectedGenres.includes(genre) && (
            <Check className="h-3 w-3" />
          )}
          {genre}
        </button>
      ))}
    </div>
  );
};
