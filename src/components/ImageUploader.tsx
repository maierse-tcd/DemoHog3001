
import { useState, useRef } from 'react';
import { Upload, Image, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
}

export const ImageUploader = ({ onImageUploaded }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // In a real app, you would upload the file to a server/storage here
    // For now, we'll just use the local URL
    if (onImageUploaded) {
      onImageUploaded(objectUrl);
    }
  };
  
  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-center text-sm text-gray-400">
              Click to upload an image
            </p>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
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
