import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth, ensureUserSignIn, isValidConfig } from './firebase';
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
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
    hidden: r.hidden !== undefined ? Boolean(r.hidden) : false,
    locked: r.locked !== undefined ? Boolean(r.locked) : false,
    fitBackgroundToText: r.fitBackgroundToText !== undefined ? Boolean(r.fitBackgroundToText) : null,
    hasBackground: r.hasBackground !== undefined ? Boolean(r.hasBackground) : null,
    hasBorder: r.hasBorder !== undefined ? Boolean(r.hasBorder) : null,
    textRole: r.textRole || null,
    clipImage: r.clipImage !== undefined ? Boolean(r.clipImage) : null,
    placeholderText: r.placeholderText || null,
    placeholderImage: r.placeholderImage || null,
    textStyle: r.textStyle ? {
      fontFamily: r.textStyle.fontFamily,
      fontSize: Number(r.textStyle.fontSize),
      color: r.textStyle.color,
      fontWeight: r.textStyle.fontWeight,
      lineHeight: Number(r.textStyle.lineHeight ?? 1.2),
      align: r.textStyle.align,
      letterSpacing: r.textStyle.letterSpacing ? Number(r.textStyle.letterSpacing) : null,
      shadowColor: r.textStyle.shadowColor || null,
      shadowBlur: r.textStyle.shadowBlur !== undefined ? Number(r.textStyle.shadowBlur) : null,
      shadowOffsetX: r.textStyle.shadowOffsetX !== undefined ? Number(r.textStyle.shadowOffsetX) : null,
      shadowOffsetY: r.textStyle.shadowOffsetY !== undefined ? Number(r.textStyle.shadowOffsetY) : null,
      hasShadow: r.textStyle.hasShadow !== undefined ? Boolean(r.textStyle.hasShadow) : null,
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
      lineHeight: Number(fe.textStyle.lineHeight ?? 1.2),
      align: fe.textStyle.align,
      letterSpacing: fe.textStyle.letterSpacing ? Number(fe.textStyle.letterSpacing) : null,
      shadowColor: fe.textStyle.shadowColor || null,
      shadowBlur: fe.textStyle.shadowBlur !== undefined ? Number(fe.textStyle.shadowBlur) : null,
      shadowOffsetX: fe.textStyle.shadowOffsetX !== undefined ? Number(fe.textStyle.shadowOffsetX) : null,
      shadowOffsetY: fe.textStyle.shadowOffsetY !== undefined ? Number(fe.textStyle.shadowOffsetY) : null,
      hasShadow: fe.textStyle.hasShadow !== undefined ? Boolean(fe.textStyle.hasShadow) : null,
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
    const payload = sanitizePayload({
      id: template.id,
      name: template.name,
      width: Number(template.width),
      height: Number(template.height),
      backgroundColor: template.backgroundColor || '#1D1D1F',
      backgroundGradient: template.backgroundGradient || null,
      backgroundImageUrl: template.backgroundImageUrl || null,
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
      userId: user.uid,
      updatedAt: new Date().toISOString()
    });

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
    const payload = sanitizePayload({
      userId,
      currentTemplateId,
      graphicData,
      generatedPages,
      templates,
      pagesByTemplate,
      updatedAt: new Date().toISOString()
    });
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
