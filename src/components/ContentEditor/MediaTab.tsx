
import React from 'react';
import { Label } from '../ui/label';
import { ImageIcon, RefreshCcw, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageUploader } from '../ImageUploader';
import { MediaGallery } from './MediaGallery';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { loadImagesFromStorage, filterUniqueImages } from '../../utils/imageUtils/urlUtils';
import { toast } from '../../hooks/use-toast';

interface MediaTabProps {
  backdropUrl: string;
  isLoadingImages: boolean;
  availableImages: string[];
  contentId: string;
  onRefreshImages: () => void;
  onBackdropChange: (url: string) => void;
  onImageUploaded: (url: string) => void;
  onImageDelete: (url: string) => void;
  isDeleting: boolean;
}

export const MediaTab: React.FC<MediaTabProps> = ({ 
  backdropUrl, 
  isLoadingImages,
  availableImages,
  contentId,
  onRefreshImages,
  onBackdropChange,
  onImageUploaded,
  onImageDelete,
  isDeleting
}) => {
  // Only show filtered images
  const filteredImages = filterUniqueImages(availableImages);
  
  // Handle clearing the backdrop image
  const clearBackdrop = () => {
    console.log('Removing selected image');
    onBackdropChange('');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Content Image</h3>
          <div className="flex gap-2">
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
        </div>
        
        {/* Selected image preview */}
        <div className="mb-6 flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/2">
            <Label className="block mb-2">Preview</Label>
            <div className="aspect-video relative bg-black/40 rounded-md overflow-hidden">
              {backdropUrl ? (
                <div className="relative h-full">
                  <img 
                    src={backdropUrl} 
                    alt="Selected backdrop" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Preview image failed to load:', backdropUrl);
                      e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                    }}
                  />
                  <button
                    onClick={clearBackdrop}
                    className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-netflix-gray/30" />
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full sm:w-1/2">
            <Label className="block mb-2">Upload New Image</Label>
            <ImageUploader 
              contentId={contentId}
              imageType="backdrop"
              aspectRatio="landscape"
              onImageUploaded={(url) => {
                console.log('Image uploaded with URL:', url);
                onBackdropChange(url);
                onImageUploaded(url);
                
                // Show confirmation toast
                toast({
                  title: "Image uploaded",
                  description: "Your new image has been uploaded and selected."
                });
              }}
            />
          </div>
        </div>
        
        {/* Image gallery */}
        <div>
          <Label className="block mb-2">Choose from existing images</Label>
          <MediaGallery
            isLoadingImages={isLoadingImages}
            availableImages={filteredImages}
            selectedImageUrl={backdropUrl}
            onImageSelect={(url) => {
              console.log('Selected image URL from gallery:', url);
              onBackdropChange(url);
              
              // Show confirmation toast
              toast({
                title: "Image selected",
                description: "Your image selection has been updated."
              });
            }}
            onImageDelete={onImageDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </div>
  );
};
