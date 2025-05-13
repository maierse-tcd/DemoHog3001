
import React, { useCallback, useState } from 'react';
import { UploadPlaceholder } from './UploadPlaceholder';
import { ImagePreview } from './ImagePreview';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  previewUrl?: string;
  label?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  contentId?: string;
  imageType?: 'poster' | 'backdrop' | 'thumbnail';
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  onImageUploaded?: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  previewUrl,
  label = 'Upload Image',
  className = '',
  accept = 'image/*',
  maxSizeMB = 5,
  contentId,
  imageType = 'backdrop',
  onImageUploaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateAndProcessFile = useCallback((file: File) => {
    // Reset error state
    setError(null);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
    
    // Simulate upload process
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        
        // Call the parent's callback if provided
        if (onImageUploaded && preview) {
          onImageUploaded(preview);
        }
      }
    }, 300);
    
    // Pass file to parent component
    onImageSelect(file);
  }, [maxSizeMB, onImageSelect, onImageUploaded, preview]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [validateAndProcessFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  }, [validateAndProcessFile]);

  const removeImage = useCallback(() => {
    setPreview(undefined);
    // You might want to notify the parent component that the image was removed
  }, []);

  // Adjust for existing user authentication status - default to true for this example
  const canUpload = true;

  return (
    <div className={`w-full ${className}`}>
      {preview ? (
        <ImagePreview 
          preview={preview} 
          imageType={imageType}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onClear={removeImage} 
        />
      ) : (
        <UploadPlaceholder
          isUploading={isUploading}
          canUpload={canUpload}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.onchange = (e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>);
            input.click();
          }}
        />
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
