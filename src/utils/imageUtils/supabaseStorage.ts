
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "../../integrations/supabase/client";
import { safeCapture } from "../posthogUtils";
import { resizeImage } from "./resizeUtils";
import { ImageType, IMAGE_SIZES } from "./types";

// Function to upload an image to Supabase storage
export const uploadImageToSupabase = async (
  file: File,
  imageType: ImageType = 'backdrop',
  contentId?: string
): Promise<string> => {
  try {
    // Generate a unique filename with timestamp to prevent cache issues
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const fileName = `${uuidv4()}_${timestamp}.${fileExt}`;
    const filePath = contentId 
      ? `${imageType}/${contentId}/${fileName}` 
      : `${imageType}/${fileName}`;
    
    // Get target dimensions
    const { width: targetWidth, height: targetHeight } = IMAGE_SIZES[imageType];
    
    // Console log for debugging
    console.log(`Resizing image to ${targetWidth}x${targetHeight} for ${imageType}`);
    
    // Resize image before upload
    const resizedImage = await resizeImage(file, targetWidth, targetHeight);
    
    console.log(`Uploading image to ${filePath}, size: ${resizedImage.size} bytes`);
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, resizedImage, {
        contentType: file.type,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    // Track successful upload
    safeCapture('image_uploaded', {
      imageType,
      contentId: contentId || 'none',
      size: resizedImage.size
    });
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    console.log('Image public URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Function to save image metadata to database
export const saveImageMetadata = async (
  imageUrl: string,
  imageType: ImageType,
  contentId: string,
  file: File,
  width: number,
  height: number
) => {
  try {
    // First get the current user
    const { data: userData } = await supabase.auth.getUser();
    
    // Extract just the path portion if it's a full URL
    let imagePath = imageUrl;
    if (imageUrl.startsWith('http')) {
      // Try to extract just the filename
      const urlObj = new URL(imageUrl);
      const pathname = urlObj.pathname;
      const mediaIndex = pathname.indexOf('/media/');
      if (mediaIndex >= 0) {
        imagePath = pathname.substring(mediaIndex + 7); // +7 to skip '/media/'
      }
    }
    
    console.log('Saving image metadata with path:', imagePath);
    
    if (!userData?.user?.id) {
      // Check if the user has a PostHog email address
      const userEmail = userData?.user?.email;
      if (userEmail && userEmail.endsWith('@posthog.com')) {
        // Allow PostHog users to upload without strict user ID check
        console.log('PostHog user detected, allowing upload');
        // Use a placeholder ID for PostHog users
        const placeholderId = 'posthog-' + uuidv4().slice(0, 8);
        
        const { error } = await supabase
          .from('content_images')
          .insert({
            content_id: contentId,
            image_path: imagePath,
            image_type: imageType,
            width,
            height,
            original_filename: file.name,
            mime_type: file.type,
            user_id: placeholderId
          });
          
        if (error) {
          console.error('Error saving image metadata:', error);
          throw error;
        }
        
        return true;
      } else {
        throw new Error('User not authenticated');
      }
    }
    
    const { error } = await supabase
      .from('content_images')
      .insert({
        content_id: contentId,
        image_path: imagePath,
        image_type: imageType,
        width,
        height,
        original_filename: file.name,
        mime_type: file.type,
        user_id: userData.user.id
      });
      
    if (error) {
      console.error('Error saving image metadata:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save image metadata:', error);
    throw error;
  }
};

/**
 * Recursively list all files in a storage bucket, including all subfolders
 * @param path The path to start listing from, default is empty string (root)
 * @returns An array of full paths to all files
 */
export const listFilesRecursively = async (path: string = ''): Promise<string[]> => {
  try {
    console.log(`Listing files in path: "${path}"`);
    
    // List all items in the current path
    const { data: items, error } = await supabase.storage
      .from('media')
      .list(path, {
        limit: 1000, // Higher limit to get more files
        sortBy: { column: 'name', order: 'asc' }
      });
      
    if (error) {
      console.error('Error listing files:', error, 'in path:', path);
      throw error;
    }
    
    if (!items || items.length === 0) {
      console.log(`No items found in path: "${path}"`);
      return [];
    }
    
    console.log(`Found ${items.length} items in path: "${path}"`);
    
    // Storage for all file paths
    const allFilePaths: string[] = [];
    
    // Process each item - recursively list folders, collect files
    for (const item of items) {
      // Build the full path for this item
      const itemPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id) {
        // It's a file (objects have IDs)
        console.log(`Found file: "${itemPath}"`);
        
        // Generate public URL for this file
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(itemPath);
          
        allFilePaths.push(urlData.publicUrl);
      } else {
        // It's a folder (folders don't have IDs)
        console.log(`Found folder: "${itemPath}", recursively listing...`);
        
        // Recursively list this folder
        const subFiles = await listFilesRecursively(itemPath);
        allFilePaths.push(...subFiles);
      }
    }
    
    console.log(`Total files found including subfolders: ${allFilePaths.length}`);
    return allFilePaths;
  } catch (error) {
    console.error('Error in recursive file listing:', error);
    return [];
  }
};
