// Cache for image URLs to avoid repeated getPublicUrl calls
export const imageUrlCache = new Map<string, string>();

// Clear cache function for cleanup
export const clearImageCache = (): void => {
  imageUrlCache.clear();
};

// Get cached URL or generate new one
export const getCachedImageUrl = (imagePath: string, getPublicUrlFn: (path: string) => string): string => {
  // Check cache first
  if (imageUrlCache.has(imagePath)) {
    return imageUrlCache.get(imagePath)!;
  }
  
  // Generate new URL and cache it
  const imageUrl = getPublicUrlFn(imagePath);
  imageUrlCache.set(imagePath, imageUrl);
  
  return imageUrl;
};