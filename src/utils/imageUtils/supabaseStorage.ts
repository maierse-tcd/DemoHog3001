
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
    const files = data.filter(item => !item.metadata.mimetype.includes('directory'));
    
    for (const file of files) {
      const filePath = prefix ? `${prefix}/${file.name}` : file.name;
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      urls.push(urlData.publicUrl);
    }

    // Recursively process subdirectories
    const folders = data.filter(item => item.metadata.mimetype.includes('directory'));
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
