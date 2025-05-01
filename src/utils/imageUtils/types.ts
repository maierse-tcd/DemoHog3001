
import { Content } from "../../data/mockData";

// Image size configurations - consistently use landscape format
export const IMAGE_SIZES = {
  poster: { width: 600, height: 900 },  // Only used when explicitly needed
  backdrop: { width: 1280, height: 720 }, // 16:9 aspect ratio
  thumbnail: { width: 480, height: 270 }  // 16:9 aspect ratio
};

export type ImageType = 'poster' | 'backdrop' | 'thumbnail';

// Default placeholder images when no image is available - only for fallback on image load errors
export const DEFAULT_IMAGES = {
  poster: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='900' viewBox='0 0 600 900'%3E%3Crect width='600' height='900' fill='%23333'/%3E%3Ctext x='300' y='450' font-family='sans-serif' font-size='24' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E",
  backdrop: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%23333'/%3E%3Ctext x='640' y='360' font-family='sans-serif' font-size='24' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E",
  thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='270' viewBox='0 0 480 270'%3E%3Crect width='480' height='270' fill='%23333'/%3E%3Ctext x='240' y='135' font-family='sans-serif' font-size='18' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
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
