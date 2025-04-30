
import { useState, useRef } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
}

export const ImageUploader = ({ onImageUploaded }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Track upload start in PostHog
    if (window.posthog) {
      window.posthog.capture('image_upload_started', {
        fileType: file.type,
        fileSize: file.size
      });
    }
    
    // Create a local URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    // Simulate upload delay for better UX feedback
    setTimeout(() => {
      setPreview(objectUrl);
      setIsUploading(false);
      
      // In a real app, you would upload the file to a server/storage here
      // For now, we'll just use the local URL
      if (onImageUploaded) {
        onImageUploaded(objectUrl);
      }
      
      toast({
        title: "Image uploaded successfully",
        description: "You can now use this image for your content."
      });
      
      // Track successful upload in PostHog
      if (window.posthog) {
        window.posthog.capture('image_upload_complete', {
          fileType: file.type,
          fileSize: file.size
        });
      }
    }, 1000);
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
    if (window.posthog) {
      window.posthog.capture('image_removed');
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md relative">
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-auto rounded-md object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-center text-sm text-gray-400">
              {isUploading ? 'Uploading...' : 'Click to upload an image'}
            </p>
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
          <p>Your image is ready to use. Copy the URL or use the callback function.</p>
        ) : (
          <p>Upload an image to get a URL you can use for movie/series thumbnails.</p>
        )}
      </div>
    </div>
  );
};
