
import { useState, useEffect, useRef } from 'react';
import { safeCapture } from './events';
import { Content } from '../../data/mockData';

// Local storage key for my list (visual only, no Supabase)
const MY_LIST_STORAGE_KEY = 'netflix_clone_my_list';

/**
 * Get the current user's My List from local storage
 */
export const getMyList = async (): Promise<string[]> => {
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
 * Add content to My List (visual only)
 */
export const addToMyList = async (contentId: string): Promise<boolean> => {
  try {
    const currentList = await getMyList();
    
    // Don't add if already in list
    if (currentList.includes(contentId)) {
      return true;
    }
    
    const newList = [...currentList, contentId];
    console.log("Adding to my list (visual only):", contentId, "New list:", newList);
    
    // Save to local storage only
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
 * Remove content from My List (visual only)
 */
export const removeFromMyList = async (contentId: string): Promise<boolean> => {
  try {
    const currentList = await getMyList();
    const newList = currentList.filter(id => id !== contentId);
    console.log("Removing from my list (visual only):", contentId, "New list:", newList);
    
    // Save to local storage only
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
 * React hook for using My List (visual only)
 */
export const useMyList = () => {
  const [myList, setMyList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple fetches
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
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
    const handleMyListUpdated = () => {
      loadMyList();
    };
    
    window.addEventListener('my-list-updated', handleMyListUpdated);
    
    return () => {
      window.removeEventListener('my-list-updated', handleMyListUpdated);
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
