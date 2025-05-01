
import { supabase } from "../integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { safeCapture } from "./posthogUtils";

// Image size configurations
export const IMAGE_SIZES = {
  poster: { width: 600, height: 900 },
  backdrop: { width: 1920, height: 1080 },
  thumbnail: { width: 480, height: 320 }
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
        
        // Draw the image with proper aspect ratio
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
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, file.type);
      };
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    reader.onerror = () => reject(new Error('File reading failed'));
  });
};

// Function to upload an image to Supabase storage
export const uploadImageToSupabase = async (
  file: File,
  imageType: 'poster' | 'backdrop' | 'thumbnail',
  contentId?: string
): Promise<string> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = contentId 
      ? `${imageType}/${contentId}/${fileName}` 
      : `${imageType}/${fileName}`;
    
    // Get target dimensions
    const { width: targetWidth, height: targetHeight } = IMAGE_SIZES[imageType];
    
    // Resize image before upload
    const resizedImage = await resizeImage(file, targetWidth, targetHeight);
    
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
    
    // Track successful upload
    safeCapture('image_uploaded', {
      imageType,
      contentId,
      size: resizedImage.size
    });
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
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
    const { error } = await supabase
      .from('content_images')
      .insert({
        content_id: contentId,
        image_path: imageUrl,
        image_type: imageType,
        width,
        height,
        original_filename: file.name,
        mime_type: file.type
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
  poster: "https://via.placeholder.com/600x900?text=No+Poster",
  backdrop: "https://via.placeholder.com/1920x1080?text=No+Backdrop",
  thumbnail: "https://via.placeholder.com/480x320?text=No+Thumbnail"
};
