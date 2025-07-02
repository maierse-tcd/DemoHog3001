
import { supabase } from '../../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { safeCapture } from '../posthogUtils';

// Function to recursively list all files in storage
export const listFilesRecursively = async (prefix = ''): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .list(prefix);

    if (error) {
      console.error("Supabase storage list error:", error);
      throw error;
    }

    if (!data) return [];

    let urls: string[] = [];

    // Process files in current directory
    const files = data.filter(item => item.metadata && item.metadata.mimetype && !item.metadata.mimetype.includes('directory'));
    
    for (const file of files) {
      const filePath = prefix ? `${prefix}/${file.name}` : file.name;
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      urls.push(urlData.publicUrl);
    }

    // Recursively process subdirectories
    const folders = data.filter(item => item.metadata && item.metadata.mimetype && item.metadata.mimetype.includes('directory'));
    for (const folder of folders) {
      const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
      const subUrls = await listFilesRecursively(folderPath);
      urls = [...urls, ...subUrls];
    }

    return urls;
  } catch (error) {
    console.error("Error listing files recursively:", error);
    return [];
  }
};

// Function to compress and resize image
const compressImage = async (file: File, quality: number = 0.6, maxWidth: number = 1920): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/webp', // Convert to WebP for better compression
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original if compression fails
        }
      }, 'image/webp', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Function to upload an image to Supabase storage
export const uploadImageToSupabase = async (
  file: File, 
  imageType: string, 
  contentId?: string
): Promise<string> => {
  // Compress image before upload
  const compressedFile = await compressImage(file, 0.6, 1920);
  
  const fileExt = 'webp'; // Always use WebP extension
  const fileName = `${contentId ? contentId + '_' : ''}${imageType}_${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  try {
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, compressedFile, {
        cacheControl: '2592000', // 30 days cache (increased from 1 hour)
        upsert: false
      });
      
    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
    
    // Get public URL
    const { data } = supabase
      .storage
      .from('media')
      .getPublicUrl(filePath);
    
    if (!data?.publicUrl) {
      throw new Error('Could not retrieve public URL');
    }
    
    const imageUrl = data.publicUrl;
    
    // Save image metadata to the database
    if (contentId) {
      const { error: dbError } = await supabase
        .from('content_images')
        .insert({
          content_id: contentId,
          image_path: fileName,
          image_type: imageType,
          user_id: '00000000-0000-0000-0000-000000000000', // Default user ID for anonymous uploads
          height: 0, // Default value, would be better to get actual dimensions
          width: 0, // Default value, would be better to get actual dimensions
          mime_type: file.type
        });
        
      if (dbError) {
        console.error("Database insert error:", dbError);
        // Optionally, decide if you want to throw an error or continue
      }
    }
    
    safeCapture('image_uploaded_to_supabase', {
      fileType: file.type,
      fileSize: file.size,
      imageType,
      contentId: contentId || 'none'
    });
    
    return imageUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    safeCapture('image_upload_failed', {
      error: String(error),
      imageType,
      contentId: contentId || 'none'
    });
    throw error;
  }
};
