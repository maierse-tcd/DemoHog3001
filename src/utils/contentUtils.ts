
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
    // Convert from Content model to database model
    const dbContent = {
      id: content.id,
      title: content.title,
      description: content.description,
      type: content.type,
      poster_url: content.posterUrl,
      backdrop_url: content.backdropUrl,
      genre: content.genre,
      release_year: content.releaseYear,
      age_rating: content.ageRating,
      duration: content.duration,
      trending: content.trending,
      video_url: content.videoUrl
    };

    const { data, error } = await supabase
      .from('content_items')
      .upsert([dbContent], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase error saving content:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Failed to save content to Supabase");
    }
    
    // Convert from database model back to Content model
    const savedContent: Content = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      type: data.type as 'movie' | 'series',
      posterUrl: data.poster_url || '',
      backdropUrl: data.backdrop_url || '',
      genre: data.genre,
      releaseYear: data.release_year || '',
      ageRating: data.age_rating || '',
      duration: data.duration || '',
      trending: data.trending || false,
      videoUrl: data.video_url
    };
    
    safeCapture('content_saved', {
      contentId: content.id,
      contentType: content.type,
      title: content.title
    });

    return savedContent;
  } catch (error) {
    console.error("Error saving content to Supabase:", error);
    throw error;
  }
};

/**
 * Loads content data from Supabase.
 * @returns An array of content objects.
 */
export const loadContentFromSupabase = async (): Promise<Content[]> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error loading content:", error);
      throw error;
    }

    // Convert from database model to Content model
    const contentItems: Content[] = data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type as 'movie' | 'series',
      posterUrl: item.poster_url || '',
      backdropUrl: item.backdrop_url || '',
      genre: item.genre,
      releaseYear: item.release_year || '',
      ageRating: item.age_rating || '',
      duration: item.duration || '',
      trending: item.trending || false,
      videoUrl: item.video_url
    }));

    return contentItems;
  } catch (error) {
    console.error("Error loading content from Supabase:", error);
    throw error;
  }
};

/**
 * Deletes content from Supabase by ID.
 * @param contentId The ID of the content to delete.
 */
export const deleteContentFromSupabase = async (contentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', contentId);

    if (error) {
      console.error("Supabase error deleting content:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error deleting content from Supabase:", error);
    throw error;
  }
};

/**
 * Initializes the content database with seed data if it's empty.
 * @param seedContent The seed content to use if the database is empty.
 */
export const initializeContentDatabase = async (seedContent: Content[]): Promise<void> => {
  try {
    // Check if content already exists
    const { data: existingContent, error: countError } = await supabase
      .from('content_items')
      .select('id')
      .limit(1);

    if (countError) {
      console.error("Supabase error checking content:", countError);
      throw countError;
    }

    // If there's no content, seed the database
    if (!existingContent || existingContent.length === 0) {
      console.log("No content found, seeding database with mock data...");

      // Convert Content models to database models for insertion
      const dbContent = seedContent.map(content => ({
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        poster_url: content.posterUrl,
        backdrop_url: content.backdropUrl,
        genre: content.genre,
        release_year: content.releaseYear,
        age_rating: content.ageRating,
        duration: content.duration,
        trending: content.trending,
        video_url: content.videoUrl
      }));

      // Insert each content item
      const { error: insertError } = await supabase
        .from('content_items')
        .insert(dbContent);

      if (insertError) {
        console.error("Supabase error seeding content:", insertError);
        throw insertError;
      }

      console.log(`Successfully seeded database with ${seedContent.length} content items`);
    } else {
      console.log("Content database already initialized, skipping seed");
    }
  } catch (error) {
    console.error("Error initializing content database:", error);
    throw error;
  }
};
