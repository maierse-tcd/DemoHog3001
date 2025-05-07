
import React from 'react';
import { Genre } from '../../data/mockData';
import { Label } from '../ui/label';

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
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedGenres.includes(genre)
              ? 'bg-netflix-red text-white'
              : 'bg-netflix-gray/20 text-netflix-gray hover:bg-netflix-gray/30'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};
