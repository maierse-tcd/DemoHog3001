
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ImageUploader } from '../components/ImageUploader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { mockContent, Content } from '../data/mockData';
import { Input } from '../components/ui/input';
import { Search, Copy, Save, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

// Create a copy of mockContent that we can modify
let localMockContent = [...mockContent];

const ImageManager = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [updatedContentList, setUpdatedContentList] = useState<Content[]>(localMockContent);
  const [savedChanges, setSavedChanges] = useState(false);
  const { toast } = useToast();
  
  // Use feature flag to determine if images navigation should be shown
  const showImagesNavigation = useFeatureFlag('show_images_navigation');
  
  // If feature flag is explicitly false (not undefined), redirect to home
  if (showImagesNavigation === false) {
    return <Navigate to="/" replace />;
  }
  
  // If feature flags are still loading, show a loading state
  if (showImagesNavigation === undefined) {
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
  
  // Load any previously saved content from localStorage on component mount
  useEffect(() => {
    const savedContent = localStorage.getItem('hogflix_content');
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        localMockContent = parsed;
        setUpdatedContentList(parsed);
      } catch (e) {
        console.error("Error parsing saved content:", e);
      }
    }
  }, []);
  
  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const filtered = updatedContentList.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContent(filtered);
    } else {
      setFilteredContent([]);
    }
  }, [searchTerm, updatedContentList]);
  
  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImages(prevImages => {
      const newImages = [...prevImages, imageUrl];
      // Track in PostHog
      if (window.posthog) {
        window.posthog.capture('image_uploaded');
      }
      return newImages;
    });
  };
  
  const copyToClipboard = (text: string, contentInfo?: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: 'URL copied to clipboard!',
          description: contentInfo 
            ? `You can use this URL for "${contentInfo}"`
            : 'You can now use this URL in your content.',
        });
        
        if (window.posthog) {
          window.posthog.capture('image_url_copied', {
            contentTitle: contentInfo
          });
        }
      })
      .catch((err) => {
        console.error('Failed to copy URL:', err);
        toast({
          title: 'Failed to copy URL',
          description: 'Please try again or copy manually.',
          variant: 'destructive',
        });
      });
  };
  
  const selectContentItem = (item: Content) => {
    setSelectedContent(item);
    setSearchTerm(item.title);
    setFilteredContent([]);
    
    // Track in PostHog
    if (window.posthog) {
      window.posthog.capture('content_selected_for_image', {
        contentId: item.id,
        contentTitle: item.title,
        contentType: item.type
      });
    }
  };
  
  const updateContentImage = (imageUrl: string) => {
    if (!selectedContent) return;
    
    // Update the content item with the new image URL
    const updatedList = updatedContentList.map(item => {
      if (item.id === selectedContent.id) {
        return { ...item, posterUrl: imageUrl };
      }
      return item;
    });
    
    // Update the state and local mock
    localMockContent = updatedList;
    setUpdatedContentList(updatedList);
    
    // Update the selected content to show the new image
    setSelectedContent({...selectedContent, posterUrl: imageUrl});
    
    // Save to localStorage for persistence
    localStorage.setItem('hogflix_content', JSON.stringify(updatedList));
    
    // Show success toast
    toast({
      title: "Image updated successfully!",
      description: `The poster for "${selectedContent.title}" has been updated.`
    });
    
    // Track in PostHog
    if (window.posthog) {
      window.posthog.capture('content_image_updated', {
        contentId: selectedContent.id,
        contentTitle: selectedContent.title,
        contentType: selectedContent.type
      });
    }
    
    setSavedChanges(true);
    setTimeout(() => setSavedChanges(false), 3000);
  };
  
  const getCodeSnippet = (imageUrl: string) => {
    if (selectedContent) {
      return `// Update in mockData.ts
const updatedContent = mockContent.map(item => {
  if (item.id === "${selectedContent.id}") {
    return { ...item, posterUrl: "${imageUrl}" };
  }
  return item;
});`;
    }
    return `posterUrl: "${imageUrl}"`;
  };
  
  // New function to view all content with their images
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
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map(item => (
              <Card 
                key={item.id} 
                className="bg-netflix-darkgray border-netflix-gray/20 overflow-hidden cursor-pointer hover:border-netflix-red transition-colors"
                onClick={() => selectContentItem(item)}
              >
                <div className="aspect-[2/3] relative">
                  {item.posterUrl ? (
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-black/50 flex items-center justify-center text-netflix-gray">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-netflix-gray">{item.type}</p>
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
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Image Manager</h1>
            {savedChanges && (
              <div className="flex items-center text-green-500">
                <CheckCircle className="mr-2 h-5 w-5" />
                <span>Changes saved</span>
              </div>
            )}
          </div>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="upload">Upload Images</TabsTrigger>
              <TabsTrigger value="map">Map to Content</TabsTrigger>
              <TabsTrigger value="library">Content Library</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="bg-netflix-darkgray border-netflix-gray/20">
                  <CardHeader>
                    <CardTitle>Upload New Image</CardTitle>
                    <CardDescription>Upload custom images for your movies and series</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUploader onImageUploaded={handleImageUploaded} />
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <p className="text-sm text-netflix-gray mb-4">
                      After uploading, you can map these images to your content titles.
                    </p>
                  </CardFooter>
                </Card>
                
                {/* Gallery Section */}
                <Card className="bg-netflix-darkgray border-netflix-gray/20">
                  <CardHeader>
                    <CardTitle>Your Uploaded Images</CardTitle>
                    <CardDescription>Recent uploads for your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Uploaded ${index + 1}`} 
                              className="rounded-md w-full h-32 object-cover"
                            />
                            <button
                              onClick={() => copyToClipboard(url)}
                              className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-white text-sm">Click to copy URL</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-netflix-gray">
                        <p>No images uploaded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="map">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Content Search Section */}
                <Card className="bg-netflix-darkgray border-netflix-gray/20">
                  <CardHeader>
                    <CardTitle>Find Content</CardTitle>
                    <CardDescription>Search for movies or series to map images to</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search movie or series titles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-black/40 border-netflix-gray/40"
                      />
                      
                      {filteredContent.length > 0 && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-netflix-darkgray border border-netflix-gray/20 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredContent.map(item => (
                            <div 
                              key={`${item.type}-${item.id}`} 
                              className="p-2 hover:bg-netflix-red/20 cursor-pointer flex justify-between"
                              onClick={() => selectContentItem(item)}
                            >
                              <span>{item.title}</span>
                              <span className="text-netflix-gray text-xs">{item.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {selectedContent && (
                      <div className="mt-4 p-4 border border-netflix-gray/20 rounded-md">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/3">
                            {selectedContent.posterUrl ? (
                              <img 
                                src={selectedContent.posterUrl} 
                                alt={selectedContent.title}
                                className="w-full aspect-[2/3] object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-black/50 flex items-center justify-center text-netflix-gray rounded">
                                No Image
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-medium">{selectedContent.title}</h3>
                            <p className="text-netflix-gray text-sm">Type: {selectedContent.type}</p>
                            
                            {selectedContent.posterUrl && (
                              <div className="mt-2">
                                <p className="text-sm text-netflix-gray">Current poster URL:</p>
                                <div className="flex mt-1">
                                  <code className="bg-black/30 p-2 rounded text-xs flex-1 overflow-x-auto">
                                    {selectedContent.posterUrl}
                                  </code>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="ml-2"
                                    onClick={() => copyToClipboard(selectedContent.posterUrl || '', selectedContent.title)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Image Mapping Section */}
                <Card className="bg-netflix-darkgray border-netflix-gray/20">
                  <CardHeader>
                    <CardTitle>Map Images to Content</CardTitle>
                    <CardDescription>Select an image to use for your selected content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Uploaded ${index + 1}`} 
                              className="rounded-md w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                              <Button 
                                variant="default"
                                size="sm"
                                className="w-full mb-1 bg-netflix-red hover:bg-netflix-red/80"
                                disabled={!selectedContent}
                                onClick={() => {
                                  if (selectedContent) {
                                    updateContentImage(url);
                                  }
                                }}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                {selectedContent ? "Save to content" : "Select content first"}
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  copyToClipboard(url);
                                }}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy URL
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-netflix-gray">
                        <p>No images uploaded yet. Go to Upload Images tab first.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="library">
              <Card className="bg-netflix-darkgray border-netflix-gray/20">
                <CardHeader>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>Browse and manage all content images</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContentLibrary />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">About Cloud Storage Options</h2>
            <Card className="bg-netflix-darkgray border-netflix-gray/20">
              <CardContent className="pt-6">
                <h3 className="text-xl mb-3">Recommended Cloud Storage Options:</h3>
                <ol className="list-decimal pl-5 space-y-4">
                  <li>
                    <strong>Supabase Storage</strong> - Free tier includes 1GB storage and 2GB bandwidth. 
                    Perfect for small to medium projects with automatic CDN distribution.
                  </li>
                  <li>
                    <strong>Cloudinary</strong> - Free tier with 25GB storage, great for image optimization and transforms.
                  </li>
                  <li>
                    <strong>Firebase Storage</strong> - 5GB storage and 1GB daily transfer on free tier.
                  </li>
                  <li>
                    <strong>Amazon S3</strong> - Pay as you go starting with low costs, highly reliable but requires more setup.
                  </li>
                </ol>
                <p className="mt-4 text-sm text-netflix-gray">
                  Note: Currently images are stored in localStorage for persistence. For production, we recommend implementing 
                  Supabase Storage for a fully integrated solution.
                </p>
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
