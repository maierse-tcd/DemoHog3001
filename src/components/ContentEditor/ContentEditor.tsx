
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Check, Loader2, Save, X } from 'lucide-react';
import { safeCapture } from '../../utils/posthogUtils';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { mockContent, Content, Genre } from '../../data/mockData';
import { supabase } from '../../integrations/supabase/client';
import { DetailsTab } from './DetailsTab';
import { MediaTab } from './MediaTab';
import { loadImagesFromStorage, filterUniqueImages, extractFilenameFromUrl } from '../../utils/imageUtils/urlUtils';

// Define ContentEditorProps interface
interface ContentEditorProps {
  content?: Content;
  onSave?: (content: Content) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

// Image size configurations - consistently use landscape format
export const IMAGE_SIZES = {
  poster: { width: 600, height: 900 },  // Only used when explicitly needed
  backdrop: { width: 1280, height: 720 }, // 16:9 aspect ratio
  thumbnail: { width: 480, height: 270 }  // 16:9 aspect ratio
};

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
  const [backdropUrl, setBackdropUrl] = useState(formData.backdropUrl || '');
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isDeleting, setIsDeleting] = useState(false);
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
      // Use the storage loading function to get all images recursively, matching ImageManager behavior
      const urls = await loadImagesFromStorage();
      console.log('ContentEditor - Loaded images from storage (including subfolders):', urls.length);
      
      // Apply filtering to ensure no duplicates, consistent with ImageManager
      const filteredUrls = filterUniqueImages(urls);
      console.log('ContentEditor - Filtered images:', filteredUrls.length);
      
      setAvailableImages(filteredUrls);
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
      setIsDeleting(true);
      
      // Extract the file name from the URL
      const fileName = extractFilenameFromUrl(imageUrl);
      
      if (!fileName) {
        throw new Error("Could not extract file name from URL");
      }
      
      // First delete from database
      const { error: dbError } = await supabase
        .from('content_images')
        .delete()
        .eq('image_path', fileName);
        
      if (dbError) {
        console.error("Database delete error:", dbError);
        // Continue with storage deletion
      }
      
      console.log("Deleting image from storage:", fileName);
      
      // Delete the file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileName]);
      
      if (storageError) {
        console.error("Supabase storage delete error:", storageError);
        throw storageError;
      }
      
      console.log("Image deleted successfully from both DB and storage");
      
      // Remove from the local state
      setAvailableImages(prev => prev.filter(url => url !== imageUrl));
      
      // If this was the selected backdrop, clear the selection
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
    } finally {
      setIsDeleting(false);
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
      backdropUrl: backdropUrl,
      genre: Array.from(selectedGenres)
    };
    
    console.log('Saving content with backdrop URL:', backdropUrl);
    
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
      
      // Dispatch a custom event to notify other components about the change
      window.dispatchEvent(new Event('content-updated'));
      
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
    console.log('New image uploaded:', imageUrl);
    // Add to available images list
    setAvailableImages(prev => [imageUrl, ...prev]);
    
    // Auto-select the newly uploaded image
    setBackdropUrl(imageUrl);
    updateFormData('backdropUrl', imageUrl);
  };

  const handleBackdropChange = (url: string) => {
    console.log('Backdrop URL changed to:', url);
    setBackdropUrl(url);
    updateFormData('backdropUrl', url);
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
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          
          {/* Basic Details Tab */}
          <TabsContent value="details">
            <DetailsTab 
              formData={formData}
              selectedGenres={selectedGenres}
              availableGenres={AVAILABLE_GENRES}
              onUpdateFormData={updateFormData}
              onToggleGenre={toggleGenre}
            />
          </TabsContent>
          
          {/* Media Tab */}
          <TabsContent value="media">
            <MediaTab 
              backdropUrl={backdropUrl}
              isLoadingImages={isLoadingImages}
              availableImages={availableImages}
              contentId={formData.id}
              onRefreshImages={loadAvailableImages}
              onBackdropChange={handleBackdropChange}
              onImageUploaded={handleImageUploaded}
              onImageDelete={handleDeleteImage}
              isDeleting={isDeleting}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t border-netflix-gray/20 sticky bottom-0 bg-netflix-darkgray z-10">
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
          size="lg"
          className="bg-netflix-red hover:bg-netflix-red/90"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? 'Update Content' : 'Save Content'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
