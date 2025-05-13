
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
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  previewUrl,
  label = 'Upload Image',
  className = '',
  accept = 'image/*',
  maxSizeMB = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);

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
    
    // Pass file to parent component
    onImageSelect(file);
  }, [maxSizeMB, onImageSelect]);

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

  return (
    <div className={`w-full ${className}`}>
      {preview ? (
        <ImagePreview 
          previewUrl={preview} 
          onRemove={removeImage} 
          label={label}
        />
      ) : (
        <UploadPlaceholder
          isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          handleFileChange={handleFileChange}
          label={label}
          accept={accept}
          error={error}
        />
      )}
    </div>
  );
};
