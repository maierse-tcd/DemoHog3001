import React from 'react';
import { Button } from '../ui/button';
import { useImageUpload } from './useImageUpload';
import { UploadProgress } from './UploadProgress';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { X } from 'lucide-react';

interface SimpleImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  contentId?: string;
  imageType?: 'poster' | 'backdrop' | 'thumbnail';
  className?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export const SimpleImageUploader = ({ 
  onImageUploaded, 
  contentId, 
  imageType = 'backdrop',
  className = '',
  aspectRatio = 'landscape'
}: SimpleImageUploaderProps) => {
  const {
    preview,
    isUploading,
    uploadProgress,
    fileInputRef,
    canUpload,
    handleFileUpload,
    clearImage
  } = useImageUpload({ onImageUploaded, contentId, imageType });
  
  // Determine aspect ratio CSS classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[2/3]';
      case 'square':
        return 'aspect-square';
      case 'landscape':
      default:
        return 'aspect-video';
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await handleFileUpload(file);
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`w-full relative ${getAspectRatioClass()}`}>
        {preview ? (
          <div className="relative h-full">
            <img 
              src={preview} 
              alt="Preview" 
              className={`w-full h-full rounded-md object-cover ${isUploading ? 'opacity-50' : ''}`}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGES[imageType];
              }}
            />
            {isUploading && <UploadProgress progress={uploadProgress} />}
            {!isUploading && (
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer h-full ${isUploading ? 'opacity-50' : ''}`}
            onClick={() => !isUploading && canUpload && fileInputRef.current?.click()}
          >
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                {canUpload ? "Click to upload" : "Sign in to upload"}
              </p>
              <p className="text-xs text-gray-500">
                Landscape format recommended
              </p>
            </div>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading || !canUpload}
        />
      </div>
      
      {!canUpload && (
        <Button 
          variant="outline" 
          size="sm"
          className="mt-2"
          onClick={() => window.location.href = '/login'}
        >
          Sign in to upload images
        </Button>
      )}
    </div>
  );
};