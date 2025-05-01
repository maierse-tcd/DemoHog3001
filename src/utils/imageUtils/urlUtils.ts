
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
    
    // Super strict check for Supabase storage URLs
    // 1. Must be from supabase.co domain
    if (!urlObj.hostname.includes('supabase.co')) {
      console.log('Rejected URL - not from supabase.co:', url);
      return false;
    }
    
    // 2. Must have the correct storage path
    if (!urlObj.pathname.includes('/storage/v1/object')) {
      console.log('Rejected URL - not a storage path:', url);
      return false;
    }
    
    // 3. Must be from the media bucket
    if (!urlObj.pathname.includes('/media/')) {
      console.log('Rejected URL - not from media bucket:', url);
      return false;
    }
    
    // 4. Must match our exact pattern for Supabase storage URLs
    const mediaPattern = /\/storage\/v1\/object\/(?:public|sign)\/media\/[^?]+/;
    const isValid = mediaPattern.test(urlObj.pathname);
    
    // 5. Should not be a folder
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Check if the path ends with a slash or has no extension (likely a folder)
    const isLikelyFolder = lastPart === '' || 
                          (!lastPart.includes('.') && !urlObj.search.includes('='));
    
    if (isLikelyFolder) {
      console.log('Rejected URL - appears to be a folder:', url);
      return false;
    }
    
    if (!isValid) {
      console.log('Rejected URL - does not match pattern:', url);
    }
    
    return isValid && !isLikelyFolder;
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
  
  console.log('Filtering images from array of length:', urls.length);
  
  // Filter out any non-Supabase URLs first
  const validSupabaseUrls = urls.filter(url => {
    const isValid = url && isSupabaseStorageUrl(url);
    if (!isValid && url) {
      console.log('Filtering out non-Supabase URL:', url);
    }
    return isValid;
  });
  
  console.log('Valid Supabase URLs after filtering:', validSupabaseUrls.length);
  
  // Create a Set for unique URLs (removing duplicates)
  const uniqueUrls = new Set<string>(validSupabaseUrls);
  
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
    
    console.log(`Found ${imageFiles.length} items in storage`);
    
    // Filter out folders and non-image files
    const actualImageFiles = imageFiles.filter(file => {
      // Skip directories
      if (file.id === null || file.metadata === null) {
        console.log('Skipping directory:', file.name);
        return false;
      }
      
      // Check if it's an image file by looking at metadata mimetype or extension
      const isImage = file.metadata?.mimetype?.startsWith('image/') || 
                     /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file.name);
      
      if (!isImage) {
        console.log('Skipping non-image file:', file.name);
      }
      
      return isImage;
    });
    
    console.log(`Found ${actualImageFiles.length} actual image files after filtering`);
    
    // Get public URLs for each file
    const urls = actualImageFiles.map(file => {
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
