import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { safeCapture } from '../utils/posthogUtils';
import { uploadImageToSupabase, IMAGE_SIZES } from '../utils/imageUtils';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_IMAGES } from '../utils/imageUtils';

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
      
      // Automatically clear the preview after a successful upload
      setTimeout(() => {
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
      
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
