
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ImageUploader } from './ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, Loader2, Save, X, RefreshCcw, ImageIcon, Trash2 } from 'lucide-react';
import { safeCapture } from '../utils/posthogUtils';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { useToast } from '../hooks/use-toast';
import { mockContent, Content, Genre } from '../data/mockData';
import { supabase } from '../integrations/supabase/client';
import { DEFAULT_IMAGES } from '../utils/imageUtils';

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
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Technology',
  'Design', 'Arts', 'Creativity', 'Data', 'Science', 
  'Biography', 'Sports', 'Reality', 'Fashion', 'Ethics', 
  'Business', 'Finance', 'Entrepreneurship', 'Inspiration'
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
  const [saved, setSaved] = useState(false);
  const [posterUrl, setPosterUrl] = useState(formData.posterUrl || '');
  const [backdropUrl, setBackdropUrl] = useState(formData.backdropUrl || '');
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const { toast } = useToast();
  
  // Load available images on component mount
  useEffect(() => {
    loadAvailableImages();
  }, []);
  
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
  
  const loadAvailableImages = async () => {
    setIsLoadingImages(true);
    try {
      const { data: imageFiles, error } = await supabase.storage
        .from('media')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
        
      if (error) {
        throw error;
      }
      
      if (imageFiles) {
        const urls = imageFiles.map(file => {
          const { data } = supabase.storage
            .from('media')
            .getPublicUrl(file.name);
          return data.publicUrl;
        });
        
        setAvailableImages(urls);
      }
    } catch (error) {
      console.error("Error loading images:", error);
      toast({
        title: "Failed to load images",
        description: "There was a problem loading your uploaded images.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      // Extract the file name from the URL
      const fileName = imageUrl.split('/').pop();
      
      if (!fileName) {
        throw new Error("Could not extract file name from URL");
      }
      
      // Delete the file from Supabase storage
      const { error } = await supabase.storage
        .from('media')
        .remove([fileName]);
      
      if (error) {
        throw error;
      }
      
      // Remove from the local state
      setAvailableImages(prev => prev.filter(url => url !== imageUrl));
      
      // If this was the selected poster or backdrop, clear the selection
      if (posterUrl === imageUrl) {
        setPosterUrl('');
        updateFormData('posterUrl', '');
      }
      
      if (backdropUrl === imageUrl) {
        setBackdropUrl('');
        updateFormData('backdropUrl', '');
      }
      
      // Show success message
      toast({
        title: "Image deleted",
        description: "The image has been removed from your storage."
      });
      
      // Track in PostHog
      safeCapture('image_deleted', {
        fileName
      });
      
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Failed to delete image",
        description: "There was a problem removing the image. Please try again.",
        variant: "destructive"
      });
    }
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
      posterUrl: posterUrl,
      backdropUrl: backdropUrl,
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
  
  const handleImageUploaded = (imageUrl: string) => {
    // Add to available images list
    setAvailableImages(prev => [imageUrl, ...prev]);
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
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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
          
          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Images</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAvailableImages}
                disabled={isLoadingImages}
              >
                <RefreshCcw className={`h-4 w-4 mr-1 ${isLoadingImages ? 'animate-spin' : ''}`} />
                Refresh Images
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Poster Image Section */}
              <div className="space-y-4 border p-4 rounded-md border-netflix-gray/20">
                <Label className="text-lg">Poster Image</Label>
                
                <div className="flex items-start space-x-4">
                  {/* Selected poster preview */}
                  <div className="relative aspect-[2/3] w-40">
                    {posterUrl ? (
                      <div className="relative h-full">
                        <img 
                          src={posterUrl} 
                          alt="Selected Poster"
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGES.poster;
                          }}
                        />
                        <button
                          onClick={() => {
                            setPosterUrl('');
                            updateFormData('posterUrl', '');
                          }}
                          className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-black/40 flex items-center justify-center rounded-md">
                        <ImageIcon className="h-8 w-8 text-netflix-gray" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload section */}
                  <div className="flex-1">
                    <Label className="block mb-2">Upload New Image</Label>
                    <ImageUploader 
                      contentId={formData.id}
                      imageType="poster"
                      aspectRatio="portrait"
                      onImageUploaded={(url) => {
                        setPosterUrl(url);
                        updateFormData('posterUrl', url);
                        handleImageUploaded(url);
                      }}
                    />
                  </div>
                </div>
                
                {/* Gallery select - simplified */}
                <div>
                  <Label className="block mb-2">Select From Existing Images</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {isLoadingImages ? (
                      <div className="col-span-3 flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-netflix-gray" />
                      </div>
                    ) : availableImages.length > 0 ? (
                      availableImages.map((url, index) => (
                        <div 
                          key={`poster-${index}`}
                          className={`aspect-[2/3] cursor-pointer relative group ${
                            posterUrl === url ? 'ring-2 ring-netflix-red' : ''
                          }`}
                        >
                          <img 
                            src={url} 
                            alt={`Available ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                            onClick={() => {
                              setPosterUrl(url);
                              updateFormData('posterUrl', url);
                            }}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_IMAGES.poster;
                            }}
                          />
                          {posterUrl === url && (
                            <div className="absolute top-1 right-1 bg-netflix-red rounded-full p-1">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                          
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(url);
                            }}
                            className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            style={{ display: posterUrl === url ? 'none' : 'block' }}
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4 text-netflix-gray">
                        No images available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Backdrop Image Section */}
              <div className="space-y-4 border p-4 rounded-md border-netflix-gray/20">
                <Label className="text-lg">Backdrop Image</Label>
                
                <div className="flex items-start space-x-4">
                  {/* Selected backdrop preview */}
                  <div className="relative aspect-video w-64">
                    {backdropUrl ? (
                      <div className="relative h-full">
                        <img 
                          src={backdropUrl} 
                          alt="Selected Backdrop"
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                          }}
                        />
                        <button
                          onClick={() => {
                            setBackdropUrl('');
                            updateFormData('backdropUrl', '');
                          }}
                          className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-black/40 flex items-center justify-center rounded-md">
                        <ImageIcon className="h-8 w-8 text-netflix-gray" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload section */}
                  <div className="flex-1">
                    <Label className="block mb-2">Upload New Image</Label>
                    <ImageUploader 
                      contentId={formData.id}
                      imageType="backdrop"
                      aspectRatio="landscape"
                      onImageUploaded={(url) => {
                        setBackdropUrl(url);
                        updateFormData('backdropUrl', url);
                        handleImageUploaded(url);
                      }}
                    />
                  </div>
                </div>
                
                {/* Gallery select - simplified */}
                <div>
                  <Label className="block mb-2">Select From Existing Images</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {isLoadingImages ? (
                      <div className="col-span-3 flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-netflix-gray" />
                      </div>
                    ) : availableImages.length > 0 ? (
                      availableImages.map((url, index) => (
                        <div 
                          key={`backdrop-${index}`}
                          className={`aspect-video cursor-pointer relative group ${
                            backdropUrl === url ? 'ring-2 ring-netflix-red' : ''
                          }`}
                        >
                          <img 
                            src={url} 
                            alt={`Available ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                            onClick={() => {
                              setBackdropUrl(url);
                              updateFormData('backdropUrl', url);
                            }}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                            }}
                          />
                          {backdropUrl === url && (
                            <div className="absolute top-1 right-1 bg-netflix-red rounded-full p-1">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                          
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(url);
                            }}
                            className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            style={{ display: backdropUrl === url ? 'none' : 'block' }}
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4 text-netflix-gray">
                        No images available
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
