
import { supabase } from "../../integrations/supabase/client";

// Helper function to extract filename from a Supabase storage URL
export const extractFilenameFromUrl = (url: string): string | null => {
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Get the pathname part which contains the bucket and file path
    const pathname = urlObj.pathname;
    
    // Look for the pattern /storage/v1/object/public/media/{filename}
    // or /storage/v1/object/sign/media/{filename} in the URL
    const mediaPattern = /\/storage\/v1\/object\/(?:public|sign)\/media\/([^?]+)/;
    const match = pathname.match(mediaPattern);
    
    if (match && match[1]) {
      // Return the filename part
      return decodeURIComponent(match[1]);
    }
    
    // If no match was found with the specific pattern, try a more general approach
    // for cases where the URL format might be different
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'media') {
      return decodeURIComponent(lastPart);
    }
    
    console.warn('Could not extract filename from URL:', url);
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

// Helper function to check if a URL is from Supabase storage
export const isSupabaseStorageUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    
    // Check if the URL contains 'supabase' and storage path patterns
    const isSupabaseURL = urlObj.hostname.includes('supabase.co');
    const isStoragePath = urlObj.pathname.includes('/storage/v1/object');
    const isMediaPath = urlObj.pathname.includes('/media/');

    return isSupabaseURL && isStoragePath && isMediaPath;
  } catch (error) {
    console.error('Error checking if URL is from Supabase storage:', error);
    return false;
  }
};

// Helper function to filter out duplicate image URLs and only keep Supabase storage URLs
export const filterUniqueImages = (urls: string[]): string[] => {
  if (!urls || !Array.isArray(urls)) {
    console.warn('Invalid URLs provided to filterUniqueImages:', urls);
    return [];
  }
  
  // Create a Set for unique URLs (removing duplicates)
  const uniqueUrls = new Set<string>();
  
  // Only include URLs from our Supabase storage
  urls.forEach(url => {
    if (url && isSupabaseStorageUrl(url)) {
      uniqueUrls.add(url);
    }
  });
  
  // Convert Set back to array
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
      console.error('Error loading images from storage:', error);
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
      
      console.log(`Generated URL for ${file.name}:`, data.publicUrl);
      return data.publicUrl;
    });
    
    return urls;
  } catch (error) {
    console.error("Error loading images from storage:", error);
    return [];
  }
};
