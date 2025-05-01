
import React, { useEffect } from 'react';
import { Button } from '../ui/button';
import { RefreshCcw, Trash2, ImageIcon } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { filterUniqueImages, isSupabaseStorageUrl } from '../../utils/imageUtils/urlUtils';

interface GalleryViewProps {
  isLoadingImages: boolean;
  uploadedImages: string[];
  onRefreshImages: () => void;
  onDeleteImage: (url: string) => void;
  isDeleting: boolean;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  isLoadingImages,
  uploadedImages,
  onRefreshImages,
  onDeleteImage,
  isDeleting
}) => {
  // Only include URLs from our Supabase storage
  const filteredImages = filterUniqueImages(uploadedImages);
  
  useEffect(() => {
    // Log the filtered images for debugging
    console.log('GalleryView - Original images count:', uploadedImages.length);
    console.log('GalleryView - Filtered images count:', filteredImages.length);
    filteredImages.forEach((url, index) => {
      console.log(`GalleryView - Image ${index + 1}:`, url);
    });
  }, [uploadedImages, filteredImages]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Available Images</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefreshImages}
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
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredImages.map((url, index) => (
            <div key={`image-${index}-${url.slice(-8)}`} className="relative group">
              <div className="aspect-video w-full overflow-hidden rounded-md bg-netflix-gray/20">
                <img 
                  src={url} 
                  alt={`Uploaded ${index + 1}`} 
                  className="rounded-md w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', url);
                    e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteImage(url)}
                  disabled={isDeleting}
                  title="Delete image"
                  className="p-1 h-auto"
                >
                  {isDeleting ? (
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-netflix-gray">
          <div className="flex flex-col items-center">
            <ImageIcon className="h-10 w-10 text-netflix-gray/30 mb-3" />
            <p>No images uploaded yet. Add images by editing content.</p>
          </div>
        </div>
      )}
    </div>
  );
};
