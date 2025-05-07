
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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="title" className="text-sm font-semibold text-white">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={handleTitleChange}
          className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red"
          placeholder="Enter title"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="description" className="text-sm font-semibold text-white">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          rows={3}
          className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red resize-none"
          placeholder="Enter description"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="releaseYear" className="text-sm font-semibold text-white">
            Release Year
          </Label>
          <Input
            id="releaseYear"
            value={releaseYear}
            onChange={handleReleaseYearChange}
            className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red"
            placeholder="e.g. 2023"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="ageRating" className="text-sm font-semibold text-white">
            Age Rating
          </Label>
          <Input
            id="ageRating"
            value={ageRating}
            onChange={handleAgeRatingChange}
            className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red"
            placeholder="e.g. PG-13"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="duration" className="text-sm font-semibold text-white">
            Duration
          </Label>
          <Input
            id="duration"
            value={duration}
            onChange={handleDurationChange}
            className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red"
            placeholder="e.g. 1h 30m"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="videoUrl" className="text-sm font-semibold text-white">
            Video URL
          </Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={handleVideoUrlChange}
            className="bg-gray-800 border-gray-700 text-white focus:ring-netflix-red focus:border-netflix-red"
            placeholder="YouTube embed URL"
          />
          {videoUrl && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-netflix-red">✓</span> Video URL set
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-white">
          Genres
        </Label>
        <GenreSelector selectedGenres={selectedGenres} onChange={handleGenreChange} />
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedGenres.map((genre) => (
            <Badge key={genre} className="bg-netflix-red/80 hover:bg-netflix-red text-white">{genre}</Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-700">
        <Button 
          variant="outline" 
          onClick={onPreview}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
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
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
};
