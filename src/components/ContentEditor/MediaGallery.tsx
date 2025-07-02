
import React, { useEffect } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, CheckCircle, Trash2, ImageIcon } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { filterUniqueImages } from '../../utils/imageUtils/urlUtils';
import { LazyImage } from '../ui/lazy-image';

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
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-netflix-red" />
          <p className="text-sm text-gray-400">Loading images...</p>
        </div>
      </div>
    );
  }

  if (filteredImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border border-dashed border-gray-700/30 rounded-xl bg-gray-800/20 backdrop-blur-sm">
        <ImageIcon className="h-12 w-12 text-gray-600 mb-3" />
        <p className="text-center max-w-xs">No images available. Upload a new image using the uploader above.</p>
      </div>
    );
  }

  return (
    <ScrollArea className={compact ? "max-h-40" : "max-h-72"}>
      <div className={`grid ${compact ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} gap-3 p-1`}>
        {filteredImages.map((url, index) => (
          <div 
            key={`image-${index}-${url.slice(-8)}`}
            className={`
              relative aspect-video overflow-hidden rounded-lg cursor-pointer 
              transition-all duration-300 transform 
              ${selectedImageUrl === url 
                ? 'ring-2 ring-netflix-red shadow-lg shadow-netflix-red/20 scale-[1.02]' 
                : 'hover:ring-1 hover:ring-gray-500/50 hover:scale-[1.02]'
              }
            `}
            onClick={() => {
              console.log('Selected image URL in gallery:', url);
              onImageSelect(url);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <LazyImage
              src={url} 
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
              fallbackSrc={DEFAULT_IMAGES.backdrop}
              placeholder={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
            />
            
            <div className="absolute inset-0 flex justify-between items-start p-1">
              {selectedImageUrl === url && (
                <div className="bg-netflix-red rounded-full p-1 m-1">
                  <CheckCircle className={`${compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} text-white`} />
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageDelete(url);
                }}
                className="bg-black/70 p-1.5 rounded-full opacity-0 hover:opacity-100 transition-opacity ml-auto m-1 hover:bg-red-600"
                disabled={isDeleting}
                aria-label="Delete image"
              >
                <Trash2 className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-white`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
