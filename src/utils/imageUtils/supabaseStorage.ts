
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
            image_path: imageUrl,
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
        image_path: imageUrl,
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
