/** File picker filter that also lets iPhone HEIC/HEIF photos through. */
export const IMAGE_ACCEPT = 'image/*,.heic,.heif';

/**
 * Detects HEIC/HEIF photos. Windows and most browsers report an empty MIME type
 * for these files, so the extension is checked as well.
 */
export function isHeicFile(file: File): boolean {
  return /^image\/hei[cf](-sequence)?$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

/** True for any image the app can accept, including HEIC files that will be converted. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isHeicFile(file);
}

/**
 * Browsers other than Safari cannot decode HEIC, so convert it to JPEG before
 * it enters the pipeline. Other files are returned unchanged. The decoder is
 * loaded lazily because it is a large WASM bundle.
 */
export async function normalizeImageFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  const { heicTo } = await import('heic-to');
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 });
  const name = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
}
