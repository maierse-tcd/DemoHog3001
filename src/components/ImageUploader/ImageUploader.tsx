import { useState, useRef } from 'react';
import { useToast } from '../../hooks/use-toast';
import { safeCapture } from '../../utils/posthogUtils';
import { uploadImageToSupabase, IMAGE_SIZES } from '../../utils/imageUtils';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { ImagePreview } from './ImagePreview';
import { UploadPlaceholder } from './UploadPlaceholder';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  contentId?: string;
  imageType?: 'poster' | 'backdrop' | 'thumbnail';
  className?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export const ImageUploader = ({ 
  onImageUploaded, 
  contentId, 
  imageType = 'backdrop',
  className = '',
  aspectRatio = 'landscape'
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userEmail } = useAuth();
  
  // Check if user has PostHog email
  const userEmailValue = userEmail || '';
  const isPostHogUser = userEmailValue?.endsWith('@posthog.com') || false;
  const canUpload = isPostHogUser || !!user?.id;
  
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
    
    if (!canUpload) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.).",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Create a local URL for preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploadProgress(20);
      
      // Track upload start in PostHog
      safeCapture('image_upload_started', {
        fileType: file.type,
        fileSize: file.size,
        contentId: contentId || 'none',
        imageType
      });
      
      // Upload to Supabase storage
      setUploadProgress(40);
      const imageUrl = await uploadImageToSupabase(file, imageType, contentId);
      setUploadProgress(90);
      
      // Callback with the uploaded image URL
      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }
      
      setUploadProgress(100);
      
      toast({
        title: "Image uploaded successfully",
        description: "You can now use this image for your content."
      });
      
      // Track successful upload in PostHog
      safeCapture('image_upload_complete', {
        fileType: file.type,
        fileSize: file.size,
        contentId: contentId || 'none',
        imageType
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive"
      });
      
      // Track upload failure in PostHog
      safeCapture('image_upload_failed', {
        error: String(error),
        contentId: contentId || 'none',
        imageType
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Track image removal in PostHog
    safeCapture('image_removed', {
      contentId: contentId || 'none',
      imageType
    });
  };

  const handleInputClick = () => {
    if (!isUploading && canUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`w-full relative ${getAspectRatioClass()}`}>
        {preview ? (
          <ImagePreview 
            preview={preview} 
            imageType={imageType} 
            isUploading={isUploading} 
            uploadProgress={uploadProgress} 
            onClear={clearImage}
          />
        ) : (
          <UploadPlaceholder 
            isUploading={isUploading} 
            canUpload={canUpload} 
            onClick={handleInputClick}
          />
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
