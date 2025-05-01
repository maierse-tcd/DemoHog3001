
import React from 'react';
import { Genre } from '../../data/mockData';
import { Label } from '../ui/label';

interface GenreSelectorProps {
  selectedGenres: Set<Genre>;
  availableGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
}

export const GenreSelector: React.FC<GenreSelectorProps> = ({ 
  selectedGenres, 
  availableGenres, 
  onToggleGenre 
}) => {
  return (
    <div className="space-y-2">
      <Label>Genres *</Label>
      <div className="flex flex-wrap gap-2 pt-1">
        {availableGenres.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => onToggleGenre(genre)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedGenres.has(genre)
                ? 'bg-netflix-red text-white'
                : 'bg-netflix-gray/20 text-netflix-gray hover:bg-netflix-gray/30'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};
