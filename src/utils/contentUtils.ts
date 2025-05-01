
import { supabase } from "../integrations/supabase/client";
import { Content } from "../data/mockData";
import { safeCapture } from "./posthogUtils";

// Convert Content object to database format
export const contentToDbFormat = (content: Content) => {
  return {
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
    trending: content.trending
  };
};

// Convert database format to Content object
export const dbFormatToContent = (dbContent: any): Content => {
  return {
    id: dbContent.id,
    title: dbContent.title,
    description: dbContent.description || "No description available.",
    type: dbContent.type,
    posterUrl: dbContent.poster_url || "",
    backdropUrl: dbContent.backdrop_url || "",
    genre: dbContent.genre || [],
    releaseYear: dbContent.release_year || new Date().getFullYear().toString(),
    ageRating: dbContent.age_rating || "PG-13",
    duration: dbContent.duration || "1h 30m",
    trending: dbContent.trending || false
  };
};

// Load content from Supabase
export const loadContentFromSupabase = async (): Promise<Content[]> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error loading content from Supabase:", error);
      throw error;
    }
    
    // Convert DB format to Content objects
    const content = data.map(dbFormatToContent);
    console.log("Loaded content from Supabase:", content.length, "items");
    return content;
  } catch (error) {
    console.error("Failed to load content from Supabase:", error);
    throw error;
  }
};

// Save content to Supabase
export const saveContentToSupabase = async (content: Content): Promise<Content> => {
  try {
    // Convert to DB format
    const dbContent = contentToDbFormat(content);
    
    const { data, error } = await supabase
      .from('content_items')
      .upsert(dbContent)
      .select()
      .single();
    
    if (error) {
      console.error("Error saving content to Supabase:", error);
      throw error;
    }
    
    // Track successful content update
    safeCapture('content_saved_to_supabase', {
      contentId: content.id,
      contentType: content.type,
      title: content.title
    });
    
    return dbFormatToContent(data);
  } catch (error) {
    console.error("Failed to save content to Supabase:", error);
    throw error;
  }
};

// Delete content from Supabase
export const deleteContentFromSupabase = async (contentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', contentId);
    
    if (error) {
      console.error("Error deleting content from Supabase:", error);
      throw error;
    }
    
    // Track successful content deletion
    safeCapture('content_deleted_from_supabase', {
      contentId
    });
  } catch (error) {
    console.error("Failed to delete content from Supabase:", error);
    throw error;
  }
};

// Initialize database with mock content if empty
export const initializeContentDatabase = async (mockContent: Content[]): Promise<void> => {
  try {
    // Check if we already have content
    const { count, error: countError } = await supabase
      .from('content_items')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error checking content count:", countError);
      return;
    }
    
    // If no content exists, seed with mock data
    if (count === 0) {
      console.log("Initializing database with mock content...");
      
      // Prepare the content items with properly formatted data
      // Make a deep copy to avoid modifying the original objects
      const contentItems = mockContent.map(item => {
        // Create a new object with the correct format
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          poster_url: item.posterUrl,
          backdrop_url: item.backdropUrl,
          genre: item.genre, // PostgreSQL will handle this correctly now
          release_year: item.releaseYear,
          age_rating: item.ageRating,
          duration: item.duration,
          trending: item.trending
        };
      });
      
      // Insert items one by one to better handle errors
      for (const item of contentItems) {
        const { error } = await supabase
          .from('content_items')
          .insert(item);
        
        if (error) {
          console.error(`Error inserting item ${item.id}:`, error);
        }
      }
      
      console.log("Database seeding complete");
    } else {
      console.log("Database already contains content, skipping initialization");
    }
  } catch (error) {
    console.error("Failed to initialize content database:", error);
  }
};
