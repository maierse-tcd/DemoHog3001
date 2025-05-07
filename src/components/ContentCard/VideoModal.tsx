
import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onOpenChange, videoUrl, title }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-none max-w-4xl w-[90vw] p-0">
        <div className="relative aspect-video bg-black">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/90 hover:bg-black text-white rounded-full transition-colors"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <iframe 
            src={`${videoUrl}?autoplay=1`}
            className="w-full h-full bg-black" /* Add black background */
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
