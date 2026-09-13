/**
 * Image compression and validation utility for Phytoscan
 * Optimizes photos to fit safely inside Firestore document limits (< 300KB)
 * while preserving clear plant pathology detail for Gemini Vision.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photo.'
    };
  }

  const maxSizeBytes = 15 * 1024 * 1024; // 15MB upload threshold
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Image file is too large (exceeds 15MB). Please choose a smaller photo.'
    };
  }

  return { valid: true };
}

/**
 * Compresses an image data URI or File to an optimized JPEG data URI
 * Max dimensions: 800x800, quality: 0.75.
 * Yields crisp leaf foliage typically between 50KB and 150KB.
 */
export async function optimizeImageForPersistence(
  source: string | File | Blob,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let shouldRevoke = false;

    if (typeof source === 'string') {
      srcUrl = source;
    } else if (typeof Blob !== 'undefined' && source instanceof Blob) {
      srcUrl = URL.createObjectURL(source);
      shouldRevoke = true;
    } else {
      return reject(new Error('Invalid image source'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (shouldRevoke) URL.revokeObjectURL(srcUrl);
          return resolve({ dataUrl: srcUrl, mimeType: 'image/jpeg' });
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);

        resolve({
          dataUrl: compressedDataUrl,
          mimeType: 'image/jpeg'
        });
      } catch (e) {
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        // Fallback to source
        if (typeof source === 'string') {
          resolve({ dataUrl: source, mimeType: 'image/jpeg' });
        } else {
          reject(e);
        }
      }
    };

    img.onerror = (err) => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      reject(new Error('Failed to read or decode image. Please try another photo.'));
    };

    img.src = srcUrl;
  });
}
