
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
