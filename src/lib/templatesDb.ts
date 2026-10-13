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
import { db, auth, ensureUserSignIn, isValidConfig } from './firebase';
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
      return uploadCloudMedia(blob, {kind:'image', contentHash:hash, fileName:`${hash}.${extension}`});
    })().catch(error => {
      uploadedMedia.delete(key);
      throw error;
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
      return uploadCloudMedia(blob, {kind:'video', contentHash:hash, fileName:`${mediaId}.${extension}`});
    })().catch(error => {
      uploadedMedia.delete(key);
      throw error;
    });
    uploadedMedia.set(key, upload);
  }
  return uploadedMedia.get(key)!;
}

/** Move binary media to Cloudinary before the lightweight snapshot reaches Firestore. */
async function prepareCloudValue(value: any, userId: string): Promise<any> {
  if (typeof value === 'string') return value.startsWith('data:image/') ? uploadDataUrl(userId, value) : value;
  if (!value || typeof value !== 'object') return value;
  if ((typeof Blob !== 'undefined' && value instanceof Blob) || (typeof File !== 'undefined' && value instanceof File)) return undefined;
  if (Array.isArray(value)) return Promise.all(value.map(item => prepareCloudValue(item, userId)));

  // A project often contains a number of independent image layers. Preparing
  // them serially can exceed the autosave timeout even on a healthy network.
  // Keep the object shape while uploading independent media concurrently.
  const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => {
    if (key === 'file') return null;
    if (key === 'videoUrl' && typeof child === 'string' && child.startsWith('blob:') && typeof value.mediaId === 'string') {
      const videoUrl = await uploadStoredVideo(userId, value.mediaId);
      return videoUrl ? [key, videoUrl] as const : null;
    }
    if (typeof child === 'string' && child.startsWith('blob:')) return null;
    const prepared = await prepareCloudValue(child, userId);
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

export function buildShareLink(code: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(SHARE_QUERY_PARAM, code);
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

/**
 * Publishes a read-only snapshot of a template under a short share code. Anyone signed in
 * with that code can copy it into their own account; later edits to the original are not
 * propagated, and the recipient's copy is fully independent.
 */
export async function shareTemplate(template: DesignTemplate, ownerName: string): Promise<string> {
  if (!isValidConfig) throw new Error('Bulut bağlantısı yapılandırılmadığı için şablon paylaşılamıyor.');
  let user = auth.currentUser;
  if (!user) {
    user = (await ensureUserSignIn()) as any;
  }
  if (!user) throw new Error('Şablon paylaşmak için oturum açmalısın.');

  // Production metadata belongs to works, not to a reusable template.
  const { sourceTemplateId: _s, productionBrief: _p, createdAt: _c, ...shareable } = template as DesignTemplate & Record<string, unknown>;
  let templateJson: string;
  try {
    templateJson = JSON.stringify(sanitizePayload(await prepareCloudValue(shareable, user.uid)));
  } catch (error) {
    throw describeShareError(error, 'Şablondaki görseller buluta yüklenemedi.');
  }
  if (templateJson.length > 900_000) {
    throw new Error('Bu şablon paylaşım için çok büyük. Gömülü görselleri azaltıp tekrar dene.');
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = createShareCode();
    const ref = doc(db, 'shared_templates', code);
    try {
      await withTimeout(setDoc(ref, {
        code,
        ownerId: user.uid,
        ownerName: (ownerName || user.displayName || 'Grafik Motoru kullanıcısı').slice(0, 120),
        name: (template.name || 'Adsız şablon').slice(0, 256),
        templateJson,
        version: 1,
        createdAt: serverTimestamp(),
      }), 20_000, 'Paylaşım kaydı zaman aşımına uğradı.');
      return code;
    } catch (error) {
      throw describeShareError(error, 'Şablon paylaşılamadı.');
    }
  }
  throw new Error('Paylaşım kodu oluşturulamadı. Lütfen tekrar dene.');
}

/** Owners can revoke a code at any time; copies already imported stay with their recipients. */
export async function revokeSharedTemplate(code: string): Promise<void> {
  if (!isValidConfig) return;
  try {
    await withTimeout(deleteDoc(doc(db, 'shared_templates', code)), 15_000, 'Bulut bağlantısı zaman aşımına uğradı.');
  } catch (error) {
    throw describeShareError(error, 'Paylaşım durdurulamadı.');
  }
}

export async function fetchSharedTemplate(code: string): Promise<SharedTemplateInfo> {
  if (!isValidConfig) throw new Error('Bulut bağlantısı yapılandırılmadığı için şablon alınamıyor.');
  const user = await ensureUserSignIn();
  if (!user) throw new Error('Paylaşılan şablonu almak için giriş yapmalısın.');
  let snapshot;
  try {
    snapshot = await withTimeout(getDoc(doc(db, 'shared_templates', code)), 15_000, 'Bulut bağlantısı zaman aşımına uğradı.');
  } catch (error) {
    throw describeShareError(error, 'Paylaşılan şablon alınamadı.');
  }
  if (!snapshot.exists()) throw new Error('Bu koda ait bir şablon bulunamadı. Kod yanlış olabilir ya da paylaşım durdurulmuş.');
  const data = snapshot.data();
  let template: DesignTemplate;
  try {
    template = JSON.parse(String(data.templateJson || ''));
  } catch {
    throw new Error('Paylaşılan şablon okunamadı.');
  }
  const valid = template && typeof template === 'object' &&
    Number.isFinite(Number(template.width)) && Number.isFinite(Number(template.height)) &&
    Array.isArray(template.regions);
  if (!valid) throw new Error('Paylaşılan şablonun içeriği geçersiz.');
  return {
    code,
    name: String(data.name || template.name || 'Paylaşılan şablon'),
    ownerId: String(data.ownerId || ''),
    ownerName: String(data.ownerName || 'Bir kullanıcı'),
    createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate() : null,
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
