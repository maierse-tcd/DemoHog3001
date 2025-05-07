
import { useState, useEffect } from 'react';
import { safeCapture } from './events';
import { safeGetDistinctId } from './identity';
import { Content } from '../../data/mockData';
import { supabase } from '../../integrations/supabase/client';

// Local storage key for my list (fallback)
const MY_LIST_STORAGE_KEY = 'netflix_clone_my_list';

/**
 * Get the current user's My List from local storage or Supabase
 */
export const getMyList = async (): Promise<string[]> => {
  // Try to get from Supabase first
  const userId = safeGetDistinctId();
  
  if (userId) {
    try {
      console.log("Fetching my list for user ID:", userId);
      
      // First attempt - try to get the data with maybeSingle instead of single
      const { data, error } = await supabase
        .from('user_my_list')
        .select('content_ids')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        console.log("Successfully retrieved my list from Supabase:", data.content_ids);
        return data.content_ids || [];
      } else if (error) {
        console.error("Error fetching from Supabase:", error);
      } else {
        console.log("No my list data found in Supabase for user:", userId);
      }
    } catch (error) {
      console.error("Error fetching my list from Supabase:", error);
    }
  } else {
    console.log("No user ID available for fetching my list");
  }
  
  // Fallback to local storage
  try {
    const storedList = localStorage.getItem(MY_LIST_STORAGE_KEY);
    const parsedList = storedList ? JSON.parse(storedList) : [];
    console.log("Using my list from local storage:", parsedList);
    return parsedList;
  } catch (error) {
    console.error("Error parsing my list from local storage:", error);
    return [];
  }
};

/**
 * Add content to My List
 */
export const addToMyList = async (contentId: string): Promise<boolean> => {
  try {
    const currentList = await getMyList();
    
    // Don't add if already in list
    if (currentList.includes(contentId)) {
      return true;
    }
    
    const newList = [...currentList, contentId];
    console.log("Adding to my list:", contentId, "New list:", newList);
    
    // Try to save to Supabase
    const userId = safeGetDistinctId();
    if (userId) {
      try {
        // Update the function call to use the correct function name in Supabase
        const { error } = await supabase
          .rpc('upsert_my_list', {
            p_user_id: userId,
            p_content_ids: newList
          });
        
        if (error) {
          console.error("Error saving to Supabase:", error);
          // Fall back to local storage
        } else {
          console.log("Successfully saved to Supabase for user:", userId);
        }
      } catch (e) {
        console.error("Failed to save my list to Supabase:", e);
      }
    } else {
      console.log("No user ID available, saving only to local storage");
    }
    
    // Always save to local storage as fallback
    localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(newList));
    
    // Track the event
    safeCapture('content_added_to_my_list', { contentId });
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('my-list-updated'));
    
    return true;
  } catch (error) {
    console.error("Error adding to my list:", error);
    return false;
  }
};

/**
 * Remove content from My List
 */
export const removeFromMyList = async (contentId: string): Promise<boolean> => {
  try {
    const currentList = await getMyList();
    const newList = currentList.filter(id => id !== contentId);
    console.log("Removing from my list:", contentId, "New list:", newList);
    
    // Try to save to Supabase
    const userId = safeGetDistinctId();
    if (userId) {
      try {
        // Update the function call to use the correct function name in Supabase
        const { error } = await supabase
          .rpc('upsert_my_list', {
            p_user_id: userId,
            p_content_ids: newList
          });
        
        if (error) {
          console.error("Error saving to Supabase:", error);
          // Fall back to local storage
        } else {
          console.log("Successfully saved to Supabase for user:", userId);
        }
      } catch (e) {
        console.error("Failed to save my list to Supabase:", e);
      }
    } else {
      console.log("No user ID available, saving only to local storage");
    }
    
    // Always save to local storage as fallback
    localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(newList));
    
    // Track the event
    safeCapture('content_removed_from_my_list', { contentId });
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('my-list-updated'));
    
    return true;
  } catch (error) {
    console.error("Error removing from my list:", error);
    return false;
  }
};

/**
 * Check if content is in My List
 */
export const isInMyList = async (contentId: string): Promise<boolean> => {
  try {
    const myList = await getMyList();
    return myList.includes(contentId);
  } catch (error) {
    console.error("Error checking if in my list:", error);
    return false;
  }
};

/**
 * React hook for using My List
 */
export const useMyList = () => {
  const [myList, setMyList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadMyList = async () => {
      setIsLoading(true);
      try {
        const list = await getMyList();
        console.log("useMyList: Retrieved list:", list);
        setMyList(list);
      } catch (error) {
        console.error("Error loading my list:", error);
        setMyList([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMyList();
    
    // Add listener for my list changes
    window.addEventListener('my-list-updated', loadMyList);
    
    return () => {
      window.removeEventListener('my-list-updated', loadMyList);
    };
  }, []);
  
  return {
    myList,
    isLoading,
    addToList: addToMyList,
    removeFromList: removeFromMyList,
    isInList: (contentId: string) => myList.includes(contentId)
  };
};
