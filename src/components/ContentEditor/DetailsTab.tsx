
import { useState, useEffect } from 'react';
import { Check, ChevronDown, Play } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Content, Genre } from '../../data/mockData';
import { GenreSelector } from './GenreSelector';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DetailsTabProps {
  content: Content;
  onChange: (content: Content) => void;
  isLoading: boolean;
  onSave: () => void;
  onPreview: () => void;
}

export const DetailsTab = ({ content, onChange, isLoading, onSave, onPreview }: DetailsTabProps) => {
  const [title, setTitle] = useState(content?.title || '');
  const [description, setDescription] = useState(content?.description || '');
  const [releaseYear, setReleaseYear] = useState(content?.releaseYear || '');
  const [ageRating, setAgeRating] = useState(content?.ageRating || '');
  const [duration, setDuration] = useState(content?.duration || '');
  const [videoUrl, setVideoUrl] = useState(content?.videoUrl || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(content?.genre || []);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setDescription(content.description || '');
      setReleaseYear(content.releaseYear || '');
      setAgeRating(content.ageRating || '');
      setDuration(content.duration || '');
      setVideoUrl(content.videoUrl || '');
      setSelectedGenres(content.genre || []);
    }
  }, [content]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...content, title: newTitle });
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onChange({ ...content, description: newDescription });
  };

  const handleReleaseYearChange = (e) => {
    const newReleaseYear = e.target.value;
    setReleaseYear(newReleaseYear);
    onChange({ ...content, releaseYear: newReleaseYear });
  };

  const handleAgeRatingChange = (e) => {
    const newAgeRating = e.target.value;
    setAgeRating(newAgeRating);
    onChange({ ...content, ageRating: newAgeRating });
  };

  const handleDurationChange = (e) => {
    const newDuration = e.target.value;
    setDuration(newDuration);
    onChange({ ...content, duration: newDuration });
  };

  const handleVideoUrlChange = (e) => {
    const newVideoUrl = e.target.value;
    setVideoUrl(newVideoUrl);
    onChange({ ...content, videoUrl: newVideoUrl });
  };

  const handleGenreChange = (newGenres) => {
    setSelectedGenres(newGenres);
    onChange({ ...content, genre: newGenres });
  };

  // Current year for release year options
  const currentYear = new Date().getFullYear();
  const yearsArray = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

  // Common age ratings
  const ratings = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"];

  return (
    <div className="space-y-6">
      {/* Title field with floating label effect */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-white/90">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={handleTitleChange}
          className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm"
          placeholder="Enter title"
        />
      </div>

      {/* Description field with expanded height */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-white/90">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          rows={4}
          className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm resize-none"
          placeholder="Enter description"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Release Year Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="releaseYear" className="text-sm font-medium text-white/90">
            Release Year
          </Label>
          <Select 
            value={releaseYear}
            onValueChange={(value) => {
              setReleaseYear(value);
              onChange({ ...content, releaseYear: value });
            }}
          >
            <SelectTrigger className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {yearsArray.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age Rating Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="ageRating" className="text-sm font-medium text-white/90">
            Age Rating
          </Label>
          <Select 
            value={ageRating}
            onValueChange={(value) => {
              setAgeRating(value);
              onChange({ ...content, ageRating: value });
            }}
          >
            <SelectTrigger className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {ratings.map((rating) => (
                <SelectItem key={rating} value={rating}>{rating}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration field */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium text-white/90">
            Duration
          </Label>
          <Input
            id="duration"
            value={duration}
            onChange={handleDurationChange}
            className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm"
            placeholder="e.g. 1h 30m"
          />
        </div>

        {/* Video URL field */}
        <div className="space-y-2">
          <Label htmlFor="videoUrl" className="text-sm font-medium text-white/90">
            Video URL
          </Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={handleVideoUrlChange}
            className="bg-gray-800/60 border-gray-700/50 text-white rounded-lg focus-within:ring-2 focus-within:ring-netflix-red/50 focus-within:border-netflix-red transition-all backdrop-blur-sm"
            placeholder="YouTube embed URL"
          />
          {videoUrl && (
            <p className="text-xs text-netflix-red mt-1 flex items-center">
              <Check className="h-3 w-3 mr-1" /> Video URL set
            </p>
          )}
        </div>
      </div>

      {/* Genres selection - modern chips design */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-white/90">
          Genres
        </Label>
        <GenreSelector selectedGenres={selectedGenres} onChange={handleGenreChange} />
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedGenres.map((genre) => (
            <Badge 
              key={genre} 
              className="bg-netflix-red hover:bg-netflix-red/90 text-white px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-700/30">
        <Button 
          variant="outline" 
          onClick={onPreview}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800/60 backdrop-blur-sm"
        >
          <Play className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          disabled={isLoading}
          onClick={onSave}
          className="bg-netflix-red hover:bg-netflix-red/90 text-white font-medium"
        >
          {isLoading ? (
            <div className="flex items-center">
              <span className="mr-2">Saving...</span>
              <Progress className="w-8 h-1" value={uploadProgress} />
            </div>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
};
