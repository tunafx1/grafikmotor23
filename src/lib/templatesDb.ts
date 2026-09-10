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

  const output: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'file') continue;
    if (key === 'videoUrl' && typeof child === 'string' && child.startsWith('blob:') && typeof value.mediaId === 'string') {
      const videoUrl = await uploadStoredVideo(userId, value.mediaId);
      if (videoUrl) output[key] = videoUrl;
      continue;
    }
    if (typeof child === 'string' && child.startsWith('blob:')) continue;
    const prepared = await prepareCloudValue(child, userId);
    if (prepared !== undefined) output[key] = prepared;
  }
  return output;
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
      templates,
      pagesByTemplate,
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
