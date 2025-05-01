
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { mockContent, Content } from '../data/mockData';
import { useFeatureFlagEnabled } from '../hooks/usePostHogFeatures';
import { useAuth } from '../hooks/useAuth';
import { usePostHog } from '../hooks/usePostHogFeatures';
import { ContentEditor } from '../components/ContentEditor';
import { supabase } from '../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { ContentLibrary } from '../components/ImageManager/ContentLibrary';
import { GalleryView } from '../components/ImageManager/GalleryView';
import { extractFilenameFromUrl, loadImagesFromDatabase } from '../utils/imageUtils/urlUtils';

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
  const [updatedContentList, setUpdatedContentList] = useState<Content[]>([]);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load uploaded images from the database
  const loadUploadedImages = async () => {
    if (!isLoggedIn && !user?.id) {
      console.log('ImageManager - User not logged in, but we will try to load images anyway');
    }
    
    setIsLoadingImages(true);
    try {
      const urls = await loadImagesFromDatabase();
      console.log('ImageManager - Loaded images:', urls.length);
      setUploadedImages(urls);
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
  
  // Load any previously saved content from localStorage on component mount
  useEffect(() => {
    const savedContent = localStorage.getItem('hogflix_content');
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        setUpdatedContentList(parsed);
      } catch (e) {
        console.error("Error parsing saved content:", e);
        setUpdatedContentList(mockContent);
      }
    } else {
      setUpdatedContentList(mockContent);
    }
  }, []);
  
  // Load uploaded images from the database on component mount
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
    // If we're editing, find and replace the content
    if (isEditMode) {
      setUpdatedContentList(prev => 
        prev.map(item => item.id === content.id ? content : item)
      );
    } else {
      // Otherwise add the new content
      setUpdatedContentList(prev => [...prev, content]);
    }
    
    setShowContentEditor(false);
    
    // Refresh the list
    const savedContent = localStorage.getItem('hogflix_content');
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        setUpdatedContentList(parsed);
      } catch (e) {
        console.error("Error parsing saved content:", e);
      }
    }
    
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
  
  const handleDeleteContent = (contentId: string) => {
    // Find the content to get its title for the confirmation message
    const contentToDelete = updatedContentList.find(item => item.id === contentId);
    
    if (!contentToDelete) return;
    
    if (confirm(`Are you sure you want to delete "${contentToDelete.title}"? This action cannot be undone.`)) {
      // Remove from state
      const newList = updatedContentList.filter(item => item.id !== contentId);
      setUpdatedContentList(newList);
      
      // Save to localStorage
      localStorage.setItem('hogflix_content', JSON.stringify(newList));
      
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
    }
  };
  
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      setIsDeleting(true);
      
      // Extract the file name from the URL
      const fileName = extractFilenameFromUrl(imageUrl);
      
      if (!fileName) {
        throw new Error("Could not extract file name from URL");
      }
      
      // First delete the entry from the content_images table
      const { error: dbError } = await supabase
        .from('content_images')
        .delete()
        .eq('image_path', fileName);
        
      if (dbError) {
        console.error("Error deleting image from database:", dbError);
        // Continue with storage deletion even if DB delete fails
      }
      
      // Then delete the file from Supabase storage
      console.log("Deleting image from storage:", fileName);
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileName]);
      
      if (storageError) {
        console.error("Supabase storage delete error:", storageError);
        throw storageError;
      }
      
      console.log("Image deleted successfully from both DB and storage");
      
      // Remove from the local state
      setUploadedImages(prev => prev.filter(url => url !== imageUrl));
      
      // Also check if any content was using this image and update it
      const contentToUpdate = updatedContentList.filter(item => 
        item.posterUrl === imageUrl || item.backdropUrl === imageUrl
      );
      
      if (contentToUpdate.length > 0) {
        const updatedList = updatedContentList.map(item => {
          if (item.posterUrl === imageUrl) {
            return { ...item, posterUrl: '' };
          }
          if (item.backdropUrl === imageUrl) {
            return { ...item, backdropUrl: '' };
          }
          return item;
        });
        
        setUpdatedContentList(updatedList);
        localStorage.setItem('hogflix_content', JSON.stringify(updatedList));
        
        // Notify user that content was updated
        toast({
          title: "Content updated",
          description: `Updated ${contentToUpdate.length} content items that were using the deleted image.`
        });
      }
      
      // Track in PostHog
      posthog?.capture('image_deleted', {
        fileName
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
            <h1 className="text-3xl md:text-4xl font-bold">Content Library</h1>
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
          
          <div className="space-y-8">
            <Card className="bg-netflix-darkgray border-netflix-gray/20">
              <CardHeader>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>Browse, edit and manage all movies and series</CardDescription>
              </CardHeader>
              <CardContent>
                <ContentLibrary 
                  content={updatedContentList}
                  onEditContent={handleEditContent}
                  onDeleteContent={handleDeleteContent}
                  onAddNew={() => {
                    setIsEditMode(false);
                    setShowContentEditor(true);
                    setSelectedContent(null);
                  }}
                />
              </CardContent>
            </Card>
            
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
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ImageManager;
