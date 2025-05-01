
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ImageUploader } from './ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, Loader2, Save, X } from 'lucide-react';
import { safeCapture } from '../utils/posthogUtils';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { useToast } from '../hooks/use-toast';
import { mockContent, Content, Genre } from '../data/mockData';

interface ContentEditorProps {
  content?: Content;
  onSave?: (content: Content) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

// Available genres based on the mockData
const AVAILABLE_GENRES: Genre[] = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
];

// Default content structure for new items
const DEFAULT_CONTENT: Content = {
  id: '',
  title: '',
  description: 'No description available.',
  type: 'movie',
  posterUrl: '',
  backdropUrl: '',
  genre: ['Drama'],
  releaseYear: new Date().getFullYear().toString(),
  ageRating: 'PG-13',
  duration: '1h 30m',
  trending: false
};

export const ContentEditor = ({ content, onSave, onCancel, isEdit = false }: ContentEditorProps) => {
  const [formData, setFormData] = useState<Content>(content || {...DEFAULT_CONTENT, id: uuidv4()});
  const [selectedGenres, setSelectedGenres] = useState<Set<Genre>>(new Set(formData.genre));
  const [saving, setSaving] = useState(false);
  const [posterUrl, setPosterUrl] = useState(formData.posterUrl);
  const [backdropUrl, setBackdropUrl] = useState(formData.backdropUrl);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  
  // Helper to update form data
  const updateFormData = (field: keyof Content, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle adding/removing genres
  const toggleGenre = (genre: Genre) => {
    const updatedGenres = new Set(selectedGenres);
    if (updatedGenres.has(genre)) {
      updatedGenres.delete(genre);
    } else {
      updatedGenres.add(genre);
    }
    setSelectedGenres(updatedGenres);
    updateFormData('genre', Array.from(updatedGenres));
  };
  
  // Handle form submission
  const handleSave = () => {
    setSaving(true);
    
    // Client-side validation
    if (!formData.title) {
      toast({
        title: "Title is required",
        description: "Please enter a title for your content.",
        variant: "destructive"
      });
      setSaving(false);
      return;
    }
    
    if (selectedGenres.size === 0) {
      toast({
        title: "Genre is required",
        description: "Please select at least one genre.",
        variant: "destructive"
      });
      setSaving(false);
      return;
    }
    
    // Update images from state
    const updatedContent = {
      ...formData,
      posterUrl: posterUrl || formData.posterUrl,
      backdropUrl: backdropUrl || formData.backdropUrl,
      genre: Array.from(selectedGenres)
    };
    
    // Save to local storage for persistence
    try {
      // Load existing content
      const existingContentJson = localStorage.getItem('hogflix_content');
      let existingContent = existingContentJson ? JSON.parse(existingContentJson) : [...mockContent];
      
      // Update or add new content
      if (isEdit) {
        existingContent = existingContent.map((item: Content) => 
          item.id === updatedContent.id ? updatedContent : item
        );
      } else {
        existingContent.push(updatedContent);
      }
      
      // Save back to local storage
      localStorage.setItem('hogflix_content', JSON.stringify(existingContent));
      
      // Track in PostHog
      safeCapture(isEdit ? 'content_updated' : 'content_created', {
        contentId: updatedContent.id,
        contentType: updatedContent.type,
        title: updatedContent.title
      });
      
      // Call the onSave callback
      if (onSave) {
        onSave(updatedContent);
      }
      
      // Show success animation
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      toast({
        title: isEdit ? "Content updated" : "Content created",
        description: `"${updatedContent.title}" has been ${isEdit ? 'updated' : 'created'} successfully.`
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-netflix-darkgray border-netflix-gray/20">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Content' : 'Add New Content'}</CardTitle>
        <CardDescription>
          {isEdit 
            ? 'Update the details for this movie or series' 
            : 'Create a new movie or series to add to your catalog'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="metadata">Additional Info</TabsTrigger>
          </TabsList>
          
          {/* Basic Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter title" 
                  className="bg-black/40 border-netflix-gray/40"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Content Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'movie' | 'series') => updateFormData('type', value)}
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
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Enter a description" 
                rows={4}
                className="bg-black/40 border-netflix-gray/40"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Genres *</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
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
          </TabsContent>
          
          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Poster Image (Portrait)</Label>
                <ImageUploader 
                  contentId={formData.id}
                  imageType="poster"
                  aspectRatio="portrait"
                  onImageUploaded={(url) => {
                    setPosterUrl(url);
                    updateFormData('posterUrl', url);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Backdrop Image (Landscape)</Label>
                <ImageUploader 
                  contentId={formData.id}
                  imageType="backdrop"
                  aspectRatio="landscape"
                  onImageUploaded={(url) => {
                    setBackdropUrl(url);
                    updateFormData('backdropUrl', url);
                  }}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input 
                  id="releaseYear" 
                  value={formData.releaseYear} 
                  onChange={(e) => updateFormData('releaseYear', e.target.value)}
                  placeholder="YYYY" 
                  className="bg-black/40 border-netflix-gray/40"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ageRating">Age Rating</Label>
                <Select 
                  value={formData.ageRating} 
                  onValueChange={(value) => updateFormData('ageRating', value)}
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
                  onChange={(e) => updateFormData('duration', e.target.value)}
                  placeholder="1h 30m" 
                  className="bg-black/40 border-netflix-gray/40"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-4">
              <Switch 
                id="trending"
                checked={formData.trending}
                onCheckedChange={(checked) => updateFormData('trending', checked)}
              />
              <Label htmlFor="trending">Mark as trending content</Label>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={saving}
        >
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? 'Update' : 'Save'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
