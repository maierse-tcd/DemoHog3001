
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ImageUploader } from '../components/ImageUploader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const ImageManager = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImages([...uploadedImages, imageUrl]);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('URL copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy URL:', err);
      });
  };
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Image Manager</h1>
          
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
                  After uploading, you can use the URL to update your content in the mockData.ts file.
                </p>
                <code className="bg-black/30 p-2 rounded text-xs w-full overflow-x-auto">
                  posterUrl: "{uploadedImages[uploadedImages.length - 1] || 'your-image-url'}"
                </code>
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
              <CardFooter>
                <p className="text-xs text-netflix-gray">
                  Note: In this demo, images are stored locally. In a production environment, you would use a cloud storage service.
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">How to Use Custom Images</h2>
            <Card className="bg-netflix-darkgray border-netflix-gray/20">
              <CardContent className="pt-6">
                <ol className="list-decimal pl-5 space-y-4">
                  <li>Upload your image using the uploader above</li>
                  <li>Copy the URL of the uploaded image</li>
                  <li>Open src/data/mockData.ts in your code editor</li>
                  <li>Find the content item you want to update</li>
                  <li>Replace the posterUrl and/or backdropUrl with your new image URL</li>
                  <li>Save the file and refresh the page</li>
                </ol>
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
