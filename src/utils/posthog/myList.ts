
import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { safeCapture } from '../posthogUtils';

/**
 * Hook for managing My List functionality
 */
export const useMyList = () => {
  const [myList, setMyList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, userEmail } = useAuth();

  // Load user's list from database
  const loadMyList = async () => {
    if (!isLoggedIn) {
      setMyList([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyList([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_my_list')
        .select('content_ids')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading My List:', error);
        setMyList([]);
      } else {
        setMyList(data?.content_ids || []);
      }
    } catch (error) {
      console.error('Error loading My List:', error);
      setMyList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to list
  const addToList = async (contentId: string) => {
    if (!isLoggedIn) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newList = [...myList, contentId];
      
      const { error } = await supabase.rpc('upsert_my_list', {
        p_user_id: user.id,
        p_content_ids: newList
      });

      if (error) {
        console.error('Error adding to My List:', error);
        return false;
      }

      console.log('MyList Hook: Adding item', contentId, 'to list. New list:', newList);
      setMyList(newList);
      
      // Track event
      safeCapture('my_list_item_added', {
        contentId,
        totalItems: newList.length
      });

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('my-list-updated'));
      
      return true;
    } catch (error) {
      console.error('Error adding to My List:', error);
      return false;
    }
  };

  // Remove item from list
  const removeFromList = async (contentId: string) => {
    if (!isLoggedIn) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newList = myList.filter(id => id !== contentId);
      
      const { error } = await supabase.rpc('upsert_my_list', {
        p_user_id: user.id,
        p_content_ids: newList
      });

      if (error) {
        console.error('Error removing from My List:', error);
        return false;
      }

      console.log('MyList Hook: Removing item', contentId, 'from list. New list:', newList);
      setMyList(newList);
      
      // Track event
      safeCapture('my_list_item_removed', {
        contentId,
        totalItems: newList.length
      });

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('my-list-updated'));
      
      return true;
    } catch (error) {
      console.error('Error removing from My List:', error);
      return false;
    }
  };

  // Check if item is in list
  const isInList = (contentId: string) => {
    return myList.includes(contentId);
  };

  // Load list on mount and auth changes
  useEffect(() => {
    loadMyList();
  }, [isLoggedIn]);

  return {
    myList,
    isLoading,
    addToList,
    removeFromList,
    isInList
  };
};

/**
 * Function for checking if content is in My List
 */
export const isInMyList = (contentId: string, myList: string[]) => {
  return myList.includes(contentId);
};

/**
 * Function for adding to My List (use the hook instead)
 */
export const addToMyList = async (contentId: string) => {
  console.warn('Use useMyList hook instead of addToMyList function');
  return false;
};

/**
 * Function for removing from My List (use the hook instead)
 */
export const removeFromMyList = async (contentId: string) => {
  console.warn('Use useMyList hook instead of removeFromMyList function');
  return false;
};

/**
 * Function for getting My List (use the hook instead)
 */
export const getMyList = () => {
  console.warn('Use useMyList hook instead of getMyList function');
  return [];
};
