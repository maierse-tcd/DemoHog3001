
import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';

interface ImagePreviewProps {
  preview: string;
  imageType: 'poster' | 'backdrop' | 'thumbnail';
  isUploading: boolean;
  uploadProgress: number;
  onClear: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  preview, 
  imageType, 
  isUploading, 
  uploadProgress, 
  onClear 
}) => {
  return (
    <div className="relative h-full">
      <img 
        src={preview} 
        alt="Preview" 
        className={`w-full h-full rounded-md object-cover ${isUploading ? 'opacity-50' : ''}`}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_IMAGES[imageType];
        }}
      />
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
          <div className="w-48 bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-white h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-white text-sm">{uploadProgress}%</p>
        </div>
      )}
      {!isUploading && (
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  );
};
