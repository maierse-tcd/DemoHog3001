
import { Content } from "../../data/mockData";

// Image size configurations - consistently use landscape format
export const IMAGE_SIZES = {
  poster: { width: 600, height: 900 },  // Only used when explicitly needed
  backdrop: { width: 1280, height: 720 }, // 16:9 aspect ratio
  thumbnail: { width: 480, height: 270 }  // 16:9 aspect ratio
};

export type ImageType = 'poster' | 'backdrop' | 'thumbnail';

// Default placeholder images when no image is available
export const DEFAULT_IMAGES = {
  poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600&h=900",
  backdrop: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1280&h=720",
  thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=480&h=270"
};

export interface ImageMetadata {
  content_id: string;
  image_path: string;
  image_type: ImageType;
  width: number;
  height: number;
  original_filename: string;
  mime_type: string;
  user_id: string;
}
