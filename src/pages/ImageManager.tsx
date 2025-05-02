
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { Content } from '../data/mockData';
import { useFeatureFlagEnabled } from '../hooks/usePostHogFeatures';
import { useAuth } from '../hooks/useAuth';
import { usePostHog } from '../hooks/usePostHogFeatures';
import { ContentEditor } from '../components/ContentEditor';
import { supabase } from '../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { ContentLibrary } from '../components/ImageManager/ContentLibrary';
import { GalleryView } from '../components/ImageManager/GalleryView';
import { PlanManager } from '../components/ImageManager/PlanManager';
import { 
  extractFilenameFromUrl, 
  loadImagesFromStorage, 
  filterUniqueImages 
} from '../utils/imageUtils/urlUtils';
import { loadContentFromSupabase, deleteContentFromSupabase } from '../utils/contentUtils';

const ImageManager = () => {
  // Use the official hook for the is_admin feature flag
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const { toast } = useToast();
  
  // State management
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
  // Load uploaded images using recursive storage listing
  const loadUploadedImages = async () => {
    if (!isLoggedIn && !user?.id) {
      console.log('ImageManager - User not logged in, but we will try to load images anyway');
    }
    
    setIsLoadingImages(true);
    try {
      // Use the new recursive listing function that includes subfolders
      const urls = await loadImagesFromStorage();
      console.log('ImageManager - Loaded all images from storage (including subfolders):', urls.length);
      
      // Filter unique images to avoid duplicates
      const filteredUrls = filterUniqueImages(urls);
      console.log('ImageManager - Filtered unique images:', filteredUrls.length);
      
      setUploadedImages(filteredUrls);
    } catch (error) {
      console.error("Error loading images:", error);
      toast({
        title: "Failed to load images",
        description: "There was a problem loading your uploaded images.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImages(false);
    }
  };
  
  // Check authentication status and redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      console.log("User not logged in, redirecting from ImageManager");
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);
  
  // Load content directly from Supabase on component mount
  const loadContentData = async () => {
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
  };
  
  // Load content on mount and when content is updated
  useEffect(() => {
    loadContentData();
    
    // Listen for content-updated events
    window.addEventListener('content-updated', loadContentData);
    
    return () => {
      window.removeEventListener('content-updated', loadContentData);
    };
  }, []);
  
  // Load uploaded images from storage on component mount
  useEffect(() => {
    loadUploadedImages();
  }, []);
  
  // If user is not logged in or not an admin (feature flag is explicitly false), redirect to home
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (isLoggedIn && isAdmin === false) {
    return <Navigate to="/" replace />;
  }
  
  // If feature flags are still loading, show a loading state
  if (isAdmin === undefined) {
    return (
      <div className="bg-netflix-black min-h-screen">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-32 bg-netflix-gray rounded mb-4"></div>
                <div className="text-netflix-gray">Loading...</div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const handleContentSaved = (content: Content) => {
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
    loadUploadedImages();
    
    // Dispatch a custom event to notify other components about the change
    window.dispatchEvent(new Event('content-updated'));
  };
  
  const handleEditContent = (content: Content) => {
    setSelectedContent(content);
    setIsEditMode(true);
    setShowContentEditor(true);
  };
  
  const handleDeleteContent = async (contentId: string) => {
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
  };
  
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      setIsDeleting(true);
      
      // Extract the file path from the URL
      const filePath = extractFilenameFromUrl(imageUrl);
      
      if (!filePath) {
        throw new Error("Could not extract file path from URL");
      }
      
      console.log("Deleting image from storage:", filePath);
      
      // First delete the entry from the content_images table
      const { error: dbError } = await supabase
        .from('content_images')
        .delete()
        .eq('image_path', filePath);
        
      if (dbError) {
        console.error("Error deleting image from database:", dbError);
        // Continue with storage deletion even if DB delete fails
      }
      
      // Then delete the file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);
      
      if (storageError) {
        console.error("Supabase storage delete error:", storageError);
        throw storageError;
      }
      
      console.log("Image deleted successfully from both DB and storage");
      
      // Remove from the local state
      setUploadedImages(prev => prev.filter(url => url !== imageUrl));
      
      // Also check if any content was using this image and update it
      const contentToUpdate = contentList.filter(item => 
        item.posterUrl === imageUrl || item.backdropUrl === imageUrl
      );
      
      if (contentToUpdate.length > 0) {
        // Update each content item that was using this image
        for (const item of contentToUpdate) {
          // Create an updated version of the content with image URLs removed
          const updatedItem = { 
            ...item,
            posterUrl: item.posterUrl === imageUrl ? '' : item.posterUrl,
            backdropUrl: item.backdropUrl === imageUrl ? '' : item.backdropUrl
          };
          
          // Save the updated content to Supabase
          await supabase.from('content_items').update({
            poster_url: updatedItem.posterUrl,
            backdrop_url: updatedItem.backdropUrl
          }).eq('id', item.id);
        }
        
        // Refresh content list to reflect updates
        loadContentData();
        
        // Notify user that content was updated
        toast({
          title: "Content updated",
          description: `Updated ${contentToUpdate.length} content items that were using the deleted image.`
        });
      }
      
      // Track in PostHog
      posthog?.capture('image_deleted', {
        fileName: filePath
      });
      
      // Show success message
      toast({
        title: "Image deleted",
        description: "The image has been removed from your storage."
      });
      
      // Dispatch a custom event to notify other components about the change
      window.dispatchEvent(new Event('content-updated'));
      
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Failed to delete image",
        description: "There was a problem removing the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Content Management</h1>
          </div>
          
          <Dialog open={showContentEditor} onOpenChange={setShowContentEditor}>
            <DialogContent className="max-w-4xl bg-netflix-black border-netflix-gray/20 p-0 max-h-[95vh] overflow-hidden">
              <ScrollArea className="max-h-[calc(95vh-2rem)]">
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Content' : 'Add New Content'}</DialogTitle>
                    <DialogDescription>
                      {isEditMode 
                        ? 'Update details for this movie or series' 
                        : 'Add a new movie or series to your library'}
                    </DialogDescription>
                  </DialogHeader>
                  <ContentEditor 
                    content={isEditMode ? selectedContent || undefined : undefined}
                    isEdit={isEditMode}
                    onSave={handleContentSaved}
                    onCancel={() => setShowContentEditor(false)}
                  />
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Tabs 
            defaultValue="content" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="content">Content Library</TabsTrigger>
              <TabsTrigger value="images">Image Gallery</TabsTrigger>
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <Card className="bg-netflix-darkgray border-netflix-gray/20">
                <CardHeader>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>Browse, edit and manage all movies and series</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingContent ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-32 bg-netflix-gray rounded mb-4"></div>
                        <div className="text-netflix-gray">Loading content...</div>
                      </div>
                    </div>
                  ) : (
                    <ContentLibrary 
                      content={contentList}
                      onEditContent={handleEditContent}
                      onDeleteContent={handleDeleteContent}
                      onAddNew={() => {
                        setIsEditMode(false);
                        setShowContentEditor(true);
                        setSelectedContent(null);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="images">
              <Card className="bg-netflix-darkgray border-netflix-gray/20">
                <CardHeader>
                  <CardTitle>Image Gallery</CardTitle>
                  <CardDescription>Manage images used across your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <GalleryView 
                    isLoadingImages={isLoadingImages}
                    uploadedImages={uploadedImages}
                    onRefreshImages={loadUploadedImages}
                    onDeleteImage={handleDeleteImage}
                    isDeleting={isDeleting}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="plans">
              <PlanManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ImageManager;
