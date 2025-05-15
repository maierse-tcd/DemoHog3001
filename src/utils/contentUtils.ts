import { Content } from '../data/mockData';
import { supabase } from '../integrations/supabase/client';
import { safeCapture } from './posthogUtils';

/**
 * Saves content data to Supabase, handling both inserts and updates.
 * @param content The content object to save.
 * @returns The saved content object.
 */
export const saveContentToSupabase = async (content: Content): Promise<Content> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .upsert([content], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase error saving content:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Failed to save content to Supabase");
    }
    
    safeCapture('content_saved', {
      contentId: content.id,
      contentType: content.type,
      title: content.title
    });

    return data as Content;
  } catch (error) {
    console.error("Error saving content to Supabase:", error);
    throw error;
  }
};
