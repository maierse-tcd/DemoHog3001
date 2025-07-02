import { supabase } from "../../integrations/supabase/client";
import { listFilesRecursively } from "./supabaseStorage";

// Function to get a public URL for the image
export const getImagePublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Load images directly from storage, recursively including subfolders
export const loadImagesFromStorage = async (): Promise<string[]> => {
  try {
    console.log('Loading images directly from storage (recursive)');
    
    // Use our recursive function to list all files
    const urls = await listFilesRecursively();
    
    console.log('Loaded images from storage:', urls.length);
    return urls;
  } catch (error) {
    console.error("Error loading images from storage:", error);
    return [];
  }
};