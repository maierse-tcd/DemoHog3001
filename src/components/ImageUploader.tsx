
import { useState, useRef } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { safeCapture } from '../utils/posthogUtils';
import { uploadImageToSupabase, IMAGE_SIZES } from '../utils/imageUtils';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

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
  imageType = 'poster',
  className = '',
  aspectRatio = 'portrait'
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isLoggedIn, user, userEmail } = useAuth();
  
  // Check if user has PostHog email
  const isPostHogUser = userEmail?.endsWith('@posthog.com') || false;
  const canUpload = isLoggedIn && (isPostHogUser || !!user?.id);
  
  // Determine aspect ratio CSS classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'landscape':
        return 'aspect-video';
      case 'square':
        return 'aspect-square';
      case 'portrait':
      default:
        return 'aspect-[2/3]';
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
      setUploadProgress(80);
      
      // If we have a contentId, save metadata
      if (contentId) {
        const { width, height } = IMAGE_SIZES[imageType];
        
        await supabase.from('content_images').insert({
          content_id: contentId,
          image_path: imageUrl,
          image_type: imageType,
          width,
          height,
          original_filename: file.name,
          mime_type: file.type,
          user_id: user?.id || '' // Use the user ID if available
        });
      }
      
      setUploadProgress(100);
      
      // Callback with the uploaded image URL
      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }
      
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
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`w-full max-w-md relative ${getAspectRatioClass()}`}>
        {preview ? (
          <div className="relative h-full">
            <img 
              src={preview} 
              alt="Preview" 
              className={`w-full h-full rounded-md object-cover ${isUploading ? 'opacity-50' : ''}`}
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
            className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer h-full ${isUploading ? 'opacity-50' : ''}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                <p className="text-center text-sm text-gray-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-center text-sm text-gray-400">
                  Click to upload an image
                </p>
                <p className="text-center text-xs text-gray-400 mt-1">
                  Recommended: {IMAGE_SIZES[imageType].width}x{IMAGE_SIZES[imageType].height}
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
          disabled={isUploading}
        />
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        {preview ? (
          <p>Your image will be automatically resized to fit the recommended dimensions.</p>
        ) : (
          <p>Original images will be resized to fit the required dimensions.</p>
        )}
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

