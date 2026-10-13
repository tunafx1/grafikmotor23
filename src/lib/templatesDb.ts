import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, auth, ensureUserSignIn, isValidConfig, enableFirestoreNetwork } from './firebase';
import { getVideoBlob, videoFileExtension } from './mediaStore';
import { dataUrlToBlob, uploadCloudMedia } from './cloudMedia';
import { DesignTemplate } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Cloud operation failed:', {code:(error as any)?.code || 'unknown', operationType, path});
  const wrapped = new Error(errInfo.error);
  Object.assign(wrapped, {code: (error as any)?.code});
  throw wrapped;
}

function mapRegion(r: any): any {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    x: Number(r.x),
    y: Number(r.y),
    width: Number(r.width),
    height: Number(r.height),
    backgroundColor: r.backgroundColor || 'transparent',
    opacity: Number(r.opacity ?? 1),
    borderColor: r.borderColor || 'transparent',
    borderWidth: Number(r.borderWidth ?? 0),
    borderRadius: Number(r.borderRadius ?? 0),
    isDynamic: Boolean(r.isDynamic),
    zIndex: Number(r.zIndex ?? 0),
    rotation: Number(r.rotation ?? 0),
    skewX: Number(r.skewX ?? 0),
    skewY: Number(r.skewY ?? 0),
    shadowColor: r.shadowColor || null,
    shadowBlur: Number(r.shadowBlur ?? 0),
    shadowOffsetX: Number(r.shadowOffsetX ?? 0),
    shadowOffsetY: Number(r.shadowOffsetY ?? 0),
    hasShadow: r.hasShadow !== undefined ? Boolean(r.hasShadow) : null,
    blendMode: r.blendMode || null,
    padding: Number(r.padding ?? 0),
    backgroundPaddingX: r.backgroundPaddingX !== undefined && r.backgroundPaddingX !== null ? Number(r.backgroundPaddingX) : null,
    backgroundPaddingY: r.backgroundPaddingY !== undefined && r.backgroundPaddingY !== null ? Number(r.backgroundPaddingY) : null,
    lockAspectRatio: r.lockAspectRatio !== undefined ? Boolean(r.lockAspectRatio) : null,
    hidden: r.hidden !== undefined ? Boolean(r.hidden) : false,
    locked: r.locked !== undefined ? Boolean(r.locked) : false,
    fitBackgroundToText: r.fitBackgroundToText !== undefined ? Boolean(r.fitBackgroundToText) : null,
    hasBackground: r.hasBackground !== undefined ? Boolean(r.hasBackground) : null,
    hasBorder: r.hasBorder !== undefined ? Boolean(r.hasBorder) : null,
    textRole: r.textRole || null,
    aiPrompt: r.aiPrompt || null,
    clipImage: r.clipImage !== undefined ? Boolean(r.clipImage) : null,
    objectFit: r.objectFit || null,
    placeholderText: r.placeholderText || null,
    placeholderImage: r.placeholderImage || null,
    textStyle: r.textStyle ? {
      fontFamily: r.textStyle.fontFamily,
      fontSize: Number(r.textStyle.fontSize),
      color: r.textStyle.color,
      fontWeight: r.textStyle.fontWeight,
      fontStyle: r.textStyle.fontStyle || 'normal',
      lineHeight: Number(r.textStyle.lineHeight ?? 1.2),
      align: r.textStyle.align,
      letterSpacing: r.textStyle.letterSpacing ? Number(r.textStyle.letterSpacing) : null,
      shadowColor: r.textStyle.shadowColor || null,
      shadowBlur: r.textStyle.shadowBlur !== undefined ? Number(r.textStyle.shadowBlur) : null,
      shadowOffsetX: r.textStyle.shadowOffsetX !== undefined ? Number(r.textStyle.shadowOffsetX) : null,
      shadowOffsetY: r.textStyle.shadowOffsetY !== undefined ? Number(r.textStyle.shadowOffsetY) : null,
      hasShadow: r.textStyle.hasShadow !== undefined ? Boolean(r.textStyle.hasShadow) : null,
      underline: r.textStyle.underline !== undefined ? Boolean(r.textStyle.underline) : null,
      highlightColor: r.textStyle.highlightColor || null,
      highlightOpacity: r.textStyle.highlightOpacity !== undefined ? Number(r.textStyle.highlightOpacity) : null,
      dropCap: r.textStyle.dropCap !== undefined ? Boolean(r.textStyle.dropCap) : null,
      isCustomColor: r.textStyle.isCustomColor !== undefined ? Boolean(r.textStyle.isCustomColor) : null,
    } : null
  };
}

function mapFixedElement(fe: any): any {
  if (!fe) return null;
  return {
    id: fe.id,
    type: fe.type,
    name: fe.name,
    x: Number(fe.x),
    y: Number(fe.y),
    width: Number(fe.width),
    height: Number(fe.height),
    zIndex: Number(fe.zIndex ?? 0),
    hidden: fe.hidden !== undefined ? Boolean(fe.hidden) : false,
    locked: fe.locked !== undefined ? Boolean(fe.locked) : false,
    opacity: Number(fe.opacity ?? 1),
    rotation: Number(fe.rotation ?? 0),
    skewX: Number(fe.skewX ?? 0),
    skewY: Number(fe.skewY ?? 0),
    shadowColor: fe.shadowColor || null,
    shadowBlur: Number(fe.shadowBlur ?? 0),
    shadowOffsetX: Number(fe.shadowOffsetX ?? 0),
    shadowOffsetY: Number(fe.shadowOffsetY ?? 0),
    hasShadow: fe.hasShadow !== undefined ? Boolean(fe.hasShadow) : null,
    blendMode: fe.blendMode || null,
    lockAspectRatio: fe.lockAspectRatio !== undefined ? Boolean(fe.lockAspectRatio) : null,
    shapeType: fe.shapeType || null,
    color: fe.color || null,
    backgroundColor: fe.backgroundColor || null,
    borderColor: fe.borderColor || null,
    borderWidth: fe.borderWidth !== undefined ? Number(fe.borderWidth) : null,
    borderRadius: fe.borderRadius !== undefined ? Number(fe.borderRadius) : null,
    content: fe.content || null,
    iconType: fe.iconType || null,
    textStyle: fe.textStyle ? {
      fontFamily: fe.textStyle.fontFamily,
      fontSize: Number(fe.textStyle.fontSize),
      color: fe.textStyle.color,
      fontWeight: fe.textStyle.fontWeight,
      fontStyle: fe.textStyle.fontStyle || 'normal',
      lineHeight: Number(fe.textStyle.lineHeight ?? 1.2),
      align: fe.textStyle.align,
      letterSpacing: fe.textStyle.letterSpacing ? Number(fe.textStyle.letterSpacing) : null,
      shadowColor: fe.textStyle.shadowColor || null,
      shadowBlur: fe.textStyle.shadowBlur !== undefined ? Number(fe.textStyle.shadowBlur) : null,
      shadowOffsetX: fe.textStyle.shadowOffsetX !== undefined ? Number(fe.textStyle.shadowOffsetX) : null,
      shadowOffsetY: fe.textStyle.shadowOffsetY !== undefined ? Number(fe.textStyle.shadowOffsetY) : null,
      hasShadow: fe.textStyle.hasShadow !== undefined ? Boolean(fe.textStyle.hasShadow) : null,
      underline: fe.textStyle.underline !== undefined ? Boolean(fe.textStyle.underline) : null,
      highlightColor: fe.textStyle.highlightColor || null,
      highlightOpacity: fe.textStyle.highlightOpacity !== undefined ? Number(fe.textStyle.highlightOpacity) : null,
      dropCap: fe.textStyle.dropCap !== undefined ? Boolean(fe.textStyle.dropCap) : null,
      isCustomColor: fe.textStyle.isCustomColor !== undefined ? Boolean(fe.textStyle.isCustomColor) : null,
    } : null
  };
}

function mapTemplatePage(p: any): any {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    pageRole: p.pageRole || null,
    backgroundImageUrl: p.backgroundImageUrl || null,
    regions: Array.isArray(p.regions) ? p.regions.map(mapRegion) : [],
    fixedElements: Array.isArray(p.fixedElements) ? p.fixedElements.map(mapFixedElement) : []
  };
}

/**
 * Fetch all custom templates saved in the cloud for the currently signed-in user.
 */
export async function getCloudTemplates(): Promise<DesignTemplate[]> {
  if (!isValidConfig) return [];
  
  const user = await ensureUserSignIn();
  if (!user) return [];

  const path = 'templates';
  try {
    const q = query(collection(db, path), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const templates: DesignTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const regions = (data.regions || []).map(mapRegion);
      const fixedElements = (data.fixedElements || []).map(mapFixedElement);
      const pages = Array.isArray(data.pages) ? data.pages.map(mapTemplatePage) : null;

      const palette = data.palette || {
        primary: data.primaryColor || '#FF6B1A',
        accent: data.accentColor || '#FF9F0A',
        text: data.textColor || 'rgba(255,255,255,0.95)',
        bg: '#1D1D1F'
      };
      if (data.palette && data.palette.boldHighlight) {
        palette.boldHighlight = data.palette.boldHighlight;
      }

      templates.push({
        id: doc.id,
        name: data.name,
        width: Number(data.width),
        height: Number(data.height),
        backgroundColor: data.backgroundColor,
        backgroundGradient: data.backgroundGradient,
        backgroundImageUrl: data.backgroundImageUrl,
        backgroundPattern: data.backgroundPattern,
        overlay: data.overlay,
        regions,
        fixedElements,
        pages: pages || undefined,
        aiSystemPrompt: data.aiSystemPrompt || undefined,
        palette
      });
    });

    return templates;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Save or update a custom template in Firestore.
 */
export async function saveCloudTemplate(template: DesignTemplate): Promise<void> {
  if (!isValidConfig) return;

  const user = await ensureUserSignIn();
  if (!user) {
    throw new Error('Authentication is required to save templates to the cloud.');
  }

  const path = `templates/${template.id}`;
  try {
    const payload = sanitizePayload(await prepareCloudValue({
      id: template.id,
      name: template.name,
      width: Number(template.width),
      height: Number(template.height),
      backgroundColor: template.backgroundColor || '#1D1D1F',
      backgroundGradient: template.backgroundGradient || null,
      backgroundImageUrl: template.backgroundImageUrl || null,
      backgroundPattern: template.backgroundPattern || null,
      overlay: template.overlay || null,
      regions: Array.isArray(template.regions) ? template.regions.map(mapRegion) : [],
      fixedElements: Array.isArray(template.fixedElements) ? template.fixedElements.map(mapFixedElement) : [],
      pages: Array.isArray(template.pages) ? template.pages.map(mapTemplatePage) : null,
      aiSystemPrompt: template.aiSystemPrompt || null,
      palette: {
        primary: template.palette.primary || '#FF6B1A',
        accent: template.palette.accent || '#FF9F0A',
        text: template.palette.text || 'rgba(255,255,255,0.95)',
        bg: template.palette.bg || '#1D1D1F',
        boldHighlight: template.palette.boldHighlight || null
      },
      primaryColor: template.palette.primary || '#FF6B1A',
      accentColor: template.palette.accent || '#FF9F0A',
      textColor: template.palette.text || 'rgba(255,255,255,0.95)',
      userId: user.uid
    }, user.uid));
    payload.updatedAt = serverTimestamp();

    await setDoc(doc(db, 'templates', template.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Recursively removes all undefined fields from an object or array to ensure compatibility with Firestore.
 */
function sanitizePayload(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = sanitizePayload(val);
        }
      }
    }
    return res;
  }
  return obj;
}

const uploadedMedia = new Map<string, Promise<string>>();

async function contentHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function uploadDataUrl(userId: string, value: string): Promise<string> {
  const mime = value.slice(5, value.indexOf(';')) || 'image/jpeg';
  const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const hash = await contentHash(value);
  const key = `${userId}/image/${hash}.${extension}`;
  if (!uploadedMedia.has(key)) {
    const upload = (async () => {
      const blob = await dataUrlToBlob(value);
      // Timeout upload after 12 seconds so autosave never freezes
      const uploadPromise = uploadCloudMedia(blob, {kind:'image', contentHash:hash, fileName:`${hash}.${extension}`});
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Cloudinary yükleme zaman aşımı')), 12_000)
      );
      return Promise.race([uploadPromise, timeoutPromise]);
    })().catch(error => {
      uploadedMedia.delete(key);
      console.warn('Medya buluta yüklenemedi, yerel koruma devrede:', error?.message);
      // Fallback: if dataUrl is small enough, retain it; otherwise safe empty fallback
      return value.length < 400_000 ? value : '';
    });
    uploadedMedia.set(key, upload);
  }
  return uploadedMedia.get(key)!;
}

async function uploadStoredVideo(userId: string, mediaId: string): Promise<string | null> {
  const blob = await getVideoBlob(mediaId);
  if (!blob) return null;
  const extension = videoFileExtension(blob);
  const key = `${userId}/video/${mediaId}.${extension}`;
  if (!uploadedMedia.has(key)) {
    const upload = (async () => {
      const hash = await contentHash(`${mediaId}:${blob.size}:${blob.type}`);
      const uploadPromise = uploadCloudMedia(blob, {kind:'video', contentHash:hash, fileName:`${mediaId}.${extension}`});
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Video yükleme zaman aşımı')), 18_000)
      );
      return Promise.race([uploadPromise, timeoutPromise]);
    })().catch(error => {
      uploadedMedia.delete(key);
      console.warn('Video buluta yüklenemedi:', error?.message);
      return null;
    });
    uploadedMedia.set(key, upload);
  }
  return uploadedMedia.get(key)!;
}

/** Move binary media to Cloudinary before the lightweight snapshot reaches Firestore. */
async function prepareCloudValue(value: any, userId: string): Promise<any> {
  if (typeof value === 'string') return value.startsWith('data:image/') ? uploadDataUrl(userId, value).catch(() => '') : value;
  if (!value || typeof value !== 'object') return value;
  if ((typeof Blob !== 'undefined' && value instanceof Blob) || (typeof File !== 'undefined' && value instanceof File)) return undefined;
  if (Array.isArray(value)) {
    const items = await Promise.all(value.map(item => prepareCloudValue(item, userId).catch(() => null)));
    return items.filter(i => i !== null && i !== undefined);
  }

  // A project often contains a number of independent image layers. Preparing
  // them concurrently with timeouts prevents exceeding autosave limits.
  const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => {
    if (key === 'file') return null;
    if (key === 'videoUrl' && typeof child === 'string' && child.startsWith('blob:') && typeof value.mediaId === 'string') {
      const videoUrl = await uploadStoredVideo(userId, value.mediaId).catch(() => null);
      return videoUrl ? [key, videoUrl] as const : null;
    }
    if (typeof child === 'string' && child.startsWith('blob:')) return null;
    const prepared = await prepareCloudValue(child, userId).catch(() => null);
    return prepared === undefined ? null : [key, prepared] as const;
  }));
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, any] => entry !== null));
}

/**
 * Delete a custom template from Firestore.
 */
export async function deleteCloudTemplate(templateId: string): Promise<void> {
  if (!isValidConfig) return;

  const user = await ensureUserSignIn();
  if (!user) {
    throw new Error('Authentication is required to delete cloud templates.');
  }

  const path = `templates/${templateId}`;
  try {
    await deleteDoc(doc(db, 'templates', templateId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* ─────────────── Cross-account template sharing ─────────────── */

// No 0/O/1/I so codes survive being read aloud or typed from a screenshot.
const SHARE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;
export const SHARE_QUERY_PARAM = 'sablon';

export type SharedTemplateInfo = {
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date | null;
  template: DesignTemplate;
};

function createShareCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, byte => SHARE_ALPHABET[byte % SHARE_ALPHABET.length]).join('');
}

/** `ABCDEFGH` → `ABCD-EFGH` for display. */
export function formatShareCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** Native stream compression (deflate-raw) to base64url */
export async function compressTemplateJson(json: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') return '';
  try {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

/** Native stream decompression (deflate-raw) from base64url */
export async function decompressTemplateJson(base64url: string): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined' || !base64url) return null;
  try {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

export function buildShareLink(code: string, compressedData?: string): string {
  const origin = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : 'https://grafik-motoru-studio.vercel.app/';
  const url = new URL(origin);
  url.searchParams.set(SHARE_QUERY_PARAM, code);
  if (compressedData && compressedData.length < 3500) {
    url.searchParams.set('d', compressedData);
  }
  return url.toString();
}

/** Accepts a raw code, a hyphenated code or a full share link. */
export function normalizeShareCode(input: string): string | null {
  let candidate = input.trim();
  if (/^https?:\/\//i.test(candidate)) {
    try { candidate = new URL(candidate).searchParams.get(SHARE_QUERY_PARAM) || ''; } catch { candidate = ''; }
  }
  candidate = candidate.toLocaleUpperCase('en-US').replace(/[^A-Z0-9]/g, '');
  return SHARE_CODE_PATTERN.test(candidate) ? candidate : null;
}

function describeShareError(error: unknown, fallback: string): Error {
  const code = (error as any)?.code || '';
  if (/permission-denied/.test(code)) {
    return new Error('Paylaşım izni reddedildi. Firestore güvenlik kurallarının Firebase Console üzerinde yayınlandığından emin ol.');
  }
  if (/unavailable|deadline-exceeded/.test(code)) {
    return new Error('Bulut bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.');
  }
  return error instanceof Error && error.message ? error : new Error(fallback);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(message), {code: 'deadline-exceeded'})), ms); }),
  ]).finally(() => clearTimeout(timer!));
}

async function postSharedTemplateToServer(payload: {
  code: string;
  ownerId: string;
  ownerName: string;
  name: string;
  templateJson: string;
  version: number;
}): Promise<boolean> {
  let apiOk = false;
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => null) : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/share-template', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      apiOk = Boolean(data.success);
    }
  } catch (err) {
    console.warn('Backend share API request failed:', err);
  }

  // Also publish directly to global resilient channel from client
  try {
    fetch(`https://ntfy.sh/gm_share_${payload.code}`, {
      method: 'POST',
      headers: { 'Title': 'gm_template', 'Priority': 'low' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch { /* noop */ }

  return apiOk;
}

async function fetchSharedTemplateFromServer(code: string): Promise<any | null> {
  const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. Try backend Express API
  try {
    const res = await fetch(`/api/shared-template/${encodeURIComponent(normalizedCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.templateJson) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend shared template fetch failed:', err);
  }

  // 2. Direct lookup from global persistent channel
  try {
    const res = await fetch(`https://ntfy.sh/gm_share_${normalizedCode}/raw?poll=1`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const lines = text.trim().split('\n').filter(Boolean);
        const lastLine = lines[lines.length - 1];
        const parsed = JSON.parse(lastLine);
        if (parsed && typeof parsed === 'object' && parsed.templateJson) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Global channel direct fetch failed:', err);
  }

  return null;
}

/**
 * Publishes a read-only snapshot of a template under a short share code. Anyone with that code
 * can copy it into their own account; later edits to the original are not propagated.
 */
export async function shareTemplate(template: DesignTemplate, ownerName: string): Promise<string> {
  // Ensure network is active and clear any stale quota locks
  await enableFirestoreNetwork().catch(() => {});
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem('firestore_quota_exceeded'); } catch {}
  }

  let user = auth.currentUser;
  if (!user && isValidConfig) {
    user = (await ensureUserSignIn()) as any;
  }

  // Production metadata belongs to works, not to a reusable template.
  const { sourceTemplateId: _s, productionBrief: _p, createdAt: _c, ...shareable } = template as DesignTemplate & Record<string, unknown>;
  let templateJson: string;
  try {
    // Pure serialization without heavy network calls: resolves in < 2ms
    templateJson = JSON.stringify(sanitizePayload(shareable));
  } catch (error) {
    throw describeShareError(error, 'Şablon verisi hazırlanamadı.');
  }

  if (templateJson.length > 1_500_000) {
    throw new Error('Bu şablon paylaşım için çok büyük. Gömülü görselleri azaltıp tekrar dene.');
  }

  const code = createShareCode();
  const ownerId = user?.uid || 'anon';
  const resolvedOwnerName = (ownerName || user?.displayName || user?.email?.split('@')[0] || 'Grafik Motoru kullanıcısı').slice(0, 120);
  const templateName = (template.name || 'Adsız şablon').slice(0, 256);

  const payload = {
    code,
    ownerId,
    ownerName: resolvedOwnerName,
    name: templateName,
    templateJson,
    version: 1,
  };

  // 1. Dispatch to server backend API immediately
  const serverSavePromise = postSharedTemplateToServer(payload);

  // 2. Concurrently attempt direct client Firestore write with a 4s timeout
  let directFirestoreOk = false;
  if (isValidConfig) {
    try {
      const ref = doc(db, 'shared_templates', code);
      await withTimeout(setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      }), 4_000, 'Firestore bağlantı zaman aşımı');
      directFirestoreOk = true;
    } catch (fsErr) {
      console.warn('Direct Firestore setDoc failed or timed out:', fsErr);
    }
  }

  const serverOk = await serverSavePromise;

  // If either direct Firestore or server API succeeded, return the code instantly
  if (directFirestoreOk || serverOk) {
    return code;
  }

  throw new Error('Bulut bağlantısı kurulamadı. Lütfen internet bağlantını kontrol et ve tekrar dene.');
}

/** Owners can revoke a code at any time; copies already imported stay with their recipients. */
export async function revokeSharedTemplate(code: string): Promise<void> {
  if (isValidConfig) {
    try {
      await withTimeout(deleteDoc(doc(db, 'shared_templates', code)), 4_000, 'Bulut bağlantısı zaman aşımına uğradı.');
    } catch (error) {
      console.warn('Direct Firestore delete failed:', error);
    }
  }
  try {
    await fetch(`/api/shared-template/${encodeURIComponent(code)}`, { method: 'DELETE' });
  } catch { /* noop */ }
}

export async function fetchSharedTemplate(code: string): Promise<SharedTemplateInfo> {
  await enableFirestoreNetwork().catch(() => {});

  let rawData: any = null;

  // 0. Check if current URL query contains embedded compressed template data
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const d = params.get('d') || params.get('data');
      if (d) {
        const decompressed = await decompressTemplateJson(d);
        if (decompressed) {
          rawData = {
            code: normalizeShareCode(code) || code,
            name: 'Paylaşılan şablon',
            templateJson: decompressed,
            ownerId: 'shared',
            ownerName: 'Grafik Motoru kullanıcısı',
          };
        }
      }
    } catch { /* noop */ }
  }

  // 1. Try server endpoint & resilient global channel (fast & quota-independent)
  if (!rawData) {
    const serverData = await fetchSharedTemplateFromServer(code);
    if (serverData) {
      rawData = serverData;
    }
  }

  // 2. Direct Firestore fallback
  if (!rawData && isValidConfig) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, 'shared_templates', code)), 3_000, 'Firestore zaman aşımı');
      if (snapshot.exists()) {
        rawData = snapshot.data();
      }
    } catch (fsErr) {
      console.warn('Direct Firestore getDoc failed:', fsErr);
    }
  }

  if (!rawData) {
    throw new Error('Bu koda ait bir şablon bulunamadı. Kod yanlış olabilir ya da paylaşım durdurulmuş.');
  }

  let template: DesignTemplate;
  try {
    template = JSON.parse(String(rawData.templateJson || ''));
  } catch {
    throw new Error('Paylaşılan şablon okunamadı.');
  }

  const valid = template && typeof template === 'object' &&
    Number.isFinite(Number(template.width)) && Number.isFinite(Number(template.height)) &&
    Array.isArray(template.regions);
  if (!valid) throw new Error('Paylaşılan şablonun içeriği geçersiz.');

  return {
    code,
    name: String(rawData.name || template.name || 'Paylaşılan şablon'),
    ownerId: String(rawData.ownerId || ''),
    ownerName: String(rawData.ownerName || 'Bir kullanıcı'),
    createdAt: typeof rawData.createdAt?.toDate === 'function'
      ? rawData.createdAt.toDate()
      : rawData.createdAt ? new Date(rawData.createdAt) : null,
    template: {
      ...template,
      width: Number(template.width),
      height: Number(template.height),
      fixedElements: Array.isArray(template.fixedElements) ? template.fixedElements : [],
      palette: template.palette || {primary: '#FF6B1A', accent: '#FF9F0A', text: 'rgba(255,255,255,0.95)', bg: '#1D1D1F'},
    },
  };
}

/**
 * Save user graphic project (uploaded PNGs, text selections, and generated pages) to Firestore.
 */
export async function saveUserGraphicProject(
  userId: string,
  currentTemplateId: string,
  graphicData: any,
  generatedPages: any[],
  templates?: DesignTemplate[],
  pagesByTemplate?: Record<string, any[]>
): Promise<void> {
  if (!isValidConfig) return;
  const path = `graphic_projects/${userId}`;
  try {
    const payload = sanitizePayload(await prepareCloudValue({
      userId,
      currentTemplateId,
      graphicData,
      generatedPages,
      // Firestore rules require these keys. Supplying safe empty defaults also
      // keeps older callers from producing a payload with omitted undefined keys.
      templates: templates ?? [],
      pagesByTemplate: pagesByTemplate ?? {},
      syncVersion: 1
    }, userId));
    payload.updatedAt = serverTimestamp();
    await setDoc(doc(db, 'graphic_projects', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch the user's active graphic project from Firestore.
 */
export async function getUserGraphicProject(userId: string): Promise<any | null> {
  if (!isValidConfig) return null;
  const path = `graphic_projects/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'graphic_projects', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export type ProjectSnapshotMetadata = {fromCache: boolean; hasPendingWrites: boolean};

/** Observe committed project changes so other devices update without a refresh. */
export function subscribeUserGraphicProject(
  userId: string,
  onData: (data: any | null, metadata: ProjectSnapshotMetadata) => void,
  onError: (error: unknown) => void
): () => void {
  if (!isValidConfig) return () => {};
  return onSnapshot(doc(db, 'graphic_projects', userId), {includeMetadataChanges:true}, snapshot => {
    onData(snapshot.exists() ? snapshot.data() : null, {
      fromCache:snapshot.metadata.fromCache,
      hasPendingWrites:snapshot.metadata.hasPendingWrites,
    });
  }, onError);
}
