import { auth } from './firebase';

type MediaKind = 'image' | 'video';

type SignedUploadResponse = {
  success: true;
  apiKey: string;
  cloudName: string;
  folder: string;
  overwrite: 'true';
  publicId: string;
  signature: string;
  timestamp: number;
  uniqueFilename: 'false';
  uploadUrl: string;
};

async function getUploadSignature(kind: MediaKind, contentHash: string): Promise<SignedUploadResponse> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw Object.assign(new Error('Medya yedeklemesi için kullanıcı oturumu bulunamadı.'), {code:'media/auth-required'});
  const response = await fetch('/api/media-upload-signature', {
    method: 'POST',
    headers: {'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({kind, contentHash}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw Object.assign(new Error(data?.error || 'Medya yedekleme bağlantısı kurulamadı.'), {code:data?.reason || 'media/signature-failed'});
  }
  return data;
}

export async function uploadCloudMedia(
  source: Blob,
  options: {kind: MediaKind; contentHash: string; fileName: string},
): Promise<string> {
  const maxBytes = 50 * 1024 * 1024;
  if (!source.size || source.size > maxBytes) {
    throw Object.assign(new Error('Medya dosyası boş veya 50 MB sınırını aşıyor.'), {code:'media/file-size'});
  }
  const signed = await getUploadSignature(options.kind, options.contentHash);
  const file = source instanceof File ? source : new File([source], options.fileName, {type:source.type});
  const form = new FormData();
  form.append('file', file, options.fileName);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('folder', signed.folder);
  form.append('public_id', signed.publicId);
  form.append('overwrite', signed.overwrite);
  form.append('unique_filename', signed.uniqueFilename);

  const response = await fetch(signed.uploadUrl, {method:'POST', body:form, credentials:'same-origin'});
  const result = await response.json().catch(() => null);
  if (!response.ok || typeof result?.secure_url !== 'string') {
    throw Object.assign(new Error(result?.error?.message || 'Medya Cloudinary’ye yüklenemedi.'), {code:'media/upload-failed'});
  }
  const expectedPrefix = `https://res.cloudinary.com/${encodeURIComponent(signed.cloudName)}/`;
  if (!result.secure_url.startsWith(expectedPrefix)) {
    throw Object.assign(new Error('Medya hizmeti beklenmeyen bir bağlantı döndürdü.'), {code:'media/invalid-url'});
  }
  return result.secure_url;
}

export async function dataUrlToBlob(value: string): Promise<Blob> {
  const response = await fetch(value);
  if (!response.ok) throw new Error('Görsel verisi hazırlanamadı.');
  return response.blob();
}
