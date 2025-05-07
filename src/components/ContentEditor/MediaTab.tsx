
import React from 'react';
import { Label } from '../ui/label';
import { ImageIcon, RefreshCcw, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageUploader } from '../ImageUploader';
import { MediaGallery } from './MediaGallery';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
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
  // Handle clearing the backdrop image
  const clearBackdrop = () => {
    console.log('Removing selected image');
    onBackdropChange('');
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-medium text-white">Featured Image</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshImages}
            disabled={isLoadingImages}
            className="bg-gray-800/60 border-gray-700/30 hover:bg-gray-700 backdrop-blur-sm"
          >
            <RefreshCcw className={`h-4 w-4 mr-1.5 ${isLoadingImages ? 'animate-spin' : ''}`} />
            Refresh Images
          </Button>
        </div>
        
        {/* Selected image preview with card-like design */}
        <div className="mb-8">
          <Label className="block mb-2 text-sm font-medium text-white/90">Preview</Label>
          <div className="aspect-video relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/30">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <button
                  onClick={clearBackdrop}
                  className="absolute top-3 right-3 bg-black/70 p-2 rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <ImageIcon className="h-16 w-16 text-gray-600" />
                <p>No image selected</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Image uploader with improved design */}
        <div className="mb-8">
          <Label className="block mb-2 text-sm font-medium text-white/90">Upload New Image</Label>
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/30 rounded-xl p-5">
            <ImageUploader 
              contentId={contentId}
              imageType="backdrop"
              aspectRatio="landscape"
              onImageUploaded={(url) => {
                console.log('Image uploaded with URL:', url);
                onBackdropChange(url);
                onImageUploaded(url);
                
                toast({
                  title: "Image uploaded",
                  description: "Your new image has been uploaded and selected."
                });
              }}
            />
          </div>
        </div>
        
        {/* Image gallery with improved design */}
        <div>
          <Label className="block mb-3 text-sm font-medium text-white/90">Image Library</Label>
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/20 rounded-xl p-4">
            <MediaGallery
              isLoadingImages={isLoadingImages}
              availableImages={availableImages}
              selectedImageUrl={backdropUrl}
              onImageSelect={(url) => {
                console.log('Selected image URL from gallery:', url);
                onBackdropChange(url);
                
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
    </div>
  );
};
