
import { supabase } from "../../integrations/supabase/client";

// Helper function to extract filename from a Supabase storage URL
export const extractFilenameFromUrl = (url: string): string | null => {
  try {
    const urlPath = new URL(url).pathname;
    // Extract the path after '/media/'
    const mediaPathMatch = urlPath.match(/\/media\/([^?]+)/);
    if (mediaPathMatch && mediaPathMatch[1]) {
      return decodeURIComponent(mediaPathMatch[1]);
    }
    return null;
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
};

// Function to get a public URL for the image
export const getImagePublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Helper function to filter out duplicate image URLs and mock images
export const filterUniqueImages = (urls: string[]): string[] => {
  // Create a Set for unique URLs (removing duplicates)
  const uniqueUrls = new Set<string>();
  
  // Only include URLs from our Supabase storage (containing '/media/')
  urls.forEach(url => {
    if (url.includes('/media/')) {
      uniqueUrls.add(url);
    }
  });
  
  return Array.from(uniqueUrls);
};

// Load all images from Supabase storage
export const loadImagesFromStorage = async (): Promise<string[]> => {
  try {
    console.log('Loading images from Supabase storage');
    
    // List all files in the media bucket
    const { data: imageFiles, error } = await supabase.storage
      .from('media')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
    if (error) {
      throw error;
    }
    
    if (!imageFiles || imageFiles.length === 0) {
      console.log('No images found in storage');
      return [];
    }
    
    console.log(`Found ${imageFiles.length} images in storage`);
    
    // Get public URLs for each file
    const urls = imageFiles.map(file => {
      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(file.name);
      return data.publicUrl;
    });
    
    return urls;
  } catch (error) {
    console.error("Error loading images from storage:", error);
    return [];
  }
};
