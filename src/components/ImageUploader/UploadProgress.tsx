import React from 'react';
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
      <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
      <div className="w-48 bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-white h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-white text-sm">{progress}%</p>
    </div>
  );
};