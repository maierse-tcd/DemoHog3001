import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import { usePostHog } from '../hooks/usePostHogFeatures';
import { supabase } from '../integrations/supabase/client';
import { 
  extractFilenameFromUrl, 
  loadImagesFromDatabase,
  filterUniqueImages 
} from '../utils/imageUtils';

export const useImageManager = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const posthog = usePostHog();
  
  // Load uploaded images using optimized database-first approach
  const loadUploadedImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      // Use database-first approach with pagination for better performance
      const urls = await loadImagesFromDatabase(50, 0);
      console.log('ImageManager - Loaded images from database:', urls.length);
      
      // Filter unique images to avoid duplicates
      const filteredUrls = filterUniqueImages(urls);
      console.log('ImageManager - Filtered unique images:', filteredUrls.length);
      
      setUploadedImages(filteredUrls);
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
  }, [toast]);

  const handleDeleteImage = useCallback(async (imageUrl: string, contentList: any[]) => {
    try {
      setIsDeleting(true);
      
      // Extract the file path from the URL
      const filePath = extractFilenameFromUrl(imageUrl);
      
      if (!filePath) {
        throw new Error("Could not extract file path from URL");
      }
      
      console.log("Deleting image from storage:", filePath);
      
      // First delete the entry from the content_images table
      const { error: dbError } = await supabase
        .from('content_images')
        .delete()
        .eq('image_path', filePath);
        
      if (dbError) {
        console.error("Error deleting image from database:", dbError);
        // Continue with storage deletion even if DB delete fails
      }
      
      // Then delete the file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);
      
      if (storageError) {
        console.error("Supabase storage delete error:", storageError);
        throw storageError;
      }
      
      console.log("Image deleted successfully from both DB and storage");
      
      // Remove from the local state
      setUploadedImages(prev => prev.filter(url => url !== imageUrl));
      
      // Also check if any content was using this image and update it
      const contentToUpdate = contentList.filter(item => 
        item.posterUrl === imageUrl || item.backdropUrl === imageUrl
      );
      
      if (contentToUpdate.length > 0) {
        // Update each content item that was using this image
        for (const item of contentToUpdate) {
          // Create an updated version of the content with image URLs removed
          const updatedItem = { 
            ...item,
            posterUrl: item.posterUrl === imageUrl ? '' : item.posterUrl,
            backdropUrl: item.backdropUrl === imageUrl ? '' : item.backdropUrl
          };
          
          // Save the updated content to Supabase
          await supabase.from('content_items').update({
            poster_url: updatedItem.posterUrl,
            backdrop_url: updatedItem.backdropUrl
          }).eq('id', item.id);
        }
        
        // Notify user that content was updated
        toast({
          title: "Content updated",
          description: `Updated ${contentToUpdate.length} content items that were using the deleted image.`
        });
      }
      
      // Track in PostHog
      posthog?.capture('image_deleted', {
        fileName: filePath
      });
      
      // Show success message
      toast({
        title: "Image deleted",
        description: "The image has been removed from your storage."
      });
      
      // Dispatch a custom event to notify other components about the change
      window.dispatchEvent(new Event('content-updated'));
      
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
  }, [toast, posthog]);

  // Load uploaded images from storage on component mount
  useEffect(() => {
    loadUploadedImages();
  }, [loadUploadedImages]);

  return {
    uploadedImages,
    isLoadingImages,
    isDeleting,
    loadUploadedImages,
    handleDeleteImage
  };
};