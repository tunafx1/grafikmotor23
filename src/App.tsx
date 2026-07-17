import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layout,
  Sliders,
  Type,
  Layers,
  Palette,
  Grid,
  Plus,
  Minus,
  Maximize2,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Save,
  Check,
  UploadCloud,
  FileText,
  MousePointer,
  HelpCircle,
  FolderOpen,
  Info,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
  ArrowUp,
  ArrowDown,
  Cloud,
  CloudOff,
  Loader2,
  Pencil,
  Settings,
  X,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FolderArchive,
  LogIn,
  LogOut,
  User as UserIcon,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  Smartphone,
  RefreshCw
} from 'lucide-react';

import JSZip from 'jszip';

import { DesignTemplate, TextStyle, Region, FixedElement, GraphicData, TemplatePage } from './types';
import { TEMPLATE_PRESETS } from './presets';
import { renderTemplateToCanvas } from './canvasRenderer';

const INITIAL_FALLBACK_TEMPLATE: DesignTemplate = {
  id: 'default-template-1',
  name: 'Yeni Özel Şablon #1',
  width: 1080,
  height: 1080,
  backgroundColor: '#FAFAFA',
  palette: {
    primary: '#4F46E5',
    accent: '#F59E0B',
    text: '#0F172A',
    bg: '#FAFAFA'
  },
  regions: [
    {
      id: 'region-title-default',
      name: 'Ana Başlık Alanı',
      type: 'text',
      x: 100,
      y: 200,
      width: 880,
      height: 250,
      backgroundColor: 'transparent',
      opacity: 1,
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      isDynamic: true,
      placeholderText: "Yeni Özel **Şablon** Başlığı",
      textStyle: {
        fontFamily: 'Space Grotesk',
        fontSize: 48,
        color: '#0F172A',
        fontWeight: 'bold',
        lineHeight: 1.2,
        align: 'center'
      }
    }
  ],
  fixedElements: []
};

// --- HELPER COMPONENT FOR RENDERING STATIC PAGE PREVIEWS IN THE SCROLLABLE VIEWPORT ---
interface StaticPageCanvasProps {
  template: DesignTemplate;
  page: any;
  activeTab: 'phase1' | 'phase2';
  paletteOverrides?: Record<string, string>;
  width: number;
  height: number;
  onClick: () => void;
  isActive: boolean;
  pageIndex: number;
  highlightColor?: string;
}

export function StaticPageCanvas({
  template,
  page,
  activeTab,
  paletteOverrides,
  width,
  height,
  onClick,
  isActive,
  highlightColor
}: StaticPageCanvasProps) {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const canvas = localCanvasRef.current;
    if (!canvas || isActive) return;

    // Use empty/placeholder texts and images when in Phase 1 Template Design Mode
    const texts = activeTab === 'phase1' ? {} : page.dynamicTexts || {};
    const images = activeTab === 'phase1' ? {} : page.dynamicImages || {};
    const hidden = activeTab === 'phase1' ? [] : page.hiddenElements || [];

    const render = async () => {
      try {
        canvas.width = width;
        canvas.height = height;
        await renderTemplateToCanvas(
          canvas,
          {
            ...template,
            backgroundImageUrl: page.backgroundImageUrl ?? template.backgroundImageUrl,
            regions: page.regions || template.regions,
            fixedElements: page.fixedElements || template.fixedElements
          },
          texts,
          images,
          {
            paletteOverrides,
            hiddenElements: hidden,
            showGrid: false,
            showSafeMargins: false,
            scale: 1.0,
            highlightColor
          }
        );
      } catch (err) {
        console.error("Static canvas render error:", err);
      }
    };

    render();

    return () => {
      isMounted = false;
    };
  }, [template, page, activeTab, paletteOverrides, isActive, width, height]);

  if (isActive) {
    return null;
  }

  return (
    <div 
      onClick={onClick}
      className="absolute inset-0 cursor-pointer hover:ring-4 hover:ring-indigo-450 rounded-lg transition duration-200 overflow-hidden bg-white select-none"
    >
      <canvas
        ref={localCanvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute inset-0 bg-slate-900/10 hover:bg-transparent transition flex items-center justify-center opacity-0 hover:opacity-100 duration-200">
        <span className="bg-slate-900/90 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg select-none">
          Düzenlemek için Seç
        </span>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT FOR USER FRIENDLY TOOLTIPS ('i' INFORMATION ICONS) ---
export function InfoTooltip({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block ml-1.5 align-middle select-none">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-[10px] font-extrabold border border-slate-200 cursor-pointer transition focus:outline-none"
        title="Bilgi Al"
      >
        i
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 w-56 p-2.5 bg-slate-900 text-white text-[10px] leading-normal rounded-lg shadow-xl font-medium text-center pointer-events-none"
          >
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { 
  getCloudTemplates, 
  saveCloudTemplate, 
  deleteCloudTemplate,
  saveUserGraphicProject,
  getUserGraphicProject
} from './lib/templatesDb';
import { 
  auth, 
  db,
  ensureUserSignIn, 
  isValidConfig,
  loginWithGoogle,
  logoutUser,
  disableFirestoreNetwork,
  enableFirestoreNetwork
} from './lib/firebase';

export function isTemplateImageFrame(r: Region): boolean {
  if (r.type !== 'image') return false;
  // If it's a user-uploaded image layer or background, placeholderImage is a base64 data URL
  if (r.placeholderImage && r.placeholderImage.startsWith('data:')) {
    return false;
  }
  return true;
}

export function isRealUserUploadedImage(url: string, template: DesignTemplate | null | undefined): boolean {
  if (!url) return false;
  
  // 1. Filter out default Unsplash images used as placeholders in template
  if (url.includes('unsplash.com') && (
    url.includes('photo-1507525428034') ||
    url.includes('photo-1470071459604') ||
    url.includes('photo-1513836279014') ||
    url.includes('photo-1498050108023') ||
    url.includes('photo-1486406146926')
  )) {
    return false;
  }

  // 2. Filter out template default placeholder images (empty gray slots, transparent grids, etc.)
  if (template) {
    if (template.regions?.some(r => r.placeholderImage === url)) {
      return false;
    }
    if (template.pages) {
      for (const p of template.pages) {
        if (p.regions?.some(r => r.placeholderImage === url)) {
          return false;
        }
      }
    }
  }

  return true;
}

export function ensureMultiPageSupport(t: DesignTemplate): DesignTemplate {
  const pages = t.pages ? [...t.pages] : [];
  if (pages.length === 0) {
    // 1. Initialize with Cover Page
    pages.push({
      id: '1',
      name: 'Kapak Sayfası',
      regions: t.regions || [],
      fixedElements: t.fixedElements || [],
      pageRole: 'cover'
    });

    // 2. Initialize with 2 Fotoğraflı Kolaj
    pages.push({
      id: '2',
      name: '2 Fotoğraflı Kolaj',
      pageRole: '2-image',
      regions: [
        {
          id: `collage-${t.id}-img-1`,
          name: 'Kolaj Resim 1',
          type: 'image',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.42),
          height: Math.floor(t.height * 0.65),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
        },
        {
          id: `collage-${t.id}-img-2`,
          name: 'Kolaj Resim 2',
          type: 'image',
          x: Math.floor(t.width * 0.53),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.42),
          height: Math.floor(t.height * 0.65),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
        },
        {
          id: `collage-${t.id}-text`,
          name: 'Kolaj Metni',
          type: 'text',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.83),
          width: Math.floor(t.width * 0.9),
          height: Math.floor(t.height * 0.12),
          backgroundColor: 'transparent',
          opacity: 1,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          isDynamic: true,
          textRole: 'description',
          placeholderText: "Detaylar ve **Harika Kolaj** İçeriği",
          textStyle: {
            fontFamily: 'Space Grotesk',
            fontSize: Math.max(16, Math.floor(t.height * 0.035)),
            color: t.palette?.text || '#0F172A',
            fontWeight: 'bold',
            lineHeight: 1.3,
            align: 'center'
          }
        }
      ],
      fixedElements: (t.fixedElements || []).filter(el => el.type !== 'text')
    });

    // 3. Initialize with 3 Fotoğraflı Kolaj
    pages.push({
      id: '4',
      name: '3 Fotoğraflı Kolaj',
      pageRole: '3-image',
      regions: [
        {
          id: `collage-${t.id}-three-img-1`,
          name: 'Kolaj Resim 1',
          type: 'image',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.28),
          height: Math.floor(t.height * 0.55),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
        },
        {
          id: `collage-${t.id}-three-img-2`,
          name: 'Kolaj Resim 2',
          type: 'image',
          x: Math.floor(t.width * 0.36),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.28),
          height: Math.floor(t.height * 0.55),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
        },
        {
          id: `collage-${t.id}-three-img-3`,
          name: 'Kolaj Resim 3',
          type: 'image',
          x: Math.floor(t.width * 0.67),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.28),
          height: Math.floor(t.height * 0.55),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800'
        },
        {
          id: `collage-${t.id}-three-text`,
          name: 'Kolaj Metni',
          type: 'text',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.75),
          width: Math.floor(t.width * 0.9),
          height: Math.floor(t.height * 0.15),
          backgroundColor: 'transparent',
          opacity: 1,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          isDynamic: true,
          textRole: 'description',
          placeholderText: "Detaylar ve **Harika Kolaj** İçeriği",
          textStyle: {
            fontFamily: 'Space Grotesk',
            fontSize: Math.max(16, Math.floor(t.height * 0.035)),
            color: t.palette?.text || '#0F172A',
            fontWeight: 'bold',
            lineHeight: 1.3,
            align: 'center'
          }
        }
      ],
      fixedElements: (t.fixedElements || []).filter(el => el.type !== 'text')
    });

    // 4. Initialize with Tek Fotoğraflı Kolaj
    pages.push({
      id: '3',
      name: 'Tek Fotoğraflı Kolaj',
      pageRole: '1-image',
      regions: [
        {
          id: `collage-${t.id}-single-img`,
          name: 'Tekli Kolaj Resim',
          type: 'image',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.15),
          width: Math.floor(t.width * 0.9),
          height: Math.floor(t.height * 0.65),
          backgroundColor: '#F1F5F9',
          opacity: 1,
          borderColor: t.palette?.primary || '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
        },
        {
          id: `collage-${t.id}-single-text`,
          name: 'Kolaj Metni',
          type: 'text',
          x: Math.floor(t.width * 0.05),
          y: Math.floor(t.height * 0.83),
          width: Math.floor(t.width * 0.9),
          height: Math.floor(t.height * 0.12),
          backgroundColor: 'transparent',
          opacity: 1,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          isDynamic: true,
          textRole: 'description',
          placeholderText: "Detaylar ve **Harika Kolaj** İçeriği",
          textStyle: {
            fontFamily: 'Space Grotesk',
            fontSize: Math.max(16, Math.floor(t.height * 0.035)),
            color: t.palette?.text || '#0F172A',
            fontWeight: 'bold',
            lineHeight: 1.3,
            align: 'center'
          }
        }
      ],
      fixedElements: (t.fixedElements || []).filter(el => el.type !== 'text')
    });
  } else {
    // If pages already exist, we just ensure the first page is name/role cover
    if (pages[0]) {
      if (!pages[0].name) {
        pages[0].name = 'Kapak Sayfası';
      }
      if (!pages[0].pageRole) {
        pages[0].pageRole = 'cover';
      }
    }
  }

  // Ensure all pages have a pageRole set (fallback to 'custom' if missing)
  pages.forEach((p, idx) => {
    if (!p.pageRole) {
      if (idx === 0) p.pageRole = 'cover';
      else if (p.regions.filter(r => isTemplateImageFrame(r)).length === 1) p.pageRole = '1-image';
      else if (p.regions.filter(r => isTemplateImageFrame(r)).length === 2) p.pageRole = '2-image';
      else if (p.regions.filter(r => isTemplateImageFrame(r)).length === 3) p.pageRole = '3-image';
      else p.pageRole = 'custom';
    }
  });

  return {
    ...t,
    pages
  };
}

export function getMappedTextsForPage(
  regions: Region[],
  data: { title: string; subtitle: string; description: string }
): Record<string, string> {
  const mapped: Record<string, string> = {};
  const textRegions = regions.filter(r => r.type === 'text');
  if (textRegions.length === 0) return mapped;

  const assignedRegionIds = new Set<string>();

  const assignRole = (role: 'title' | 'subtitle' | 'description', value: string) => {
    // Find if there is a region with this textRole
    const explicitReg = textRegions.find(r => r.textRole === role && !assignedRegionIds.has(r.id));
    if (explicitReg) {
      mapped[explicitReg.id] = value;
      assignedRegionIds.add(explicitReg.id);
      return;
    }

    // Heuristics: search keywords
    const keywords = role === 'title' ? ['title', 'başlık'] : 
                     role === 'subtitle' ? ['subtitle', 'alt başlık', 'alt_başlık', 'alt-başlık', 'slogan'] : 
                     ['desc', 'açıklama', 'detay', 'text', 'metin', 'info'];

    const matchedReg = textRegions.find(r => {
      if (assignedRegionIds.has(r.id)) return false;
      const idLower = r.id.toLowerCase();
      const nameLower = (r.name || '').toLowerCase();
      return keywords.some(kw => idLower.includes(kw) || nameLower.includes(kw));
    });

    if (matchedReg) {
      mapped[matchedReg.id] = value;
      assignedRegionIds.add(matchedReg.id);
    }
  };

  assignRole('title', data.title);
  assignRole('subtitle', data.subtitle);
  assignRole('description', data.description);

  const remainingRegions = textRegions.filter(r => !assignedRegionIds.has(r.id));
  if (remainingRegions.length > 0) {
    const sortedByFontSize = [...remainingRegions].sort((a, b) => {
      const sizeA = a.textStyle?.fontSize || 0;
      const sizeB = b.textStyle?.fontSize || 0;
      return sizeB - sizeA;
    });

    let hasTitleAssigned = textRegions.some(r => mapped[r.id] === data.title);
    let hasSubtitleAssigned = textRegions.some(r => mapped[r.id] === data.subtitle);
    let hasDescAssigned = textRegions.some(r => mapped[r.id] === data.description);

    sortedByFontSize.forEach(r => {
      if (!hasTitleAssigned) {
        mapped[r.id] = data.title;
        hasTitleAssigned = true;
      } else if (!hasSubtitleAssigned) {
        mapped[r.id] = data.subtitle;
        hasSubtitleAssigned = true;
      } else if (!hasDescAssigned) {
        mapped[r.id] = data.description;
        hasDescAssigned = true;
      } else {
        const size = r.textStyle?.fontSize || 20;
        mapped[r.id] = size > 30 ? data.title : data.description;
      }
    });
  }

  return mapped;
}

export default function App() {
  // --- STATE MANAGEMENT ---
  const [templates, setTemplatesState] = useState<DesignTemplate[]>(() => {
    // 1. Try to load complete list (v2) first
    const savedV2 = localStorage.getItem('active_templates_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse active_templates_v2', e);
      }
    }

    // 2. Fallback to v1 (custom_templates)
    const savedV1 = localStorage.getItem('custom_templates');
    if (savedV1) {
      try {
        const parsed = JSON.parse(savedV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse custom_templates', e);
      }
    }

    // 3. Absolute fallback
    return [INITIAL_FALLBACK_TEMPLATE];
  });

  // --- CANVAS DRAGGING & TOUCH REPOSITIONING STATES ---
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    elementId: string;
    elementType: 'region' | 'fixed';
    startX: number;
    startY: number;
    mouseStartX: number;
    mouseStartY: number;
    mode?: 'drag' | 'resize';
    resizeHandle?: 'TL' | 'TR' | 'BL' | 'BR';
    startWidth?: number;
    startHeight?: number;
  } | null>(null);

  // --- UNDO / REDO HISTORY STATES ---
  const [undoStack, setUndoStack] = useState<DesignTemplate[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignTemplate[][]>([]);
  const templatesBeforeDragRef = useRef<DesignTemplate[] | null>(null);

  // Custom setTemplates wrapper to record design history
  const setTemplates = (
    value: DesignTemplate[] | ((prev: DesignTemplate[]) => DesignTemplate[])
  ) => {
    setTemplatesState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (next !== prev) {
        // Only push to undo stack if we are NOT actively dragging or resizing on canvas.
        // Dragging & resizing is grouped into a single undo step on mouse/touch release (pointerUp).
        if (!dragStartRef.current) {
          setUndoStack(u => {
            const updated = [...u, prev];
            if (updated.length > 50) updated.shift();
            return updated;
          });
          setRedoStack([]); // Clear redo stack on any new modification
        }
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setRedoStack(r => [...r, templates]);
    setTemplatesState(previous);
    
    localStorage.setItem('active_templates_v2', JSON.stringify(previous));
    const customs = previous.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
    localStorage.setItem('custom_templates', JSON.stringify(customs));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setUndoStack(u => [...u, templates]);
    setTemplatesState(next);

    localStorage.setItem('active_templates_v2', JSON.stringify(next));
    const customs = next.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
    localStorage.setItem('custom_templates', JSON.stringify(customs));
  };

  // Keyboard shortcut listener for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';

      if ((e.ctrlKey || e.metaKey) && isZ && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && isZ && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && isY) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, templates]);

  const [currentTemplateId, setCurrentTemplateId] = useState<string>(() => {
    const savedV2 = localStorage.getItem('active_templates_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    const savedV1 = localStorage.getItem('custom_templates');
    if (savedV1) {
      try {
        const parsed = JSON.parse(savedV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    return INITIAL_FALLBACK_TEMPLATE.id;
  });
  const [user, setUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');
  const [firestoreQuotaExceeded, setFirestoreQuotaExceededState] = useState<boolean>(() => {
    return localStorage.getItem('firestore_quota_exceeded') === 'true';
  });

  const setFirestoreQuotaExceeded = (value: boolean) => {
    setFirestoreQuotaExceededState(value);
    if (value) {
      localStorage.setItem('firestore_quota_exceeded', 'true');
    } else {
      localStorage.removeItem('firestore_quota_exceeded');
    }
  };
  const [iosExportImages, setIosExportImages] = useState<{ url: string; name: string }[] | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);
  const lastSavedProjectRef = useRef<string>('');
  
  // Template Catalog Inline Edit States
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingWidth, setEditingWidth] = useState<number>(1080);
  const [editingHeight, setEditingHeight] = useState<number>(1080);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  const currentTemplate = useMemo(() => {
    const raw = templates.find(t => t.id === currentTemplateId) || templates[0];
    return ensureMultiPageSupport(raw);
  }, [templates, currentTemplateId]);

  // Active production data
  const [graphicData, setGraphicData] = useState<Record<string, GraphicData>>(() => {
    const savedLocal = localStorage.getItem('active_graphic_data');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && Object.keys(parsed).length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse active_graphic_data from localStorage', e);
      }
    }
    // Generate initial dynamic data for all templates
    const initial: Record<string, GraphicData> = {};
    const defaultTemplates = [INITIAL_FALLBACK_TEMPLATE];
    defaultTemplates.forEach(t => {
      const texts: Record<string, string> = {};
      const images: Record<string, any> = {};
      t.regions.forEach(r => {
        if (r.type === 'text') {
          texts[r.id] = r.placeholderText || '';
        } else if (r.type === 'image') {
          images[r.id] = {
            url: r.placeholderImage || '',
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          };
        }
      });
      initial[t.id] = {
        templateId: t.id,
        dynamicTexts: texts,
        dynamicImages: images,
        hiddenElements: []
      };
    });
    return initial;
  });

  // Helper to get active production data
  const activeGraphicData = useMemo<GraphicData>(() => {
    if (graphicData[currentTemplateId]) {
      return graphicData[currentTemplateId];
    }
    // Initialize if missing
    const texts: Record<string, string> = {};
    const images: Record<string, any> = {};
    currentTemplate.regions.forEach(r => {
      if (r.type === 'text') {
        texts[r.id] = r.placeholderText || '';
      } else if (r.type === 'image') {
        images[r.id] = {
          url: r.placeholderImage || '',
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0
        };
      }
    });
    return {
      templateId: currentTemplateId,
      dynamicTexts: texts,
      dynamicImages: images,
      hiddenElements: []
    };
  }, [graphicData, currentTemplateId, currentTemplate]);

  // Active Node / Selected Layer for Phase 1 Design
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingImageRegionId, setEditingImageRegionId] = useState<string | null>(null);

  // General App configuration
  const [activeTab, setActiveTab] = useState<'presets' | 'phase1' | 'phase2'>('phase2');

  const handleTabChange = (targetTab: 'presets' | 'phase1' | 'phase2') => {
    if (activeTab === 'phase1' && targetTab !== 'phase1') {
      if (!isCloudSynced && isValidConfig && user && user.uid) {
        setConfirmDialog({
          isOpen: true,
          title: 'Kaydedilmemiş Değişiklikler',
          message: 'Şablon üzerinde yaptığınız değişiklikler henüz buluta kaydedilmedi. Kaydetmeden çıkmak istediğinize emin misiniz?',
          type: 'warning',
          confirmText: 'Kaydetmeden Çık',
          cancelText: 'Vazgeç',
          onConfirm: () => {
            setConfirmDialog(null);
            setActiveTab(targetTab);
          }
        });
        return;
      }
    }
    setActiveTab(targetTab);
  };

  // --- MULTI-PAGE TEMPLATE AND COLLAGE AUTOMATION STATES ---
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [generatedPages, setGeneratedPages] = useState<any[]>(() => {
    const savedLocal = localStorage.getItem('active_generated_pages');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse active_generated_pages from localStorage', e);
      }
    }
    return [];
  });
  const [activeGeneratedPageIndex, setActiveGeneratedPageIndex] = useState<number>(0);

  const activePageData = useMemo(() => {
    if (generatedPages.length > 0 && generatedPages[activeGeneratedPageIndex]) {
      return generatedPages[activeGeneratedPageIndex];
    }
    return {
      id: 'default-cover',
      templatePageId: '1',
      dynamicTexts: activeGraphicData.dynamicTexts,
      dynamicImages: activeGraphicData.dynamicImages,
      hiddenElements: activeGraphicData.hiddenElements || []
    };
  }, [generatedPages, activeGeneratedPageIndex, activeGraphicData]);

  const activeTemplatePage = useMemo(() => {
    const pages = currentTemplate.pages || [];
    if (activeTab === 'phase1') {
      return pages[activePageIndex] || pages[0];
    } else {
      const pageId = activePageData.templatePageId;
      return pages.find(p => p.id === pageId) || pages[0];
    }
  }, [currentTemplate, activeTab, activePageIndex, activePageData.templatePageId]);

  const editingTemplate = useMemo(() => {
    return {
      ...currentTemplate,
      backgroundImageUrl: activeTemplatePage?.backgroundImageUrl ?? currentTemplate.backgroundImageUrl,
      regions: activeTemplatePage.regions,
      fixedElements: activeTemplatePage.fixedElements
    };
  }, [currentTemplate, activeTemplatePage]);

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportScale, setExportScale] = useState<number>(1.5); // 1.5x, 2x for DPI
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});

  // AI Content Assistant
  const [aiNiche, setAiNiche] = useState<string>('Moda');
  const [aiStyle, setAiStyle] = useState<string>('fashion');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiCollageBrief, setAiCollageBrief] = useState<string>('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get all unique uploaded Base64 images across the entire project (all templates, pages, etc.)
  const getUniqueUploadedImages = () => {
    const urls: string[] = [];

    // 1. From graphicData
    (Object.values(graphicData) as any[]).forEach(gd => {
      if (gd && gd.dynamicImages) {
        Object.values(gd.dynamicImages).forEach((img: any) => {
          if (img && img.url && img.url.startsWith('data:')) {
            urls.push(img.url);
          }
        });
      }
    });

    // 2. From generatedPages
    (generatedPages as any[]).forEach(p => {
      if (p && p.dynamicImages) {
        Object.values(p.dynamicImages).forEach((img: any) => {
          if (img && img.url && img.url.startsWith('data:')) {
            urls.push(img.url);
          }
        });
      }
    });

    // Keep unique values
    const unique = Array.from(new Set(urls));
    return unique.filter(url => isRealUserUploadedImage(url, currentTemplate));
  };

  // --- MOBILE RESPONSIVE PANEL STATE ---
  const [mobileView, setMobileView] = useState<'editor' | 'canvas' | 'export'>('canvas');
  const [expandedImageSettings, setExpandedImageSettings] = useState<Record<string, boolean>>({});

  // --- GLOBAL HIGHLIGHT/ACCENT (VURGU) COLOR STATE ---
  const [vurguColor, setVurguColor] = useState<string>(() => {
    return localStorage.getItem('vurgu_color') || '#4F46E5';
  });

  const handleVurguColorChange = (color: string) => {
    setVurguColor(color);
    localStorage.setItem('vurgu_color', color);
  };

  // --- CANVAS ZOOM & PAN STATES ---
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
  const [zoomScale, setZoomScale] = useState<number>(0.5);
  const [panOffset, setPanOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // --- LAYER EDITS & DRAG-AND-DROP REORDERING STATES ---
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [tempRegionName, setTempRegionName] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- RE-RENDER CANVAS WHENEVER CONFIG CHANGE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use empty/placeholder texts and images when in Phase 1 Template Design Mode
    const texts = activeTab === 'phase1' ? {} : activePageData.dynamicTexts;
    const images = activeTab === 'phase1' ? {} : activePageData.dynamicImages;
    const hidden = activeTab === 'phase1' ? [] : activePageData.hiddenElements;

    // Render with 1x scale for the live display preview
    renderTemplateToCanvas(
      canvas,
      editingTemplate,
      texts,
      images,
      {
        paletteOverrides: activeGraphicData.paletteOverrides,
        hiddenElements: hidden,
        showGrid,
        showSafeMargins,
        scale: 1.0,
        selectedNodeId,
        highlightColor: vurguColor,
        editingImageRegionId
      }
    );
  }, [editingTemplate, activeTab, activePageData, activeGraphicData.paletteOverrides, showGrid, showSafeMargins, selectedNodeId, vurguColor, editingImageRegionId]);

  // --- FIREBASE CLOUD STORAGE INTEGRATION & SYNCING ---
  const lastSavedRef = useRef<string>('');

  const syncAndLoadUserData = async (uid: string) => {
    if (!isValidConfig) return;
    
    if (firestoreQuotaExceeded || localStorage.getItem('firestore_quota_exceeded') === 'true') {
      console.warn('Bypassing Firestore sync due to active quota limits. Loading from localStorage instead.');
      setCloudStatus('offline');
      
      let localTemplates: DesignTemplate[] = [];
      const savedV2 = localStorage.getItem('active_templates_v2') || localStorage.getItem('custom_templates');
      if (savedV2) {
        try {
          const parsed = JSON.parse(savedV2);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplatesState(parsed);
            localTemplates = parsed;
          }
        } catch (e) {
          console.error('Failed to parse local templates in offline mode:', e);
        }
      }
      
      // Initialize refs even in offline mode to support future edits and auto-save attempts
      const fallbackTemplates = localTemplates.length > 0 ? localTemplates : [INITIAL_FALLBACK_TEMPLATE];
      const customOnly = fallbackTemplates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
      lastSavedRef.current = JSON.stringify(customOnly);
      lastSavedProjectRef.current = JSON.stringify({
        currentTemplateId: currentTemplateId || fallbackTemplates[0]?.id || '',
        graphicData: graphicData || {},
        generatedPages: generatedPages || []
      });
      return;
    }

    setCloudStatus('syncing');
    try {
      // Load deleted template IDs from localStorage to enforce local deletions even when offline transitions happen
      const deletedIds = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
      const deletedIdsSet = new Set<string>(deletedIds);

      // 1. First, load existing local templates from localStorage to prevent wiping out unsynced custom templates!
      let localTemplates: DesignTemplate[] = [];
      const savedV2 = localStorage.getItem('active_templates_v2') || localStorage.getItem('custom_templates');
      if (savedV2) {
        try {
          const parsed = JSON.parse(savedV2);
          if (Array.isArray(parsed)) {
            localTemplates = parsed.filter(t => !deletedIdsSet.has(t.id));
          }
        } catch (e) {
          console.error('Failed to parse local templates in syncAndLoadUserData:', e);
        }
      }

      // 2. Fetch cloud templates and active project in parallel for high performance!
      const [cloudTemplates, savedProject] = await Promise.all([
        getCloudTemplates().then(res => res || []),
        getUserGraphicProject(uid).catch(err => {
          console.error('Error fetching user graphic project:', err);
          return null;
        })
      ]);

      // Handle delayed deletions for any cloud templates that are in deletedIds list
      for (const ct of cloudTemplates) {
        if (deletedIdsSet.has(ct.id)) {
          console.log(`Processing offline/delayed deletion for cloud template: ${ct.name} (${ct.id})`);
          deleteCloudTemplate(ct.id).then(() => {
            const currentDeleted = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
            const updatedDeleted = currentDeleted.filter((id: string) => id !== ct.id);
            localStorage.setItem('deleted_template_ids', JSON.stringify(updatedDeleted));
          }).catch(err => {
            console.error(`Failed to execute delayed cloud deletion for ${ct.id}:`, err);
          });
        }
      }

      // 3. Create a map of custom templates to merge cloud and potentially guest templates securely.
      const templatesMap = new Map<string, DesignTemplate>();

      // Filter cloudTemplates to exclude deleted ones
      const activeCloudTemplates = cloudTemplates.filter(ct => !deletedIdsSet.has(ct.id));

      // Decide if we should import local guest templates (only once per user session initialization)
      const importFlagKey = `guest_templates_imported_${uid}`;
      const guestTemplatesImported = localStorage.getItem(importFlagKey) === 'true';

      if (!guestTemplatesImported) {
        // First load: seed with local custom templates to merge existing guest designs into the cloud account
        localTemplates.forEach(t => {
          if (!TEMPLATE_PRESETS.some(p => p.id === t.id)) {
            templatesMap.set(t.id, t);
          }
        });

        // Merge cloud templates (cloud takes priority)
        activeCloudTemplates.forEach(t => {
          if (!TEMPLATE_PRESETS.some(p => p.id === t.id)) {
            templatesMap.set(t.id, t);
          }
        });

        // Save imported custom templates immediately to the cloud to sync them up!
        const mergedCustomOnly = Array.from(templatesMap.values());
        for (const template of mergedCustomOnly) {
          await saveCloudTemplate(template).catch(err => console.error('Failed to auto-save imported guest template:', err));
        }

        localStorage.setItem(importFlagKey, 'true');
      } else {
        // Subsequent loads / other devices: Cloud templates are the absolute, ultimate source of truth!
        // We do NOT load or merge local templates from localStorage to prevent resurrection of deleted templates!
        activeCloudTemplates.forEach(t => {
          if (!TEMPLATE_PRESETS.some(p => p.id === t.id)) {
            templatesMap.set(t.id, t);
          }
        });
      }

      // C. If there is a saved project, merge its templates overrides as well (only for templates that already exist in templatesMap, preventing resurrected deleted templates)
      if (savedProject && savedProject.templates && savedProject.templates.length > 0) {
        savedProject.templates.forEach((savedT: any) => {
          if (!TEMPLATE_PRESETS.some(p => p.id === savedT.id)) {
            const existing = templatesMap.get(savedT.id);
            if (existing) {
              templatesMap.set(savedT.id, { ...existing, ...savedT });
            }
          }
        });
      }

      // D. Combine presets and custom merged templates
      const mergedCustomTemplates = Array.from(templatesMap.values());
      let finalTemplates = [...TEMPLATE_PRESETS, ...mergedCustomTemplates];

      if (finalTemplates.length === 0) {
        finalTemplates = [INITIAL_FALLBACK_TEMPLATE];
      }

      // 4. Update project states
      if (savedProject) {
        if (savedProject.graphicData) {
          setGraphicData(savedProject.graphicData);
        }
        if (savedProject.generatedPages) {
          setGeneratedPages(savedProject.generatedPages);
        }
        if (savedProject.currentTemplateId) {
          if (finalTemplates.some(t => t.id === savedProject.currentTemplateId)) {
            setCurrentTemplateId(savedProject.currentTemplateId);
          } else {
            setCurrentTemplateId(finalTemplates[0].id);
          }
        }
      } else {
        // If no saved project exists, initialize currentTemplateId to first available template
        setCurrentTemplateId(finalTemplates[0].id);
      }

      // ALWAYS initialize the project and template refs securely to allow background auto-syncs for new/empty projects
      lastSavedProjectRef.current = JSON.stringify({
        currentTemplateId: savedProject?.currentTemplateId || finalTemplates[0]?.id || '',
        graphicData: savedProject?.graphicData || {},
        generatedPages: savedProject?.generatedPages || []
      });

      // 5. Update the state and local storage once atomically!
      setTemplatesState(finalTemplates);
      saveTemplatesToLocalStorage(finalTemplates);

      // Clear undo/redo history stacks after syncing user cloud database
      setUndoStack([]);
      setRedoStack([]);

      // 6. Initialize the auto-save ref immediately with the final custom templates
      const customOnly = finalTemplates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
      lastSavedRef.current = JSON.stringify(customOnly);

      setCloudStatus('synced');
    } catch (err: any) {
      console.error('Error in syncAndLoadUserData:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('quota') || 
          errMsg.toLowerCase().includes('exhausted') || 
          errMsg.toLowerCase().includes('permission')) {
        setFirestoreQuotaExceeded(true);
      }
      setCloudStatus('error');
      
      // Fallback: load whatever templates we have locally in localStorage if any
      const savedV2 = localStorage.getItem('active_templates_v2');
      if (savedV2) {
        try {
          const parsed = JSON.parse(savedV2);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplatesState(parsed);
          }
        } catch (e) {
          console.error('Failed to parse active_templates_v2 from localStorage:', e);
        }
      }
    }
  };

  useEffect(() => {
    if (!isValidConfig) {
      setCloudStatus('offline');
      setIsAppLoaded(true);
      return;
    }

    setCloudStatus('syncing');
    
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await syncAndLoadUserData(currentUser.uid);
        isLoadedRef.current = true;
        setIsAppLoaded(true);
      } else {
        setUser(null);
        setCloudStatus('offline');
        isLoadedRef.current = true;
        setIsAppLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- REAL-TIME CLOUD SYNCHRONIZATION ---
  // Real-time listeners (onSnapshot) have been removed to completely prevent infinite sync loops and avoid Firestore quota exhaustion.
  // Data is securely loaded once on startup or Google Sign-In.
  // Automatic sync-on-focus has been removed to respect manual synchronization and prevent overwriting unsaved local changes.

  // Synchronize Firestore network state with firestoreQuotaExceeded state to prevent infinite background write retries and console spam
  useEffect(() => {
    if (!isValidConfig) return;
    if (firestoreQuotaExceeded) {
      disableFirestoreNetwork();
    } else {
      enableFirestoreNetwork();
    }
  }, [firestoreQuotaExceeded]);

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Manual save function that sends local changes directly to the Firestore cloud database
  const saveDataToCloud = async (
    specificTemplates?: DesignTemplate[] | any,
    specificTemplateId?: string,
    specificGraphicData?: Record<string, GraphicData> | any,
    specificGeneratedPages?: any[]
  ) => {
    if (!isValidConfig || !user || !user.uid) return;

    setCloudStatus('syncing');
    try {
      // Guard against React Event objects being passed as parameters when used directly in onClick
      const templatesToUse = Array.isArray(specificTemplates) ? specificTemplates : templates;
      const templateIdToUse = typeof specificTemplateId === 'string' ? specificTemplateId : currentTemplateId;
      const graphicDataToUse = (specificGraphicData && typeof specificGraphicData === 'object' && !('nativeEvent' in specificGraphicData)) ? specificGraphicData : graphicData;
      const generatedPagesToUse = Array.isArray(specificGeneratedPages) ? specificGeneratedPages : generatedPages;

      const customTemplates = templatesToUse.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
      const currentSerializedTemplates = JSON.stringify(customTemplates);
      const currentSerializedProject = JSON.stringify({
        currentTemplateId: templateIdToUse,
        graphicData: graphicDataToUse,
        generatedPages: generatedPagesToUse
      });

      // 1. Fetch current cloud templates to handle deleted ones securely
      const cloudTemplates = await getCloudTemplates().then(res => res || []);
      const currentCustomIds = new Set(customTemplates.map(t => t.id));

      for (const ct of cloudTemplates) {
        if (!currentCustomIds.has(ct.id)) {
          console.log(`Deleting removed template from Firestore: ${ct.name} (${ct.id})`);
          await deleteCloudTemplate(ct.id);
        }
      }

      // 2. Save active custom templates
      for (const template of customTemplates) {
        await saveCloudTemplate(template);
      }

      // 3. Save active graphic project
      await saveUserGraphicProject(user.uid, templateIdToUse, graphicDataToUse, generatedPagesToUse);

      // 4. Update saved refs to block duplicate background saving
      lastSavedRef.current = currentSerializedTemplates;
      lastSavedProjectRef.current = currentSerializedProject;

      setIsCloudSynced(true);
      setCloudStatus('synced');
      setFirestoreQuotaExceeded(false); // Reset quota limit warning on success!
    } catch (err: any) {
      console.error('Error saving data to cloud:', err);
      setCloudStatus('error');
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('quota') || 
          errMsg.toLowerCase().includes('exhausted') || 
          errMsg.toLowerCase().includes('permission')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  // Monitor state changes to update isCloudSynced state
  useEffect(() => {
    if (!isValidConfig || !user || !user.uid || !isLoadedRef.current) return;

    const customTemplates = templates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
    const currentSerializedTemplates = JSON.stringify(customTemplates);
    const currentSerializedProject = JSON.stringify({
      currentTemplateId,
      graphicData,
      generatedPages
    });

    const templatesChanged = lastSavedRef.current && currentSerializedTemplates !== lastSavedRef.current;
    const projectChanged = lastSavedProjectRef.current && currentSerializedProject !== lastSavedProjectRef.current;

    if (templatesChanged || projectChanged) {
      setIsCloudSynced(false);
    } else {
      setIsCloudSynced(true);
    }
  }, [templates, currentTemplateId, graphicData, generatedPages, user]);

  // Automatically migrate existing image regions that had clipImage set to false/undefined by default
  useEffect(() => {
    if (isAppLoaded) {
      setTemplatesState(prev => {
        return prev.map(t => {
          const pages = t.pages?.map(p => ({
            ...p,
            regions: p.regions?.map(r => {
              if (r.type === 'image' && (r.clipImage === false || r.clipImage === undefined)) {
                return { ...r, clipImage: true };
              }
              return r;
            }) || []
          })) || [];

          const regions = t.regions?.map(r => {
            if (r.type === 'image' && (r.clipImage === false || r.clipImage === undefined)) {
              return { ...r, clipImage: true };
            }
            return r;
          }) || [];

          return { ...t, pages, regions };
        });
      });

      setGeneratedPages(prev => {
        return prev.map(p => {
          if (p.regions) {
            return {
              ...p,
              regions: p.regions.map((r: any) => {
                if (r.type === 'image' && (r.clipImage === false || r.clipImage === undefined)) {
                  return { ...r, clipImage: true };
                }
                return r;
              })
            };
          }
          return p;
        });
      });
    }
  }, [isAppLoaded]);

  // Automatic background synchronization has been removed in favor of manual saves.
  // Data is only persisted to the cloud when the user explicitly clicks "Buluta Kaydet".

  const handleGoogleLogin = async () => {
    setCloudStatus('syncing');
    isLoadedRef.current = false;
    setIsAppLoaded(false);
    try {
      setFirestoreQuotaExceeded(false); // Reset quota limit warning on login to allow retrying sync
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        await syncAndLoadUserData(loggedInUser.uid);
      }
    } catch (err) {
      console.error('Google Login error:', err);
      setCloudStatus('error');
      alert('Google ile Giriş yaparken bir sorun oluştu. Tarayıcınız popup pencerelerini engelliyor olabilir, lütfen platformu yeni sekmede açarak tekrar deneyin.');
    } finally {
      isLoadedRef.current = true;
      setIsAppLoaded(true);
    }
  };

  const handleLogout = async () => {
    setCloudStatus('syncing');
    try {
      await logoutUser();
      // Reset localStorage and local states
      localStorage.removeItem('active_templates_v2');
      localStorage.removeItem('custom_templates');
      localStorage.removeItem('active_graphic_data');
      localStorage.removeItem('active_generated_pages');
      
      setTemplates([INITIAL_FALLBACK_TEMPLATE]);
      setGeneratedPages([]);
      
      const initial: Record<string, GraphicData> = {};
      [INITIAL_FALLBACK_TEMPLATE].forEach(t => {
        const texts: Record<string, string> = {};
        const images: Record<string, any> = {};
        t.regions.forEach(r => {
          if (r.type === 'text') {
            texts[r.id] = r.placeholderText || '';
          } else if (r.type === 'image') {
            images[r.id] = {
              url: r.placeholderImage || '',
              scale: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
          }
        });
        initial[t.id] = {
          templateId: t.id,
          dynamicTexts: texts,
          dynamicImages: images,
          hiddenElements: []
        };
      });
      setGraphicData(initial);
      setCurrentTemplateId(INITIAL_FALLBACK_TEMPLATE.id);
      setCloudStatus('offline');
    } catch (err) {
      console.error('Logout error:', err);
      setCloudStatus('error');
    }
  };

  // Save custom templates to localStorage
  const saveTemplatesToLocalStorage = (updatedTemplates: DesignTemplate[]) => {
    localStorage.setItem('active_templates_v2', JSON.stringify(updatedTemplates));
    const customs = updatedTemplates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
    localStorage.setItem('custom_templates', JSON.stringify(customs));
  };

  // Instant local storage cache for active graphic project to prevent data loss on page reloads/exit
  useEffect(() => {
    if (Object.keys(graphicData).length > 0) {
      localStorage.setItem('active_graphic_data', JSON.stringify(graphicData));
    }
  }, [graphicData]);

  useEffect(() => {
    if (generatedPages.length > 0) {
      localStorage.setItem('active_generated_pages', JSON.stringify(generatedPages));
    } else {
      localStorage.removeItem('active_generated_pages');
    }
  }, [generatedPages]);

  // Remove uploaded image from all layouts and shift remaining images
  const removeUploadedImage = (urlToDelete: string) => {
    // 1. Get all unique uploaded images before deletion
    const allUnique = getUniqueUploadedImages();
    const remainingUrls = allUnique.filter(u => u !== urlToDelete);

    // 2. Clear from templates and template pages backgroundImageUrl
    setTemplates(prev => {
      const updated = prev.map(t => {
        let changed = false;
        let newBg = t.backgroundImageUrl;
        if (newBg === urlToDelete) {
          newBg = undefined;
          changed = true;
        }
        let newPages = t.pages;
        if (t.pages) {
          newPages = t.pages.map(p => {
            if ((p as any).backgroundImageUrl === urlToDelete) {
              return { ...p, backgroundImageUrl: undefined };
            }
            return p;
          });
          if (JSON.stringify(newPages) !== JSON.stringify(t.pages)) {
            changed = true;
          }
        }
        if (changed) {
          return { ...t, backgroundImageUrl: newBg, pages: newPages };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });

    // 3. Clear from graphicData
    setGraphicData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(tempId => {
        const gd = updated[tempId];
        if (gd && gd.dynamicImages) {
          let gdChanged = false;
          const newImages = { ...gd.dynamicImages };
          Object.keys(newImages).forEach(regionId => {
            if (newImages[regionId]?.url === urlToDelete) {
              newImages[regionId] = {
                ...newImages[regionId],
                url: ''
              };
              gdChanged = true;
            }
          });
          if (gdChanged) {
            updated[tempId] = {
              ...gd,
              dynamicImages: newImages
            };
          }
        }
      });
      return updated;
    });

    // 4. Update generatedPages if there are any
    if (generatedPages.length > 0) {
      if (remainingUrls.length === 0) {
        setGeneratedPages([]);
        setActiveGeneratedPageIndex(0);
      } else {
        generateMultiPageSequence(remainingUrls);
      }
    }
  };

  // --- UPDATE DATA HELPER FUNCTIONS ---
  const updateActiveText = (regionId: string, text: string) => {
    // 1. Update generatedPages if active
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((p, idx) => {
        if (idx === activeGeneratedPageIndex) {
          return {
            ...p,
            dynamicTexts: {
              ...p.dynamicTexts,
              [regionId]: text
            }
          };
        }
        return p;
      }));
    }

    // 2. Fallback/sync update graphicData
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || {
        templateId: currentTemplateId,
        dynamicTexts: {},
        dynamicImages: {},
        hiddenElements: []
      };
      return {
        ...prev,
        [currentTemplateId]: {
          ...current,
          dynamicTexts: {
            ...current.dynamicTexts,
            [regionId]: text
          }
        }
      };
    });
  };

  const updateActiveImageProp = (regionId: string, prop: 'url' | 'scale' | 'offsetX' | 'offsetY' | 'rotation', value: any) => {
    // 1. Update generatedPages if active
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((p, idx) => {
        if (idx === activeGeneratedPageIndex) {
          const imgData = p.dynamicImages[regionId] || {
            url: '',
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          };
          return {
            ...p,
            dynamicImages: {
              ...p.dynamicImages,
              [regionId]: {
                ...imgData,
                [prop]: value
              }
            }
          };
        }
        return p;
      }));
    }

    // 2. Fallback/sync update graphicData
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || {
        templateId: currentTemplateId,
        dynamicTexts: {},
        dynamicImages: {},
        hiddenElements: []
      };
      const imgData = current.dynamicImages[regionId] || {
        url: '',
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      };
      return {
        ...prev,
        [currentTemplateId]: {
          ...current,
          dynamicImages: {
            ...current.dynamicImages,
            [regionId]: {
              ...imgData,
              [prop]: value
            }
          }
        }
      };
    });
  };

  const toggleElementVisibility = (elementId: string) => {
    // 1. Update generatedPages if active
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((p, idx) => {
        if (idx === activeGeneratedPageIndex) {
          const hidden = p.hiddenElements || [];
          const updatedHidden = hidden.includes(elementId)
            ? hidden.filter(id => id !== elementId)
            : [...hidden, elementId];
          return {
            ...p,
            hiddenElements: updatedHidden
          };
        }
        return p;
      }));
    }

    // 2. Fallback/sync update graphicData
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || {
        templateId: currentTemplateId,
        dynamicTexts: {},
        dynamicImages: {},
        hiddenElements: []
      };
      const hidden = current.hiddenElements || [];
      const updatedHidden = hidden.includes(elementId)
        ? hidden.filter(id => id !== elementId)
        : [...hidden, elementId];
      return {
        ...prev,
        [currentTemplateId]: {
          ...current,
          hiddenElements: updatedHidden
        }
      };
    });
  };

  const compressDataUrl = (dataUrl: string, maxWidth = 300, maxHeight = 300, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  };

  const getClientSideFallback = (nicheText: string, styleType: string) => {
    const niche = nicheText ? nicheText.trim() : 'Girişim';
    const style = styleType ? styleType.toLowerCase() : 'minimalist';

    const defaultFallbacks: Record<string, { title: string; subtitle: string; description: string; primaryColor: string; accentColor: string; textColor: string; bgColor: string }> = {
      fashion: {
        title: `**${niche}** Zamanın Ötesinde`,
        subtitle: `*Yeni Sezon* Kreasyonları`,
        description: `Sürdürülebilir üretim süreçleri ve *özel kumaş dokularıyla* tasarlanan, tarzınızı yansıtan parçalar şimdi yayında.`,
        primaryColor: "#7C2D12",
        accentColor: "#D97706",
        textColor: "#292524",
        bgColor: "#FAF8F5"
      },
      tech: {
        title: `Yapay Zeka ve **${niche}** Entegrasyonu`,
        subtitle: `*Yenilikçi* Dijital Çözümler`,
        description: `Maksimum hız, yüksek verimlilik ve *modern yazılım standartlarıyla* iş akışlarınızı geleceğe entegre edin.`,
        primaryColor: "#0891B2",
        accentColor: "#2563EB",
        textColor: "#F3F4F6",
        bgColor: "#090D16"
      },
      food: {
        title: `Tazelikten Gelen **${niche}** Lezzeti`,
        subtitle: `*Gurme* Gastronomi Keyfi`,
        description: `Yerel üreticilerden doğrudan temin edilen taze malzemeler ve *şefimizin özel dokunuşuyla* eşsiz bir deneyim.`,
        primaryColor: "#15803D",
        accentColor: "#EA580C",
        textColor: "#1C1917",
        bgColor: "#FDFDFB"
      },
      education: {
        title: `**${niche}** ile Geleceğinizi Kurun`,
        subtitle: `*Gelişmiş* Eğitim Metotları`,
        description: `Uzman eğitmen kadrosu, modern konu başlıkları ve *birebir mentorluk desteğiyle* kariyerinizde yeni bir dönem.`,
        primaryColor: "#4F46E5",
        accentColor: "#10B981",
        textColor: "#0F172A",
        bgColor: "#F8FAFC"
      },
      minimalist: {
        title: `Az Çoktur: **${niche}** Dünyası`,
        subtitle: `*Yalın ve Dengeli* Çizgiler`,
        description: `Gereksiz detaylardan arınmış, *tamamen işlevselliğe odaklanmış* estetik ve modern bir felsefe.`,
        primaryColor: "#111827",
        accentColor: "#6B7280",
        textColor: "#1F2937",
        bgColor: "#FFFFFF"
      }
    };

    return defaultFallbacks[style] || defaultFallbacks.minimalist;
  };

  const runAiCollageAnalysis = async (uploadedImages: string[], briefTextOverride?: string) => {
    if (uploadedImages.length === 0) return;
    setIsAiAnalyzing(true);
    setAiSuccessMessage(null);
    setAiProgress(5);

    const targetBrief = briefTextOverride !== undefined ? briefTextOverride : aiCollageBrief;

    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 99) return 99;
        let nextVal = prev;
        if (prev >= 95) nextVal = prev + 0.1;
        else if (prev >= 80) nextVal = prev + 0.8;
        else if (prev >= 50) nextVal = prev + 2;
        else nextVal = prev + 5;
        return nextVal >= 99 ? 99 : nextVal;
      });
    }, 150);

    try {
      // Compress the first image down to ultra lightweight size to speed up the transit and processing
      const compressedFirstImage = await compressDataUrl(uploadedImages[0], 320, 320, 0.55);

      const response = await fetch('/api/analyze-collage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [compressedFirstImage], // Send the high-speed compressed image to reduce payload size and prevent network Entity Too Large errors
          systemPrompt: currentTemplate.aiSystemPrompt || '',
          userPrompt: targetBrief
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Response was not valid JSON, using smart local engine fallback.', parseError);
        data = { success: false };
      }

      clearInterval(progressInterval);
      setAiProgress(100);

      // Trigger smart local fallback on API failure or key problem
      if (!data || !data.success || !data.title) {
        let detectedStyle = aiStyle;
        const briefLower = (targetBrief || '').toLowerCase();
        if (briefLower.includes('moda') || briefLower.includes('giyim') || briefLower.includes('elbise') || briefLower.includes('tasarım') || briefLower.includes('stil') || briefLower.includes('fashion')) {
          detectedStyle = 'fashion';
        } else if (briefLower.includes('yazılım') || briefLower.includes('teknoloji') || briefLower.includes('tech') || briefLower.includes('kod') || briefLower.includes('ai') || briefLower.includes('yapay zeka')) {
          detectedStyle = 'tech';
        } else if (briefLower.includes('yemek') || briefLower.includes('gıda') || briefLower.includes('restoran') || briefLower.includes('cafe') || briefLower.includes('lezzet') || briefLower.includes('food')) {
          detectedStyle = 'food';
        } else if (briefLower.includes('eğitim') || briefLower.includes('kurs') || briefLower.includes('okul') || briefLower.includes('ders') || briefLower.includes('akademi') || briefLower.includes('education')) {
          detectedStyle = 'education';
        }

        const fallbackData = getClientSideFallback(targetBrief || 'Kampanya', detectedStyle);
        data = {
          success: true,
          isFallback: true,
          title: fallbackData.title,
          subtitle: fallbackData.subtitle,
          description: fallbackData.description,
          primaryColor: fallbackData.primaryColor,
          accentColor: fallbackData.accentColor,
          textColor: fallbackData.textColor,
          bgColor: fallbackData.bgColor
        };
      }

      if (data.success) {
        // Apply the title, subtitle, and description appropriately to all generated pages
        setGeneratedPages(prev => {
          if (prev.length === 0) return prev;
          return prev.map((page) => {
            const pageDef = currentTemplate.pages?.find(p => p.id === page.templatePageId) || currentTemplate;
            const mappedPageTexts = getMappedTextsForPage(pageDef.regions, {
              title: data.title || '',
              subtitle: data.subtitle || '',
              description: data.description || ''
            });
            return {
              ...page,
              dynamicTexts: {
                ...page.dynamicTexts,
                ...mappedPageTexts
              }
            };
          });
        });

        // Also update graphicData with mapped title, subtitle, and description for fallback sync
        setGraphicData(prev => {
          const current = prev[currentTemplateId] || {
            templateId: currentTemplateId,
            dynamicTexts: {},
            dynamicImages: {},
            hiddenElements: []
          };
          const mappedTemplateTexts = getMappedTextsForPage(currentTemplate.regions, {
            title: data.title || '',
            subtitle: data.subtitle || '',
            description: data.description || ''
          });
          return {
            ...prev,
            [currentTemplateId]: {
              ...current,
              dynamicTexts: {
                ...current.dynamicTexts,
                ...mappedTemplateTexts
              }
            }
          };
        });

        // Apply color overrides
        if (data.primaryColor) applyPaletteOverride('primary', data.primaryColor);
        if (data.accentColor) applyPaletteOverride('accent', data.accentColor);
        if (data.textColor) applyPaletteOverride('text', data.textColor);
        if (data.bgColor) applyPaletteOverride('bg', data.bgColor);

        setAiSuccessMessage(data.isFallback
          ? 'Kreatif yerel tasarım motoru ile başlıklar ve renk paleti başarıyla uyarlandı!'
          : 'Yapay Zeka görseli otomatik algıladı, başlık ve açıklamayı başarıyla üretti!'
        );
        setTimeout(() => setAiSuccessMessage(null), 5000);
      } else {
        alert('Görsel analiz edilirken bir hata oluştu.');
      }
    } catch (e) {
      console.warn('Network error during analyze-collage, using local smart fallback engine.', e);
      
      clearInterval(progressInterval);
      setAiProgress(100);

      // Trigger local fallback directly on catch so there is absolutely no blocking alert!
      let detectedStyle = aiStyle;
      const briefLower = (targetBrief || '').toLowerCase();
      if (briefLower.includes('moda') || briefLower.includes('giyim') || briefLower.includes('elbise') || briefLower.includes('tasarım') || briefLower.includes('stil') || briefLower.includes('fashion')) {
        detectedStyle = 'fashion';
      } else if (briefLower.includes('yazılım') || briefLower.includes('teknoloji') || briefLower.includes('tech') || briefLower.includes('kod') || briefLower.includes('ai') || briefLower.includes('yapay zeka')) {
        detectedStyle = 'tech';
      } else if (briefLower.includes('yemek') || briefLower.includes('gıda') || briefLower.includes('restoran') || briefLower.includes('cafe') || briefLower.includes('lezzet') || briefLower.includes('food')) {
        detectedStyle = 'food';
      } else if (briefLower.includes('eğitim') || briefLower.includes('kurs') || briefLower.includes('okul') || briefLower.includes('ders') || briefLower.includes('akademi') || briefLower.includes('education')) {
        detectedStyle = 'education';
      }

      const fallbackData = getClientSideFallback(targetBrief || 'Kampanya', detectedStyle);
      
      // Map texts and update pages
      setGeneratedPages(prev => {
        if (prev.length === 0) return prev;
        return prev.map((page) => {
          const pageDef = currentTemplate.pages?.find(p => p.id === page.templatePageId) || currentTemplate;
          const mappedPageTexts = getMappedTextsForPage(pageDef.regions, {
            title: fallbackData.title || '',
            subtitle: fallbackData.subtitle || '',
            description: fallbackData.description || ''
          });
          return {
            ...page,
            dynamicTexts: {
              ...page.dynamicTexts,
              ...mappedPageTexts
            }
          };
        });
      });

      setGraphicData(prev => {
        const current = prev[currentTemplateId] || {
          templateId: currentTemplateId,
          dynamicTexts: {},
          dynamicImages: {},
          hiddenElements: []
        };
        const mappedTemplateTexts = getMappedTextsForPage(currentTemplate.regions, {
          title: fallbackData.title || '',
          subtitle: fallbackData.subtitle || '',
          description: fallbackData.description || ''
        });
        return {
          ...prev,
          [currentTemplateId]: {
            ...current,
            dynamicTexts: {
              ...current.dynamicTexts,
              ...mappedTemplateTexts
            }
          }
        };
      });

      // Apply color overrides
      if (fallbackData.primaryColor) applyPaletteOverride('primary', fallbackData.primaryColor);
      if (fallbackData.accentColor) applyPaletteOverride('accent', fallbackData.accentColor);
      if (fallbackData.textColor) applyPaletteOverride('text', fallbackData.textColor);
      if (fallbackData.bgColor) applyPaletteOverride('bg', fallbackData.bgColor);

      setAiSuccessMessage('Yerel kreatif motor ile şablon başlıkları ve renk paleti başarıyla güncellendi!');
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setAiProgress(0), 1000);
      setIsAiAnalyzing(false);
    }
  };

  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

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
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => {
          resolve((e.target?.result as string) || '');
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  const fillEmptyImageFramesWithWizard = (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;

    let activePages = [...generatedPages];
    if (activePages.length === 0) {
      const pageWithFallback = ensureMultiPageSupport(currentTemplate);
      const availablePages = pageWithFallback.pages || [];
      activePages = availablePages.map((pageDef, idx) => {
        const texts: any = {};
        const images: any = {};
        pageDef.regions.forEach(r => {
          if (r.type === 'text') {
            texts[r.id] = r.placeholderText || '';
          } else if (r.type === 'image') {
            images[r.id] = {
              url: r.placeholderImage || '',
              scale: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
          }
        });
        return {
          id: `generated-${pageDef.id}-${idx}-${Date.now()}`,
          templatePageId: pageDef.id,
          name: pageDef.name || `${idx + 1}. Sayfa`,
          dynamicTexts: texts,
          dynamicImages: images,
          hiddenElements: []
        };
      });
    }

    let imgIdx = 0;
    const updatedPages = activePages.map(page => {
      const pageDef = currentTemplate.pages?.find(p => p.id === page.templatePageId) || currentTemplate;
      const imageRegions = pageDef.regions?.filter(r => isTemplateImageFrame(r)) || [];
      const newDynamicImages = { ...page.dynamicImages };

      imageRegions.forEach(r => {
        const currentImg = newDynamicImages[r.id];
        const isImgEmpty = !currentImg || 
                           !currentImg.url || 
                           currentImg.url === '' || 
                           currentImg.url.includes('unsplash.com') || 
                           (r.placeholderImage && currentImg.url === r.placeholderImage && !r.placeholderImage.startsWith('data:'));

        if (isImgEmpty && imgIdx < imageUrls.length) {
          newDynamicImages[r.id] = {
            url: imageUrls[imgIdx],
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          };
          imgIdx++;
        }
      });

      return {
        ...page,
        dynamicImages: newDynamicImages
      };
    });

    setGeneratedPages(updatedPages);
    setActiveGeneratedPageIndex(0);
    setAiSuccessMessage(`Görseller başarıyla boş resim çerçevelerinin içine yerleştirildi.`);
  };

  const generateMultiPageSequence = (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;

    const pageWithFallback = ensureMultiPageSupport(currentTemplate);
    const availablePages = pageWithFallback.pages || [];

    // Find the cover template page
    const coverPageDef = availablePages.find(p => p.pageRole === 'cover') || availablePages[0];
    
    // Find 2-image template page and 1-image template page (fallback to other slots if missing)
    const twoImagePageDef = availablePages.find(p => p.pageRole === '2-image') || 
                            availablePages.find(p => p.regions.filter(r => isTemplateImageFrame(r)).length === 2) || 
                            availablePages[1] || availablePages[0];
                            
    const oneImagePageDef = availablePages.find(p => p.pageRole === '1-image') || 
                            availablePages.find(p => p.regions.filter(r => isTemplateImageFrame(r)).length === 1) || 
                            availablePages[2] || availablePages[0];

    const newGeneratedPages: any[] = [];

    // --- PAGE 1: COVER PAGE (Always 1 photo) ---
    const coverTexts = { ...activeGraphicData.dynamicTexts };
    const coverImages: any = {};

    const coverImgRegions = coverPageDef.regions.filter(r => isTemplateImageFrame(r));
    if (coverImgRegions.length > 0) {
      coverImages[coverImgRegions[0].id] = {
        url: imageUrls[0],
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      };
    }

    newGeneratedPages.push({
      id: `generated-cover-${Date.now()}`,
      templatePageId: coverPageDef.id,
      name: coverPageDef.name || 'Kapak Sayfası',
      dynamicTexts: coverTexts,
      dynamicImages: coverImages,
      hiddenElements: []
    });

    // --- COLLAGE PAGES ---
    const remainingImages = imageUrls.slice(1);
    
    if (remainingImages.length > 0) {
      let imgIdx = 0;
      let pageCount = 1;

      while (imgIdx < remainingImages.length) {
        const imagesLeft = remainingImages.length - imgIdx;

        // "eğer ki tüm fotoğrafları kolaja yerleştirdin ve elinde tek bir fotoğraf kaldı ise onu tekli şablona koyacaksın."
        if (imagesLeft === 1) {
          const pageImages: any = {};
          const pageTexts = { ...activeGraphicData.dynamicTexts };
          const imageRegions = oneImagePageDef.regions.filter(r => isTemplateImageFrame(r));

          if (imageRegions.length > 0) {
            pageImages[imageRegions[0].id] = {
              url: remainingImages[imgIdx],
              scale: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
            imgIdx++;
          } else {
            imgIdx++; // Fallback progress
          }

          newGeneratedPages.push({
            id: `generated-collage-${oneImagePageDef.id}-${pageCount}-${Date.now()}`,
            templatePageId: oneImagePageDef.id,
            name: `${pageCount + 1}. Sayfa (${oneImagePageDef.name})`,
            dynamicTexts: pageTexts,
            dynamicImages: pageImages,
            hiddenElements: []
          });
          pageCount++;
        } else {
          // "geri kalan fotoğrafları 2li kolaj"
          const pageImages: any = {};
          const pageTexts = { ...activeGraphicData.dynamicTexts };
          const imageRegions = twoImagePageDef.regions.filter(r => isTemplateImageFrame(r));

          let processedCount = 0;
          for (let i = 0; i < imageRegions.length; i++) {
            if (i >= 2) break; // Ensure we only put up to 2 images on this 2-image collage
            if (imgIdx < remainingImages.length) {
              const imgUrl = remainingImages[imgIdx];
              pageImages[imageRegions[i].id] = {
                url: imgUrl,
                scale: 1.0,
                offsetX: 0,
                offsetY: 0,
                rotation: 0
              };
              imgIdx++;
              processedCount++;
            }
          }

          if (processedCount === 0 && imgIdx < remainingImages.length) {
            imgIdx += Math.min(2, remainingImages.length - imgIdx); // Safety step to avoid infinite loop
          }

          newGeneratedPages.push({
            id: `generated-collage-${twoImagePageDef.id}-${pageCount}-${Date.now()}`,
            templatePageId: twoImagePageDef.id,
            name: `${pageCount + 1}. Sayfa (${twoImagePageDef.name})`,
            dynamicTexts: pageTexts,
            dynamicImages: pageImages,
            hiddenElements: []
          });
          pageCount++;
        }
      }
    }

    setGeneratedPages(newGeneratedPages);
    setActiveGeneratedPageIndex(0);
    setAiSuccessMessage(`Başarıyla ${newGeneratedPages.length} sayfa otomatik üretildi! Görseller fotoğraf sayısına göre ve şablon sayfa türlerine göre yerleştirildi.`);
  };

  const handleMultiImageFiles = async (files: FileList | File[]) => {
    let fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    if (fileList.length > 25) {
      alert('Maksimum 25 adet fotoğraf yükleyebilirsiniz. İlk 25 fotoğrafınız işleme alınacaktır.');
      fileList = fileList.slice(0, 25);
    }

    try {
      const readPromises = fileList.map(file => {
        return compressImage(file, 1200, 1200, 0.85);
      });

      const imageUrls = await Promise.all(readPromises);
      fillEmptyImageFramesWithWizard(imageUrls);
    } catch (err) {
      console.error('Fotoğraflar işlenirken hata oluştu:', err);
    }
  };

  const applyPaletteOverride = (key: 'primary' | 'accent' | 'text' | 'bg' | 'boldHighlight', color: string) => {
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || {
        templateId: currentTemplateId,
        dynamicTexts: {},
        dynamicImages: {},
        hiddenElements: []
      };
      const overrides = current.paletteOverrides || {};
      return {
        ...prev,
        [currentTemplateId]: {
          ...current,
          paletteOverrides: {
            ...overrides,
            [key]: color
          }
        }
      };
    });
  };

  const resetPaletteOverrides = () => {
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || {
        templateId: currentTemplateId,
        dynamicTexts: {},
        dynamicImages: {},
        hiddenElements: []
      };
      return {
        ...prev,
        [currentTemplateId]: {
          ...current,
          paletteOverrides: undefined
        }
      };
    });
  };

  // --- PHASE 1: TEMPLATE BLUEPRINT MODIFIERS ---
  const handleTemplatePropertyChange = (prop: keyof DesignTemplate, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          return { ...t, [prop]: value };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleTemplatePaletteChange = (key: 'primary' | 'accent' | 'text' | 'bg' | 'boldHighlight', value: string) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          return {
            ...t,
            palette: {
              ...t.palette,
              [key]: value
            }
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const resetTemplatePalette = () => {
    const preset = TEMPLATE_PRESETS.find(p => p.id === currentTemplateId);
    const defaultPalette = preset?.palette || {
      primary: '#4F46E5',
      accent: '#F59E0B',
      text: '#0F172A',
      bg: '#F8FAFC',
      boldHighlight: '#4F46E5'
    };

    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          return {
            ...t,
            palette: {
              ...defaultPalette,
              boldHighlight: defaultPalette.boldHighlight || defaultPalette.primary
            }
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleRegionPropertyChange = (regionId: string, prop: keyof Region, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                regions: p.regions.map(r => r.id === regionId ? { ...r, [prop]: value } : r)
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleRegionPropertiesChange = (regionId: string, updates: Partial<Region>) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                regions: p.regions.map(r => r.id === regionId ? { ...r, ...updates } : r)
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementPropertiesChange = (elementId: string, updates: Partial<FixedElement>) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                fixedElements: p.fixedElements.map(el => el.id === elementId ? { ...el, ...updates } : el)
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleRegionTextStyleChange = (regionId: string, prop: keyof TextStyle, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                regions: p.regions.map(r => {
                  if (r.id === regionId) {
                    return {
                      ...r,
                      textStyle: {
                        ...r.textStyle!,
                        [prop]: value,
                        ...(prop === 'color' ? { isCustomColor: true } : {})
                      }
                    };
                  }
                  return r;
                })
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementPropertyChange = (elementId: string, prop: keyof FixedElement, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                fixedElements: p.fixedElements.map(el => el.id === elementId ? { ...el, [prop]: value } : el)
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementTextStyleChange = (elementId: string, prop: keyof TextStyle, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                fixedElements: p.fixedElements.map(el => {
                  if (el.id === elementId) {
                    return {
                      ...el,
                      textStyle: {
                        ...el.textStyle!,
                        [prop]: value,
                        ...(prop === 'color' ? { isCustomColor: true } : {})
                      }
                    };
                  }
                  return el;
                })
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  // Center selected layer on canvas
  const centerSelectedLayer = (axis: 'horizontal' | 'vertical' | 'both') => {
    if (!selectedNodeId) return;

    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          // Check regions
          let hasRegion = false;
          const updatedRegions = t.regions.map(r => {
            if (r.id === selectedNodeId) {
              hasRegion = true;
              let newX = r.x;
              let newY = r.y;
              if (axis === 'horizontal' || axis === 'both') {
                newX = Math.round((t.width - r.width) / 2);
              }
              if (axis === 'vertical' || axis === 'both') {
                newY = Math.round((t.height - r.height) / 2);
              }
              return { ...r, x: newX, y: newY };
            }
            return r;
          });

          if (hasRegion) {
            return { ...t, regions: updatedRegions };
          }

          // Check fixed elements
          const updatedElements = t.fixedElements.map(el => {
            if (el.id === selectedNodeId) {
              let newX = el.x;
              let newY = el.y;
              if (axis === 'horizontal' || axis === 'both') {
                newX = Math.round((t.width - el.width) / 2);
              }
              if (axis === 'vertical' || axis === 'both') {
                newY = Math.round((t.height - el.height) / 2);
              }
              return { ...el, x: newX, y: newY };
            }
            return el;
          });

          return { ...t, fixedElements: updatedElements };
        }
        return t;
      });

      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  // Create new completely blank user template
  const createNewTemplate = () => {
    const id = `custom-template-${Date.now()}`;
    const newTemp: DesignTemplate = {
      id,
      name: `Yeni Özel Şablon #${templates.length + 1}`,
      width: 1080,
      height: 1080,
      backgroundColor: '#FAFAFA',
      palette: {
        primary: '#4F46E5',
        accent: '#F59E0B',
        text: '#0F172A',
        bg: '#FAFAFA'
      },
      regions: [
        {
          id: `region-title-${Date.now()}`,
          name: 'Ana Başlık Alanı',
          type: 'text',
          x: 100,
          y: 200,
          width: 880,
          height: 250,
          backgroundColor: 'transparent',
          opacity: 1,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          isDynamic: true,
          placeholderText: "Yeni Özel **Şablon** Başlığı",
          textStyle: {
            fontFamily: 'Space Grotesk',
            fontSize: 48,
            color: '#0F172A',
            fontWeight: 'bold',
            lineHeight: 1.2,
            align: 'center'
          }
        },
        {
          id: `region-image-${Date.now()}`,
          name: 'Ana Fotoğraf Alanı',
          type: 'image',
          x: 290,
          y: 500,
          width: 500,
          height: 450,
          backgroundColor: '#E2E8F0',
          opacity: 1,
          borderColor: '#4F46E5',
          borderWidth: 2,
          borderRadius: 16,
          isDynamic: true,
          placeholderImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
        }
      ],
      fixedElements: [
        {
          id: `fixed-logo-${Date.now()}`,
          type: 'logo',
          name: 'Üst Logo',
          x: 100,
          y: 80,
          width: 880,
          height: 40,
          content: '✦ MARKANIZ',
          textStyle: {
            fontFamily: 'Inter',
            fontSize: 18,
            color: '#4F46E5',
            fontWeight: 'bold',
            lineHeight: 1,
            align: 'center',
            letterSpacing: 2
          }
        }
      ]
    };

    setTemplates(prev => {
      const updated = [...prev, newTemp];
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
    setCurrentTemplateId(id);
    setActiveTab('phase1');
    setSelectedNodeId(null);
  };

  // Delete any template from the catalog
  const deleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('Katalogda en az bir şablon bulunmalıdır! Son kalan şablonu silemezsiniz.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Şablonu Sil',
      message: 'Bu şablonu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: () => {
        const index = templates.findIndex(t => t.id === id);
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        saveTemplatesToLocalStorage(updated);

        // Add to deleted_template_ids list to handle offline/other-device synchronizations
        const deletedIds = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('deleted_template_ids', JSON.stringify(deletedIds));
        }

        // Delete from Firestore if it was a custom template saved to cloud
        if (isValidConfig && !firestoreQuotaExceeded) {
          deleteCloudTemplate(id).then(() => {
            // Remove from deletion queue on successful deletion
            const currentDeleted = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
            const updatedDeleted = currentDeleted.filter((item: string) => item !== id);
            localStorage.setItem('deleted_template_ids', JSON.stringify(updatedDeleted));
          }).catch(err => {
            console.error('Failed to delete cloud template:', err);
          });
        }
        
        // Switch active template
        const fallbackId = updated[index === 0 ? 0 : index - 1]?.id || updated[0].id;
        setCurrentTemplateId(fallbackId);
        setSelectedNodeId(null);
        setConfirmDialog(null);
      }
    });
  };

  // Save inline edits to template name and dimensions from catalog
  const saveInlineTemplateEdit = (id: string) => {
    if (!editingName.trim()) {
      alert('Şablon adı boş bırakılamaz!');
      return;
    }
    const widthVal = Math.max(100, Math.min(4000, editingWidth));
    const heightVal = Math.max(100, Math.min(4000, editingHeight));

    const updatedTemplates = templates.map(t => {
      if (t.id === id) {
        return {
          ...t,
          name: editingName.trim(),
          width: widthVal,
          height: heightVal
        };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    saveTemplatesToLocalStorage(updatedTemplates);
    setEditingTemplateId(null);
  };

  // --- PAGE MANAGEMENT HELPERS ---
  const addNewTemplatePage = (role: 'cover' | '1-image' | '2-image' | '3-image' | 'custom' = '1-image') => {
    const id = `page-${Date.now()}`;
    const nameMap = {
      'cover': 'Kapak Sayfası',
      '1-image': 'Tek Fotoğraflı Kolaj',
      '2-image': '2 Fotoğraflı Kolaj',
      '3-image': '3 Fotoğraflı Kolaj',
      'custom': 'Özel Sayfa'
    };
    
    // Create pre-configured regions based on selected role
    const regions: Region[] = [];
    if (role === 'cover') {
      regions.push({
        id: `region-title-${id}`,
        name: 'Ana Başlık Alanı',
        type: 'text',
        x: Math.floor(currentTemplate.width * 0.1),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.8),
        height: Math.floor(currentTemplate.height * 0.2),
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        textRole: 'title',
        placeholderText: 'Yeni Kapak Başlığı',
        textStyle: {
          fontFamily: 'Space Grotesk',
          fontSize: 48,
          color: currentTemplate.palette?.text || '#0F172A',
          fontWeight: 'bold',
          lineHeight: 1.2,
          align: 'center'
        }
      });
      regions.push({
        id: `region-img-${id}`,
        name: 'Kapak Görseli',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.1),
        y: Math.floor(currentTemplate.height * 0.4),
        width: Math.floor(currentTemplate.width * 0.8),
        height: Math.floor(currentTemplate.height * 0.5),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      });
    } else if (role === '1-image') {
      regions.push({
        id: `region-img-${id}-1`,
        name: 'Görsel 1',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.1),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.8),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      });
      regions.push({
        id: `region-text-${id}`,
        name: 'Açıklama Metni',
        type: 'text',
        x: Math.floor(currentTemplate.width * 0.1),
        y: Math.floor(currentTemplate.height * 0.75),
        width: Math.floor(currentTemplate.width * 0.8),
        height: Math.floor(currentTemplate.height * 0.15),
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        textRole: 'description',
        placeholderText: 'Yeni tek görsel kolaj açıklaması.',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 20,
          color: currentTemplate.palette?.text || '#0F172A',
          fontWeight: 'normal',
          lineHeight: 1.4,
          align: 'center'
        }
      });
    } else if (role === '2-image') {
      regions.push({
        id: `region-img-${id}-1`,
        name: 'Görsel 1',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.05),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.42),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      });
      regions.push({
        id: `region-img-${id}-2`,
        name: 'Görsel 2',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.53),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.42),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
      });
      regions.push({
        id: `region-text-${id}`,
        name: 'Açıklama Metni',
        type: 'text',
        x: Math.floor(currentTemplate.width * 0.05),
        y: Math.floor(currentTemplate.height * 0.75),
        width: Math.floor(currentTemplate.width * 0.9),
        height: Math.floor(currentTemplate.height * 0.15),
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        textRole: 'description',
        placeholderText: 'Yeni iki görsel kolaj açıklaması.',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 20,
          color: currentTemplate.palette?.text || '#0F172A',
          fontWeight: 'normal',
          lineHeight: 1.4,
          align: 'center'
        }
      });
    } else if (role === '3-image') {
      regions.push({
        id: `region-img-${id}-1`,
        name: 'Görsel 1',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.05),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.28),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      });
      regions.push({
        id: `region-img-${id}-2`,
        name: 'Görsel 2',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.36),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.28),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
      });
      regions.push({
        id: `region-img-${id}-3`,
        name: 'Görsel 3',
        type: 'image',
        x: Math.floor(currentTemplate.width * 0.67),
        y: Math.floor(currentTemplate.height * 0.15),
        width: Math.floor(currentTemplate.width * 0.28),
        height: Math.floor(currentTemplate.height * 0.55),
        backgroundColor: '#F1F5F9',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#4F46E5',
        borderWidth: 2,
        borderRadius: 16,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800'
      });
      regions.push({
        id: `region-text-${id}`,
        name: 'Açıklama Metni',
        type: 'text',
        x: Math.floor(currentTemplate.width * 0.05),
        y: Math.floor(currentTemplate.height * 0.75),
        width: Math.floor(currentTemplate.width * 0.9),
        height: Math.floor(currentTemplate.height * 0.15),
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        textRole: 'description',
        placeholderText: 'Yeni üç görsel kolaj açıklaması.',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 18,
          color: currentTemplate.palette?.text || '#0F172A',
          fontWeight: 'normal',
          lineHeight: 1.4,
          align: 'center'
        }
      });
    } else {
      // Custom blank
      regions.push({
        id: `region-title-${id}`,
        name: 'Başlık Alanı',
        type: 'text',
        x: Math.floor(currentTemplate.width * 0.1),
        y: Math.floor(currentTemplate.height * 0.1),
        width: Math.floor(currentTemplate.width * 0.8),
        height: Math.floor(currentTemplate.height * 0.15),
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        textRole: 'title',
        placeholderText: 'Yeni Özel Sayfa',
        textStyle: {
          fontFamily: 'Space Grotesk',
          fontSize: 36,
          color: currentTemplate.palette?.text || '#0F172A',
          fontWeight: 'bold',
          lineHeight: 1.2,
          align: 'center'
        }
      });
    }

    const newPage: TemplatePage = {
      id,
      name: `${currentTemplate.pages!.length + 1}. Sayfa: ${nameMap[role]}`,
      pageRole: role,
      regions,
      fixedElements: (currentTemplate.fixedElements || []).filter(el => el.type !== 'text')
    };

    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          return {
            ...t,
            pages: [...pageWithFallback.pages!, newPage]
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });

    setActivePageIndex(currentTemplate.pages!.length);
    setSelectedNodeId(null);
  };

  const handlePagePropertyChange = (pageIdx: number, prop: keyof TemplatePage, value: any) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === pageIdx) {
              return { ...p, [prop]: value };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const deleteTemplatePage = (pageIdx: number) => {
    if (currentTemplate.pages!.length <= 1) {
      alert('Şablonda en az bir sayfa bulunmalıdır!');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Sayfayı Sil',
      message: 'Bu şablon sayfasını kalıcı olarak silmek istediğinize emin misiniz?',
      onConfirm: () => {
        setTemplates(prev => {
          const updated = prev.map(t => {
            if (t.id === currentTemplateId) {
              const pageWithFallback = ensureMultiPageSupport(t);
              const updatedPages = pageWithFallback.pages!.filter((_, idx) => idx !== pageIdx);
              return {
                ...t,
                pages: updatedPages
              };
            }
            return t;
          });
          saveTemplatesToLocalStorage(updated);
          return updated;
        });
        
        setActivePageIndex(prev => Math.max(0, prev - 1));
        setSelectedNodeId(null);
        setConfirmDialog(null);
      }
    });
  };

  // Add new dynamic region to current template
  const addNewRegion = (type: 'text' | 'image') => {
    const id = `region-${type}-${Date.now()}`;
    
    // Determine smart default textRole based on existing text regions on the active page
    let defaultRole: 'title' | 'subtitle' | 'description' | 'normal' | undefined = undefined;
    let defaultName = 'Yeni Metin Alanı';
    let defaultText = 'Metninizi buraya yazın.';
    
    if (type === 'text') {
      const activePage = currentTemplate.pages?.[activePageIndex] || currentTemplate;
      const textRegionsOnPage = activePage.regions.filter(r => r.type === 'text');
      
      const hasTitle = textRegionsOnPage.some(r => r.textRole === 'title');
      const hasSubtitle = textRegionsOnPage.some(r => r.textRole === 'subtitle');
      const hasDescription = textRegionsOnPage.some(r => r.textRole === 'description');
      
      if (!hasTitle) {
        defaultRole = 'title';
        defaultName = 'Yeni Başlık Alanı';
        defaultText = 'Harika Başlık';
      } else if (!hasSubtitle) {
        defaultRole = 'subtitle';
        defaultName = 'Yeni Alt Başlık Alanı';
        defaultText = 'Alt Başlık Detayı';
      } else if (!hasDescription) {
        defaultRole = 'description';
        defaultName = 'Yeni Açıklama Alanı';
        defaultText = 'Kampanya veya ürün hakkında detaylı açıklama.';
      } else {
        defaultRole = 'normal';
        defaultName = 'Yeni Metin Alanı';
        defaultText = 'Metninizi buraya yazın.';
      }
    }

    const newReg: Region = type === 'text' ? {
      id,
      name: defaultName,
      type: 'text',
      x: 100,
      y: 400,
      width: 400,
      height: 150,
      backgroundColor: 'transparent',
      opacity: 1,
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      isDynamic: true,
      textRole: defaultRole,
      placeholderText: defaultText,
      textStyle: {
        fontFamily: defaultRole === 'title' ? 'Space Grotesk' : 'Inter',
        fontSize: defaultRole === 'title' ? 36 : defaultRole === 'subtitle' ? 24 : 18,
        color: '#0F172A',
        fontWeight: defaultRole === 'title' ? 'bold' : 'normal',
        lineHeight: 1.4,
        align: 'left'
      }
    } : {
      id,
      name: `Yeni Görsel Alanı`,
      type: 'image',
      x: 100,
      y: 400,
      width: 300,
      height: 300,
      backgroundColor: '#E2E8F0',
      opacity: 1,
      borderColor: '#4F46E5',
      borderWidth: 2,
      borderRadius: 12,
      isDynamic: true,
      placeholderImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      clipImage: true
    };

    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return { ...p, regions: [...p.regions, newReg] };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
    setSelectedNodeId(id);
  };

  // Add new image layer from uploaded PNG/image file
  const addImageRegionFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen yalnızca bir resim dosyası seçin!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      if (!dataUrl) return;

      const id = `region-image-${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        const tempWidth = currentTemplate.width;
        const tempHeight = currentTemplate.height;

        let w = img.width;
        let h = img.height;
        let x = 0;
        let y = 0;

        // Calculate aspect ratios
        const imgRatio = w / h;
        const tempRatio = tempWidth / tempHeight;
        const ratioDiff = Math.abs(imgRatio - tempRatio);

        // Check if the uploaded image matches the workspace template dimension proportions
        if (ratioDiff < 0.05 || (w >= tempWidth * 0.9 && h >= tempHeight * 0.9)) {
          // If the image is extremely close to the workspace aspect ratio or dimensions,
          // make it fit the workspace perfectly and position it at the top-left (0,0)
          w = tempWidth;
          h = tempHeight;
          x = 0;
          y = 0;
        } else {
          // Otherwise, it is a custom design asset or transparent element.
          // Keep its original size if it fits inside the workspace,
          // but if it is larger than the workspace, scale it down proportionally to fit 80% of workspace size
          if (w > tempWidth || h > tempHeight) {
            const scaleX = (tempWidth * 0.8) / w;
            const scaleY = (tempHeight * 0.8) / h;
            const scale = Math.min(scaleX, scaleY);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          // Center it in the workspace
          x = Math.round((tempWidth - w) / 2);
          y = Math.round((tempHeight - h) / 2);
        }

        const newReg: Region = {
          id,
          name: `${file.name.replace(/\.[^/.]+$/, "")}`,
          type: 'image',
          x,
          y,
          width: w,
          height: h,
          backgroundColor: 'transparent',
          opacity: 1,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          isDynamic: true,
          placeholderImage: dataUrl,
          clipImage: true // Default newly uploaded files to fit and clip to their frame bounds (Maskeli)
        };

        setTemplates(prev => {
          const updated = prev.map(t => {
            if (t.id === currentTemplateId) {
              const pageWithFallback = ensureMultiPageSupport(t);
              const updatedPages = pageWithFallback.pages!.map((p, idx) => {
                if (idx === activePageIndex) {
                  return { ...p, regions: [...p.regions, newReg] };
                }
                return p;
              });
              return {
                ...t,
                pages: updatedPages,
                regions: updatedPages[0].regions,
                fixedElements: updatedPages[0].fixedElements
              };
            }
            return t;
          });
          saveTemplatesToLocalStorage(updated);
          return updated;
        });
        setSelectedNodeId(id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Move region within layers list to update its rendering and visual ordering hierarchy
  const moveRegionInList = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0) return;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              if (fromIndex >= p.regions.length || toIndex >= p.regions.length) {
                return p;
              }
              const newRegions = [...p.regions];
              const [removed] = newRegions.splice(fromIndex, 1);
              newRegions.splice(toIndex, 0, removed);

              // Update each region's zIndex to reflect its array sequence exactly
              const finalRegions = newRegions.map((reg, rIdx) => ({
                ...reg,
                zIndex: rIdx + 1
              }));

              return { ...p, regions: finalRegions };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  // Add new fixed branding element
  const addNewFixedElement = (type: 'logo' | 'social' | 'shape') => {
    const id = `fixed-${type}-${Date.now()}`;
    const newEl: FixedElement = type === 'logo' ? {
      id,
      type: 'logo',
      name: 'Özel Logo',
      x: 80,
      y: 80,
      width: 200,
      height: 40,
      content: '✦ LOGOMUZ',
      textStyle: {
        fontFamily: 'Space Grotesk',
        fontSize: 18,
        color: '#4F46E5',
        fontWeight: 'bold',
        lineHeight: 1,
        align: 'left'
      }
    } : type === 'social' ? {
      id,
      type: 'social',
      name: 'Sosyal Medya Linki',
      x: 80,
      y: 1000,
      width: 250,
      height: 30,
      iconType: 'instagram',
      content: '@kullaniciadi',
      textStyle: {
        fontFamily: 'JetBrains Mono',
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
        lineHeight: 1,
        align: 'left'
      }
    } : {
      id,
      type: 'shape',
      name: 'Dekoratif Dikdörtgen',
      x: 80,
      y: 130,
      width: 100,
      height: 4,
      shapeType: 'rect',
      backgroundColor: '#F59E0B'
    };

    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return { ...p, fixedElements: [...p.fixedElements, newEl] };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
    setSelectedNodeId(id);
  };

  // Delete element from current template
  const deleteElement = (id: string) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return {
                ...p,
                regions: p.regions.filter(r => r.id !== id),
                fixedElements: p.fixedElements.filter(el => el.id !== id)
              };
            }
            return p;
          });
          return {
            ...t,
            pages: updatedPages,
            regions: updatedPages[0].regions,
            fixedElements: updatedPages[0].fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
    setSelectedNodeId(null);
  };

  // Reset all templates to defaults
  const resetAllToPresets = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kataloğu Sıfırla',
      message: 'Oluşturduğunuz tüm özel şablonlar silinecek ve fabrika ayarlarına dönülecektir. Emin misiniz?',
      onConfirm: () => {
        const customs = templates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
        
        // Add all custom templates to deleted_template_ids list
        const deletedIds = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
        customs.forEach(t => {
          if (!deletedIds.includes(t.id)) {
            deletedIds.push(t.id);
          }
        });
        localStorage.setItem('deleted_template_ids', JSON.stringify(deletedIds));

        if (isValidConfig && !firestoreQuotaExceeded) {
          customs.forEach(t => {
            deleteCloudTemplate(t.id).then(() => {
              // Remove from deletion queue on successful deletion
              const currentDeleted = JSON.parse(localStorage.getItem('deleted_template_ids') || '[]');
              const updatedDeleted = currentDeleted.filter((id: string) => id !== t.id);
              localStorage.setItem('deleted_template_ids', JSON.stringify(updatedDeleted));
            }).catch(err => {
              console.error('Failed to delete cloud template during reset:', err);
            });
          });
        }
        localStorage.removeItem('custom_templates');
        localStorage.removeItem('active_templates_v2');
        setTemplates([INITIAL_FALLBACK_TEMPLATE]);
        setCurrentTemplateId(INITIAL_FALLBACK_TEMPLATE.id);
        setSelectedNodeId(null);
        setConfirmDialog(null);
      }
    });
  };

  // Change layer order (zIndex modifier)
  const moveLayerOrder = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const regIdx = t.regions.findIndex(r => r.id === id);
          const fixedIdx = t.fixedElements.findIndex(el => el.id === id);
          
          if (regIdx > -1) {
            const newRegions = [...t.regions];
            const currentZ = newRegions[regIdx].zIndex ?? 0;
            let newZ = currentZ;
            
            if (direction === 'up') newZ = currentZ + 1;
            else if (direction === 'down') newZ = currentZ - 1;
            else if (direction === 'front') {
              const maxZ = Math.max(
                0,
                ...t.regions.map(r => r.zIndex ?? 0),
                ...t.fixedElements.map(e => e.zIndex ?? 0)
              );
              newZ = maxZ + 1;
            } else if (direction === 'back') {
              const minZ = Math.min(
                0,
                ...t.regions.map(r => r.zIndex ?? 0),
                ...t.fixedElements.map(e => e.zIndex ?? 0)
              );
              newZ = minZ - 1;
            }
            
            newRegions[regIdx] = { ...newRegions[regIdx], zIndex: newZ };
            return { ...t, regions: newRegions };
          } else if (fixedIdx > -1) {
            const newFixed = [...t.fixedElements];
            const currentZ = newFixed[fixedIdx].zIndex ?? 0;
            let newZ = currentZ;
            
            if (direction === 'up') newZ = currentZ + 1;
            else if (direction === 'down') newZ = currentZ - 1;
            else if (direction === 'front') {
              const maxZ = Math.max(
                0,
                ...t.regions.map(r => r.zIndex ?? 0),
                ...t.fixedElements.map(e => e.zIndex ?? 0)
              );
              newZ = maxZ + 1;
            } else if (direction === 'back') {
              const minZ = Math.min(
                0,
                ...t.regions.map(r => r.zIndex ?? 0),
                ...t.fixedElements.map(e => e.zIndex ?? 0)
              );
              newZ = minZ - 1;
            }
            
            newFixed[fixedIdx] = { ...newFixed[fixedIdx], zIndex: newZ };
            return { ...t, fixedElements: newFixed };
          }
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  // Pointer/Touch interactions on Canvas for repositioning layers and resizing them
  const handleCanvasPointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture the state snapshot BEFORE dragging begins so we can revert to it on Undo
    templatesBeforeDragRef.current = templates;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const scaleX = currentTemplate.width / rect.width;
    const scaleY = currentTemplate.height / rect.height;

    const x = relativeX * scaleX;
    const y = relativeY * scaleY;

    // If mouse image positioning is active, drag the image content instead of the frame
    if (editingImageRegionId) {
      const activeReg = editingTemplate.regions.find(r => r.id === editingImageRegionId);
      if (activeReg) {
        if (x >= activeReg.x && x <= activeReg.x + activeReg.width && y >= activeReg.y && y <= activeReg.y + activeReg.height) {
          const imgData = activePageData.dynamicImages[editingImageRegionId] || {
            offsetX: 0,
            offsetY: 0,
            scale: 1.0,
            rotation: 0
          };
          dragStartRef.current = {
            elementId: editingImageRegionId,
            elementType: 'region',
            startX: imgData.offsetX ?? 0,
            startY: imgData.offsetY ?? 0,
            mouseStartX: x,
            mouseStartY: y,
            mode: 'image-pan' as any
          };
          setIsDragging(true);
          return;
        } else {
          // Clicked outside active crop zone, exit crop mode
          setEditingImageRegionId(null);
        }
      }
    }

    // First check if user clicked on any resize handles of the currently selected node
    let isResizeAction = false;
    let hitHandle: 'TL' | 'TR' | 'BL' | 'BR' | null = null;
    let selectedElType: 'region' | 'fixed' | null = null;
    let selectedEl: any = null;

    if (selectedNodeId) {
      const region = editingTemplate.regions.find(r => r.id === selectedNodeId);
      if (region) {
        selectedEl = region;
        selectedElType = 'region';
      } else {
        const fixed = editingTemplate.fixedElements.find(el => el.id === selectedNodeId);
        if (fixed) {
          selectedEl = fixed;
          selectedElType = 'fixed';
        }
      }

      // Only allow resizing if the element is NOT locked
      if (selectedEl && !selectedEl.locked) {
        const hitRadius = 18 * scaleX; // 18px on-screen comfortable hit-target radius
        const corners = [
          { handle: 'TL', cx: selectedEl.x, cy: selectedEl.y },
          { handle: 'TR', cx: selectedEl.x + selectedEl.width, cy: selectedEl.y },
          { handle: 'BL', cx: selectedEl.x, cy: selectedEl.y + selectedEl.height },
          { handle: 'BR', cx: selectedEl.x + selectedEl.width, cy: selectedEl.y + selectedEl.height }
        ] as const;

        for (const corner of corners) {
          const dist = Math.sqrt((x - corner.cx) ** 2 + (y - corner.cy) ** 2);
          if (dist <= hitRadius) {
            isResizeAction = true;
            hitHandle = corner.handle;
            break;
          }
        }
      }
    }

    if (isResizeAction && selectedEl && hitHandle) {
      dragStartRef.current = {
        elementId: selectedNodeId!,
        elementType: selectedElType!,
        startX: selectedEl.x,
        startY: selectedEl.y,
        mouseStartX: x,
        mouseStartY: y,
        mode: 'resize',
        resizeHandle: hitHandle,
        startWidth: selectedEl.width,
        startHeight: selectedEl.height
      };
      setIsDragging(true);
      return;
    }

    // Build the visual render list hierarchy exactly as drawn on the canvas (zIndex, order, index)
    const renderList = [
      ...editingTemplate.fixedElements.map((el, idx) => ({ item: el, isRegion: false, order: 0, index: idx, zIndex: el.zIndex ?? 0 })),
      ...editingTemplate.regions.map((reg, idx) => ({ item: reg, isRegion: true, order: 1, index: idx, zIndex: reg.zIndex ?? 0 }))
    ];

    // Sort by zIndex, then order, then index (matches canvasRenderer.ts)
    renderList.sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.index - b.index;
    });

    let foundId: string | null = null;
    let foundType: 'region' | 'fixed' | null = null;

    // Check hit targets in REVERSE rendering order (topmost element first)
    for (let i = renderList.length - 1; i >= 0; i--) {
      const node = renderList[i];
      const el = node.item;

      // Skip if hidden
      if (activeGraphicData.hiddenElements?.includes(el.id) || el.hidden) {
        continue;
      }

      // Skip if locked (Requirement 4: locked elements are unselectable/unmovable on canvas)
      if (el.locked) {
        continue;
      }

      if (node.isRegion) {
        const reg = el as Region;
        if (x >= reg.x && x <= reg.x + reg.width && y >= reg.y && y <= reg.y + reg.height) {
          foundId = reg.id;
          foundType = 'region';
          break;
        }
      } else {
        const fixed = el as FixedElement;
        if (fixed.type === 'shape' && fixed.shapeType === 'circle') {
          // Circle distance match
          const dist = Math.sqrt((x - fixed.x) ** 2 + (y - fixed.y) ** 2);
          if (dist <= fixed.width / 2) {
            foundId = fixed.id;
            foundType = 'fixed';
            break;
          }
        } else {
          // Standard bounding box match
          if (x >= fixed.x && x <= fixed.x + fixed.width && y >= fixed.y && y <= fixed.y + fixed.height) {
            foundId = fixed.id;
            foundType = 'fixed';
            break;
          }
        }
      }
    }

    if (foundId) {
      setSelectedNodeId(foundId);
      const activeEl = editingTemplate.regions.find(r => r.id === foundId) || editingTemplate.fixedElements.find(el => el.id === foundId);
      if (activeEl) {
        dragStartRef.current = {
          elementId: foundId,
          elementType: foundType!,
          startX: activeEl.x,
          startY: activeEl.y,
          mouseStartX: x,
          mouseStartY: y,
          mode: 'drag'
        };
        setIsDragging(true);
      }
    } else {
      setSelectedNodeId(null);
    }
  };

  const handleCanvasPointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const scaleX = currentTemplate.width / rect.width;
    const scaleY = currentTemplate.height / rect.height;

    const x = relativeX * scaleX;
    const y = relativeY * scaleY;

    const dx = x - dragStartRef.current.mouseStartX;
    const dy = y - dragStartRef.current.mouseStartY;

    if (dragStartRef.current.mode === 'image-pan') {
      const ref = dragStartRef.current;
      const newOffsetX = Math.round(ref.startX + dx);
      const newOffsetY = Math.round(ref.startY + dy);
      updateActiveImageProp(ref.elementId, 'offsetX', newOffsetX);
      updateActiveImageProp(ref.elementId, 'offsetY', newOffsetY);
    } else if (dragStartRef.current.mode === 'resize' && dragStartRef.current.resizeHandle) {
      const ref = dragStartRef.current;
      const startX = ref.startX;
      const startY = ref.startY;
      const startWidth = ref.startWidth ?? 20;
      const startHeight = ref.startHeight ?? 20;

      let newX = startX;
      let newY = startY;
      let newW = startWidth;
      let newH = startHeight;

      const minSize = 20;

      if (ref.resizeHandle === 'BR') {
        newW = Math.max(minSize, startWidth + dx);
        newH = Math.max(minSize, startHeight + dy);
      } else if (ref.resizeHandle === 'BL') {
        newX = Math.min(startX + startWidth - minSize, startX + dx);
        newW = (startX + startWidth) - newX;
        newH = Math.max(minSize, startHeight + dy);
      } else if (ref.resizeHandle === 'TR') {
        newY = Math.min(startY + startHeight - minSize, startY + dy);
        newH = (startY + startHeight) - newY;
        newW = Math.max(minSize, startWidth + dx);
      } else if (ref.resizeHandle === 'TL') {
        newX = Math.min(startX + startWidth - minSize, startX + dx);
        newY = Math.min(startY + startHeight - minSize, startY + dy);
        newW = (startX + startWidth) - newX;
        newH = (startY + startHeight) - newY;
      }

      newX = Math.round(newX);
      newY = Math.round(newY);
      newW = Math.round(newW);
      newH = Math.round(newH);

      if (ref.elementType === 'region') {
        handleRegionPropertiesChange(ref.elementId, { x: newX, y: newY, width: newW, height: newH });
      } else {
        handleFixedElementPropertiesChange(ref.elementId, { x: newX, y: newY, width: newW, height: newH });
      }
    } else {
      // Normal dragging mode
      const newX = Math.round(dragStartRef.current.startX + dx);
      const newY = Math.round(dragStartRef.current.startY + dy);

      if (dragStartRef.current.elementType === 'region') {
        handleRegionPropertyChange(dragStartRef.current.elementId, 'x', newX);
        handleRegionPropertyChange(dragStartRef.current.elementId, 'y', newY);
      } else {
        handleFixedElementPropertyChange(dragStartRef.current.elementId, 'x', newX);
        handleFixedElementPropertyChange(dragStartRef.current.elementId, 'y', newY);
      }
    }
  };

  const handleCanvasPointerUp = () => {
    if (dragStartRef.current && templatesBeforeDragRef.current) {
      // Push history state if something actually moved/resized
      const currentSnapshotStr = JSON.stringify(templates);
      const beforeSnapshotStr = JSON.stringify(templatesBeforeDragRef.current);
      if (currentSnapshotStr !== beforeSnapshotStr) {
        const prevSnapshot = templatesBeforeDragRef.current;
        setUndoStack(u => {
          const updated = [...u, prevSnapshot];
          if (updated.length > 50) updated.shift();
          return updated;
        });
        setRedoStack([]); // Clear redo
      }
    }
    setIsDragging(false);
    dragStartRef.current = null;
    templatesBeforeDragRef.current = null;
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    const scaleX = currentTemplate.width / rect.width;
    const scaleY = currentTemplate.height / rect.height;

    const x = relativeX * scaleX;
    const y = relativeY * scaleY;

    // Find if double clicked on an image region
    const hitRegion = editingTemplate.regions.find(reg => {
      if (reg.type !== 'image') return false;
      if (activeGraphicData.hiddenElements?.includes(reg.id) || reg.hidden) return false;
      return x >= reg.x && x <= reg.x + reg.width && y >= reg.y && y <= reg.y + reg.height;
    });

    if (hitRegion) {
      setEditingImageRegionId(hitRegion.id);
      setSelectedNodeId(hitRegion.id);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      const targetRegionId = editingImageRegionId || (selectedNodeId && editingTemplate.regions.find(r => r.id === selectedNodeId && r.type === 'image')?.id);
      if (!targetRegionId) return;

      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const scaleX = currentTemplate.width / rect.width;
      const scaleY = currentTemplate.height / rect.height;

      const x = relativeX * scaleX;
      const y = relativeY * scaleY;

      const reg = editingTemplate.regions.find(r => r.id === targetRegionId);
      if (reg) {
        if (x >= reg.x && x <= reg.x + reg.width && y >= reg.y && y <= reg.y + reg.height) {
          e.preventDefault();
          
          const imgData = activePageData.dynamicImages[targetRegionId] || {
            scale: 1.0
          };

          const zoomDirection = e.deltaY < 0 ? 1 : -1;
          const step = 0.05;
          const newScale = Math.max(0.1, Math.min(10.0, parseFloat((imgData.scale + zoomDirection * step).toFixed(2))));

          updateActiveImageProp(targetRegionId, 'scale', newScale);
        }
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [editingImageRegionId, selectedNodeId, editingTemplate, activePageData, currentTemplate]);

  // --- VIEWPORT DRAG PAN HANDLERS ---
  const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag pan if clicked directly on viewport or an element that is NOT interactive (like canvas, inputs, buttons)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('canvas') || target.closest('input') || target.closest('select')) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    if (zoomMode !== 'custom') {
      // Calculate a reasonable starting zoom scale based on current template
      setZoomMode('custom');
      // If template is very large, start with 0.35, otherwise 0.5
      const initialScale = currentTemplate.width > 1200 ? 0.35 : 0.5;
      setZoomScale(initialScale);
    }
    const newX = e.clientX - panStartRef.current.x;
    const newY = e.clientY - panStartRef.current.y;
    setPanOffset({ x: newX, y: newY });
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
  };

  const handleViewportTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('canvas') || target.closest('input') || target.closest('select')) {
        return;
      }
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
    }
  };

  const handleViewportTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (zoomMode !== 'custom') {
      setZoomMode('custom');
      const initialScale = currentTemplate.width > 1200 ? 0.35 : 0.5;
      setZoomScale(initialScale);
    }
    const newX = touch.clientX - panStartRef.current.x;
    const newY = touch.clientY - panStartRef.current.y;
    setPanOffset({ x: newX, y: newY });
  };

  const handleViewportTouchEnd = () => {
    setIsPanning(false);
  };

  // --- FILE DRAG & DROP & MANUALLY CHOOSE HANDLERS ---
  const handleDrag = (e: React.DragEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [regionId]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [regionId]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [regionId]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0], regionId);
    }
  };

  const handleMultiDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, 'multi-collage': false }));

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultiImageFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, regionId: string) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0], regionId);
    }
  };

  const handleImageFile = (file: File, regionId: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen yalnızca bir resim dosyası seçin!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateActiveImageProp(regionId, 'url', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- SECURE SERVER SIDE GEMINI API TRIGGER ---
  const triggerAiGenerator = async () => {
    setIsAiLoading(true);
    setAiSuccessMessage(null);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: aiNiche, styleType: aiStyle })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Response was not valid JSON, using local smart engine fallback.', parseError);
        data = { success: false };
      }

      // If response failed or returned an error, run smart client-side fallback
      if (!data || !data.success || !data.title) {
        const fallbackData = getClientSideFallback(aiNiche || 'Girişim', aiStyle);
        data = {
          success: true,
          isFallback: true,
          title: fallbackData.title,
          description: fallbackData.description,
          primaryColor: fallbackData.primaryColor,
          accentColor: fallbackData.accentColor,
          textColor: fallbackData.textColor,
          bgColor: fallbackData.bgColor
        };
      }

      if (data.success) {
        // Find title region and desc region using ID or textRole
        const titleRegion = editingTemplate.regions.find(r => r.type === 'text' && (r.id.includes('title') || r.textRole === 'title'));
        const descRegion = editingTemplate.regions.find(r => r.type === 'text' && (r.id.includes('desc') || r.textRole === 'description'));

        if (titleRegion) {
          updateActiveText(titleRegion.id, data.title);
        } else {
          // fallback update first metin
          const firstTxt = editingTemplate.regions.find(r => r.type === 'text');
          if (firstTxt) updateActiveText(firstTxt.id, data.title);
        }

        if (descRegion) {
          updateActiveText(descRegion.id, data.description);
        } else {
          const secondTxt = editingTemplate.regions.filter(r => r.type === 'text')[1];
          if (secondTxt) updateActiveText(secondTxt.id, data.description);
        }

        // Apply color overrides
        applyPaletteOverride('primary', data.primaryColor);
        applyPaletteOverride('accent', data.accentColor);
        applyPaletteOverride('text', data.textColor);
        applyPaletteOverride('bg', data.bgColor);

        setAiSuccessMessage(data.isFallback 
          ? 'Kreatif yerel tasarım motoru ile kampanya içerikleri ve renkler başarıyla uyarlandı!' 
          : 'Yapay Zeka içeriği ve renk paleti başarıyla üretildi!'
        );

        setTimeout(() => setAiSuccessMessage(null), 5000);
      } else {
        alert('Yapay zeka ile içerik üretilirken hata oluştu.');
      }
    } catch (e) {
      console.warn('Network error in triggerAiGenerator, using local fallback.', e);
      
      const fallbackData = getClientSideFallback(aiNiche || 'Girişim', aiStyle);
      
      // Find title region and desc region
      const titleRegion = editingTemplate.regions.find(r => r.type === 'text' && (r.id.includes('title') || r.textRole === 'title'));
      const descRegion = editingTemplate.regions.find(r => r.type === 'text' && (r.id.includes('desc') || r.textRole === 'description'));

      if (titleRegion) {
        updateActiveText(titleRegion.id, fallbackData.title);
      } else {
        const firstTxt = editingTemplate.regions.find(r => r.type === 'text');
        if (firstTxt) updateActiveText(firstTxt.id, fallbackData.title);
      }

      if (descRegion) {
        updateActiveText(descRegion.id, fallbackData.description);
      } else {
        const secondTxt = editingTemplate.regions.filter(r => r.type === 'text')[1];
        if (secondTxt) updateActiveText(secondTxt.id, fallbackData.description);
      }

      // Apply color overrides
      applyPaletteOverride('primary', fallbackData.primaryColor);
      applyPaletteOverride('accent', fallbackData.accentColor);
      applyPaletteOverride('text', fallbackData.textColor);
      applyPaletteOverride('bg', fallbackData.bgColor);

      setAiSuccessMessage('Bulut sunucusu meşgul olduğundan yerel kreatif motor ile şablon başlıkları ve renk paleti başarıyla güncellendi!');
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- OFF-SCREEN HIGH-RES RENDER & DOWNLOADING ---
  const exportSingleHighResPage = async (pageData: any, index: number) => {
    setIsExporting(true);
    try {
      const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
      const fileExt = exportFormat === 'png' ? 'png' : 'jpg';

      const templatePageId = pageData.templatePageId;
      const matchedPage = currentTemplate.pages?.find(p => p.id === templatePageId) || currentTemplate.pages?.[0] || currentTemplate;

      const pageTemplate = {
        ...currentTemplate,
        regions: matchedPage.regions,
        fixedElements: matchedPage.fixedElements
      };

      const offscreenCanvas = document.createElement('canvas');
      const targetWidth = currentTemplate.width * exportScale;
      const targetHeight = currentTemplate.height * exportScale;

      offscreenCanvas.width = targetWidth;
      offscreenCanvas.height = targetHeight;

      await renderTemplateToCanvas(
        offscreenCanvas,
        pageTemplate,
        pageData.dynamicTexts,
        pageData.dynamicImages,
        {
          paletteOverrides: activeGraphicData.paletteOverrides,
          hiddenElements: pageData.hiddenElements || [],
          showGrid: false,
          showSafeMargins: false,
          scale: exportScale,
          highlightColor: vurguColor
        }
      );

      const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        const pageName = index === 0 ? 'Kapak Sayfası' : `${index}. Sayfa`;
        setIosExportImages([{ url: dataUrl, name: pageName }]);
        setIsExporting(false);
        return;
      }

      const link = document.createElement('a');
      const pageName = index === 0 ? 'kapak' : `sayfa_${index}`;
      link.download = `${currentTemplate.name.replace(/\s+/g, '_').toLowerCase()}_${pageName}_${Date.now()}.${fileExt}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Sayfa indirilirken hata:', err);
      alert('Sayfa yüksek çözünürlüklü üretilirken hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportHighResGraphic = async () => {
    setIsExporting(true);
    try {
      const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
      const fileExt = exportFormat === 'png' ? 'png' : 'jpg';

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // If we have generated multiple pages, let's export all of them sequentially!
      if (generatedPages.length > 0) {
        if (isIOS) {
          const iosImages = [];
          for (let i = 0; i < generatedPages.length; i++) {
            const pageData = generatedPages[i];
            const templatePageId = pageData.templatePageId;
            const matchedPage = currentTemplate.pages?.find(p => p.id === templatePageId) || currentTemplate.pages?.[0] || currentTemplate;

            const pageTemplate = {
              ...currentTemplate,
              regions: matchedPage.regions,
              fixedElements: matchedPage.fixedElements
            };

            const offscreenCanvas = document.createElement('canvas');
            const targetWidth = currentTemplate.width * exportScale;
            const targetHeight = currentTemplate.height * exportScale;

            offscreenCanvas.width = targetWidth;
            offscreenCanvas.height = targetHeight;

            await renderTemplateToCanvas(
              offscreenCanvas,
              pageTemplate,
              pageData.dynamicTexts,
              pageData.dynamicImages,
              {
                paletteOverrides: activeGraphicData.paletteOverrides,
                hiddenElements: pageData.hiddenElements || [],
                showGrid: false,
                showSafeMargins: false,
                scale: exportScale,
                highlightColor: vurguColor
              }
            );

            const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
            const pageName = i === 0 ? 'Kapak Sayfası' : `Sayfa ${i}`;
            iosImages.push({ url: dataUrl, name: pageName });
          }
          setIosExportImages(iosImages);
          setIsExporting(false);
          return;
        }

        for (let i = 0; i < generatedPages.length; i++) {
          const pageData = generatedPages[i];
          const templatePageId = pageData.templatePageId;
          const matchedPage = currentTemplate.pages?.find(p => p.id === templatePageId) || currentTemplate.pages?.[0] || currentTemplate;

          const pageTemplate = {
            ...currentTemplate,
            regions: matchedPage.regions,
            fixedElements: matchedPage.fixedElements
          };

          const offscreenCanvas = document.createElement('canvas');
          const targetWidth = currentTemplate.width * exportScale;
          const targetHeight = currentTemplate.height * exportScale;

          offscreenCanvas.width = targetWidth;
          offscreenCanvas.height = targetHeight;

          await renderTemplateToCanvas(
            offscreenCanvas,
            pageTemplate,
            pageData.dynamicTexts,
            pageData.dynamicImages,
            {
              paletteOverrides: activeGraphicData.paletteOverrides,
              hiddenElements: pageData.hiddenElements || [],
              showGrid: false,
              showSafeMargins: false,
              scale: exportScale,
              highlightColor: vurguColor
            }
          );

          const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
          const link = document.createElement('a');
          const pageName = i === 0 ? 'kapak' : `sayfa_${i}`;
          link.download = `${currentTemplate.name.replace(/\s+/g, '_').toLowerCase()}_${pageName}_${Date.now()}.${fileExt}`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Wait briefly to let the browser queue multiple downloads properly
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        // Single page default export
        const offscreenCanvas = document.createElement('canvas');
        const targetWidth = currentTemplate.width * exportScale;
        const targetHeight = currentTemplate.height * exportScale;

        offscreenCanvas.width = targetWidth;
        offscreenCanvas.height = targetHeight;

        await renderTemplateToCanvas(
          offscreenCanvas,
          editingTemplate,
          activeTab === 'phase1' ? {} : activePageData.dynamicTexts,
          activeTab === 'phase1' ? {} : activePageData.dynamicImages,
          {
            paletteOverrides: activeGraphicData.paletteOverrides,
            hiddenElements: activeTab === 'phase1' ? [] : activePageData.hiddenElements,
            showGrid: false,
            showSafeMargins: false,
            scale: exportScale,
            highlightColor: vurguColor
          }
        );

        const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
        const link = document.createElement('a');
        link.download = `${currentTemplate.name.replace(/\s+/g, '_').toLowerCase()}_grafik_${Date.now()}.${fileExt}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('High resolution export failed', err);
      alert('Yüksek çözünürlüklü grafik üretilirken bir sorun oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportHighResZip = async () => {
    if (generatedPages.length === 0) {
      alert('Sadece çoklu şablon sayfaları üretildikten sonra ZIP olarak indirebilirsiniz!');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      setIsExportingZip(true);
      try {
        const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
        const iosImages = [];

        for (let i = 0; i < generatedPages.length; i++) {
          const pageData = generatedPages[i];
          const templatePageId = pageData.templatePageId;
          const matchedPage = currentTemplate.pages?.find(p => p.id === templatePageId) || currentTemplate.pages?.[0] || currentTemplate;

          const pageTemplate = {
            ...currentTemplate,
            regions: matchedPage.regions,
            fixedElements: matchedPage.fixedElements
          };

          const offscreenCanvas = document.createElement('canvas');
          const targetWidth = currentTemplate.width * exportScale;
          const targetHeight = currentTemplate.height * exportScale;

          offscreenCanvas.width = targetWidth;
          offscreenCanvas.height = targetHeight;

          await renderTemplateToCanvas(
            offscreenCanvas,
            pageTemplate,
            pageData.dynamicTexts,
            pageData.dynamicImages,
            {
              paletteOverrides: activeGraphicData.paletteOverrides,
              hiddenElements: pageData.hiddenElements || [],
              showGrid: false,
              showSafeMargins: false,
              scale: exportScale,
              highlightColor: vurguColor
            }
          );

          const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
          const pageName = i === 0 ? 'Kapak Sayfası' : `Sayfa ${i}`;
          iosImages.push({ url: dataUrl, name: pageName });
        }
        setIosExportImages(iosImages);
      } catch (err) {
        console.error('iOS high res export failed', err);
        alert('Görseller hazırlanırken bir sorun oluştu.');
      } finally {
        setIsExportingZip(false);
      }
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
      const fileExt = exportFormat === 'png' ? 'png' : 'jpg';

      for (let i = 0; i < generatedPages.length; i++) {
        const pageData = generatedPages[i];
        const templatePageId = pageData.templatePageId;
        const matchedPage = currentTemplate.pages?.find(p => p.id === templatePageId) || currentTemplate.pages?.[0] || currentTemplate;

        const pageTemplate = {
          ...currentTemplate,
          regions: matchedPage.regions,
          fixedElements: matchedPage.fixedElements
        };

        const offscreenCanvas = document.createElement('canvas');
        const targetWidth = currentTemplate.width * exportScale;
        const targetHeight = currentTemplate.height * exportScale;

        offscreenCanvas.width = targetWidth;
        offscreenCanvas.height = targetHeight;

        await renderTemplateToCanvas(
          offscreenCanvas,
          pageTemplate,
          pageData.dynamicTexts,
          pageData.dynamicImages,
          {
            paletteOverrides: activeGraphicData.paletteOverrides,
            hiddenElements: pageData.hiddenElements || [],
            showGrid: false,
            showSafeMargins: false,
            scale: exportScale,
            highlightColor: vurguColor
          }
        );

        const dataUrl = offscreenCanvas.toDataURL(mimeType, exportFormat === 'jpeg' ? 0.95 : undefined);
        const base64Data = dataUrl.split(',')[1];
        const pageName = i === 0 ? 'kapak' : `sayfa_${i}`;
        const fileName = `${currentTemplate.name.replace(/\s+/g, '_').toLowerCase()}_${pageName}.${fileExt}`;
        zip.file(fileName, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${currentTemplate.name.replace(/\s+/g, '_').toLowerCase()}_tum_sayfalar_${Date.now()}.zip`;
      link.href = URL.createObjectURL(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP export failed', err);
      alert('ZIP dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setIsExportingZip(false);
    }
  };

  // --- PALETTE PRESETS ---
  const PALETTE_PRESETS = [
    { name: 'Kozmik Mürekkep', primary: '#4F46E5', accent: '#F59E0B', text: '#0F172A', bg: '#F8FAFC' },
    { name: 'Doğal Toprak', primary: '#854D0E', accent: '#B45309', text: '#451A03', bg: '#FAF7F2' },
    { name: 'Sanal Neon', primary: '#06B6D4', accent: '#3B82F6', text: '#F3F4F6', bg: '#0B0F19' },
    { name: 'Minimalist Kömür', primary: '#111827', accent: '#6B7280', text: '#1F2937', bg: '#FFFFFF' },
    { name: 'Canlı Nar', primary: '#DC2626', accent: '#F59E0B', text: '#111827', bg: '#FEF2F2' },
    { name: 'Sakin Orman', primary: '#0D9488', accent: '#D97706', text: '#0F172A', bg: '#F0FDFA' }
  ];

  if (!isAppLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-orange-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full bg-indigo-600/5 blur-[150px] pointer-events-none" />
        
        <div className="flex flex-col items-center space-y-6 z-10 max-w-sm text-center px-6">
          {/* Animated Application Icon (Fills and rotates) */}
          <div className="relative w-24 h-24">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-3xl bg-orange-500/20 animate-ping" />
            
            {/* Spinning gradient border */}
            <div className="absolute -inset-1.5 rounded-[22px] bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-500 animate-spin opacity-80" />
            
            {/* Inner Logo */}
            <div className="absolute inset-0 bg-slate-900 rounded-[20px] flex items-center justify-center overflow-hidden border border-slate-800">
              <svg viewBox="0 0 100 100" className="w-14 h-14 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoLoadingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M40 35 H65 V45 H50 V55 H65 V65 H40 C34 65 30 61 30 55 V45 C30 39 34 35 40 35Z" fill="url(#logoLoadingGrad)" />
                <path d="M72 28 L74 32 L78 34 L74 36 L72 40 L70 36 L66 34 L70 32 Z" fill="white" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold tracking-tight text-white">Verileriniz Eşitleniyor</h3>
            <p className="text-xs text-slate-400 font-mono tracking-wide leading-relaxed">
              Bulut sunucusuna bağlanılıyor, şablonlarınız ve kreatif tasarımlarınız yükleniyor...
            </p>
          </div>
          
          {/* Spinner bar */}
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full w-2/3 animate-[loading_1.5s_infinite_ease-in-out]" style={{ animation: 'loading-bar 1.5s infinite ease-in-out' }} />
          </div>
        </div>
        
        <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
        
        {/* Header / Brand */}
        <header className="max-w-7xl mx-auto w-full px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="landingLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#landingLogoGrad)" />
                <path d="M40 35 H65 V45 H50 V55 H65 V65 H40 C34 65 30 61 30 55 V45 C30 39 34 35 40 35Z" fill="white" />
                <path d="M72 28 L74 32 L78 34 L74 36 L72 40 L70 36 L66 34 L70 32 Z" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              GRAFİK MOTORU
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">v1.5.0</div>
        </header>

        {/* Main content split */}
        <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 z-10 flex-1">
          {/* Left info column */}
          <div className="max-w-xl text-left space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-400 font-semibold shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              AI Destekli Şablon Otomasyonu
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Sosyal medya şablonlarınız <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                zamanınızı almasın.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-350 leading-relaxed font-normal">
              Yapay zeka gücüyle dakikalar içinde yüzlerce profesyonel varyasyon üretin, düzenleyin ve indirin. Markanız için akıllı şablon otomasyonu ile pikselleri canlandırın.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-4 rounded-xl">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Ultra Hızlı Üretim</h3>
                  <p className="text-xs text-slate-400 mt-1">Tek bir tıkla tüm sayfaları ve alternatif tasarımları oluşturun.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-4 rounded-xl">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bulut Senkronizasyonu</h3>
                  <p className="text-xs text-slate-400 mt-1">Tasarımlarınız tüm cihazlarınız arasında anında senkronize olur.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right login card */}
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] space-y-8 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 35 H65 V45 H50 V55 H65 V65 H40 C34 65 30 61 30 55 V45 C30 39 34 35 40 35Z" fill="currentColor" />
                  <path d="M72 28 L74 32 L78 34 L74 36 L72 40 L70 36 L66 34 L70 32 Z" fill="currentColor" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Hoş Geldiniz</h2>
              <p className="text-sm text-slate-400">Tasarım evrenine katılmak için oturum açın</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 px-6 rounded-xl shadow-lg transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google ile Giriş Yap</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-500 font-mono">
                Bulut tabanlı, kesintisiz veri eşitleme
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-500 z-10 border-t border-slate-800/50">
          © 2026 Grafik Motoru. By Tunafx. Tüm Hakları Saklıdır.
        </footer>
      </div>
    );
  }

  return (
    <div id="graphics-engine-app" className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col selection:bg-indigo-500 selection:text-white overflow-hidden relative">
      <style>{`
        :root {
          --vurgu-color: ${vurguColor};
          --vurgu-color-hover: ${vurguColor}dd;
          --vurgu-color-light: ${vurguColor}12;
          --vurgu-color-border: ${vurguColor}33;
        }

        /* Map Tailwind classes dynamically to the user's custom color */
        .bg-indigo-600, .bg-indigo-500 {
          background-color: var(--vurgu-color) !important;
        }
        .hover\:bg-indigo-700:hover, .hover\:bg-indigo-600:hover {
          background-color: var(--vurgu-color-hover) !important;
        }
        .text-indigo-600, .text-indigo-500, .text-indigo-700 {
          color: var(--vurgu-color) !important;
        }
        .border-indigo-600, .border-indigo-500 {
          border-color: var(--vurgu-color) !important;
        }
        .border-indigo-100 {
          border-color: var(--vurgu-color-border) !important;
        }
        .bg-indigo-50 {
          background-color: var(--vurgu-color-light) !important;
        }
        .focus\:border-indigo-500:focus {
          border-color: var(--vurgu-color) !important;
        }
        .focus\:ring-indigo-100:focus {
          --tw-ring-color: var(--vurgu-color-border) !important;
        }
        .ring-indigo-100 {
          --tw-ring-color: var(--vurgu-color-border) !important;
        }
        .accent-indigo-600 {
          accent-color: var(--vurgu-color) !important;
        }
        
        /* Custom Selection and highlighters */
        ::selection {
          background-color: var(--vurgu-color) !important;
          color: white !important;
        }
        .selection\:bg-indigo-500::selection {
          background-color: var(--vurgu-color) !important;
          color: white !important;
        }
        .border-indigo-500 {
          border-color: var(--vurgu-color) !important;
        }
        .hover\:border-indigo-500:hover {
          border-color: var(--vurgu-color) !important;
        }
        .hover\:text-indigo-600:hover {
          color: var(--vurgu-color) !important;
        }
        .from-indigo-500 {
          --tw-gradient-from: var(--vurgu-color) !important;
        }
        .to-indigo-500 {
          --tw-gradient-to: var(--vurgu-color) !important;
        }
        .shadow-indigo-600\/25 {
          --tw-shadow-color: var(--vurgu-color-border) !important;
        }
        .shadow-indigo-500\/20 {
          --tw-shadow-color: var(--vurgu-color-border) !important;
        }
        .bg-indigo-100 {
          background-color: var(--vurgu-color-light) !important;
        }
        .text-indigo-600 {
          color: var(--vurgu-color) !important;
        }
      `}</style>
      
      {/* HEADER BAR */}
      <header id="app-header" className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)] pb-3 sm:px-5 sm:py-3 flex items-center justify-between shrink-0 z-30" style={{ boxShadow: '0 1px 0 rgba(99,102,241,0.12), 0 4px 24px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 select-none">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(249,115,22,0.4))' }}>
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#logoGrad)" />
              <path d="M40 35 H65 V45 H50 V55 H65 V65 H40 C34 65 30 61 30 55 V45 C30 39 34 35 40 35Z" fill="white" />
              <path d="M72 28 L74 32 L78 34 L74 36 L72 40 L70 36 L66 34 L70 32 Z" fill="white" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold tracking-wider bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent truncate">
              GRAFİK MOTORU
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-500 font-semibold tracking-wider uppercase">AI · Piksel Kusursuz Tasarım Platformu</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Undo/Redo */}
          <div className="hidden sm:flex items-center space-x-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
              title="Geri Al (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
              title="İleri Al (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Google Login / Profile Interface */}
          {user && !user.isAnonymous ? (
            <div className="flex items-center space-x-1.5">
              {/* Cloud Sync Status */}
              {cloudStatus === 'syncing' ? (
                <div className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 text-[10px] sm:text-xs font-bold shrink-0 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                  <span className="hidden md:inline">Eşitleniyor...</span>
                </div>
              ) : isCloudSynced ? (
                <div 
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-bold shrink-0"
                  title="Tüm tasarımlarınız buluta başarıyla kaydedildi!"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Eşitlendi</span>
                </div>
              ) : (
                <button
                  onClick={saveDataToCloud}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer shrink-0 animate-pulse hover:scale-[1.02] active:scale-[0.98]"
                  title="Kaydedilmemiş değişiklikleriniz var!"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Buluta Kaydet</span>
                </button>
              )}

              {/* Profile */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5 sm:p-1 pr-1.5 sm:pr-2 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-lg border border-slate-700 shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[9.5px] font-bold text-slate-300 leading-tight max-w-[80px] sm:max-w-[110px] truncate">
                    {user.displayName || 'Kullanıcı'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-medium leading-none truncate max-w-[80px] sm:max-w-[110px] mt-0.5">
                    {user.email || ''}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFirestoreQuotaExceeded(false);
                    syncAndLoadUserData(user.uid);
                  }}
                  disabled={cloudStatus === 'syncing'}
                  className={`p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer ${cloudStatus === 'syncing' ? 'animate-spin text-indigo-400' : ''}`}
                  title="Yenile / Eşitle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 shadow-sm transition text-[10px] sm:text-xs font-bold cursor-pointer shrink-0 hover:bg-indigo-500/10"
              title="Google ile giriş yapın"
            >
              <LogIn className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-400" />
              <span>Google Giriş</span>
            </button>
          )}
        </div>
      </header>

      {/* CLOUD QUOTA EXCEEDED WARNING BANNER */}
      {firestoreQuotaExceeded && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 sm:px-6 flex items-center justify-between gap-3 text-amber-400 z-40">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>Yerel Çalışma Modu:</strong> Veritabanı kotası sınırına ulaşıldı. Tasarımlarınız <strong>LocalStorage</strong> ’a kaydediliyor.
            </span>
          </div>
          <button 
            onClick={() => setFirestoreQuotaExceeded(false)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition shrink-0"
          >
            Anladım
          </button>
        </div>
      )}

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: EDITOR CONTROL CENTER */}
        <div id="editor-controls" className={`w-full lg:w-[460px] bg-slate-900 border-r border-slate-800/80 flex flex-col h-full z-20 ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'}`} style={{ boxShadow: 'inset -1px 0 0 rgba(99,102,241,0.08)' }}>
          
          {/* TAB SYSTEM */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 p-2 shrink-0" style={{ backdropFilter: 'blur(12px)' }}>
            <div className="flex flex-1 space-x-1">
              <button
                onClick={() => handleTabChange('phase2')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'phase2'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-bold'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeTab === 'phase2' ? 'text-amber-300' : 'text-amber-500'}`} />
                <span>Grafik Üret</span>
              </button>

              <button
                onClick={() => handleTabChange('presets')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-bold'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <FolderOpen className={`w-4 h-4 ${activeTab === 'presets' ? 'text-blue-300' : 'text-indigo-400'}`} />
                <span>Şablonlar ({templates.length})</span>
              </button>
            </div>

            <button
              onClick={() => handleTabChange(activeTab === 'phase1' ? 'phase2' : 'phase1')}
              title="Şablon Tasarım Modü (Gelişmiş)"
              className={`ml-2 p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
                activeTab === 'phase1'
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* TAB SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* TAB 1: PRESETS & SELECTION */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-header">ŞABLON KATALOĞU</h3>
                  <button
                    onClick={createNewTemplate}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Özel Şablon Ekle</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {templates.map(temp => {
                    const isCustom = !TEMPLATE_PRESETS.some(p => p.id === temp.id);
                    const isSelected = temp.id === currentTemplateId;
                    const isEditing = editingTemplateId === temp.id;
                    
                    return (
                      <div
                        key={temp.id}
                        onClick={() => {
                          if (!isEditing) {
                            setCurrentTemplateId(temp.id);
                            setSelectedNodeId(null);
                          }
                        }}
                        className={`group relative p-3.5 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg ring-1 ring-indigo-500/20'
                            : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Şablon Düzenle</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">DÜZENLEME MODU</span>
                            </div>
                            
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Şablon Adı</label>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                                placeholder="Şablon İsmi"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Genişlik (px)</label>
                                <input
                                  type="number"
                                  value={editingWidth}
                                  onChange={(e) => setEditingWidth(parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                                  min={200}
                                  max={3000}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yükseklik (px)</label>
                                <input
                                  type="number"
                                  value={editingHeight}
                                  onChange={(e) => setEditingHeight(parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                                  min={200}
                                  max={3000}
                                />
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-1.5 justify-end border-t border-slate-700">
                              <button
                                onClick={() => setEditingTemplateId(null)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-semibold cursor-pointer transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>İptal</span>
                              </button>
                              <button
                                onClick={() => saveInlineTemplateEdit(temp.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer transition shadow-sm shadow-emerald-600/20"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Kaydet</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition">
                                  {temp.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5 font-medium">
                                  <span>{temp.width} × {temp.height} px</span>
                                  <span className="text-slate-700">•</span>
                                  <span className="font-mono text-[11px]">{temp.regions.length} Alan</span>
                                  <span className="text-slate-700">•</span>
                                  <span className="font-mono text-[11px]">{temp.fixedElements.length} Sabit</span>
                                </p>
                              </div>

                              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                {isCustom ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wide">
                                    KULLANICI
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-bold uppercase tracking-wide">
                                    HAZIR
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action row */}
                            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                              {/* Left: color swatches */}
                              <div className="flex items-center space-x-1.5">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-800 shadow-sm ring-1 ring-slate-700" style={{ backgroundColor: temp.palette.primary }} />
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-800 shadow-sm ring-1 ring-slate-700" style={{ backgroundColor: temp.palette.accent }} />
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-800 shadow-sm ring-1 ring-slate-700" style={{ backgroundColor: temp.palette.bg }} />
                              </div>

                              {/* Right: Action buttons */}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentTemplateId(temp.id);
                                    setSelectedNodeId(null);
                                    setActiveTab('phase1');
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                                  title="Şablon Tasarımını Düzenle"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>Tasarla</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTemplateId(temp.id);
                                    setEditingName(temp.name);
                                    setEditingWidth(temp.width);
                                    setEditingHeight(temp.height);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                                  title="İsim ve Boyut Düzenle"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Düzenle</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTemplate(temp.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  title="Şablonu Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PHASE 1 BLUEPRINT MAKER */}
            {activeTab === 'phase1' && (
              <div className="space-y-5">
                
                {/* Şablon Tasarım Başlığı */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Modül Modu</span>
                    <span className="text-xs font-bold text-slate-200">Şablon Tasarımı</span>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {isValidConfig && user && user.uid && (
                      <button
                        type="button"
                        onClick={saveDataToCloud}
                        disabled={cloudStatus === 'syncing'}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isCloudSynced
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/25'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20 animate-pulse'
                        }`}
                        title={isCloudSynced ? 'Değişiklikleriniz bulutta güvende!' : 'Şablon iç düzenlemelerini buluta kaydetmek için tıklayın.'}
                      >
                        {cloudStatus === 'syncing' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : isCloudSynced ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500 font-extrabold" />
                            <span>Eşitlendi</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Buluta Kaydet</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange('phase2');
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold cursor-pointer transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Geri Dön</span>
                    </button>
                  </div>
                </div>
                
                {/* Şablon Sayfaları Seçici */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <h4 className="section-header">ŞABLON SAYFALARI</h4>
                      <InfoTooltip text="Şablonunuz birden çok sayfadan oluşabilir. Her sayfa için farklı bir görsel düzeni (Kapak, 1, 2 veya 3 Görselli vb.) seçerek, çoklu resim yüklediğinizde resimlerin otomatik yerleşimini sağlayabilirsiniz." />
                    </div>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {(currentTemplate.pages || []).length} Sayfa
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {(currentTemplate.pages || []).map((page, idx) => {
                      const isActive = activePageIndex === idx;
                      const imageCount = page.regions.filter(r => isTemplateImageFrame(r)).length;
                      let roleBadgeText = 'Özel';
                      let roleBadgeColor = 'bg-slate-700/60 text-slate-300 border border-slate-650';
                      if (page.pageRole === 'cover') {
                        roleBadgeText = 'Kapak';
                        roleBadgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                      } else if (page.pageRole === '1-image') {
                        roleBadgeText = '1 Görsel';
                        roleBadgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      } else if (page.pageRole === '2-image') {
                        roleBadgeText = '2 Görsel';
                        roleBadgeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                      } else if (page.pageRole === '3-image') {
                        roleBadgeText = '3 Görsel';
                        roleBadgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                      }

                      return (
                        <div
                          key={page.id}
                          className={`rounded-xl border p-3 transition ${
                            isActive
                              ? 'border-indigo-500/50 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/20'
                              : 'border-slate-700/60 hover:border-slate-600 bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePageIndex(idx);
                                setSelectedNodeId(null);
                              }}
                              className="flex-1 text-left font-bold text-xs text-slate-300 flex items-center space-x-1.5 cursor-pointer focus:outline-none"
                            >
                              <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                              <span className="truncate">{page.name || `${idx + 1}. Sayfa`}</span>
                            </button>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${roleBadgeColor}`}>
                                {roleBadgeText}
                              </span>
                              {(currentTemplate.pages || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => deleteTemplatePage(idx)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                  title="Sayfayı Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">SAYFA İSMİ</label>
                                <input
                                  type="text"
                                  value={page.name}
                                  onChange={(e) => handlePagePropertyChange(idx, 'name', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">GÖRSELLİK / ŞABLON ROLÜ</label>
                                <select
                                  value={page.pageRole || 'custom'}
                                  onChange={(e) => handlePagePropertyChange(idx, 'pageRole', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-semibold cursor-pointer focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="cover">Kapak Sayfası (Cover Page)</option>
                                  <option value="1-image">Tek Görselli Kolaj (1-Image Collage)</option>
                                  <option value="2-image">2 Görselli Kolaj (2-Image Collage)</option>
                                  <option value="3-image">3 Görselli Kolaj (3-Image Collage)</option>
                                  <option value="custom">Özel/Diğer (Custom Layout)</option>
                                </select>
                              </div>

                              <div className="text-[9px] text-slate-400 font-semibold flex justify-between">
                                <span>Bu sayfadaki dinamik görsel alanı sayısı:</span>
                                <span className="font-bold text-indigo-400">{imageCount} adet</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Yeni Sayfa Ekleme Kontrolleri */}
                  <div className="pt-3 border-t border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">YENİ SAYFA EKLE</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('1-image')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tek Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('2-image')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ 2 Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('3-image')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ 3 Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('cover')}
                        className="py-1.5 px-2 bg-slate-850 hover:bg-slate-800 text-indigo-300 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Kapak</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Kullanıcı çoklu fotoğraf yüklediğinde, sistem fotoğrafları yukarıda seçtiğiniz şablon rollerine (Kapak, Tek, 2 Görsel vb.) göre otomatik yerleştirir.
                  </p>
                </div>
                
                {/* Şablon Genel Ayarları */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">1. ŞABLON BOYUT & TUVAL</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-semibold">Şablon İsmi</label>
                      <input
                        type="text"
                        value={currentTemplate.name}
                        onChange={(e) => handleTemplatePropertyChange('name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Kurumsal Dil / AI Prompt</span>
                      </label>
                      <textarea
                        value={currentTemplate.aiSystemPrompt || ''}
                        onChange={(e) => handleTemplatePropertyChange('aiSystemPrompt', e.target.value)}
                        placeholder="Örn: Genç ve samimi bir ton kullan, emojiler ekle, lüks marka dili, ingilizce yaz vb."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-200 font-medium resize-none placeholder:text-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-semibold">Genişlik (px)</label>
                        <input
                          type="number"
                          value={currentTemplate.width}
                          min={200}
                          max={3000}
                          onChange={(e) => handleTemplatePropertyChange('width', parseInt(e.target.value) || 1080)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-200 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-semibold">Yükseklik (px)</label>
                        <input
                          type="number"
                          value={currentTemplate.height}
                          min={200}
                          max={3000}
                          onChange={(e) => handleTemplatePropertyChange('height', parseInt(e.target.value) || 1080)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-200 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-semibold">Tuval Varsayılan Arka Planı</label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.backgroundColor.startsWith('#') ? currentTemplate.backgroundColor : '#FFFFFF'}
                          onChange={(e) => handleTemplatePropertyChange('backgroundColor', e.target.value)}
                          className="w-10 h-8 rounded border border-slate-600 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentTemplate.backgroundColor}
                          onChange={(e) => handleTemplatePropertyChange('backgroundColor', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-semibold">Hazır Şablon Arka Plan Resmi</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="bg-image-uploader-input"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  handleTemplatePropertyChange('backgroundImageUrl', event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                        <label
                          htmlFor="bg-image-uploader-input"
                          className="flex-1 text-center bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-2"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>{currentTemplate.backgroundImageUrl ? 'Arka Planı Değiştir' : 'Görsel Yükle (PNG/JPG)'}</span>
                        </label>
                        {currentTemplate.backgroundImageUrl && (
                          <button
                            onClick={() => handleTemplatePropertyChange('backgroundImageUrl', undefined)}
                            className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Arka Plan Resmini Kaldır"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>

                      {/* Quick-pick shared image list */}
                      {(() => {
                        const uniqueImages = getUniqueUploadedImages();
                        if (uniqueImages.length === 0) return null;
                        return (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yüklediğiniz Diğer Görseller</span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                              {uniqueImages.map((url, i) => (
                                <div key={i} className="relative group/thumb shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTemplatePropertyChange('backgroundImageUrl', url)}
                                    className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 shrink-0 bg-slate-100 cursor-pointer shadow-sm transition hover:scale-105 active:scale-95 group"
                                    title="Bu görseli şablon arka planı yap"
                                  >
                                    <img src={url} alt={`Varlık ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeUploadedImage(url);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow hover:scale-110 active:scale-90 transition z-20 cursor-pointer opacity-0 group-hover/thumb:opacity-100"
                                    title="Görseli Kaldır"
                                  >
                                    <X className="w-2.5 h-2.5 stroke-[3]" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 2. ŞABLON RENK PALETİ */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4 shadow-sm" id="custom-palette-overrides-card">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      <span>2. ŞABLON RENK PALETİ</span>
                    </span>
                    <button
                      type="button"
                      onClick={resetTemplatePalette}
                      className="text-[10px] text-pink-500 hover:text-pink-400 hover:underline font-bold cursor-pointer"
                    >
                      Varsayılana Sıfırla
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Tasarım şablonunuzun varsayılan renklerini dilediğiniz gibi özelleştirin. Başlık ve açıklamalardaki <strong>**kalın vurgu**</strong> yazılarının rengini en alttaki seçiciden belirleyebilirsiniz. Bu renkler şablona kaydedilir.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Birincil Renk */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Birincil Renk</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.primary || '#4F46E5'}
                          onChange={(e) => handleTemplatePaletteChange('primary', e.target.value)}
                          className="w-6 h-6 rounded-md border border-slate-700 cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">{currentTemplate.palette?.primary || '#4F46E5'}</span>
                      </div>
                    </div>

                    {/* Vurgu Rengi */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">İkincil Accent</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.accent || '#F59E0B'}
                          onChange={(e) => handleTemplatePaletteChange('accent', e.target.value)}
                          className="w-6 h-6 rounded-md border border-slate-700 cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">{currentTemplate.palette?.accent || '#F59E0B'}</span>
                      </div>
                    </div>

                    {/* Metin Rengi */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Metin Rengi</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.text || '#0F172A'}
                          onChange={(e) => handleTemplatePaletteChange('text', e.target.value)}
                          className="w-6 h-6 rounded-md border border-slate-700 cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">{currentTemplate.palette?.text || '#0F172A'}</span>
                      </div>
                    </div>

                    {/* Arka Plan Rengi */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Arka Plan</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.bg || '#F8FAFC'}
                          onChange={(e) => handleTemplatePaletteChange('bg', e.target.value)}
                          className="w-6 h-6 rounded-md border border-slate-700 cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">{currentTemplate.palette?.bg || '#F8FAFC'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kalın Vurgu Yazı Rengi */}
                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Kalın Vurgu Yazı Rengi</span>
                      <span className="text-[10px] text-slate-500 block">**kalın yazılar** bu renkle vurgulanır.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTemplate.palette?.boldHighlight || currentTemplate.palette?.primary || '#4F46E5'}
                        onChange={(e) => handleTemplatePaletteChange('boldHighlight', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-700 shadow-sm cursor-pointer p-0"
                      />
                      <span className="font-mono text-xs text-indigo-400 font-extrabold uppercase">
                        {currentTemplate.palette?.boldHighlight || currentTemplate.palette?.primary || '#4F46E5'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Katman & Bölge Yönetimi */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">3. BÖLGELER & KATMANLAR</h4>
                    
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => addNewRegion('text')}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-755/80 text-slate-300 text-[10px] font-extrabold cursor-pointer shadow-sm transition"
                      >
                        <Type className="w-3 h-3 text-indigo-400 font-bold" />
                        <span>Metin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewRegion('image')}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-755/80 text-slate-300 text-[10px] font-extrabold cursor-pointer shadow-sm transition"
                      >
                        <ImageIcon className="w-3 h-3 text-indigo-400 font-bold" />
                        <span>Resim</span>
                      </button>
                      <label
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold cursor-pointer shadow-sm transition animate-pulse-subtle"
                      >
                        <Upload className="w-3 h-3 text-emerald-400 font-bold" />
                        <span>Yükle</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              addImageRegionFromFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
 
                  {/* List of Regions & Layers */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {/* Dynamic Regions rendered in REVERSE order (top layer is on top of the list) */}
                    {[...editingTemplate.regions].reverse().map((r, revIdx) => {
                      const origIndex = editingTemplate.regions.length - 1 - revIdx;
                      const isSelected = selectedNodeId === r.id;
                      const isEditing = editingRegionId === r.id;

                      return (
                        <div
                          key={r.id}
                          draggable={!isEditing}
                          onDragStart={(e) => {
                            setDraggedIndex(origIndex);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedIndex !== null && draggedIndex !== origIndex) {
                              moveRegionInList(draggedIndex, origIndex);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg ring-1 ring-indigo-500/20'
                              : 'bg-slate-800 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80 shadow-sm'
                          } ${draggedIndex === origIndex ? 'opacity-30 border-dashed' : ''}`}
                          onClick={() => setSelectedNodeId(r.id)}
                        >
                          <div className="flex items-center space-x-2 w-full min-w-0">
                            {/* Drag handle */}
                            <div 
                              className="text-slate-500 cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-700 rounded shrink-0"
                              title="Sürükleyerek Sırala"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                            </div>

                            {/* Layer type icon */}
                            <div className="shrink-0">
                              {r.type === 'text' 
                                ? <Type className="w-3.5 h-3.5 text-slate-400" /> 
                                : <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                              }
                            </div>

                            {/* Layer name & type details */}
                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={tempRegionName}
                                  onChange={(e) => setTempRegionName(e.target.value)}
                                  onBlur={() => {
                                    if (tempRegionName.trim()) {
                                      handleRegionPropertyChange(r.id, 'name', tempRegionName.trim());
                                    }
                                    setEditingRegionId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (tempRegionName.trim()) {
                                        handleRegionPropertyChange(r.id, 'name', tempRegionName.trim());
                                      }
                                      setEditingRegionId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingRegionId(null);
                                    }
                                  }}
                                  className="w-full bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="flex items-center space-x-1 group/name">
                                  <span 
                                    className="text-xs font-bold text-slate-200 truncate block cursor-pointer"
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingRegionId(r.id);
                                      setTempRegionName(r.name);
                                    }}
                                    title="Çift tıklayarak ismi düzenleyin"
                                  >
                                    {r.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingRegionId(r.id);
                                      setTempRegionName(r.name);
                                    }}
                                    className="opacity-0 group-hover/name:opacity-100 p-0.5 text-slate-500 hover:text-indigo-400 transition cursor-pointer"
                                    title="İsmi Düzenle"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              <span className="text-[9px] text-slate-400 block font-medium truncate">
                                {r.type === 'text' ? 'Metin Katmanı' : (r.clipImage === false ? 'Serbest PNG' : 'Görsel Katmanı')} • {r.width}x{r.height}px
                              </span>
                            </div>
                          </div>

                          {/* Quick layer ordering & Delete actions */}
                          <div className="flex items-center space-x-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Toggle visibility button (Eye / EyeOff) */}
                            <button
                              type="button"
                              onClick={() => handleRegionPropertyChange(r.id, 'hidden', !r.hidden)}
                              className={`p-1 rounded-lg transition cursor-pointer ${
                                r.hidden 
                                  ? 'text-red-400 hover:text-indigo-400 bg-red-500/10 hover:bg-slate-700' 
                                  : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700'
                              }`}
                              title={r.hidden ? "Katmanı Göster (Gizli)" : "Katmanı Gizle (Görünür)"}
                            >
                              {r.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {/* Toggle lock button (Lock / Unlock) */}
                            <button
                              type="button"
                              onClick={() => handleRegionPropertyChange(r.id, 'locked', !r.locked)}
                              className={`p-1 rounded-lg transition cursor-pointer ${
                                r.locked 
                                  ? 'text-amber-400 hover:text-indigo-400 bg-amber-500/10 hover:bg-slate-700 font-bold' 
                                  : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700'
                              }`}
                              title={r.locked ? "Kilidi Aç (Kilitli)" : "Katmanı Kilitle (Seçilebilir)"}
                            >
                              {r.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            <span className="w-px h-3.5 bg-slate-700 mx-0.5" />

                            {/* Move Up in hierarchy button */}
                            <button
                              type="button"
                              disabled={origIndex === editingTemplate.regions.length - 1}
                              onClick={() => moveRegionInList(origIndex, origIndex + 1)}
                              className="text-slate-500 hover:text-indigo-400 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none p-1 rounded-lg transition cursor-pointer"
                              title="Üste Taşı"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>

                            {/* Move Down in hierarchy button */}
                            <button
                              type="button"
                              disabled={origIndex === 0}
                              onClick={() => moveRegionInList(origIndex, origIndex - 1)}
                              className="text-slate-500 hover:text-indigo-400 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none p-1 rounded-lg transition cursor-pointer"
                              title="Alta Taşı"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => deleteElement(r.id)}
                              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1 rounded-lg transition cursor-pointer"
                              title="Katmanı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Seçili Katmanın Özellikleri Panel */}
                <AnimatePresence mode="wait">
                  {selectedNodeId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-slate-800/90 border border-slate-700/60 shadow-lg rounded-xl p-4 space-y-4"
                    >
                      {/* Check if Region or FixedElement */}
                      {(() => {
                        const region = editingTemplate.regions.find(r => r.id === selectedNodeId);
                        const fixed = editingTemplate.fixedElements.find(el => el.id === selectedNodeId);

                        if (region) {
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                                <div className="flex items-center">
                                  <h5 className="text-xs font-bold text-slate-300 uppercase">KATMAN DÜZENLEYİCİ</h5>
                                  <InfoTooltip text="Seçtiğiniz bu katmanın ekrandaki yerini (X ve Y konumları), genişlik/yükseklik boyutlarını, yazı tipini, boyutunu, rengini ve metin hiyerarşisi rollerini buradan detaylıca ayarlayabilirsiniz." />
                                </div>
                                <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 px-2.5 py-0.5 rounded-md font-extrabold font-mono">Dinamik</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Katman Adı</label>
                                  <input
                                    type="text"
                                    value={region.name}
                                    onChange={(e) => handleRegionPropertyChange(region.id, 'name', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Bölge Tipi</label>
                                  <span className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-slate-400 block font-bold">
                                    {region.type === 'text' ? 'Metin Alanı' : 'Resim Alanı'}
                                  </span>
                                </div>
                              </div>

                              {/* Quick states: Hidden / Locked */}
                              <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-xs justify-between">
                                <span className="font-bold text-slate-400 text-[10px] uppercase">Katman Durumu:</span>
                                
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRegionPropertyChange(region.id, 'hidden', !region.hidden)}
                                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition cursor-pointer font-bold text-[11px] border ${
                                      region.hidden 
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                    }`}
                                  >
                                    {region.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    <span>{region.hidden ? 'Gizli' : 'Görünür'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRegionPropertyChange(region.id, 'locked', !region.locked)}
                                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition cursor-pointer font-bold text-[11px] border ${
                                      region.locked 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                    }`}
                                  >
                                    {region.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    <span>{region.locked ? 'Kilitli' : 'Serbest'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Geometry offsets */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Konum &amp; Boyut (X, Y, W, H)</span>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Konum X</span>
                                      <span className="font-mono text-indigo-400 font-bold">{region.x}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.width}
                                      value={region.x}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'x', parseInt(e.target.value))}
                                      className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Konum Y</span>
                                      <span className="font-mono text-indigo-400 font-bold">{region.y}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.height}
                                      value={region.y}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'y', parseInt(e.target.value))}
                                      className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Genişlik</span>
                                      <span className="font-mono text-indigo-400 font-bold">{region.width}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={20}
                                      max={currentTemplate.width}
                                      value={region.width}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'width', parseInt(e.target.value))}
                                      className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Yükseklik</span>
                                      <span className="font-mono text-indigo-400 font-bold">{region.height}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={20}
                                      max={currentTemplate.height}
                                      value={region.height}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'height', parseInt(e.target.value))}
                                      className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="pt-1.5 pb-1">
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1.5">Katmanı Ortala</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('horizontal')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>↔ Yatay</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('vertical')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>↕ Dikey</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('both')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>✛ Tam</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Stylings border radius etc */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Arka Plan (Dolgu) &amp; Çerçeve</span>

                                {region.type === 'text' && (
                                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5">
                                    <div className="space-y-0.5 pr-2">
                                      <span className="text-[11px] font-extrabold text-slate-200 block">Metin Arka Planını Sığdır</span>
                                      <span className="text-[9px] text-slate-400 block leading-tight font-medium">Arka planı başlık/metin uzunluğuna göre eş zamanlı uyarla.</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={!!region.fitBackgroundToText}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'fitBackgroundToText', e.target.checked)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                    </label>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={region.hasBackground === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-slate-400 font-bold block">Arka Plan Dolgu</label>
                                      <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={region.hasBackground !== false}
                                          onChange={(e) => handleRegionPropertyChange(region.id, 'hasBackground', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-7 h-3.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[12px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                      </label>
                                    </div>
                                    <div className="flex space-x-1">
                                      <input
                                        type="color"
                                        value={region.backgroundColor?.startsWith('#') ? region.backgroundColor : '#FFFFFF'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'backgroundColor', e.target.value)}
                                        className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                                        disabled={region.hasBackground === false}
                                      />
                                      <input
                                        type="text"
                                        value={region.backgroundColor || 'transparent'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'backgroundColor', e.target.value)}
                                        placeholder="transparent"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-300 font-medium"
                                        disabled={region.hasBackground === false}
                                      />
                                    </div>
                                  </div>
                                  <div className={region.hasBorder === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-slate-400 font-bold block">Kenarlık Rengi</label>
                                      <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={region.hasBorder !== false}
                                          onChange={(e) => handleRegionPropertyChange(region.id, 'hasBorder', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-7 h-3.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[12px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                      </label>
                                    </div>
                                    <div className="flex space-x-1">
                                      <input
                                        type="color"
                                        value={region.borderColor?.startsWith('#') ? region.borderColor : '#4F46E5'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'borderColor', e.target.value)}
                                        className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                                        disabled={region.hasBorder === false}
                                      />
                                      <input
                                        type="text"
                                        value={region.borderColor || 'transparent'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'borderColor', e.target.value)}
                                        placeholder="transparent"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-300 font-medium"
                                        disabled={region.hasBorder === false}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className={region.hasBackground === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Köşe Yuvarlama (Radius)</label>
                                    <input
                                      type="number"
                                      value={region.borderRadius}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'borderRadius', parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                      disabled={region.hasBackground === false}
                                    />
                                  </div>
                                  <div className={region.hasBorder === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Kenarlık Kalınlığı</label>
                                    <input
                                      type="number"
                                      value={region.borderWidth}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'borderWidth', parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                      disabled={region.hasBorder === false}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Typography settings for Text region */}
                              {region.type === 'text' && region.textStyle && (
                                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                                  <span className="text-[10px] font-bold text-slate-550 uppercase block">YAZITİPİ (TYPOGRAPHY) AYARLARI</span>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Metin Rolü / Hiyerarşisi</label>
                                    <select
                                      value={region.textRole || 'normal'}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'textRole', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-semibold cursor-pointer mb-2"
                                    >
                                      <option value="normal">Normal / Diğer Metin</option>
                                      <option value="title">Başlık (Title)</option>
                                      <option value="subtitle">Alt Başlık (Subtitle)</option>
                                      <option value="description">Açıklama (Description)</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500">Yapay Zeka içeriği doldururken bu role göre başlığı, alt başlığı veya açıklamayı otomatik eşleştirecektir.</p>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Font Ailesi</label>
                                    <select
                                      value={region.textStyle.fontFamily}
                                      onChange={(e) => handleRegionTextStyleChange(region.id, 'fontFamily', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-semibold cursor-pointer"
                                    >
                                      <option value="Arimo">Arimo (Modern Dengeli Sans)</option>
                                      <option value="Roboto">Roboto (Klasik Temiz Sans)</option>
                                      <option value="Oswald">Oswald (Dar & Çarpıcı Başlık)</option>
                                      <option value="Inter">Inter (Sade Sans)</option>
                                      <option value="Space Grotesk">Space Grotesk (Modern Tech)</option>
                                      <option value="Playfair Display">Playfair Display (Zarif Serif)</option>
                                      <option value="JetBrains Mono">JetBrains Mono (Düz Mono)</option>
                                      <option value="Syne">Syne (Büyük Gösterişli)</option>
                                      <option value="Montserrat">Montserrat (Geometrik Sans)</option>
                                      <option value="Poppins">Poppins (Sıcak/Modern Sans)</option>
                                      <option value="Lora">Lora (Klasik Edebi Serif)</option>
                                      <option value="Cinzel">Cinzel (Lüks Antik Serif)</option>
                                      <option value="Bebas Neue">Bebas Neue (Dar/Kalın Başlık)</option>
                                      <option value="Russo One">Russo One (Fütüristik Darbe)</option>
                                      <option value="Permanent Marker">Permanent Marker (Fırça/Grafiti)</option>
                                      <option value="Dancing Script">Dancing Script (Zarif El Yazısı)</option>
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Boyutu (px)</label>
                                      <input
                                        type="number"
                                        value={region.textStyle.fontSize}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'fontSize', parseInt(e.target.value) || 24)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Rengi</label>
                                      <div className="flex space-x-1.5">
                                        <input
                                          type="color"
                                          value={region.textStyle.color.startsWith('#') ? region.textStyle.color : '#FFFFFF'}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'color', e.target.value)}
                                          className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                                        />
                                        <input
                                          type="text"
                                          value={region.textStyle.color}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'color', e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 font-medium"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Satır Aralığı</label>
                                      <input
                                        type="number"
                                        step={0.1}
                                        value={region.textStyle.lineHeight}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'lineHeight', parseFloat(e.target.value) || 1.2)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Kalınlığı</label>
                                      <select
                                        value={region.textStyle.fontWeight}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'fontWeight', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 font-bold cursor-pointer"
                                      >
                                        <option value="300">İnce (300)</option>
                                        <option value="normal">Normal (400)</option>
                                        <option value="500">Orta (500)</option>
                                        <option value="bold">Kalın (700)</option>
                                        <option value="700">Çok Kalın (800)</option>
                                        <option value="900">Siyah (900)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Harf Boşluğu (px)</label>
                                      <input
                                        type="number"
                                        value={region.textStyle.letterSpacing ?? 0}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'letterSpacing', parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Hizalama</label>
                                      <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-900 gap-0.5 h-7">
                                        <button
                                          type="button"
                                          onClick={() => handleRegionTextStyleChange(region.id, 'align', 'left')}
                                          className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                            region.textStyle.align === 'left'
                                              ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                              : 'text-slate-500 hover:text-slate-300'
                                          }`}
                                          title="Sola Hizala"
                                        >
                                          <AlignLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRegionTextStyleChange(region.id, 'align', 'center')}
                                          className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                            region.textStyle.align === 'center'
                                              ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                              : 'text-slate-500 hover:text-slate-300'
                                          }`}
                                          title="Ortala"
                                        >
                                          <AlignCenter className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRegionTextStyleChange(region.id, 'align', 'right')}
                                          className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                            region.textStyle.align === 'right'
                                              ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                              : 'text-slate-500 hover:text-slate-300'
                                          }`}
                                          title="Sağa Hizala"
                                        >
                                          <AlignRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Shadow settings */}
                                  <div className="space-y-3 pt-2 border-t border-slate-700/60">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Metin Arkası Gölge (Text Shadow)</span>
                                      <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={region.textStyle.hasShadow !== false}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'hasShadow', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                      </label>
                                    </div>
                                    <div className={`space-y-3 ${region.textStyle.hasShadow === false ? "opacity-45 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">Gölge Rengi</label>
                                          <div className="flex space-x-1">
                                            <input
                                              type="color"
                                              value={region.textStyle.shadowColor?.startsWith('#') ? region.textStyle.shadowColor : '#000000'}
                                              onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowColor', e.target.value)}
                                              className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                                              disabled={region.textStyle.hasShadow === false}
                                            />
                                            <input
                                              type="text"
                                              value={region.textStyle.shadowColor || 'transparent'}
                                              onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowColor', e.target.value)}
                                              placeholder="transparent"
                                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-200 font-medium"
                                              disabled={region.textStyle.hasShadow === false}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Gölge Dağılımı (Blur)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowBlur ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowBlur', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">X Kayması (Offset X)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowOffsetX ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowOffsetX', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Y Kayması (Offset Y)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowOffsetY ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowOffsetY', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Layer Hierarchy Reordering Controls */}
                              <div className="space-y-2 pt-3 border-t border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Katman Hiyerarşisi (Sıralama)</span>
                                <div className="grid grid-cols-4 gap-1.5 text-center">
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'front')}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-300 font-bold cursor-pointer transition shadow-sm"
                                    title="En Üste Getir"
                                  >
                                    En Üst
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'up')}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-300 font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                    title="Bir Üste Çıkar"
                                  >
                                    <ChevronUp className="w-3 h-3 text-indigo-400" />
                                    <span>Öne</span>
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'down')}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-300 font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                    title="Bir Alta İndir"
                                  >
                                    <ChevronDown className="w-3 h-3 text-indigo-400" />
                                    <span>Arka</span>
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'back')}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-300 font-bold cursor-pointer transition shadow-sm"
                                    title="En Alta Gönder"
                                  >
                                    En Alt
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (fixed) {
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                                <h5 className="text-xs font-bold text-amber-500 uppercase">SABİT ÖĞE DÜZENLEYİCİ</h5>
                                <span className="text-[9px] bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-md font-extrabold">Sabit</span>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">Katman Adı</label>
                                <input
                                  type="text"
                                  value={fixed.name}
                                  onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'name', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              {/* Geometry offsets */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Konum &amp; Boyut (X, Y, W, H)</span>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Konum X</span>
                                      <span className="font-mono text-amber-450 font-bold">{fixed.x}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.width}
                                      value={fixed.x}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'x', parseInt(e.target.value))}
                                      className="w-full accent-amber-500 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Konum Y</span>
                                      <span className="font-mono text-amber-450 font-bold">{fixed.y}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.height}
                                      value={fixed.y}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'y', parseInt(e.target.value))}
                                      className="w-full accent-amber-500 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Genişlik</span>
                                      <span className="font-mono text-amber-450 font-bold">{fixed.width}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={5}
                                      max={currentTemplate.width}
                                      value={fixed.width}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'width', parseInt(e.target.value))}
                                      className="w-full accent-amber-500 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between mb-1">
                                      <span>Yükseklik</span>
                                      <span className="font-mono text-amber-450 font-bold">{fixed.height}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={2}
                                      max={currentTemplate.height}
                                      value={fixed.height}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'height', parseInt(e.target.value))}
                                      className="w-full accent-amber-500 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="pt-1.5 pb-1">
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1.5">Katmanı Ortala</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('horizontal')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>↔ Yatay</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('vertical')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>↕ Dikey</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('both')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <span>✛ Tam</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Details depending on type */}
                              {fixed.type === 'shape' && (
                                <div className="space-y-3 pt-2">
                                  <span className="text-[10px] font-bold text-slate-550 uppercase block">Şekil Detayları</span>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Şekil Tipi</label>
                                      <select
                                        value={fixed.shapeType}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'shapeType', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-bold cursor-pointer"
                                      >
                                        <option value="rect">Dikdörtgen</option>
                                        <option value="circle">Daire</option>
                                        <option value="line">Çizgi</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Dolgu Rengi</label>
                                      <input
                                        type="text"
                                        value={fixed.backgroundColor || fixed.color}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'backgroundColor', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-250 font-semibold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(fixed.type === 'logo' || fixed.type === 'social') && (
                                <div className="space-y-3 pt-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Metin &amp; Simge Özellikleri</span>
                                  
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">İçerik Metni</label>
                                    <input
                                      type="text"
                                      value={fixed.content}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'content', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                                    />
                                  </div>

                                  {fixed.type === 'social' && (
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Simge Tipi</label>
                                      <select
                                        value={fixed.iconType}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'iconType', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-bold cursor-pointer"
                                      >
                                        <option value="none">Simgesiz</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="globe">Web / Küre</option>
                                        <option value="mail">E-posta</option>
                                        <option value="phone">Telefon</option>
                                      </select>
                                    </div>
                                  )}

                                  {fixed.textStyle && (
                                    <div className="space-y-3 pt-2 border-t border-slate-700/60">
                                      <div>
                                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Font Ailesi</label>
                                        <select
                                          value={fixed.textStyle.fontFamily || 'Space Grotesk'}
                                          onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontFamily', e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-bold cursor-pointer"
                                        >
                                          <option value="Arimo">Arimo (Modern Dengeli Sans)</option>
                                          <option value="Roboto">Roboto (Klasik Temiz Sans)</option>
                                          <option value="Oswald">Oswald (Dar &amp; Çarpıcı Başlık)</option>
                                          <option value="Inter">Inter (Sade Sans)</option>
                                          <option value="Space Grotesk">Space Grotesk (Modern Tech)</option>
                                          <option value="Playfair Display">Playfair Display (Zarif Serif)</option>
                                          <option value="JetBrains Mono">JetBrains Mono (Düz Mono)</option>
                                          <option value="Syne">Syne (Büyük Gösterişli)</option>
                                          <option value="Montserrat">Montserrat (Geometrik Sans)</option>
                                          <option value="Poppins">Poppins (Sıcak/Modern Sans)</option>
                                          <option value="Lora">Lora (Klasik Edebi Serif)</option>
                                          <option value="Cinzel">Cinzel (Lüks Antik Serif)</option>
                                          <option value="Bebas Neue">Bebas Neue (Dar/Kalın Başlık)</option>
                                          <option value="Russo One">Russo One (Fütüristik Darbe)</option>
                                          <option value="Permanent Marker">Permanent Marker (Fırça/Grafiti)</option>
                                          <option value="Dancing Script">Dancing Script (Zarif El Yazısı)</option>
                                        </select>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Boyutu</label>
                                          <input
                                            type="number"
                                            value={fixed.textStyle.fontSize}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontSize', parseInt(e.target.value) || 14)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Rengi</label>
                                          <div className="flex space-x-1.5">
                                            <input
                                              type="color"
                                              value={fixed.textStyle.color.startsWith('#') ? fixed.textStyle.color : '#FFFFFF'}
                                              onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'color', e.target.value)}
                                              className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                                            />
                                            <input
                                              type="text"
                                              value={fixed.textStyle.color}
                                              onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'color', e.target.value)}
                                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 font-medium"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yazı Kalınlığı</label>
                                          <select
                                            value={fixed.textStyle.fontWeight || 'normal'}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontWeight', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-350 font-bold cursor-pointer"
                                          >
                                            <option value="300">İnce (300)</option>
                                            <option value="normal">Normal (400)</option>
                                            <option value="500">Orta (500)</option>
                                            <option value="bold">Kalın (700)</option>
                                            <option value="700">Çok Kalın (800)</option>
                                            <option value="900">Siyah (900)</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Harf Boşluğu (px)</label>
                                          <input
                                            type="number"
                                            value={fixed.textStyle.letterSpacing ?? 0}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'letterSpacing', parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium font-mono"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Hizalama</label>
                                        <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-900 gap-0.5 h-7">
                                          <button
                                            type="button"
                                            onClick={() => handleFixedElementTextStyleChange(fixed.id, 'align', 'left')}
                                            className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                              fixed.textStyle.align === 'left'
                                                ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                                : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                            title="Sola Hizala"
                                          >
                                            <AlignLeft className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleFixedElementTextStyleChange(fixed.id, 'align', 'center')}
                                            className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                              fixed.textStyle.align === 'center'
                                                ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                                : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                            title="Ortala"
                                          >
                                            <AlignCenter className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleFixedElementTextStyleChange(fixed.id, 'align', 'right')}
                                            className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                              fixed.textStyle.align === 'right'
                                                ? 'bg-indigo-650 text-white shadow-sm border border-indigo-500/25'
                                                : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                            title="Sağa Hizala"
                                          >
                                            <AlignRight className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Layer Hierarchy Reordering Controls for Fixed elements */}
                                  <div className="space-y-2 pt-3 border-t border-slate-700/60 mt-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Katman Hiyerarşisi (Sıralama)</span>
                                    <div className="grid grid-cols-4 gap-1.5 text-center">
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'front')}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-350 font-bold cursor-pointer transition shadow-sm"
                                        title="En Üste Getir"
                                      >
                                        En Üst
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'up')}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-350 font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                        title="Bir Üste Çıkar"
                                      >
                                        <ChevronUp className="w-3 h-3 text-amber-400" />
                                        <span>Öne</span>
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'down')}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-350 font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                        title="Bir Alta İndir"
                                      >
                                        <ChevronDown className="w-3 h-3 text-amber-400" />
                                        <span>Arka</span>
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'back')}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[10px] rounded text-slate-350 font-bold cursor-pointer transition shadow-sm"
                                        title="En Alta Gönder"
                                      >
                                        En Alt
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* TAB 3: PHASE 2 GRAPHIC PRODUCTION ENGINE */}
            {activeTab === 'phase2' && (
              <div className="space-y-5">

                {/* Şablon Hızlı Seçici */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Aktif Tasarım Şablonu</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presets')}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>Tümünü Yönet ({templates.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1.5">
                    {templates.map(temp => {
                      const isActive = temp.id === currentTemplateId;
                      return (
                        <button
                          key={temp.id}
                          type="button"
                          onClick={() => {
                            setCurrentTemplateId(temp.id);
                            setSelectedNodeId(null);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 font-extrabold'
                              : 'bg-slate-700/60 hover:bg-slate-700 border-slate-600 text-slate-300 font-semibold'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-300 animate-pulse' : 'bg-slate-500'}`} />
                          <span>{temp.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sihirbaz Modülü */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-4 relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Sihirbaz</h3>
                  </div>

                  {/* Kısaca Bahset (AI Özel İstekleri) */}
                  <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">gönderiden kısaca bahset</span>
                      {currentTemplate.aiSystemPrompt && (
                        <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded-md">
                          Kurumsal Dil Aktif
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <textarea
                        value={aiCollageBrief}
                        onChange={(e) => setAiCollageBrief(e.target.value)}
                        placeholder="Örn: 'Butiğim için yaz koleksiyonu, keten elbiseler', 'fiyat odaklı ve sıcak bir dil kullan' vb."
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-300 font-medium resize-y placeholder:text-slate-600"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      {generatedPages.length > 0 ? (
                        <button
                          type="button"
                          disabled={isAiAnalyzing}
                          onClick={() => {
                            const urls: string[] = [];
                            generatedPages.forEach(p => {
                              Object.values(p.dynamicImages).forEach((img: any) => {
                                if (img && img.url) urls.push(img.url);
                              });
                            });
                            const uniqueUrls = Array.from(new Set(urls));
                            if (uniqueUrls.length > 0) {
                              runAiCollageAnalysis(uniqueUrls);
                            } else {
                              alert('Önce görsel yüklemelisiniz!');
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          {isAiAnalyzing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>AI Tüm Sayfaları Güncelliyor...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Yapay Zeka ile Tüm Sayfaları Güncelle</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isAiLoading}
                          onClick={triggerAiGenerator}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          {isAiLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Metinler Üretiliyor...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Yapay Zeka ile Başlık & Açıklama Üret</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div 
                    onDragEnter={(e) => handleDrag(e, 'multi-collage')}
                    onDragLeave={(e) => handleDrag(e, 'multi-collage')}
                    onDragOver={(e) => handleDrag(e, 'multi-collage')}
                    onDrop={handleMultiDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer relative ${
                      dragActive['multi-collage']
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleMultiImageFiles(e.target.files);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-bold">Görsel Yükle</p>
                  </div>

                  {/* Eklenen Fotoğraflar Küçük Resim Gösterimi */}
                  {(() => {
                    const uniqueUrls = getUniqueUploadedImages();
                    const bgUrl = activeTemplatePage?.backgroundImageUrl || currentTemplate.backgroundImageUrl;
                    const filteredUniqueUrls = bgUrl ? uniqueUrls.filter(url => url !== bgUrl) : uniqueUrls;
                    
                    if (filteredUniqueUrls.length === 0 && !bgUrl) return null;

                    return (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yüklenen Fotoğraflar</span>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                          {/* 1. Background Image Thumbnail (Special Highlight Styling & Undeletable) */}
                          {bgUrl && (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-emerald-500 shrink-0 shadow-md bg-emerald-50/50 group/thumb transition-all hover:scale-105" title="Arka Plan Görseli (Silinemez)">
                              <img src={bgUrl} alt="Arka Plan Görseli" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] font-bold py-0.5 text-center uppercase tracking-wider">
                                Arka Plan
                              </span>
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow">
                                <Lock className="w-2 h-2" />
                              </div>
                            </div>
                          )}

                          {/* 2. Regular User Uploaded Images */}
                          {filteredUniqueUrls.map((url, i) => (
                            <div key={i} className="relative w-14 h-14 rounded-lg border border-slate-200 shrink-0 shadow-sm bg-slate-100 group/thumb transition-all hover:scale-105">
                              <div className="w-full h-full rounded-lg overflow-hidden">
                                <img src={url} alt={`Yüklenen ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-tl rounded-br-lg">
                                {i + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(url)}
                                className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow active:scale-90 transition z-20 cursor-pointer opacity-100 lg:opacity-0 lg:group-hover/thumb:opacity-100"
                                title="Fotoğrafı Kaldır"
                              >
                                <X className="w-3 h-3 stroke-[3.5]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {isAiAnalyzing && (
                    <div className="space-y-2 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-fade-in">
                      <div className="flex justify-between items-center text-xs font-bold text-indigo-700">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                          <span>Yapay Zeka Görselleri Analiz Ediyor...</span>
                        </div>
                        <span className="font-mono text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                          %{Math.round(aiProgress)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${aiProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold text-center italic">
                        {aiProgress < 40 
                          ? 'Görseller sıkıştırılıyor ve optimize ediliyor...' 
                          : aiProgress < 75 
                          ? 'Yapay Zeka görsel içeriğini ve renk paletini çözümlüyor...' 
                          : 'Sektörünüze özel kampanya başlığı ve açıklamaları oluşturuluyor...'}
                      </p>
                    </div>
                  )}

                  {generatedPages.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-indigo-100 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Üretilen Sayfalar ({generatedPages.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedPages([]);
                            setActiveGeneratedPageIndex(0);
                            setAiSuccessMessage('Çoklu sayfa akışı temizlendi.');
                          }}
                          className="text-[10px] text-pink-600 hover:underline font-bold"
                        >
                          Sıfırla
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {generatedPages.map((page, index) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => setActiveGeneratedPageIndex(index)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                              activeGeneratedPageIndex === index
                                ? 'bg-indigo-600 text-white shadow-md scale-105'
                                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-sm'
                            }`}
                          >
                            <span>{page.name || (index === 0 ? '✦ Kapak Sayfası' : `${index}. Sayfa`)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dinamik Alanların Düzenlenmesi (Aşama 2 Form) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">DİNAMİK ŞABLON PARAMETRELERİ</h4>

                  {activeTemplatePage.regions.filter(r => r.isDynamic !== false).length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs font-medium">
                      Bu şablonda tanımlanmış dinamik bölge yok! Aşama 1'den ekleyebilirsiniz.
                    </div>
                  )}

                  {activeTemplatePage.regions.filter(r => r.isDynamic !== false).map(r => {
                    if (r.type === 'text') {
                      const textVal = activePageData.dynamicTexts[r.id] !== undefined
                        ? activePageData.dynamicTexts[r.id]
                        : (r.placeholderText || '');
                      
                      return (
                        <div key={r.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                              <Type className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{r.name}</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {r.id.split('-')[1]}</span>
                          </div>

                          <textarea
                            rows={3}
                            value={textVal}
                            onChange={(e) => updateActiveText(r.id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 font-medium leading-relaxed resize-y shadow-inner animate-fade-in"
                            placeholder="Metninizi yazın..."
                          />

                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                            <span>Markdown: <strong className="text-slate-600">**kalın**</strong> ve <em className="text-slate-600">*eğik*</em> desteklenir.</span>
                            <span className="font-mono text-[9px]">{textVal.length} karakter</span>
                          </div>
                        </div>
                      );
                    }

                    if (r.type === 'image') {
                      const imgData = activePageData.dynamicImages[r.id] || {
                        url: '',
                        scale: 1.0,
                        offsetX: 0,
                        offsetY: 0,
                        rotation: 0
                      };

                      const hasImage = !!imgData.url;
                      const isExpanded = !!expandedImageSettings[r.id];

                      return (
                        <div key={r.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{r.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {imgData.url ? 'Görsel Yüklendi' : 'Görsel Bekleniyor'}
                            </span>
                          </div>

                          {/* File Thumbnail or Drag & Drop Block */}
                          {hasImage ? (
                            <div className="flex items-center space-x-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm relative group">
                                <img src={imgData.url} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition duration-150" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10.5px] font-bold text-slate-700 truncate block">Görsel Alanı Dolu</span>
                                <span className="text-[9.5px] text-emerald-600 font-semibold flex items-center space-x-0.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                  <span>Tasarımda Gösteriliyor</span>
                                </span>
                              </div>
                              <div className="flex flex-col space-y-1 shrink-0">
                                <label className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 hover:text-indigo-700 text-[10px] font-bold border border-indigo-200 cursor-pointer text-center transition shadow-sm">
                                  <span>Değiştir</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileInput(e, r.id)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => updateActiveImageProp(r.id, 'url', '')}
                                  className="px-2.5 py-1 rounded-md bg-pink-50 hover:bg-pink-100 text-pink-600 text-[10px] font-bold border border-pink-150 cursor-pointer text-center transition"
                                >
                                  Temizle
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onDragEnter={(e) => handleDrag(e, r.id)}
                              onDragLeave={(e) => handleDrag(e, r.id)}
                              onDragOver={(e) => handleDrag(e, r.id)}
                              onDrop={(e) => handleDrop(e, r.id)}
                              className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                                dragActive[r.id]
                                  ? 'border-indigo-500 bg-indigo-50/50'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                              }`}
                            >
                              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
                              <p className="text-xs text-slate-700 font-bold mb-1">Görselinizi Sürükleyin veya Seçin</p>
                              <p className="text-[10px] text-slate-400 mb-3 font-semibold font-mono">PNG, JPEG veya SVG desteklenir</p>
                              
                              <label className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200 cursor-pointer inline-block transition shadow-sm">
                                <span>Dosya Seç</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileInput(e, r.id)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}

                          {/* Quick-pick shared image list */}
                          {(() => {
                            const uniqueImages = getUniqueUploadedImages();
                            if (uniqueImages.length === 0) return null;
                            return (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yüklediğiniz Diğer Görseller</span>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                                  {uniqueImages.map((url, i) => (
                                    <div key={i} className="relative group/thumb shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => updateActiveImageProp(r.id, 'url', url)}
                                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 shrink-0 bg-slate-100 cursor-pointer shadow-sm transition hover:scale-105 active:scale-95 group"
                                        title="Bu görseli buraya yerleştir"
                                      >
                                        <img src={url} alt={`Varlık ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeUploadedImage(url);
                                        }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow hover:scale-110 active:scale-90 transition z-20 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100"
                                        title="Görseli Kaldır"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Collapsible Photo Alignment and Tweaks Bar */}
                          <div className="pt-1.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setExpandedImageSettings(prev => ({
                                ...prev,
                                [r.id]: !isExpanded
                              }))}
                              className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer transition select-none"
                            >
                              <div className="flex items-center space-x-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                                <span>İnce Ayarlar ve Hizalama</span>
                              </div>
                              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="space-y-3.5 pt-3 border-t border-slate-100/80 mt-1 animate-fade-in">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                                  <span className="font-bold uppercase tracking-wider">Hizalama Komutları</span>
                                  <button
                                    onClick={() => {
                                      updateActiveImageProp(r.id, 'scale', 1.0);
                                      updateActiveImageProp(r.id, 'offsetX', 0);
                                      updateActiveImageProp(r.id, 'offsetY', 0);
                                      updateActiveImageProp(r.id, 'rotation', 0);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-1 transition"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Pozisyonu Sıfırla</span>
                                  </button>
                                </div>

                                {/* Mouse with Image adjustment toggle */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingImageRegionId === r.id) {
                                      setEditingImageRegionId(null);
                                    } else {
                                      setEditingImageRegionId(r.id);
                                      setSelectedNodeId(r.id);
                                    }
                                  }}
                                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border transition cursor-pointer ${
                                    editingImageRegionId === r.id
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                                      : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  <MousePointer className={`w-3.5 h-3.5 ${editingImageRegionId === r.id ? 'animate-pulse' : ''}`} />
                                  <span>
                                    {editingImageRegionId === r.id ? 'Mouse Düzenleme Aktif (Kapat)' : 'Görseli Mouse ile Sürükle ve Ölçekle'}
                                  </span>
                                </button>

                                {/* Maske Sınırı Toggle */}
                                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 block">Sınır Maskesi (Kırpma)</span>
                                    <span className="text-[10px] text-slate-500 block leading-tight">Görselin katman kutusuna sığmasını kısıtlar.</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRegionPropertyChange(r.id, 'clipImage', r.clipImage !== false ? false : true);
                                    }}
                                    className={`px-2.5 py-1 rounded text-[10px] font-extrabold border transition cursor-pointer shrink-0 ${
                                      r.clipImage !== false
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}
                                  >
                                    {r.clipImage !== false ? 'Maskeli' : 'Sınırsız (PNG)'}
                                  </button>
                                </div>

                                {/* Zoom Scale slider */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                                    <span>Yakınlaştır / Uzaklaştır (Ölçek)</span>
                                    <span className="font-mono text-indigo-600 font-bold">{imgData.scale.toFixed(1)}x</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0.1}
                                    max={10.0}
                                    step={0.1}
                                    value={imgData.scale}
                                    onChange={(e) => updateActiveImageProp(r.id, 'scale', parseFloat(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                                  />
                                </div>

                                {/* Offset X / Horizontal Shift slider */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                                    <span>Yatay Kaydırma (Sol - Sağ)</span>
                                    <span className="font-mono text-indigo-600 font-bold">{imgData.offsetX}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-1000}
                                    max={1000}
                                    value={imgData.offsetX}
                                    onChange={(e) => updateActiveImageProp(r.id, 'offsetX', parseInt(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                                  />
                                </div>

                                {/* Offset Y / Vertical Shift slider */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                                    <span>Dikey Kaydırma (Yukarı - Aşağı)</span>
                                    <span className="font-mono text-indigo-600 font-bold">{imgData.offsetY}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-1000}
                                    max={1000}
                                    value={imgData.offsetY}
                                    onChange={(e) => updateActiveImageProp(r.id, 'offsetY', parseInt(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                                  />
                                </div>

                                {/* Rotate slider */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                                    <span>Döndür (Açı)</span>
                                    <span className="font-mono text-indigo-600 font-bold">{imgData.rotation}°</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    value={imgData.rotation}
                                    onChange={(e) => updateActiveImageProp(r.id, 'rotation', parseInt(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: LIVE CANVAS PREVIEW STAGE */}
        <div id="canvas-stage" className={`flex-1 bg-[#080b12] flex flex-col items-center justify-between p-3 sm:p-4 lg:p-6 relative overflow-hidden h-full ${mobileView === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Top Info Bar */}
          <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-semibold z-10 shrink-0" style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.08)' }}>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50" />
              <span className="text-slate-300 font-bold">Görsel Tuvali</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500 font-bold font-mono">{currentTemplate.width} × {currentTemplate.height} px</span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-500">
              {/* Geri Al (Undo) */}
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndo}
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-400 bg-slate-900 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                title="Geri Al (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Geri Al</span>
              </button>

              {/* İleri Al (Redo) */}
              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-400 bg-slate-900 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                title="İleri Al (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">İleri Al</span>
              </button>

              <span className="text-slate-700 hidden xs:inline">|</span>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm ${
                  showGrid ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400'
                }`}
                title="Kılavuz Çizgileri"
              >
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Kılavuz</span>
              </button>

              {/* Margin Toggle */}
              <button
                onClick={() => setShowSafeMargins(!showSafeMargins)}
                className={`flex items-center space-x-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm ${
                  showSafeMargins ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400'
                }`}
                title="Güvenli Baskı Alanı"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Güvenli Alan</span>
              </button>
            </div>
          </div>

          {/* Canvas Wrapper Container with Scrollable Pages */}
          <div 
            id="canvas-viewport"
            className="flex-1 flex flex-col items-center w-full max-h-[calc(100dvh-180px)] sm:max-h-[calc(100dvh-200px)] my-2 sm:my-4 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-8 canvas-viewport-bg rounded-2xl border border-slate-800/50 select-none scroll-smooth relative"
          >
            {/* Ambient glow overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

            {editingImageRegionId && (
              <div className="sticky top-0 z-30 w-full max-w-md bg-emerald-600 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between space-x-3 border border-emerald-500 animate-fade-in shrink-0">
                <div className="flex items-center space-x-2">
                  <MousePointer className="w-3.5 h-3.5 animate-bounce" />
                  <span>Görseli mouse ile sürükleyip kaydırın, tekerlek ile yakınlaştırın</span>
                </div>
                <button
                  onClick={() => setEditingImageRegionId(null)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            )}

            {/* List of Pages */}
            {activeTab === 'phase1' ? (
              // --- TEMPLATE EDIT MODE PAGES ---
              (currentTemplate.pages || []).map((page, idx) => {
                const isActive = activePageIndex === idx;
                const baseWidth = window.innerWidth < 640 ? Math.min(window.innerWidth - 32, 380) : 380;
                const pageScale = zoomMode === 'fit' ? 1.0 : zoomScale;
                const displayWidth = baseWidth * pageScale;
                return (
                  <div 
                    key={page.id} 
                    className="flex flex-col items-center space-y-2.5 w-full shrink-0"
                    style={{ maxWidth: `${displayWidth}px` }}
                  >
                    {/* Header with Page Info */}
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50"></span>
                        <span>{idx + 1}. Sayfa: {page.name || 'İsimsiz Sayfa'}</span>
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Aktif Düzenleme
                        </span>
                      )}
                    </div>

                    {/* Canvas Frame */}
                    <div 
                      className={`relative w-full p-1 rounded-xl shadow-2xl transition duration-200 canvas-wrapper-glow ${
                        isActive 
                          ? 'bg-indigo-500/10 border-2 border-indigo-500/60 ring-4 ring-indigo-500/15 shadow-indigo-500/20' 
                          : 'bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 hover:shadow-xl'
                      }`}
                      style={{ aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}` }}
                    >
                      {isActive ? (
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleCanvasPointerDown}
                          onMouseMove={handleCanvasPointerMove}
                          onMouseUp={handleCanvasPointerUp}
                          onMouseLeave={handleCanvasPointerUp}
                          onTouchStart={handleCanvasPointerDown}
                          onTouchMove={handleCanvasPointerMove}
                          onTouchEnd={handleCanvasPointerUp}
                          onDoubleClick={handleCanvasDoubleClick}
                          style={{
                            width: '100%',
                            height: '100%',
                            aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}`,
                            display: 'block',
                            cursor: isDragging ? 'grabbing' : 'grab'
                          }}
                          className="bg-white rounded-lg shadow-inner select-none touch-none"
                        />
                      ) : (
                        <StaticPageCanvas
                          template={currentTemplate}
                          page={page}
                          activeTab="phase1"
                          paletteOverrides={activeGraphicData.paletteOverrides}
                          width={currentTemplate.width}
                          height={currentTemplate.height}
                          onClick={() => {
                            setActivePageIndex(idx);
                            setSelectedNodeId(null);
                          }}
                          isActive={false}
                          pageIndex={idx}
                          highlightColor={vurguColor}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // --- GENERATED POSTS MODE PAGES ---
              generatedPages.length > 0 ? (
                generatedPages.map((page, idx) => {
                  const isActive = activeGeneratedPageIndex === idx;
                  const pageDef = currentTemplate.pages?.find(p => p.id === page.templatePageId) || currentTemplate;
                  const baseWidth = window.innerWidth < 640 ? Math.min(window.innerWidth - 32, 380) : 380;
                  const pageScale = zoomMode === 'fit' ? 1.0 : zoomScale;
                  const displayWidth = baseWidth * pageScale;
                  return (
                    <div 
                      key={page.id} 
                      className="flex flex-col items-center space-y-2 w-full shrink-0"
                      style={{ maxWidth: `${displayWidth}px` }}
                    >
                      {/* Header with Page Info */}
                      <div className="flex items-center justify-between w-full px-2">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
                        <span>{page.name || `${idx + 1}. Sayfa`}</span>
                      </span>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Aktif Düzenleme
                          </span>
                        )}
                      </div>

                      {/* Canvas Frame - Generated Post */}
                      <div 
                        className={`relative w-full p-1 rounded-xl shadow-2xl transition duration-200 canvas-wrapper-glow ${
                          isActive 
                            ? 'bg-emerald-500/10 border-2 border-emerald-500/50 ring-4 ring-emerald-500/15 shadow-emerald-500/20' 
                            : 'bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 hover:shadow-xl'
                        }`}
                        style={{ aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}` }}
                      >
                        {isActive ? (
                          <canvas
                            ref={canvasRef}
                            onMouseDown={handleCanvasPointerDown}
                            onMouseMove={handleCanvasPointerMove}
                            onMouseUp={handleCanvasPointerUp}
                            onMouseLeave={handleCanvasPointerUp}
                            onTouchStart={handleCanvasPointerDown}
                            onTouchMove={handleCanvasPointerMove}
                            onTouchEnd={handleCanvasPointerUp}
                            onDoubleClick={handleCanvasDoubleClick}
                            style={{
                              width: '100%',
                              height: '100%',
                              aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}`,
                              display: 'block',
                              cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                            className="bg-white rounded-lg shadow-inner select-none touch-none"
                          />
                        ) : (
                          <StaticPageCanvas
                            template={currentTemplate}
                            page={{
                              ...page,
                              regions: pageDef.regions,
                              fixedElements: pageDef.fixedElements
                            }}
                            activeTab="phase2"
                            paletteOverrides={activeGraphicData.paletteOverrides}
                            width={currentTemplate.width}
                            height={currentTemplate.height}
                            onClick={() => {
                              setActiveGeneratedPageIndex(idx);
                              setSelectedNodeId(null);
                            }}
                            isActive={false}
                            pageIndex={idx}
                            highlightColor={vurguColor}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <p className="text-sm font-semibold">Henüz üretilmiş bir sayfa yok.</p>
                  <p className="text-xs">Soldaki panelden içerik üreterek başlayın.</p>
                </div>
              )
            )}
          </div>

          {/* FLOATING ZOOM AND PAN CONTROLS */}
          <div className="absolute bottom-16 right-4 sm:bottom-6 sm:right-6 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-full p-1.5 flex items-center space-x-1 z-20" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)' }}>
            {/* Zoom Out */}
            <button
              onClick={() => {
                if (zoomMode === 'fit') {
                  setZoomMode('custom');
                  setZoomScale(0.35);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoomScale(prev => Math.max(0.1, parseFloat((prev - 0.05).toFixed(2))));
                }
              }}
              className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Uzaklaştır"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Current Zoom Indicator */}
            <span className="text-[11px] font-bold text-slate-300 min-w-[45px] text-center font-mono">
              {zoomMode === 'fit' ? 'Sığdır' : `${Math.round(zoomScale * 100)}%`}
            </span>

            {/* Zoom In */}
            <button
              onClick={() => {
                if (zoomMode === 'fit') {
                  setZoomMode('custom');
                  setZoomScale(0.5);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoomScale(prev => Math.min(3.0, parseFloat((prev + 0.05).toFixed(2))));
                }
              }}
              className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Yakınlaştır"
            >
              <Plus className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 mx-1" />

            {/* Fit Screen / Reset */}
            <button
              onClick={() => {
                setZoomMode('fit');
                setPanOffset({ x: 0, y: 0 });
              }}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                zoomMode === 'fit'
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Ekrana Sığdır"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Info Status bar */}
          <div className="w-full max-w-xl text-center text-slate-600 font-medium text-[10px] sm:text-[11px] leading-relaxed select-none pb-2 shrink-0">
            Mükemmel hizalama ve DPI çıktısı için parametreleri sol panelden özelleştirin.
            Kılavuz çizgileri ve hizalama araçları çıktı görselinde gizlenir.
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ASSETS & EXPORT */}
        <div id="export-assets-bar" className={`w-full lg:w-[300px] bg-slate-900 border-l border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between h-full overflow-y-auto shrink-0 z-20 ${mobileView === 'export' ? 'flex' : 'hidden lg:flex'}`} style={{ boxShadow: 'inset 1px 0 0 rgba(99,102,241,0.08)' }}>
          
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="section-header">PROJE SAYFALARI</span>
                {generatedPages.length > 0 && (
                  <span className="text-[9.5px] font-extrabold text-indigo-400 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                    {generatedPages.length} Hazır
                  </span>
                )}
              </div>

              {generatedPages.length > 0 ? (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {generatedPages.map((page, idx) => {
                    const isActive = activeGeneratedPageIndex === idx;
                    const pageDef = currentTemplate.pages?.find(p => p.id === page.templatePageId) || currentTemplate;
                    
                    // Check if all image regions are filled
                    const imageRegions = pageDef.regions?.filter(r => r.type === 'image') || [];
                    const filledImages = imageRegions.filter(r => {
                      const imgObj = page.dynamicImages[r.id];
                      return imgObj && !!imgObj.url;
                    }).length;
                    const isFullyFilled = filledImages === imageRegions.length;

                    return (
                      <div
                        key={page.id}
                        onClick={() => {
                          setActiveGeneratedPageIndex(idx);
                          setSelectedNodeId(null);
                        }}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
                          isActive
                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Mini Number Badge */}
                          <div className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 truncate block">
                              {page.name || `${idx + 1}. Sayfa`}
                            </span>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {/* Fill status */}
                              {imageRegions.length > 0 ? (
                                <span className={`text-[9.5px] font-bold ${isFullyFilled ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}`}>
                                  {filledImages}/{imageRegions.length} Görsel
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-slate-500 font-semibold">Sadece Metin</span>
                              )}
                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                              <span className="text-[9.5px] text-slate-600 truncate max-w-[80px] font-medium font-mono">
                                ID: {page.id.split('-')[1]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (Direct Single Export) */}
                        <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              exportSingleHighResPage(page, idx);
                            }}
                            className="p-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition cursor-pointer shadow-sm group-hover:scale-105"
                            title="Sadece bu sayfayı yüksek çözünürlükte indir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-700/60 rounded-2xl bg-slate-800/30">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Aktif sayfa bulunmuyor</p>
                  <p className="text-[10px] text-slate-600 mt-1 font-semibold">Fotoğrafları yükleyerek ilk sayfaları üretebilirsiniz.</p>
                </div>
              )}
            </div>
          </div>

          {/* PRINT & EXPORT PANEL */}
          <div className="pt-5 border-t border-slate-800 space-y-4">
            
            <div className="space-y-3">
              <span className="section-header">İHRACAT STANDARTLARI</span>
              
              {/* Output format selectors */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('png')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    exportFormat === 'png'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  PNG (Kusursuz)
                </button>
                <button
                  onClick={() => setExportFormat('jpeg')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    exportFormat === 'jpeg'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  JPEG (Sıkışmış)
                </button>
              </div>

              {/* Scale DPI multipliers */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Çözünürlük Kalitesi</span>
                  <span className="font-mono text-slate-400">
                    {exportScale === 1 ? '72 DPI (Web)' : exportScale === 1.5 ? '150 DPI (Önizleme)' : '300 DPI (Baskı)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'Web (1x)', val: 1.0 },
                    { label: 'Yüksek (1.5x)', val: 1.5 },
                    { label: 'Baskı (2x)', val: 2.0 }
                  ].map(sc => (
                    <button
                      key={sc.val}
                      onClick={() => setExportScale(sc.val)}
                      className={`py-1 rounded text-[10px] border transition cursor-pointer ${
                        exportScale === sc.val
                          ? 'bg-slate-800 border-indigo-500 text-indigo-400 font-bold'
                          : 'bg-slate-900/30 border-slate-850 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Core download action */}
            <div className="space-y-2">
              <button
                onClick={exportHighResGraphic}
                disabled={isExporting || isExportingZip}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/10 transition cursor-pointer disabled:opacity-55"
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                    <span>Grafik İşleniyor (300 DPI)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{generatedPages.length > 0 ? 'Tüm Sayfaları Sırayla İndir' : 'Grafik Üret ve İndir'}</span>
                  </>
                )}
              </button>

              {generatedPages.length > 0 && (
                <button
                  onClick={exportHighResZip}
                  disabled={isExporting || isExportingZip}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-55"
                >
                  {isExportingZip ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>ZIP Hazırlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4 h-4 text-white" />
                      <span>Çoklu Şablonu ZIP Olarak İndir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Footer Signature */}
          <div className="pt-4 text-center border-t border-slate-800 shrink-0">
            <span className="text-[9px] font-bold text-slate-600 font-mono tracking-widest uppercase">
              GRAFİK OTOMASYON MOTORU © 2026
            </span>
          </div>

        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div id="mobile-nav-bar" className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-2 z-30 shrink-0 select-none" style={{ boxShadow: '0 -1px 0 rgba(99,102,241,0.1)' }}>
        <button
          onClick={() => setMobileView('editor')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-4 py-2 rounded-xl ${
            mobileView === 'editor' 
              ? 'text-indigo-400 font-bold bg-indigo-500/15 shadow-lg shadow-indigo-500/10' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">Şablon</span>
        </button>

        <button
          onClick={() => setMobileView('canvas')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-4 py-2 rounded-xl ${
            mobileView === 'canvas'
              ? 'text-indigo-400 font-bold bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Tuval</span>
        </button>

        <button
          onClick={() => setMobileView('export')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-4 py-2 rounded-xl ${
            mobileView === 'export'
              ? 'text-emerald-400 font-bold bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px]">Aktar</span>
        </button>
      </div>

      {/* CUSTOM CONFIRM DIALOG MODAL */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  {confirmDialog.type === 'warning' ? (
                    <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  ) : confirmDialog.type === 'info' ? (
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Info className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </span>
                  )}
                  <span>{confirmDialog.title}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="flex space-x-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                >
                  {confirmDialog.cancelText || 'İptal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className={`px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer transition ${
                    confirmDialog.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : confirmDialog.type === 'info'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {confirmDialog.confirmText || 'Evet, Sil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* iOS IMAGE DOWNLOAD OVERLAY MODAL */}
      <AnimatePresence>
        {iosExportImages && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col my-8"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-100">
                      Görselleri Albüme Kaydet
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                      iOS kısıtlamaları nedeniyle çoklu indirmeler albüme otomatik kaydedilemez.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIosExportImages(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* IOS SAVE INSTRUCTION ALERT */}
              <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/20 rounded-xl p-4 mb-4 text-xs space-y-2 leading-relaxed text-left">
                <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10px]">⚠️ Albüme Fotoğraf Olarak Kaydetme Adımları:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Aşağıdaki görsellerden kaydetmek istediğinizin üzerine <strong className="text-white bg-indigo-500/20 px-1 py-0.5 rounded">basılı tutun (uzun basın)</strong>.</li>
                  <li>Açılan menüden <strong className="text-white">"Fotoğraflara Ekle"</strong> veya <strong className="text-white">"Görüntüyü Kaydet"</strong> seçeneğini seçin.</li>
                  <li>Görsel anında telefonunuzun fotoğraf albümüne eklenecektir. Her sayfa için bu işlemi tekrarlayın.</li>
                </ol>
              </div>

              {/* IMAGE SCROLLABLE LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {iosExportImages.map((img, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-300">{img.name}</span>
                      <span className="text-[9px] font-mono text-slate-500">Uzun Basıp Kaydedin</span>
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800/80 group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-contain pointer-events-auto select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-100 flex items-center justify-center transition pointer-events-none">
                        <span className="text-[10px] text-white font-extrabold bg-slate-900/80 px-2 py-1 rounded-full border border-slate-800/80 flex items-center space-x-1.5">
                          <Smartphone className="w-3 h-3 text-indigo-400 animate-pulse" />
                          <span>Görsele Basılı Tutun</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIosExportImages(null)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer transition shadow-lg shadow-indigo-600/10"
                >
                  Tamam, Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
