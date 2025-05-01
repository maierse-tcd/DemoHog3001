
import React from 'react';
import { Label } from '../ui/label';
import { ImageIcon, RefreshCcw, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageUploader } from '../ImageUploader';
import { MediaGallery } from './MediaGallery';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';

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
                      e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                    }}
                  />
                  <button
                    onClick={() => onBackdropChange('')}
                    className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full hover:bg-black"
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
                onBackdropChange(url);
                onImageUploaded(url);
              }}
            />
          </div>
        </div>
        
        {/* Image gallery */}
        <div>
          <Label className="block mb-2">Choose from existing images</Label>
          <MediaGallery
            isLoadingImages={isLoadingImages}
            availableImages={availableImages}
            selectedImageUrl={backdropUrl}
            onImageSelect={(url) => onBackdropChange(url)}
            onImageDelete={onImageDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </div>
  );
};
