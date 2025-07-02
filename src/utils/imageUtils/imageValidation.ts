import { extractFilenameFromUrl, extractBaseFilename } from './urlExtraction';

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
    const mediaPattern = /\/storage\/v1\/object\/(?:public|sign)\/media\/([^?]+)/;
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
  
  // First, create a Set to eliminate direct duplicates
  const uniqueUrls = [...new Set(urls)];
  console.log('After Set deduplication:', uniqueUrls.length);
  
  // Then filter out any non-Supabase URLs
  const validSupabaseUrls = uniqueUrls.filter(url => {
    const isValid = url && isSupabaseStorageUrl(url);
    if (!isValid && url) {
      console.log('Filtering out non-Supabase URL:', url);
    }
    return isValid;
  });
  
  console.log('Valid Supabase URLs after filtering:', validSupabaseUrls.length);
  
  // Deduplicate again based on filenames
  const seenFilenames = new Map<string, string>(); // Maps base filename to full URL
  const deduplicatedUrls: string[] = [];
  
  validSupabaseUrls.forEach(url => {
    const fullPath = extractFilenameFromUrl(url);
    if (!fullPath) return;
    
    // Get just the filename without the path
    const baseFilename = extractBaseFilename(fullPath);
    
    // Check if we've seen this filename before
    if (!seenFilenames.has(baseFilename)) {
      seenFilenames.set(baseFilename, url);
      deduplicatedUrls.push(url);
    } else {
      console.log('Filtering out duplicate filename:', baseFilename);
    }
  });
  
  console.log('Final deduplicated URLs:', deduplicatedUrls.length);
  
  return deduplicatedUrls;
};
