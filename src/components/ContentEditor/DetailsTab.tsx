
import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Content } from '../../data/mockData';
import { GenreSelector } from './GenreSelector';
import { Genre } from '../../data/mockData';

interface DetailsTabProps {
  formData: Content;
  selectedGenres: Set<Genre>;
  availableGenres: Genre[];
  onUpdateFormData: (field: keyof Content, value: any) => void;
  onToggleGenre: (genre: Genre) => void;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ 
  formData,
  selectedGenres,
  availableGenres,
  onUpdateFormData,
  onToggleGenre
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={(e) => onUpdateFormData('title', e.target.value)}
            placeholder="Enter title" 
            className="bg-black/40 border-netflix-gray/40"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Content Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: 'movie' | 'series') => onUpdateFormData('type', value)}
          >
            <SelectTrigger className="bg-black/40 border-netflix-gray/40">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="series">TV Series</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => onUpdateFormData('description', e.target.value)}
          placeholder="Enter a description" 
          rows={4}
          className="bg-black/40 border-netflix-gray/40"
        />
      </div>
      
      <GenreSelector
        selectedGenres={selectedGenres}
        availableGenres={availableGenres}
        onToggleGenre={onToggleGenre}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="releaseYear">Release Year</Label>
          <Input 
            id="releaseYear" 
            value={formData.releaseYear} 
            onChange={(e) => onUpdateFormData('releaseYear', e.target.value)}
            placeholder="YYYY" 
            className="bg-black/40 border-netflix-gray/40"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ageRating">Age Rating</Label>
          <Select 
            value={formData.ageRating} 
            onValueChange={(value) => onUpdateFormData('ageRating', value)}
          >
            <SelectTrigger className="bg-black/40 border-netflix-gray/40">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="G">G</SelectItem>
              <SelectItem value="PG">PG</SelectItem>
              <SelectItem value="PG-13">PG-13</SelectItem>
              <SelectItem value="R">R</SelectItem>
              <SelectItem value="NC-17">NC-17</SelectItem>
              <SelectItem value="TV-Y">TV-Y</SelectItem>
              <SelectItem value="TV-G">TV-G</SelectItem>
              <SelectItem value="TV-PG">TV-PG</SelectItem>
              <SelectItem value="TV-14">TV-14</SelectItem>
              <SelectItem value="TV-MA">TV-MA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input 
            id="duration" 
            value={formData.duration} 
            onChange={(e) => onUpdateFormData('duration', e.target.value)}
            placeholder="1h 30m" 
            className="bg-black/40 border-netflix-gray/40"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 pt-4">
        <Switch 
          id="trending"
          checked={formData.trending}
          onCheckedChange={(checked) => onUpdateFormData('trending', checked)}
        />
        <Label htmlFor="trending">Mark as trending content</Label>
      </div>
    </div>
  );
};
