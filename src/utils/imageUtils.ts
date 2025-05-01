
import { supabase } from "../integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { safeCapture } from "./posthogUtils";

// Image size configurations - consistently use landscape format
export const IMAGE_SIZES = {
  poster: { width: 600, height: 900 },  // Only used when explicitly needed
  backdrop: { width: 1280, height: 720 }, // 16:9 aspect ratio
  thumbnail: { width: 480, height: 270 }  // 16:9 aspect ratio
};

// Function to resize an image client-side before upload
export const resizeImage = async (
  file: File, 
  targetWidth: number, 
  targetHeight: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // For landscape images (preferred), maintain aspect ratio and center crop
        const aspectRatio = img.width / img.height;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        // Center crop to fit target dimensions while maintaining aspect ratio
        if (aspectRatio > targetWidth / targetHeight) {
          // Image is wider than target aspect ratio
          drawWidth = targetHeight * aspectRatio;
          offsetX = -(drawWidth - targetWidth) / 2;
        } else {
          // Image is taller than target aspect ratio
          drawHeight = targetWidth / aspectRatio;
          offsetY = -(drawHeight - targetHeight) / 2;
        }
        
        // Draw with the calculated dimensions and offsets
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to blob with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, file.type, 0.9); // Higher quality (0.9)
      };
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    reader.onerror = () => reject(new Error('File reading failed'));
  });
};

// Function to upload an image to Supabase storage
export const uploadImageToSupabase = async (
  file: File,
  imageType: 'poster' | 'backdrop' | 'thumbnail' = 'backdrop',
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

// Helper function to extract filename from a Supabase storage URL
export const extractFilenameFromUrl = (url: string): string | null => {
  try {
    const urlPath = new URL(url).pathname;
    // Extract the path after '/media/'
    const mediaPathMatch = urlPath.match(/\/media\/(.+)/);
    if (mediaPathMatch && mediaPathMatch[1]) {
      return mediaPathMatch[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
};

// Function to save image metadata to database
export const saveImageMetadata = async (
  imageUrl: string,
  imageType: 'poster' | 'backdrop' | 'thumbnail',
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

// Function to get a public URL for the image
export const getImagePublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Default placeholder images when no image is available
export const DEFAULT_IMAGES = {
  poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600&h=900",
  backdrop: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1280&h=720",
  thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=480&h=270"
};
