import { useState, useRef } from 'react';
import { useToast } from '../../hooks/use-toast';
import { safeCapture } from '../../utils/posthogUtils';
import { uploadImageToSupabase } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { validateFileType, validateFileSize, sanitizeFileName, rateLimitCheck } from '../../utils/inputValidation';

interface UseImageUploadProps {
  onImageUploaded?: (imageUrl: string) => void;
  contentId?: string;
  imageType?: 'poster' | 'backdrop' | 'thumbnail';
  maxSizeMB?: number;
}

export const useImageUpload = ({
  onImageUploaded,
  contentId,
  imageType = 'backdrop',
  maxSizeMB = 5
}: UseImageUploadProps) => {
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

  const validateFile = (file: File): boolean => {
    // Rate limiting check - max 10 uploads per hour
    if (!rateLimitCheck('image_upload', 10, 60 * 60 * 1000)) {
      toast({
        title: "Upload limit reached",
        description: "Please wait before uploading more images.",
        variant: "destructive"
      });
      return false;
    }
    
    // Enhanced file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validateFileType(file, allowedTypes)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image file.",
        variant: "destructive"
      });
      return false;
    }
    
    // Enhanced file size validation
    if (!validateFileSize(file, maxSizeMB)) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSizeMB}MB.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Validate file name
    const sanitizedName = sanitizeFileName(file.name);
    if (sanitizedName !== file.name) {
      toast({
        title: "Invalid file name",
        description: "File name contains invalid characters.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!canUpload) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateFile(file)) return;
    
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

  return {
    preview,
    isUploading,
    uploadProgress,
    fileInputRef,
    canUpload,
    handleFileUpload,
    clearImage
  };
};