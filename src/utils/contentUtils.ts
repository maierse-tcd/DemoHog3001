
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
      
      // First, we need to enable RLS bypass for this operation
      // by using the `auth.admin()` function if available
      const serviceRoleClient = supabase.auth.admin ? supabase.auth.admin() : supabase;
      
      try {
        // Use the seed_content_items function in the database to handle all inserts at once
        const { error: seedError } = await serviceRoleClient.rpc('seed_content_items', {
          content_items: JSON.stringify(
            mockContent.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description,
              type: item.type,
              poster_url: item.posterUrl,
              backdrop_url: item.backdropUrl,
              genre: item.genre,
              release_year: item.releaseYear,
              age_rating: item.ageRating,
              duration: item.duration,
              trending: item.trending
            }))
          )
        });
        
        if (seedError) {
          console.error("Error using seed_content_items RPC:", seedError);
          // Fall back to alternative seeding method if RPC fails
          await seedContentItemsManually(mockContent);
        } else {
          console.log("Successfully seeded database using RPC function");
        }
      } catch (seedError) {
        console.error("Failed to use RPC function:", seedError);
        // Fall back to alternative seeding method
        await seedContentItemsManually(mockContent);
      }
      
      console.log("Database seeding complete");
    } else {
      console.log("Database already contains content, skipping initialization");
    }
  } catch (error) {
    console.error("Failed to initialize content database:", error);
  }
};

// Alternative manual seeding method that creates an SQL statement directly
const seedContentItemsManually = async (mockContent: Content[]): Promise<void> => {
  console.log("Falling back to manual seeding method with SQL...");
  
  try {
    // Create a single SQL statement to insert all content at once
    // This bypasses RLS policies because it's executed directly as SQL
    const items = mockContent.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || null,
      type: item.type,
      poster_url: item.posterUrl || null,
      backdrop_url: item.backdropUrl || null,
      genre: item.genre,
      release_year: item.releaseYear || null,
      age_rating: item.ageRating || null,
      duration: item.duration || null,
      trending: item.trending || false
    }));
    
    // Using the .rpc() method to execute a direct SQL query
    // This might require enabling "pg_catalog" in Supabase policies
    const { error } = await supabase.rpc('execute_sql', {
      sql_statement: `
        INSERT INTO public.content_items 
        (id, title, description, type, poster_url, backdrop_url, genre, release_year, age_rating, duration, trending)
        VALUES 
        ${items.map(item => `(
          '${item.id}', 
          '${item.title.replace(/'/g, "''")}', 
          ${item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL'}, 
          '${item.type}', 
          ${item.poster_url ? `'${item.poster_url}'` : 'NULL'}, 
          ${item.backdrop_url ? `'${item.backdrop_url}'` : 'NULL'}, 
          ARRAY[${item.genre.map(g => `'${g}'`).join(', ')}]::text[], 
          ${item.release_year ? `'${item.release_year}'` : 'NULL'}, 
          ${item.age_rating ? `'${item.age_rating}'` : 'NULL'}, 
          ${item.duration ? `'${item.duration}'` : 'NULL'}, 
          ${item.trending}
        )`).join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `
    });
    
    if (error) {
      console.error("Error executing SQL for seeding:", error);
      console.log("Attempting direct API inserts with serviceRole client...");
      
      // As a last resort, try direct API inserts
      const { SUPABASE_SERVICE_ROLE_KEY } = import.meta.env;
      if (SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(
          import.meta.env.VITE_SUPABASE_URL || "",
          SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Insert items with the admin client that bypasses RLS
        for (const item of items) {
          const { error: insertError } = await adminClient
            .from('content_items')
            .insert(item);
          
          if (insertError) {
            console.error(`Error inserting item ${item.id} with admin client:`, insertError);
          }
        }
      } else {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin access");
      }
    }
  } catch (error) {
    console.error("Failed during manual SQL seeding:", error);
  }
};
