import { storeVideo } from '../lib/mediaStore';
import { SequenceMediaItem } from '../types';

/**
 * Checks whether a given file or URL is a video
 */
export function isMediaVideo(fileOrUrl: string | File): boolean {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl !== 'string') {
    return fileOrUrl.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv)$/i.test(fileOrUrl.name);
  }
  return /\.(mp4|mov|webm|m4v|mkv)(\?.*)?$/i.test(fileOrUrl) || fileOrUrl.startsWith('data:video');
}

/**
 * Compresses an image file to a lightweight data URL using offscreen HTML5 Canvas
 */
export function compressImageFile(
  file: File,
  maxWidth: number = 3840,
  maxHeight: number = 3840,
  quality: number = 0.95
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width || 800;
        let height = img.height || 800;

        if (width > maxWidth || height > maxHeight) {
          const ratio = width / height;
          if (ratio > 1) {
            width = maxWidth;
            height = Math.round(maxWidth / ratio);
          } else {
            height = maxHeight;
            width = Math.round(maxHeight * ratio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mimeType, isPng ? undefined : quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a high-quality JPEG snapshot (poster frame) from an MP4/WebM video file or Blob URL
 */
export function extractVideoSnapshot(
  videoSource: File | Blob | string,
  targetTime: number = 1.0,
  maxDimension: number = 1000
): Promise<{ thumbnailUrl: string; duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    let isResolved = false;
    let sourceDuration = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      sourceDuration = duration;
      const seekTime = duration > 0 ? Math.min(targetTime, duration * 0.5) : 0;
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      if (isResolved) return;
      isResolved = true;

      try {
        let width = video.videoWidth || 720;
        let height = video.videoHeight || 1280;

        if (width > maxDimension || height > maxDimension) {
          const ratio = width / height;
          if (ratio > 1) {
            width = maxDimension;
            height = Math.round(maxDimension / ratio);
          } else {
            height = maxDimension;
            width = Math.round(maxDimension * ratio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.80);
          cleanup();
          resolve({
            thumbnailUrl,
            duration: sourceDuration,
            width,
            height
          });
        } else {
          cleanup();
          reject(new Error('Canvas context could not be created for video snapshot'));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      if (isResolved) return;
      isResolved = true;
      const message = video.error?.message || 'Desteklenmeyen video biçimi';
      cleanup();
      reject(new Error(`Video yüklenirken hata oluştu: ${message}`));
    };

    // Safety timeout in case seeked event never fires (e.g. unsupported codec)
    timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(new Error('Video karesi çıkarılırken zaman aşımı oluştu.'));
      }
    }, 6000);
  });
}

/**
 * Creates a normalized SequenceMediaItem from an uploaded File (Image or Video)
 */
export async function createSequenceMediaItem(file: File): Promise<SequenceMediaItem> {
  const isVideo = isMediaVideo(file);
  const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (isVideo) {
    const { thumbnailUrl, duration } = await extractVideoSnapshot(file, 1.0, 1080);
    const stored = await storeVideo(file);
    return {id, type:'video', mediaId:stored.id, file, url:stored.url, thumbnailUrl, duration, originalName:file.name};
  } else {
    // Store original image in IndexedDB without downscaling or compression, preserving 100% full quality
    try {
      const stored = await storeVideo(file);
      // Generate a fast thumbnail strictly for filmstrip preview and AI brief prompt
      let thumbnailUrl = stored.url;
      try {
        thumbnailUrl = await compressImageFile(file, 800, 800, 0.82);
      } catch {
        thumbnailUrl = stored.url;
      }
      return {
        id,
        type: 'image',
        mediaId: stored.id,
        file,
        url: stored.url, // Original full-resolution object URL
        thumbnailUrl,    // Thumbnail strictly for UI previews
        originalName: file.name
      };
    } catch (err) {
      console.warn('Image store fallback:', err);
      const fallbackUrl = URL.createObjectURL(file);
      return {
        id,
        type: 'image',
        file,
        url: fallbackUrl,
        thumbnailUrl: fallbackUrl,
        originalName: file.name
      };
    }
  }
}
