/**
 * Image resizing utilities for client-side image processing
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

/**
 * Resizes an image file while maintaining aspect ratio
 * @param file - The image file to resize
 * @param options - Resize options
 * @returns Promise that resolves to the resized file
 */
export const resizeImage = (
  file: File, 
  options: ResizeOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = file.type
  } = options;

  return new Promise((resolve, reject) => {
    // Validate that it's an image file
    if (!file.type.startsWith('image/')) {
      resolve(file); // Return original file if not an image
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Clean up object URL
        URL.revokeObjectURL(objectUrl);

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        // Only resize if image is larger than target dimensions
        if (width <= maxWidth && height <= maxHeight) {
          resolve(file); // Return original file if already small enough
          return;
        }
        
        // Calculate scaling factor
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate new dimensions
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and resize image with high quality
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file with resized image
            const resizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            // Fallback to original file if blob creation fails
            resolve(file);
          }
        }, format, quality);
        
      } catch (error) {
        console.warn('Error during image resize:', error);
        resolve(file); // Fallback to original file
      }
    };
    
    img.onerror = (error) => {
      console.warn('Error loading image for resize:', error);
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file
    };

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
};

/**
 * Resizes multiple image files
 * @param files - Array of files to resize
 * @param options - Resize options
 * @returns Promise that resolves to array of resized files
 */
export const resizeImages = async (
  files: File[], 
  options: ResizeOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map(file => resizeImage(file, options)));
};

/**
 * Gets image dimensions without loading the full image
 * @param file - The image file
 * @returns Promise that resolves to {width, height}
 */
export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converts an image file to a different format
 * @param file - The image file to convert
 * @param targetFormat - Target MIME type (e.g., 'image/webp')
 * @param quality - Quality for lossy formats (0-1)
 * @returns Promise that resolves to the converted file
 */
export const convertImageFormat = (
  file: File, 
  targetFormat: string, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const convertedFile = new File([blob], file.name, {
            type: targetFormat,
            lastModified: Date.now()
          });
          resolve(convertedFile);
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, targetFormat, quality);
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates image file type and size
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result
 */
export const validateImageFile = (
  file: File,
  options: {
    allowedTypes?: string[];
    maxSizeBytes?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<{valid: boolean, errors: string[]}> => {
  const {
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSizeBytes = 5 * 1024 * 1024, // 5MB
    minWidth = 0,
    minHeight = 0,
    maxWidth = Infinity,
    maxHeight = Infinity
  } = options;

  return new Promise(async (resolve) => {
    const errors: string[] = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      errors.push(`File size too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Check image dimensions if it's an image
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await getImageDimensions(file);
        
        if (dimensions.width < minWidth) {
          errors.push(`Image width too small. Minimum width: ${minWidth}px`);
        }
        
        if (dimensions.height < minHeight) {
          errors.push(`Image height too small. Minimum height: ${minHeight}px`);
        }
        
        if (dimensions.width > maxWidth) {
          errors.push(`Image width too large. Maximum width: ${maxWidth}px`);
        }
        
        if (dimensions.height > maxHeight) {
          errors.push(`Image height too large. Maximum height: ${maxHeight}px`);
        }
      } catch (error) {
        errors.push('Failed to read image dimensions');
      }
    }

    resolve({
      valid: errors.length === 0,
      errors
    });
  });
};
