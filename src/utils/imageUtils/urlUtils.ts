
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

// Recursive function to list all files in a bucket, including subdirectories
async function listFilesRecursive(path: string = ''): Promise<string[]> {
  console.log(`Listing files in path: ${path || 'root'}`);
  
  // List all items at the current path
  const { data: items, error } = await supabase.storage
    .from('media')
    .list(path, {
      sortBy: { column: 'name', order: 'asc' }
    });
    
  if (error) {
    console.error(`Error listing files in ${path}:`, error);
    throw error;
  }
  
  if (!items || items.length === 0) {
    console.log(`No items found in path: ${path || 'root'}`);
    return [];
  }
  
  console.log(`Found ${items.length} items in ${path || 'root'}`);
  
  // Initialize an array to store all file URLs
  let allFiles: string[] = [];
  
  // Process each item
  for (const item of items) {
    // If it's a folder (no id means it's a folder in Supabase storage)
    if (!item.id) {
      console.log(`Found folder: ${item.name}`);
      const folderPath = path ? `${path}/${item.name}` : item.name;
      // Recursively list files in this folder
      const nestedFiles = await listFilesRecursive(folderPath);
      allFiles = [...allFiles, ...nestedFiles];
    } 
    // If it's a file and appears to be an image
    else {
      const isImage = item.metadata?.mimetype?.startsWith('image/') || 
                     /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(item.name);
      
      if (isImage) {
        const filePath = path ? `${path}/${item.name}` : item.name;
        console.log(`Found image: ${filePath}`);
        
        // Get the public URL for this file
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
        
        allFiles.push(data.publicUrl);
      } else {
        console.log(`Skipping non-image file: ${item.name}`);
      }
    }
  }
  
  return allFiles;
}

// Load all images from Supabase storage (including subdirectories)
export const loadImagesFromStorage = async (): Promise<string[]> => {
  try {
    console.log('Loading images from Supabase storage (recursive)');
    
    // Use the recursive function to list all files
    const imageUrls = await listFilesRecursive();
    
    console.log(`Found ${imageUrls.length} total image files after recursive search`);
    
    return imageUrls;
  } catch (error) {
    console.error("Error loading images from storage:", error);
    return [];
  }
};
