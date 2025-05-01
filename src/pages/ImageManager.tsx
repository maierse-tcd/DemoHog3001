import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { mockContent, Content } from '../data/mockData';
import { Input } from '../components/ui/input';
import { Search, Pencil, Trash2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useFeatureFlagEnabled } from '../hooks/usePostHogFeatures';
import { useAuth } from '../hooks/useAuth';
import { usePostHog } from '../hooks/usePostHogFeatures';
import { ContentEditor } from '../components/ContentEditor';
import { supabase } from '../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { DEFAULT_IMAGES } from '../utils/imageUtils';

const ImageManager = () => {
  // Use the official hook for the is_admin feature flag
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const posthog = usePostHog();
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [updatedContentList, setUpdatedContentList] = useState<Content[]>([]);
  const [savedChanges, setSavedChanges] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const { toast } = useToast();
  
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
  
  // Load uploaded images from Supabase Storage
  useEffect(() => {
    loadUploadedImages();
  }, [isLoggedIn, user]);
  
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
  
  const loadUploadedImages = async () => {
    if (!isLoggedIn || !user?.id) return;
    
    setIsLoadingImages(true);
    try {
      const { data: imageFiles, error } = await supabase.storage
        .from('media')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
        
      if (error) {
        throw error;
      }
      
      if (imageFiles) {
        // Get public URLs for each file
        const urls = imageFiles.map(file => {
          const { data } = supabase.storage
            .from('media')
            .getPublicUrl(file.name);
          return data.publicUrl;
        });
        
        setUploadedImages(urls);
      }
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
    }
  };
  
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      // Extract the file name from the URL
      const fileName = imageUrl.split('/').pop();
      
      if (!fileName) {
        throw new Error("Could not extract file name from URL");
      }
      
      // Delete the file from Supabase storage
      const { error } = await supabase.storage
        .from('media')
        .remove([fileName]);
      
      if (error) {
        throw error;
      }
      
      // Remove from the local state
      setUploadedImages(prev => prev.filter(url => url !== imageUrl));
      
      // Track in PostHog
      posthog?.capture('image_deleted', {
        fileName
      });
      
      // Show success message
      toast({
        title: "Image deleted",
        description: "The image has been removed from your storage."
      });
      
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Failed to delete image",
        description: "There was a problem removing the image. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Content Library
  const ContentLibrary = () => {
    const [viewType, setViewType] = useState<'all' | 'movies' | 'series'>('all');
    const [librarySearch, setLibrarySearch] = useState('');
    
    const filteredLibrary = updatedContentList.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(librarySearch.toLowerCase());
      const matchesType = viewType === 'all' || item.type === viewType;
      return matchesSearch && matchesType;
    });
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="pl-10 bg-black/40 border-netflix-gray/40"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={viewType === 'all' ? "default" : "outline"} 
              onClick={() => setViewType('all')}
              className="min-w-20"
            >
              All
            </Button>
            <Button 
              variant={viewType === 'movies' ? "default" : "outline"} 
              onClick={() => setViewType('movies')}
              className="min-w-20"
            >
              Movies
            </Button>
            <Button 
              variant={viewType === 'series' ? "default" : "outline"} 
              onClick={() => setViewType('series')}
              className="min-w-20"
            >
              Series
            </Button>
          </div>
          
          <Button 
            variant="default" 
            onClick={() => {
              setIsEditMode(false);
              setShowContentEditor(true);
              setSelectedContent(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map(item => (
              <Card 
                key={item.id} 
                className="bg-netflix-darkgray border-netflix-gray/20 overflow-hidden hover:border-netflix-red transition-colors"
              >
                <div className="aspect-[2/3] relative">
                  {item.posterUrl ? (
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGES.poster;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-black/50 flex items-center justify-center text-netflix-gray">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => handleEditContent(item)}
                      className="bg-black/70 p-1.5 rounded-full hover:bg-black"
                      title="Edit content"
                    >
                      <Pencil className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="bg-black/70 p-1.5 rounded-full hover:bg-netflix-red"
                      title="Delete content"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-netflix-gray">{item.type} • {item.releaseYear}</p>
                  <div className="flex flex-wrap mt-1 gap-1">
                    {item.genre.slice(0, 2).map((genre, i) => (
                      <span key={i} className="text-xs bg-netflix-gray/20 px-1.5 py-0.5 rounded">
                        {genre}
                      </span>
                    ))}
                    {item.genre.length > 2 && (
                      <span className="text-xs text-netflix-gray">+{item.genre.length - 2}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-netflix-gray">
              <p>No content found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Image Gallery
  const ImageGallery = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Available Images</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadUploadedImages}
            disabled={isLoadingImages}
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${isLoadingImages ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {isLoadingImages ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-netflix-gray rounded-full mb-2"></div>
              <div className="h-4 w-24 bg-netflix-gray rounded"></div>
            </div>
          </div>
        ) : uploadedImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Uploaded ${index + 1}`} 
                  className="rounded-md w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGES.thumbnail;
                  }}
                />
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteImage(url)}
                    title="Delete image"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-netflix-gray">
            <p>No images uploaded yet. Add images by editing content.</p>
          </div>
        )}
      </div>
    );
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
            <DialogContent className="max-w-4xl bg-netflix-black border-netflix-gray/20">
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
            </DialogContent>
          </Dialog>
          
          <div className="space-y-8">
            <Card className="bg-netflix-darkgray border-netflix-gray/20">
              <CardHeader>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>Browse, edit and manage all movies and series</CardDescription>
              </CardHeader>
              <CardContent>
                <ContentLibrary />
              </CardContent>
            </Card>
            
            <Card className="bg-netflix-darkgray border-netflix-gray/20">
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>Manage images used across your content</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGallery />
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
