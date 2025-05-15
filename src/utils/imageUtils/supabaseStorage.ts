import { supabase } from '../../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { safeCapture } from '../posthogUtils';

// Function to upload an image to Supabase storage
export const uploadImageToSupabase = async (
  file: File, 
  imageType: string, 
  contentId?: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${contentId ? contentId + '_' : ''}${imageType}_${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  try {
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
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
        .insert([{ 
          content_id: contentId, 
          image_path: fileName, 
          image_url: imageUrl,
          image_type: imageType
        }]);
        
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
