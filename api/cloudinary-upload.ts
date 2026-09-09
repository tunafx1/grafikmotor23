import { createHash } from 'node:crypto';

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type SignedMediaUpload = {
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

export function readCloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  const direct = {
    cloudName: env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    apiKey: env.CLOUDINARY_API_KEY?.trim() || '',
    apiSecret: env.CLOUDINARY_API_SECRET?.trim() || '',
  };
  if (direct.cloudName && direct.apiKey && direct.apiSecret) return direct;

  const raw = env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'cloudinary:' || !parsed.hostname || !parsed.username || !parsed.password) return null;
    return {
      cloudName: decodeURIComponent(parsed.hostname),
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

export function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex');
}

export function createSignedMediaUpload(
  config: CloudinaryConfig,
  input: { userId: string; kind: 'image' | 'video'; contentHash: string; timestamp?: number },
): SignedMediaUpload {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(input.userId)) throw new Error('Geçersiz kullanıcı kimliği.');
  if (!/^[a-f0-9]{64}$/.test(input.contentHash)) throw new Error('Geçersiz medya özeti.');
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const folder = `grafik-motoru/${input.userId}`;
  const publicId = `${input.kind}-${input.contentHash}`;
  const signedParams = {
    folder,
    overwrite: 'true' as const,
    public_id: publicId,
    timestamp,
    unique_filename: 'false' as const,
  };
  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder,
    overwrite: signedParams.overwrite,
    publicId,
    signature: signCloudinaryParams(signedParams, config.apiSecret),
    timestamp,
    uniqueFilename: signedParams.unique_filename,
    // Keep the browser request on the application origin. Vercel's external
    // rewrite streams the body to Cloudinary and avoids client-side blockers.
    uploadUrl: `/cloudinary-upload/${input.kind}`,
  };
}
