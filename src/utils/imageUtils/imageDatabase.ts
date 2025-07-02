import { supabase } from "../../integrations/supabase/client";
import { getCachedImageUrl } from './imageCache';

// Load images from the content_images database table with caching
export const loadImagesFromDatabase = async (limit: number = 50, offset: number = 0): Promise<string[]> => {
  try {
    console.log('Loading images from content_images database table with pagination');
    
    const { data: images, error } = await supabase
      .from('content_images')
      .select('image_path, id')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching images from database:", error);
      throw error;
    }
    
    if (!images || images.length === 0) {
      console.log('No images found in database');
      return [];
    }
    
    console.log(`Found ${images.length} images in database`);
    
    // Convert DB records to image URLs with caching
    const imageUrls = images.map(image => {
      let imageUrl: string;
      
      // CRITICAL FIX: Check if image_path is already a full URL
      if (image.image_path.startsWith('http')) {
        imageUrl = image.image_path;
      } else {
        // If it's a relative path, generate the public URL with caching
        imageUrl = getCachedImageUrl(image.image_path, (path) => {
          const { data } = supabase.storage
            .from('media')
            .getPublicUrl(path);
          return data.publicUrl;
        });
      }
      
      return imageUrl;
    });
    
    console.log('Generated image URLs:', imageUrls.length);
    return imageUrls;
  } catch (error) {
    console.error("Error loading images from database:", error);
    return [];
  }
};