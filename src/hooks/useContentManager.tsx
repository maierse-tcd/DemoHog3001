import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import { usePostHog } from '../hooks/usePostHogFeatures';
import { Content } from '../data/mockData';
import { loadContentFromSupabase, deleteContentFromSupabase } from '../utils/contentUtils';

export const useContentManager = () => {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const { toast } = useToast();
  const posthog = usePostHog();
  
  // Load content directly from Supabase
  const loadContentData = useCallback(async () => {
    setIsLoadingContent(true);
    try {
      const content = await loadContentFromSupabase();
      setContentList(content);
      console.log('Loaded content from Supabase:', content.length, 'items');
    } catch (error) {
      console.error("Error loading content:", error);
      toast({
        title: "Failed to load content",
        description: "There was a problem loading your content library. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingContent(false);
    }
  }, [toast]);

  const handleContentSaved = useCallback((content: Content, loadUploadedImages?: () => void) => {
    // Refresh the content list from the database
    loadContentData();
    
    // Close the editor
    setShowContentEditor(false);
    
    // Show success message
    toast({
      title: isEditMode ? "Content updated" : "Content added",
      description: `"${content.title}" has been ${isEditMode ? 'updated' : 'added'} successfully.`
    });
    
    // Track in PostHog
    posthog?.capture(isEditMode ? 'content_updated' : 'content_created', {
      contentId: content.id,
      contentTitle: content.title,
      contentType: content.type
    });
    
    // Refresh uploaded images to show any new uploads
    if (loadUploadedImages) {
      loadUploadedImages();
    }
    
    // Dispatch a custom event to notify other components about the change
    window.dispatchEvent(new Event('content-updated'));
  }, [isEditMode, toast, posthog, loadContentData]);

  const handleEditContent = useCallback((content: Content) => {
    setSelectedContent(content);
    setIsEditMode(true);
    setShowContentEditor(true);
  }, []);

  const handleAddNewContent = useCallback(() => {
    setIsEditMode(false);
    setShowContentEditor(true);
    setSelectedContent(null);
  }, []);

  const handleDeleteContent = useCallback(async (contentId: string) => {
    // Find the content to get its title for the confirmation message
    const contentToDelete = contentList.find(item => item.id === contentId);
    
    if (!contentToDelete) return;
    
    if (confirm(`Are you sure you want to delete "${contentToDelete.title}"? This action cannot be undone.`)) {
      try {
        // Delete from Supabase
        await deleteContentFromSupabase(contentId);
        
        // Remove from state
        setContentList(prev => prev.filter(item => item.id !== contentId));
        
        // If this was the selected content, clear the selection
        if (selectedContent?.id === contentId) {
          setSelectedContent(null);
        }
        
        // Track in PostHog
        posthog?.capture('content_deleted', {
          contentTitle: contentToDelete.title
        });
        
        // Show success message
        toast({
          title: "Content deleted",
          description: `"${contentToDelete.title}" has been removed.`
        });
        
        // Dispatch a custom event to notify other components about the change
        window.dispatchEvent(new Event('content-updated'));
      } catch (error) {
        console.error("Error deleting content:", error);
        toast({
          title: "Failed to delete content",
          description: "There was a problem removing the content. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [contentList, selectedContent, toast, posthog]);

  // Load content on mount and when content is updated
  useEffect(() => {
    loadContentData();
    
    // Listen for content-updated events
    window.addEventListener('content-updated', loadContentData);
    
    return () => {
      window.removeEventListener('content-updated', loadContentData);
    };
  }, [loadContentData]);

  return {
    selectedContent,
    contentList,
    showContentEditor,
    setShowContentEditor,
    isEditMode,
    isLoadingContent,
    loadContentData,
    handleContentSaved,
    handleEditContent,
    handleAddNewContent,
    handleDeleteContent
  };
};