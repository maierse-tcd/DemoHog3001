
import React, { useEffect } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, CheckCircle, Trash2, ImageIcon } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { filterUniqueImages } from '../../utils/imageUtils/urlUtils';

interface MediaGalleryProps {
  isLoadingImages: boolean;
  availableImages: string[];
  selectedImageUrl: string;
  onImageSelect: (url: string) => void;
  onImageDelete: (url: string) => void;
  isDeleting: boolean;
  compact?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  isLoadingImages, 
  availableImages, 
  selectedImageUrl, 
  onImageSelect,
  onImageDelete,
  isDeleting,
  compact = false
}) => {
  // Apply the same successful filtering approach we used before
  const filteredImages = filterUniqueImages([...new Set(availableImages)]);
  
  useEffect(() => {
    // Log the filtered images for debugging
    console.log('MediaGallery - Available images count:', availableImages.length);
    console.log('MediaGallery - Filtered images count:', filteredImages.length);
    console.log('MediaGallery - Selected image URL:', selectedImageUrl);
  }, [filteredImages, selectedImageUrl, availableImages]);
  
  if (isLoadingImages) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-netflix-gray" />
      </div>
    );
  }

  if (filteredImages.length === 0) {
    return (
      <div className="text-center py-8 text-netflix-gray border border-dashed border-netflix-gray/30 rounded-md">
        <div className="flex flex-col items-center">
          <ImageIcon className="h-10 w-10 text-netflix-gray/30 mb-3" />
          <p>No images available. Upload a new image using the uploader above.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={compact ? "max-h-40" : "max-h-60"}>
      <div className={`grid ${compact ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} gap-2 p-1`}>
        {filteredImages.map((url, index) => (
          <div 
            key={`image-${index}-${url.slice(-8)}`}
            className={`${compact ? "aspect-video" : "aspect-video"} cursor-pointer relative group overflow-hidden rounded-md ${
              selectedImageUrl === url ? 'ring-2 ring-netflix-red' : 'hover:ring-1 hover:ring-netflix-gray/50'
            }`}
            onClick={() => {
              console.log('Selected image URL in gallery:', url);
              onImageSelect(url);
            }}
          >
            <img 
              src={url} 
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', url);
                e.currentTarget.src = DEFAULT_IMAGES.backdrop;
              }}
            />
            <div className="absolute inset-0 flex justify-between items-start p-1">
              {selectedImageUrl === url && (
                <div className="bg-netflix-red rounded-full p-1">
                  <CheckCircle className={`${compact ? "h-2 w-2" : "h-3 w-3"} text-white`} />
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageDelete(url);
                }}
                className="bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                disabled={isDeleting}
                aria-label="Delete image"
              >
                <Trash2 className={`${compact ? "h-2 w-2" : "h-3 w-3"} text-white`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
