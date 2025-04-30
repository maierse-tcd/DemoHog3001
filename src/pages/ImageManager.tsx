
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ImageUploader } from '../components/ImageUploader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { mockMovies, mockSeries } from '../data/mockData';
import { Input } from '../components/ui/input';
import { Search, Copy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const ImageManager = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState<Array<{id: string, title: string, type: string, posterUrl?: string}>>([]);
  const [selectedContent, setSelectedContent] = useState<{id: string, title: string, type: string, posterUrl?: string} | null>(null);
  const { toast } = useToast();
  
  // Combine movies and series for searching
  useEffect(() => {
    const allContent = [
      ...mockMovies.map(movie => ({ ...movie, type: 'movie' })),
      ...mockSeries.map(series => ({ ...series, type: 'series' }))
    ];
    
    if (searchTerm) {
      const filtered = allContent.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContent(filtered);
    } else {
      setFilteredContent([]);
    }
  }, [searchTerm]);
  
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
  
  const selectContentItem = (item: typeof filteredContent[0]) => {
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
  
  const getCodeSnippet = (imageUrl: string, contentType: string = 'movie') => {
    if (selectedContent) {
      return `// Update in mockData.ts
const updated${contentType === 'movie' ? 'Movies' : 'Series'} = ${contentType === 'movie' ? 'mockMovies' : 'mockSeries'}.map(item => {
  if (item.id === "${selectedContent.id}") {
    return { ...item, posterUrl: "${imageUrl}" };
  }
  return item;
});`;
    }
    return `posterUrl: "${imageUrl}"`;
  };
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Image Manager</h1>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
              <TabsTrigger value="upload">Upload Images</TabsTrigger>
              <TabsTrigger value="map">Map to Content</TabsTrigger>
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
                                variant="outline"
                                size="sm"
                                className="w-full mb-1"
                                disabled={!selectedContent}
                                onClick={() => {
                                  if (selectedContent) {
                                    copyToClipboard(url, selectedContent.title);
                                  }
                                }}
                              >
                                Use for {selectedContent?.title || "selected content"}
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  copyToClipboard(getCodeSnippet(url, selectedContent?.type || 'movie'));
                                }}
                              >
                                Copy code
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
                  <CardFooter>
                    <p className="text-xs text-netflix-gray">
                      Note: This tool helps you map images to content by generating code snippets. You'll still need to update the mockData.ts file with the changes.
                    </p>
                  </CardFooter>
                </Card>
              </div>
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
                  Note: In the current demo, images are stored locally in the browser. For a production environment, 
                  you would implement image upload to one of these cloud services.
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
