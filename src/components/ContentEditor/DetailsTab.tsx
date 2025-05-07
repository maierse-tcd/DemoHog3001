
import { useState, useEffect } from 'react';
import { Check, ChevronDown, Play } from 'lucide-react';
import { GenreSelector } from './GenreSelector';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Content, Genre } from '../../data/mockData';

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
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white">
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
            value={title}
            onChange={handleTitleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={3}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="releaseYear" className="block text-sm font-medium text-white">
            Release Year
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="releaseYear"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
              value={releaseYear}
              onChange={handleReleaseYearChange}
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="ageRating" className="block text-sm font-medium text-white">
            Age Rating
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="ageRating"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
              value={ageRating}
              onChange={handleAgeRatingChange}
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="duration" className="block text-sm font-medium text-white">
            Duration
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="duration"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
              value={duration}
              onChange={handleDurationChange}
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="videoUrl" className="block text-sm font-medium text-white">
            Video URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="videoUrl"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
              value={videoUrl}
              onChange={handleVideoUrlChange}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white">
          Genres
        </label>
        <div className="mt-1">
          <GenreSelector selectedGenres={selectedGenres} onChange={handleGenreChange} />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onPreview}>
          Preview
        </Button>
        <Button
          disabled={isLoading}
          onClick={onSave}
        >
          {isLoading ? (
            <>
              Saving...
              <Progress className="w-5 h-5 ml-2" value={uploadProgress} />
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
};
