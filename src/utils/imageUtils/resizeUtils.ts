
// Function to resize an image client-side before upload
export const resizeImage = async (
  file: File, 
  targetWidth: number, 
  targetHeight: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // For landscape images (preferred), maintain aspect ratio and center crop
        const aspectRatio = img.width / img.height;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        // Center crop to fit target dimensions while maintaining aspect ratio
        if (aspectRatio > targetWidth / targetHeight) {
          // Image is wider than target aspect ratio
          drawWidth = targetHeight * aspectRatio;
          offsetX = -(drawWidth - targetWidth) / 2;
        } else {
          // Image is taller than target aspect ratio
          drawHeight = targetWidth / aspectRatio;
          offsetY = -(drawHeight - targetHeight) / 2;
        }
        
        // Draw with the calculated dimensions and offsets
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to blob with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, file.type, 0.9); // Higher quality (0.9)
      };
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    reader.onerror = () => reject(new Error('File reading failed'));
  });
};
