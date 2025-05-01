
import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadPlaceholderProps {
  isUploading: boolean;
  canUpload: boolean;
  onClick: () => void;
}

export const UploadPlaceholder: React.FC<UploadPlaceholderProps> = ({ 
  isUploading, 
  canUpload, 
  onClick 
}) => {
  return (
    <div 
      className={`border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer h-full ${isUploading ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
          <p className="text-center text-sm text-gray-400">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-center text-sm text-gray-400">
            {canUpload ? "Click to upload" : "Sign in to upload"}
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            Landscape format recommended
          </p>
        </>
      )}
    </div>
  );
};
