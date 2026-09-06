import { describeGoogleLoginError } from './lib/authErrors';
import { getAiTextFields, requestAiText } from './utils/aiText';
import { MediaDownloaderDialog } from './components/MediaDownloaderDialog';
import { LandingPage } from './components/LandingPage';
import { createExportAsset, safeFileName } from './utils/exportAssets';
import { storeVideo, getVideoUrl, replaceVideoUrls } from './lib/mediaStore';
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
  WandSparkles,
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
  RefreshCw,
  Moon,
  Sun,
  Wrench,
  Video,
  Music,
  ExternalLink,
  Film,
  Copy,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// JSZip is dynamically imported when needed for better performance

import { DesignTemplate, TextStyle, Region, FixedElement, GraphicData, TemplatePage, SequenceMediaItem } from './types';
import { TEMPLATE_PRESETS } from './presets';
import { renderTemplateToCanvas } from './canvasRenderer';
import { isMediaVideo, extractVideoSnapshot, createSequenceMediaItem } from './utils/mediaUtils';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { TemplateThumbnail } from './components/TemplateThumbnail';
import { useProjectPages } from './hooks/useProjectPages';
import { storage } from './lib/storage';
import './workspace.css';
import { CanvasVideoOverlay } from './components/CanvasVideoOverlay';

const INITIAL_FALLBACK_TEMPLATE: DesignTemplate = {
  id: 'default-template-1',
  name: 'Yeni Özel Şablon #1',
  width: 1080,
  height: 1080,
  backgroundColor: '#1D1D1F',
  palette: {
    primary: '#FF6B1A',
    accent: '#FF9F0A',
    text: '#F5F5F7',
    bg: '#1D1D1F'
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
        color: '#F5F5F7',
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

  }, [template, page, activeTab, paletteOverrides, isActive, width, height, highlightColor]);

  const hasVideoInStatic = useMemo(() => {
    const images = activeTab === 'phase1' ? {} : page.dynamicImages || {};
    return Object.values(images).some((img: any) => img?.isVideo);
  }, [page, activeTab]);

  if (isActive) return null;

  return (
    <div 
      onClick={onClick}
      className="absolute inset-0 cursor-pointer hover:ring-4 hover:ring-[#FF6B1A] rounded-lg transition duration-200 overflow-hidden bg-[#252528] select-none"
    >
      <canvas
        ref={localCanvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
      {hasVideoInStatic && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold flex items-center gap-1 shadow-md pointer-events-none z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>MP4</span>
        </div>
      )}
      <div className="absolute inset-0 bg-[#1D1D1F]/10 hover:bg-transparent transition flex items-center justify-center opacity-0 hover:opacity-100 duration-200">
        <span className="bg-[#1D1D1F]/90 text-[rgba(255,255,255,0.95)] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg select-none">
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
        className="w-4 h-4 rounded-full bg-[#252528] hover:bg-[#2C2C2E] text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] flex items-center justify-center text-[10px] font-extrabold border border-[rgba(255,255,255,0.08)] cursor-pointer transition focus:outline-none"
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
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 w-56 p-2.5 bg-[#1D1D1F] text-[rgba(255,255,255,0.95)] text-[10px] leading-normal rounded-lg shadow-xl font-medium text-center pointer-events-none"
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
            color: t.palette?.text || '#1D1D1F',
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
            color: t.palette?.text || '#1D1D1F',
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
          backgroundColor: '#252528',
          opacity: 1,
          borderColor: t.palette?.primary || '#FF6B1A',
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
            color: t.palette?.text || '#1D1D1F',
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
  // --- DARK MODE STATE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return storage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      storage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      storage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- STATE MANAGEMENT ---
  const [templates, setTemplatesState] = useState<DesignTemplate[]>(() => {
    // 1. Try to load complete list (v2) first
    const savedV2 = storage.getItem('active_templates_v2');
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
    const savedV1 = storage.getItem('custom_templates');
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
    return structuredClone(TEMPLATE_PRESETS);
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
    mode?: 'drag' | 'resize' | 'image-pan';
    resizeHandle?: 'TL' | 'TR' | 'BL' | 'BR';
    startWidth?: number;
    startHeight?: number;
  } | null>(null);

  type ProjectSnapshot = { templates: DesignTemplate[]; graphicData: Record<string, GraphicData>; pages: any[]; templateId: string };
  const [undoStack, setUndoStack] = useState<ProjectSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectSnapshot[]>([]);
  const historyRef = useRef<ProjectSnapshot | null>(null);
  const restoringHistory = useRef(false);
  const templatesRef = useRef(templates);
  templatesRef.current = templates;
  const setTemplates = (value: React.SetStateAction<DesignTemplate[]>) => {
    const next = typeof value === 'function' ? value(templatesRef.current) : value;
    templatesRef.current = next;
    setTemplatesState(next);
  };
  const restoreSnapshot = (snapshot: ProjectSnapshot) => {
    restoringHistory.current = true;
    storage.setItem('project_dirty', 'true');
    templatesRef.current = snapshot.templates;
    setTemplatesState(snapshot.templates);
    setGraphicData(snapshot.graphicData);
    setGeneratedPages(snapshot.pages);
    setSelectedNodeId(null);
    setEditingImageRegionId(null);
  };
  const handleUndo = () => {
    if (!undoStack.length || !historyRef.current) return;
    setRedoStack(r => [...r, historyRef.current!]);
    setUndoStack(u => u.slice(0, -1));
    restoreSnapshot(undoStack[undoStack.length - 1]);
  };
  const handleRedo = () => {
    if (!redoStack.length || !historyRef.current) return;
    setUndoStack(u => [...u, historyRef.current!]);
    setRedoStack(r => r.slice(0, -1));
    restoreSnapshot(redoStack[redoStack.length - 1]);
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
  });

  const [currentTemplateId, setCurrentTemplateId] = useState<string>(() => {
    const remembered = storage.getItem('active_template_id');
    if (templates.some(t => t.id === remembered)) return remembered!;
    const savedV2 = storage.getItem('active_templates_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    const savedV1 = storage.getItem('custom_templates');
    if (savedV1) {
      try {
        const parsed = JSON.parse(savedV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    return TEMPLATE_PRESETS[0].id;
  });
  const [user, setUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');
  const [firestoreQuotaExceeded, setFirestoreQuotaExceededState] = useState<boolean>(() => {
    return storage.getItem('firestore_quota_exceeded') === 'true';
  });

  const setFirestoreQuotaExceeded = (value: boolean) => {
    setFirestoreQuotaExceededState(value);
    if (value) {
      storage.setItem('firestore_quota_exceeded', 'true');
    } else {
      storage.removeItem('firestore_quota_exceeded');
    }
  };
  const [iosExportImages, setIosExportImages] = useState<{ url: string; name: string }[] | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(true);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
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

  // --- ARAÇLAR & YOUTUBE MEDYA İNDİRİCİ STATE & HANDLERS ---
  const [isToolsModalOpen, setIsToolsModalOpen] = useState<boolean>(false);
  const [ytUrl, setYtUrl] = useState<string>('');
  const [ytInfo, setYtInfo] = useState<{
    videoId: string;
    title: string;
    author: string;
    thumbnail: string;
    maxThumbnail?: string;
  } | null>(null);
  const [ytLoading, setYtLoading] = useState<boolean>(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytFormat, setYtFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [ytDownloading, setYtDownloading] = useState<boolean>(false);
  const [ytDownloadResult, setYtDownloadResult] = useState<{
    downloadUrl: string;
    quality: string;
  } | null>(null);
  const [recentDownloads, setRecentDownloads] = useState<Array<{
    title: string;
    format: string;
    date: string;
    url: string;
    thumbnail: string;
  }>>(() => {
    try {
      const saved = storage.getItem('yt_recent_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleFetchYtInfo = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : ytUrl).trim();
    if (!targetUrl) {
      setYtError('Lütfen geçerli bir YouTube video adresi girin.');
      setYtInfo(null);
      return;
    }

    setYtLoading(true);
    setYtError(null);
    setYtDownloadResult(null);

    try {
      const res = await fetch('/api/yt-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const data = await res.json();
      if (data.success) {
        setYtInfo({
          videoId: data.videoId,
          title: data.title,
          author: data.author,
          thumbnail: data.thumbnail,
          maxThumbnail: data.maxThumbnail
        });
      } else {
        setYtError(data.error || 'Video bilgileri alınamadı.');
        setYtInfo(null);
      }
    } catch (err: any) {
      setYtError('Sunucuya bağlanırken bir hata oluştu: ' + (err.message || String(err)));
      setYtInfo(null);
    } finally {
      setYtLoading(false);
    }
  };

  const handleStartYtDownload = async () => {
    if (!ytUrl.trim()) {
      setYtError('Lütfen geçerli bir YouTube video adresi girin.');
      return;
    }

    setYtDownloading(true);
    setYtError(null);
    setYtDownloadResult(null);

    try {
      const res = await fetch('/api/yt-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: ytUrl.trim(),
          format: ytFormat,
          title: ytInfo?.title || 'youtube-media'
        })
      });

      const data = await res.json();
      if (data.success && data.downloadUrl) {
        setYtDownloadResult({
          downloadUrl: data.downloadUrl,
          quality: data.quality
        });

        // Trigger native direct browser file download
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `${ytInfo?.title || 'youtube-media'}.${ytFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Save to recent downloads
        const newItem = {
          title: ytInfo?.title || 'YouTube Medya',
          format: ytFormat.toUpperCase(),
          date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          url: data.downloadUrl,
          thumbnail: ytInfo?.thumbnail || `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`
        };
        setRecentDownloads(prev => {
          const updated = [newItem, ...prev.filter(i => i.url !== newItem.url)].slice(0, 8);
          storage.setItem('yt_recent_downloads', JSON.stringify(updated));
          return updated;
        });

      } else {
        setYtError(data.error || 'İndirme başlatılamadı.');
      }
    } catch (err: any) {
      setYtError('İndirme sırasında hata oluştu: ' + (err.message || String(err)));
    } finally {
      setYtDownloading(false);
    }
  };

  const handleClearYtHistory = () => {
    setRecentDownloads([]);
    storage.removeItem('yt_recent_downloads');
  };

  const currentTemplate = useMemo(() => {
    const raw = templates.find(t => t.id === currentTemplateId) || templates[0] || INITIAL_FALLBACK_TEMPLATE;
    return ensureMultiPageSupport(raw);
  }, [templates, currentTemplateId]);

  useEffect(() => { storage.setItem('active_template_id', currentTemplateId); }, [currentTemplateId]);
  useEffect(() => {
    setActivePageIndex(0);
    setActiveGeneratedPageIndex(0);
    setSelectedNodeId(null);
    setEditingImageRegionId(null);
    setPlayingVideoRegionId(null);
  }, [currentTemplateId]);

  // Active production data
  const [graphicData, setGraphicData] = useState<Record<string, GraphicData>>(() => {
    const savedLocal = storage.getItem('active_graphic_data');
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
    const defaultTemplates = templates;
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
    setActiveTab(targetTab);
  };

  // --- MULTI-PAGE TEMPLATE AND COLLAGE AUTOMATION STATES ---
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [generatedPages, setGeneratedPages, pagesByTemplate, setPagesByTemplate] = useProjectPages(currentTemplateId);
  const [activeGeneratedPageIndex, setActiveGeneratedPageIndex] = useState<number>(0);

  useEffect(() => {
    if (isDragging) return;
    const snapshot = { templates, graphicData, pages: generatedPages, templateId: currentTemplateId };
    const previous = historyRef.current;
    if (restoringHistory.current) {
      restoringHistory.current = false;
    } else if (previous && previous.templateId !== currentTemplateId) {
      setUndoStack([]);
      setRedoStack([]);
    } else if (previous && (previous.templates !== templates || previous.graphicData !== graphicData || previous.pages !== generatedPages)) {
      storage.setItem('project_dirty', 'true');
      setUndoStack(u => [...u, previous].slice(-50));
      setRedoStack([]);
    }
    historyRef.current = snapshot;
  }, [templates, graphicData, generatedPages, currentTemplateId, isDragging]);

  useEffect(() => {
    let cancelled = false;
    const ids = new Set<string>();
    const collect = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.mediaId) ids.add(node.mediaId);
      Object.values(node).forEach(collect);
    };
    collect(graphicData);
    collect(generatedPages);
    if (!ids.size) return;
    Promise.all([...ids].map(async id => [id, await getVideoUrl(id)] as const)).then(entries => {
      if (cancelled) return;
      const urls = new Map(entries.filter((entry): entry is readonly [string, string] => !!entry[1]));
      const nextData = replaceVideoUrls(graphicData, urls);
      const nextPages = replaceVideoUrls(generatedPages, urls);
      if (nextData !== graphicData || nextPages !== generatedPages) {
        restoringHistory.current = true;
        if (nextData !== graphicData) setGraphicData(nextData);
        if (nextPages !== generatedPages) setGeneratedPages(nextPages);
      }
    });
    return () => { cancelled = true; };
  }, [graphicData, generatedPages]);

  // --- IN-CANVAS VIDEO PLAYBACK STATES ---
  const [playingVideoRegionId, setPlayingVideoRegionId] = useState<string | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Auto-reset video playback when switching pages, tabs, or templates
  useEffect(() => {
    setPlayingVideoRegionId(null);
  }, [activeGeneratedPageIndex, activePageIndex, activeTab, currentTemplateId]);

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
    const pageWithFallback = ensureMultiPageSupport(currentTemplate);
    const pages = pageWithFallback.pages || [];
    const fallbackPage: TemplatePage = {
      id: 'fallback-page',
      name: currentTemplate.name || 'Sayfa',
      regions: currentTemplate.regions || [],
      fixedElements: currentTemplate.fixedElements || []
    };
    if (activeTab === 'phase1') {
      return pages[activePageIndex] || pages[0] || fallbackPage;
    } else {
      const pageId = activePageData?.templatePageId;
      return pages.find(p => p.id === pageId) || pages[0] || fallbackPage;
    }
  }, [currentTemplate, activeTab, activePageIndex, activePageData?.templatePageId]);

  const editingTemplate = useMemo(() => {
    const page = activeTab === 'phase1' ? activeTemplatePage : activePageData;
    return {...currentTemplate,
      backgroundImageUrl: page.backgroundImageUrl ?? activeTemplatePage.backgroundImageUrl ?? currentTemplate.backgroundImageUrl,
      regions: page.regions ?? activeTemplatePage.regions ?? currentTemplate.regions,
      fixedElements: page.fixedElements ?? activeTemplatePage.fixedElements ?? currentTemplate.fixedElements,
    };
  }, [currentTemplate, activeTemplatePage, activeTab, activePageData]);

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportScale, setExportScale] = useState<number>(1.5); // 1.5x, 2x for DPI
  const [exportFiles, setExportFiles] = useState<{url:string; name:string; type:string}[]>([]);
  const exportUrls = useRef<string[]>([]);
  useEffect(() => () => exportUrls.current.forEach(url => URL.revokeObjectURL(url)), []);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});

  // AI Content Assistant
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiCollageBrief, setAiCollageBrief] = useState<string>('');
  const [aiTextTarget, setAiTextTarget] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNoticeLocation, setAiNoticeLocation] = useState<'all' | 'fields'>('fields');
  const aiRequestRef = useRef<AbortController | null>(null);
  useEffect(() => {
    aiRequestRef.current?.abort();
    aiRequestRef.current = null;
    setAiTextTarget(null);
    setAiError(null);
    setAiSuccessMessage(null);
    return () => { aiRequestRef.current?.abort(); };
  }, [currentTemplateId, activePageData.id, activeTab, currentTemplate.aiSystemPrompt]);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string | null>(null);

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
  const [exportPanelOpen, setExportPanelOpen] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    const onError = () => setStorageError('Tarayıcı depolaması dolu veya kullanılamıyor. Son değişiklikler kaydedilemedi.');
    window.addEventListener('workspace-storage-error', onError);
    return () => window.removeEventListener('workspace-storage-error', onError);
  }, []);
  const [mobileView, setMobileView] = useState<'editor' | 'canvas' | 'export'>('canvas');
  const [expandedImageSettings, setExpandedImageSettings] = useState<Record<string, boolean>>({});

  // --- GLOBAL HIGHLIGHT/ACCENT (VURGU) COLOR STATE ---
  const [vurguColor, setVurguColor] = useState<string>(() => {
    return storage.getItem('vurgu_color') || '#FF6B1A';
  });

  const handleVurguColorChange = (color: string) => {
    setVurguColor(color);
    storage.setItem('vurgu_color', color);
  };

  // --- CANVAS ZOOM & PAN STATES ---
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [canvasWidth, setCanvasWidth] = useState(480);
  useEffect(() => {
    const viewport = document.getElementById('canvas-viewport');
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => setCanvasWidth(Math.max(160, entry.contentRect.width - 48)));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isAppLoaded, mobileView]);
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
  }, [editingTemplate, activeTab, activePageData, activeGraphicData.paletteOverrides, showGrid, showSafeMargins, selectedNodeId, vurguColor, editingImageRegionId, isAppLoaded, mobileView]);

  // --- FIREBASE CLOUD STORAGE INTEGRATION & SYNCING ---
  const lastSavedRef = useRef<string>('');

  const syncAndLoadUserData = async (uid: string) => {
    if (!isValidConfig) return;
    if (firestoreQuotaExceeded) { setCloudStatus('offline'); return; }
    const beforeLoad = historyRef.current;
    setCloudStatus('syncing');
    try {
      const saved = await getUserGraphicProject(uid);
      // A background read must never overwrite work changed on this device.
      if (storage.getItem('project_dirty') === 'true' || historyRef.current !== beforeLoad) {
        setIsCloudSynced(false);
        setCloudStatus('idle');
        return;
      }
      if (!saved) { setIsCloudSynced(false); setCloudStatus('idle'); return; }
      const legacyTemplates = Array.isArray(saved.templates) && saved.templates.length ? [] : await getCloudTemplates();
      if (historyRef.current !== beforeLoad || auth.currentUser?.uid !== uid) {
        setIsCloudSynced(false);
        setCloudStatus('idle');
        return;
      }
      const nextTemplates = Array.isArray(saved.templates) && saved.templates.length
        ? saved.templates : [...TEMPLATE_PRESETS, ...legacyTemplates];
      const nextId = nextTemplates.some(t => t.id === saved.currentTemplateId) ? saved.currentTemplateId : nextTemplates[0].id;
      const nextData = saved.graphicData || {};
      const nextPages = saved.pagesByTemplate || {[nextId]:saved.generatedPages || []};
      restoringHistory.current = true;
      setTemplatesState(nextTemplates);
      setGraphicData(nextData);
      setPagesByTemplate(nextPages);
      setCurrentTemplateId(nextId);
      setUndoStack([]);
      setRedoStack([]);
      lastSavedRef.current = JSON.stringify(nextTemplates);
      lastSavedProjectRef.current = JSON.stringify({graphicData:nextData, pagesByTemplate:nextPages});
      storage.setItem('project_dirty', 'false');
      setIsCloudSynced(true);
      setCloudStatus('synced');
    } catch (error) {
      console.error('Cloud load failed:', error);
      setCloudStatus('error');
      setIsCloudSynced(false);
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

  // Save a complete user-owned snapshot in one document. Loading never writes or deletes remote data.
  const saveDataToCloud = async (
    specificTemplates?: DesignTemplate[] | any,
    specificTemplateId?: string,
    specificGraphicData?: Record<string, GraphicData> | any,
    specificGeneratedPages?: any[]
  ) => {
    if (!isValidConfig || !user?.uid || cloudStatus === 'syncing') return;
    const templatesToSave = Array.isArray(specificTemplates) ? specificTemplates : templates;
    const id = typeof specificTemplateId === 'string' ? specificTemplateId : currentTemplateId;
    const data = specificGraphicData && !('nativeEvent' in specificGraphicData) ? specificGraphicData : graphicData;
    const allPages = {...pagesByTemplate, [id]:Array.isArray(specificGeneratedPages) ? specificGeneratedPages : generatedPages};
    const savedTemplates = JSON.stringify(templatesToSave);
    const savedProject = JSON.stringify({graphicData:data, pagesByTemplate:allPages});
    const beforeSave = historyRef.current;
    setCloudStatus('syncing');
    try {
      await saveUserGraphicProject(user.uid, id, data, allPages[id], templatesToSave, allPages);
      lastSavedRef.current = savedTemplates;
      lastSavedProjectRef.current = savedProject;
      const unchanged = historyRef.current === beforeSave;
      storage.setItem('project_dirty', unchanged ? 'false' : 'true');
      setIsCloudSynced(unchanged);
      setCloudStatus('synced');
    } catch (error) {
      console.error('Cloud save failed:', error);
      setCloudStatus('error');
      setIsCloudSynced(false);
      setConfirmDialog({isOpen:true, title:'Buluta kaydedilemedi', message:'Çalışmanız bu cihazda duruyor. Bağlantınızı ve hesabınızı kontrol edip tekrar deneyin. Büyük medya içeren projeler bulut boyut sınırını aşabilir.', type:'info', onConfirm:() => setConfirmDialog(null)});
    }
  };
  useEffect(() => {
    if (!user?.uid || !isLoadedRef.current) return;
    setIsCloudSynced(
      JSON.stringify(templates) === lastSavedRef.current &&
      JSON.stringify({graphicData, pagesByTemplate}) === lastSavedProjectRef.current
    );
  }, [templates, graphicData, pagesByTemplate, user]);

  // Automatic background synchronization has been removed in favor of manual saves.
  // Data is only persisted to the cloud when the user explicitly clicks "Buluta Kaydet".

  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const googleLoginPending = useRef(false);
  const handleGoogleLogin = async () => {
    if (googleLoginPending.current) return;
    googleLoginPending.current = true;
    setIsGoogleSigningIn(true);
    setCloudStatus('syncing');
    isLoadedRef.current = false;
    try {
      setFirestoreQuotaExceeded(false); // Reset quota limit warning on login to allow retrying sync
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        // onAuthStateChanged owns the cloud load.
      }
    } catch (err) {
      console.error('Google Login error:', err);
      const notice = describeGoogleLoginError(err, window.location.hostname);
      setCloudStatus(notice ? 'error' : 'idle');
      if (notice) setConfirmDialog({isOpen:true, type:'info', ...notice, onConfirm:() => setConfirmDialog(null)});
    } finally {
      googleLoginPending.current = false;
      setIsGoogleSigningIn(false);
      isLoadedRef.current = true;
      setIsAppLoaded(true);
    }
  };

  const handleLogout = async () => {
    setCloudStatus('syncing');
    try {
      await logoutUser();
      setUser(null);
      setCloudStatus('offline');
    } catch (err) {
      console.error('Logout error:', err);
      setCloudStatus('error');
    }
  };

  // Save custom templates to localStorage
  const saveTemplatesToLocalStorage = (updatedTemplates: DesignTemplate[]) => {
    storage.setItem('active_templates_v2', JSON.stringify(updatedTemplates));
    const customs = updatedTemplates.filter(t => !TEMPLATE_PRESETS.some(p => p.id === t.id));
    storage.setItem('custom_templates', JSON.stringify(customs));
  };

  useEffect(() => { saveTemplatesToLocalStorage(templates); }, [templates]);

  // Instant local storage cache for active graphic project to prevent data loss on page reloads/exit
  useEffect(() => {
    try {
      if (Object.keys(graphicData).length > 0) {
        storage.setItem('active_graphic_data', JSON.stringify(graphicData));
      }
    } catch (e) {
      console.warn('LocalStorage active_graphic_data save skipped (quota limit):', e);
    }
  }, [graphicData]);

  useEffect(() => {
    try {
      if (generatedPages.length > 0) {
        storage.setItem('active_generated_pages', JSON.stringify(generatedPages));
      } else {
        storage.removeItem('active_generated_pages');
      }
    } catch (e) {
      console.warn('LocalStorage active_generated_pages save skipped (quota limit):', e);
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
      const current = prev[currentTemplateId] || activeGraphicData;
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

  const updateActiveImageProp = (regionId: string, prop: keyof GraphicData['dynamicImages'][string], value: any) => {
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
      const current = prev[currentTemplateId] || activeGraphicData;
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
      const current = prev[currentTemplateId] || activeGraphicData;
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
    return new Promise((resolve, reject) => {
      const img = new Image();
      const cleanup = () => { clearTimeout(timer); img.onload = null; img.onerror = null; };
      const timer = setTimeout(() => { cleanup(); img.src = ''; reject(new Error('Görsel hazırlanamadı.')); }, 5000);
      img.onload = () => {
        try {
          const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Görsel hazırlanamadı.');
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (error) { reject(error); }
        finally { cleanup(); }
      };
      img.onerror = () => { cleanup(); reject(new Error('Görsel açılamadı.')); };
      img.src = dataUrl;
    });
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

  const generateMultiPageSequence = (mediaItems: (SequenceMediaItem | string)[]) => {
    if (mediaItems.length === 0) return;

    // Normalize items into SequenceMediaItem
    const normalizedItems: SequenceMediaItem[] = mediaItems.map((item, idx) => {
      if (typeof item === 'string') {
        const isVid = isMediaVideo(item);
        return {
          id: `media-${idx}-${Date.now()}`,
          type: isVid ? 'video' : 'image',
          url: item,
          thumbnailUrl: item
        };
      }
      return item;
    });

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

    // --- PAGE 1: COVER PAGE ---
    const firstItem = normalizedItems[0];
    const coverTexts = { ...activeGraphicData.dynamicTexts };
    const coverImages: any = {};

    const coverImgRegions = coverPageDef.regions.filter(r => isTemplateImageFrame(r));
    if (coverImgRegions.length > 0) {
      coverImages[coverImgRegions[0].id] = {
        url: firstItem.thumbnailUrl || firstItem.url,
        videoUrl: firstItem.type === 'video' ? firstItem.url : undefined,
        isVideo: firstItem.type === 'video',
        mediaId: firstItem.mediaId,
        duration: firstItem.duration,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      };
    }

    newGeneratedPages.push({
      id: `generated-cover-${Date.now()}`,
      templatePageId: coverPageDef.id,
      name: firstItem.type === 'video' ? 'Kapak Sayfası (Video)' : (coverPageDef.name || 'Kapak Sayfası'),
      dynamicTexts: coverTexts,
      dynamicImages: coverImages,
      hiddenElements: []
    });

    // --- REMAINING MEDIA (Collage & Video Pages) ---
    const remainingItems = normalizedItems.slice(1);
    
    if (remainingItems.length > 0) {
      let itemIdx = 0;
      let pageCount = 1;

      while (itemIdx < remainingItems.length) {
        const currentItem = remainingItems[itemIdx];

        // If the item is a VIDEO, assign to a dedicated 1-image/video page so it remains full aspect ratio!
        if (currentItem.type === 'video') {
          const pageImages: any = {};
          const pageTexts = { ...activeGraphicData.dynamicTexts };
          const imageRegions = oneImagePageDef.regions.filter(r => isTemplateImageFrame(r));

          if (imageRegions.length > 0) {
            pageImages[imageRegions[0].id] = {
              url: currentItem.thumbnailUrl || currentItem.url,
              videoUrl: currentItem.url,
              mediaId: currentItem.mediaId,
              isVideo: true,
              duration: currentItem.duration,
              scale: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
          }
          itemIdx++;

          newGeneratedPages.push({
            id: `generated-video-${oneImagePageDef.id}-${pageCount}-${Date.now()}`,
            templatePageId: oneImagePageDef.id,
            name: `${pageCount + 1}. Sayfa (Video)`,
            dynamicTexts: pageTexts,
            dynamicImages: pageImages,
            hiddenElements: []
          });
          pageCount++;
          continue;
        }

        // If current item is an IMAGE:
        // Check if next item is also an IMAGE for 2-image collage
        const itemsLeft = remainingItems.length - itemIdx;
        const nextItem = itemsLeft > 1 ? remainingItems[itemIdx + 1] : null;

        if (itemsLeft === 1 || (nextItem && nextItem.type === 'video')) {
          // Only 1 image left OR the next item is a video -> put into 1-image page
          const pageImages: any = {};
          const pageTexts = { ...activeGraphicData.dynamicTexts };
          const imageRegions = oneImagePageDef.regions.filter(r => isTemplateImageFrame(r));

          if (imageRegions.length > 0) {
            pageImages[imageRegions[0].id] = {
              url: currentItem.thumbnailUrl || currentItem.url,
              scale: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
          }
          itemIdx++;

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
          // 2 images in sequence -> place into 2-image collage
          const pageImages: any = {};
          const pageTexts = { ...activeGraphicData.dynamicTexts };
          const imageRegions = twoImagePageDef.regions.filter(r => isTemplateImageFrame(r));

          let processedCount = 0;
          for (let i = 0; i < imageRegions.length; i++) {
            if (i >= 2) break;
            if (itemIdx < remainingItems.length && remainingItems[itemIdx].type === 'image') {
              const imgItem = remainingItems[itemIdx];
              pageImages[imageRegions[i].id] = {
                url: imgItem.thumbnailUrl || imgItem.url,
                scale: 1.0,
                offsetX: 0,
                offsetY: 0,
                rotation: 0
              };
              itemIdx++;
              processedCount++;
            }
          }

          if (processedCount === 0 && itemIdx < remainingItems.length) {
            itemIdx++;
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
    setAiSuccessMessage(`Başarıyla ${newGeneratedPages.length} sayfa otomatik üretildi! Fotoğraflar ve MP4 videolar uygun şablon sayfalarına yerleştirildi.`);
  };

  const handleMultiMediaFiles = async (files: FileList | File[]) => {
    if (isAiLoading) return;
    let fileList = Array.from(files).filter(f => f.type.startsWith('image/') || isMediaVideo(f));
    if (fileList.length === 0) {
      alert('Lütfen resim veya MP4 video dosyaları seçin!');
      return;
    }

    if (fileList.length > 25) {
      alert('Maksimum 25 adet dosya yükleyebilirsiniz. İlk 25 dosyanız işleme alınacaktır.');
      fileList = fileList.slice(0, 25);
    }

    setIsAiLoading(true);
    try {
      const mediaItems: SequenceMediaItem[] = [];
      for (const file of fileList) {
        const item = await createSequenceMediaItem(file);
        mediaItems.push(item);
      }

      generateMultiPageSequence(mediaItems);
    } catch (err) {
      console.error('Medyalar işlenirken hata oluştu:', err);
      alert('Dosyalar işlenirken bir hata oluştu.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMultiImageFiles = handleMultiMediaFiles;

  const applyPaletteOverride = (key: 'primary' | 'accent' | 'text' | 'bg' | 'boldHighlight', color: string) => {
    setGraphicData(prev => {
      const current = prev[currentTemplateId] || activeGraphicData;
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
      const current = prev[currentTemplateId] || activeGraphicData;
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
      primary: '#FF6B1A',
      accent: '#FF9F0A',
      text: '#1D1D1F',
      bg: '#1D1D1F',
      boldHighlight: '#FF6B1A'
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
    if (activeTab !== 'phase1' && generatedPages.length) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, [prop]: value} : node)
      } : page));
      return;
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id) {
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
    if (activeTab !== 'phase1' && generatedPages.length) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, ...updates} : node)
      } : page));
      return;
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id) {
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
            if (p.id === activeTemplatePage.id) {
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
    if (activeTab !== 'phase1' && generatedPages.length) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, textStyle: {...node.textStyle, [prop]: value}} : node)
      } : page));
      return;
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id) {
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
    if (activeTab !== 'phase1' && generatedPages.length) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {...page,
        fixedElements: (page.fixedElements ?? editingTemplate.fixedElements).map(node => node.id === elementId ? {...node, [prop]: value} : node)
      } : page));
      return;
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id) {
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
    if (activeTab !== 'phase1' && generatedPages.length) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {...page,
        fixedElements: (page.fixedElements ?? editingTemplate.fixedElements).map(node => node.id === elementId ? {...node, textStyle: {...node.textStyle, [prop]: value}} : node)
      } : page));
      return;
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id) {
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
      backgroundColor: '#1D1D1F',
      palette: {
        primary: '#FF6B1A',
        accent: '#FF9F0A',
        text: '#F5F5F7',
        bg: '#1D1D1F'
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
            color: '#F5F5F7',
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
          backgroundColor: 'rgba(255,255,255,0.08)',
          opacity: 1,
          borderColor: '#FF6B1A',
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
            color: '#FF6B1A',
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
        const deletedIds = JSON.parse(storage.getItem('deleted_template_ids') || '[]');
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          storage.setItem('deleted_template_ids', JSON.stringify(deletedIds));
        }

        // Delete from Firestore if it was a custom template saved to cloud
        if (isValidConfig && !firestoreQuotaExceeded) {
          deleteCloudTemplate(id).then(() => {
            // Remove from deletion queue on successful deletion
            const currentDeleted = JSON.parse(storage.getItem('deleted_template_ids') || '[]');
            const updatedDeleted = currentDeleted.filter((item: string) => item !== id);
            storage.setItem('deleted_template_ids', JSON.stringify(updatedDeleted));
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
          color: currentTemplate.palette?.text || '#1D1D1F',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
          color: currentTemplate.palette?.text || '#1D1D1F',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
          color: currentTemplate.palette?.text || '#1D1D1F',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
        backgroundColor: '#252528',
        opacity: 1,
        borderColor: currentTemplate.palette?.primary || '#FF6B1A',
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
          color: currentTemplate.palette?.text || '#1D1D1F',
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
          color: currentTemplate.palette?.text || '#1D1D1F',
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
        color: '#1D1D1F',
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
      backgroundColor: 'rgba(255,255,255,0.08)',
      opacity: 1,
      borderColor: '#FF6B1A',
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
        color: '#FF6B1A',
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
        color: 'rgba(255,255,255,0.72)',
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
      backgroundColor: '#FF9F0A'
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
        const deletedIds = JSON.parse(storage.getItem('deleted_template_ids') || '[]');
        customs.forEach(t => {
          if (!deletedIds.includes(t.id)) {
            deletedIds.push(t.id);
          }
        });
        storage.setItem('deleted_template_ids', JSON.stringify(deletedIds));

        if (isValidConfig && !firestoreQuotaExceeded) {
          customs.forEach(t => {
            deleteCloudTemplate(t.id).then(() => {
              // Remove from deletion queue on successful deletion
              const currentDeleted = JSON.parse(storage.getItem('deleted_template_ids') || '[]');
              const updatedDeleted = currentDeleted.filter((id: string) => id !== t.id);
              storage.setItem('deleted_template_ids', JSON.stringify(updatedDeleted));
            }).catch(err => {
              console.error('Failed to delete cloud template during reset:', err);
            });
          });
        }
        storage.removeItem('custom_templates');
        storage.removeItem('active_templates_v2');
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
      let newOffsetX = Math.round(ref.startX + dx);
      let newOffsetY = Math.round(ref.startY + dy);

      // Görselin pan (kaydırma) sınırlarını hesaplama ve clamp işlemi (bölge dışına çıkmayı önleme)
      const region = editingTemplate.regions.find(r => r.id === ref.elementId);
      const imgData = activePageData.dynamicImages[ref.elementId];
      if (region && imgData && imgData.url) {
        const img = new Image();
        img.src = imgData.url; // Tarayıcı önbelleğinden hızlıca gelir
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const regRatio = region.width / region.height;
          let drawWidth, drawHeight;
          
          // Cover mantığıyla çizim boyutlarını hesapla
          if (imgRatio > regRatio) {
            drawHeight = region.height;
            drawWidth = region.height * imgRatio;
          } else {
            drawWidth = region.width;
            drawHeight = region.width / imgRatio;
          }
          
          const scaleFactor = imgData.scale || 1.0;
          const finalDrawWidth = drawWidth * scaleFactor;
          const finalDrawHeight = drawHeight * scaleFactor;

          // Kayabilecek maksimum offset miktarları
          const maxOffsetX = Math.max(0, (finalDrawWidth - region.width) / 2);
          const maxOffsetY = Math.max(0, (finalDrawHeight - region.height) / 2);

          // Sınırları uygulama
          if (newOffsetX > maxOffsetX) newOffsetX = Math.round(maxOffsetX);
          if (newOffsetX < -maxOffsetX) newOffsetX = Math.round(-maxOffsetX);
          if (newOffsetY > maxOffsetY) newOffsetY = Math.round(maxOffsetY);
          if (newOffsetY < -maxOffsetY) newOffsetY = Math.round(-maxOffsetY);
        }
      }

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
    dragStartRef.current = null;
    setIsDragging(false);
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

  const handleImageFile = async (file: File, regionId: string) => {
    if (isMediaVideo(file)) {
      try {
        const { thumbnailUrl, duration } = await extractVideoSnapshot(file);
        const stored = await storeVideo(file);
        const videoBlobUrl = stored.url;
        updateActiveImageProp(regionId, 'mediaId', stored.id);
        updateActiveImageProp(regionId, 'url', thumbnailUrl);
        updateActiveImageProp(regionId, 'videoUrl', videoBlobUrl);
        updateActiveImageProp(regionId, 'isVideo', true);
        updateActiveImageProp(regionId, 'duration', duration);
      } catch (err) {
        console.warn('Video karesi çıkarılamadı:', err);
        setConfirmDialog({isOpen: true, title: 'Video yüklenemedi', message: 'Bu video tarayıcıda açılamadı. MP4 veya WebM biçiminde başka bir dosya deneyin.', type: 'info', onConfirm: () => setConfirmDialog(null)});
      }
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim veya MP4 video dosyası seçin!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateActiveImageProp(regionId, 'url', event.target.result as string);
        updateActiveImageProp(regionId, 'mediaId', undefined);
        updateActiveImageProp(regionId, 'isVideo', false);
        updateActiveImageProp(regionId, 'videoUrl', undefined);
        updateActiveImageProp(regionId, 'duration', undefined);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate only requested text fields on the captured page; never change the palette.
  const triggerAiGenerator = async (regionId?: string) => {
    if (aiRequestRef.current || isAiLoading) return;
    const context = getAiTextFields(editingTemplate.regions, activePageData.dynamicTexts);
    const fields = regionId ? context.filter(f => f.id === regionId) : context;
    if (!fields.length) { setAiError('Bu sayfada üretilecek dinamik metin alanı yok.'); return; }
    const controller = new AbortController();
    aiRequestRef.current = controller;
    setAiTextTarget(regionId || 'all');
    setAiNoticeLocation(regionId ? 'fields' : 'all');
    setAiError(null);
    setAiSuccessMessage(null);
    const templateId = currentTemplateId;
    const pageId = generatedPages[activeGeneratedPageIndex]?.id;
    const timeout = setTimeout(() => controller.abort(new Error('timeout')), 60000);
    try {
      let image: string | undefined;
      const uploaded = Object.values(activePageData.dynamicImages || {}).find((item: any) => item?.url?.startsWith('data:image')) as any;
      if (uploaded) {
        try { image = await compressDataUrl(uploaded.url, 360, 360, 0.6); } catch { /* Text context remains sufficient. */ }
      }
      if (controller.signal.aborted) throw controller.signal.reason;
      const texts = await requestAiText({
        systemPrompt:currentTemplate.aiSystemPrompt || '', templateName:currentTemplate.name,
        brief:aiCollageBrief, fields, context, ...(image ? {image} : {}),
      }, controller.signal);
      if (controller.signal.aborted || aiRequestRef.current !== controller) return;
      if (pageId) {
        setGeneratedPages(pages => pages.map(page => page.id === pageId
          ? {...page, dynamicTexts:{...page.dynamicTexts, ...texts}} : page), templateId);
      } else {
        setGraphicData(prev => ({...prev, [templateId]:{
          ...(prev[templateId] || activeGraphicData),
          dynamicTexts:{...(prev[templateId]?.dynamicTexts || activeGraphicData.dynamicTexts), ...texts},
        }}));
      }
      setAiSuccessMessage(regionId ? `${fields[0].name} şablon promptuna göre oluşturuldu.` : 'Bu sayfanın metinleri şablon promptuna göre oluşturuldu.');
    } catch (error) {
      if (aiRequestRef.current === controller) {
        setAiError(controller.signal.aborted ? 'AI isteği zaman aşımına uğradı. Tekrar deneyin; metinleriniz korundu.' :
          error instanceof Error ? error.message : 'AI bağlantısı kurulamadı. Tekrar deneyin.');
      }
    } finally {
      clearTimeout(timeout);
      if (aiRequestRef.current === controller) {
        aiRequestRef.current = null;
        setAiTextTarget(null);
      }
    }
  };

  // All export paths use the same page resolver and renderer.
  const publishExport = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    exportUrls.current.push(url);
    setExportFiles(prev => [...prev, {url, name, type:blob.type}]);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const resetExportResults = () => {
    exportUrls.current.forEach(url => URL.revokeObjectURL(url));
    exportUrls.current = [];
    setExportFiles([]);
  };
  const exportPages = async (pages: any[], asZip = false) => {
    if (isExporting || isExportingZip) return;
    resetExportResults();
    setIsExporting(!asZip);
    setIsExportingZip(asZip);
    try {
      const zip = asZip ? new (await import('jszip')).default() : null;
      for (const [index, page] of pages.entries()) {
        setExportStatusText(`${index + 1} / ${pages.length} sayfa hazırlanıyor…`);
        const {blob, extension} = await createExportAsset(currentTemplate, page, {
          format:exportFormat, scale:exportScale, highlightColor:vurguColor,
          paletteOverrides:activeGraphicData.paletteOverrides,
          onProgress: percent => setExportStatusText(`${index + 1}. sayfa · %${percent}`),
        });
        const name = `${safeFileName(currentTemplate.name)}_${index + 1}.${extension}`;
        if (zip) zip.file(name, blob);
        else publishExport(blob, name);
      }
      if (zip) publishExport(await zip.generateAsync({type:'blob'}), `${safeFileName(currentTemplate.name)}.zip`);
    } catch (error) {
      setConfirmDialog({isOpen:true, title:'Dışa aktarma tamamlanamadı',
        message:error instanceof Error ? error.message : 'Dosya hazırlanırken bir hata oluştu. Tekrar deneyin.',
        type:'info', onConfirm:() => setConfirmDialog(null)});
    } finally {
      setIsExporting(false);
      setIsExportingZip(false);
      setExportStatusText(null);
    }
  };
  const exportSingleHighResPage = (page: any, _index: number) => exportPages([page]);
  const exportHighResGraphic = () => {
    if (activeTab === 'phase1') return exportPages([{
      templatePageId:activeTemplatePage.id, regions:editingTemplate.regions,
      fixedElements:editingTemplate.fixedElements, backgroundImageUrl:editingTemplate.backgroundImageUrl,
      dynamicTexts:{}, dynamicImages:{},
    }]);
    return exportPages(generatedPages.length ? generatedPages : [activePageData]);
  };
  const exportHighResZip = () => exportPages(generatedPages.length ? generatedPages : [activePageData], true);

  // --- PALETTE PRESETS ---
  const PALETTE_PRESETS = [
    { name: 'Kozmik Mürekkep', primary: '#A394F5', accent: '#F2BE6A', text: '#F5F3FF', bg: '#202033' },
    { name: 'Doğal Toprak', primary: '#FF9F0A', accent: '#FF9F0A', text: 'rgba(255,255,255,0.72)', bg: '#252528' },
    { name: 'Sanal Neon', primary: '#FF6B1A', accent: '#FF6B1A', text: 'rgba(255,255,255,0.95)', bg: '#1D1D1F' },
    { name: 'Minimalist Kömür', primary: '#A6ABB8', accent: '#D9DCE4', text: '#F5F5F7', bg: '#252528' },
    { name: 'Canlı Nar', primary: '#FF453A', accent: '#FF9F0A', text: '#F5F5F7', bg: '#252528' },
    { name: 'Sakin Orman', primary: '#34C759', accent: '#FF9F0A', text: '#F5F5F7', bg: '#252528' }
  ];

  if (!isAppLoaded) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="flex flex-col items-center z-10">
          <div className="w-12 h-12 rounded-[14px] bg-[#1d1d1f] flex items-center justify-center text-[rgba(255,255,255,0.95)] font-extrabold text-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-6">
            G
          </div>
          <div className="w-[140px] h-[3px] bg-black/5 rounded-full overflow-hidden relative mb-3">
            <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-[#1d1d1f] rounded-full animate-[loading-bar_1.8s_infinite_ease-in-out]" style={{ animation: 'loading-bar 1.8s infinite ease-in-out' }} />
          </div>
          <p className="text-[13px] font-medium text-[rgba(255,255,255,0.72)] tracking-tight animate-[pulse_2s_infinite_ease-in-out]">
            {user ? 'Verileriniz eşitleniyor...' : 'Uygulama hazırlanıyor...'}
          </p>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }


  // --- LANDING PAGE ---
  if (showLandingPage) {
    return <LandingPage onEnter={() => setShowLandingPage(false)} onLogin={handleGoogleLogin} />;
  }

  return (
    <div id="graphics-engine-app" data-export-open={exportPanelOpen} className="h-[100dvh] bg-[#1D1D1F] dark:bg-[#1D1D1F] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-sans flex flex-col selection:bg-[#FF6B1A] selection:text-[rgba(255,255,255,0.95)] overflow-hidden relative transition-colors duration-300">
      <WorkspaceHeader
        templateName={currentTemplate.name}
        isDark={isDarkMode} onTheme={() => setIsDarkMode(v => !v)}
        userName={user && !user.isAnonymous ? user.displayName || 'Hesabım' : null}
        cloudStatus={cloudStatus} isCloudSynced={isCloudSynced}
        onLogin={handleGoogleLogin} onLogout={handleLogout} isSigningIn={isGoogleSigningIn}
        onSave={() => saveDataToCloud()} onTools={() => setIsToolsModalOpen(true)}
        onExport={() => { setMobileView('export'); setExportPanelOpen(v => window.matchMedia('(max-width: 1023px)').matches ? true : !v); }}
        exportPanelOpen={exportPanelOpen}
      />
      {storageError && <div className="workspace-warning" role="alert">{storageError} Çalışmanızı indirin veya buluta kaydedin.</div>}
      {/* CLOUD QUOTA EXCEEDED WARNING BANNER */}
      {firestoreQuotaExceeded && (
        <div className="bg-[#FF9F0A]/10 dark:bg-[#2C2C2E]/30 border-b border-[#FF9F0A]/20 px-4 py-2 sm:px-6 flex items-center justify-between gap-3 text-[#FF9F0A] z-40 transition-colors">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#FF9F0A] animate-pulse" />
            <span>
              <strong>Yerel Çalışma Modu (Bulut Kotası Sınırı):</strong> Veritabanı kotası sınırına ulaşıldığı için tasarımlarınız anlık olarak tarayıcınızın <strong>yerel depolama</strong> alanına kaydedilmektedir. Kesintisiz bir şekilde tasarımlarınızı düzenlemeye, görseller yüklemeye ve indirmeye devam edebilirsiniz! Tarayıcı verilerini silmeden önce çalışmanızı yedekleyin.
            </span>
          </div>
          <button 
            onClick={() => setFirestoreQuotaExceeded(false)}
            className="text-xs font-bold text-[#FF9F0A] hover:text-[#FF9F0A] px-2 py-1 rounded bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 transition shrink-0"
          >
            Anladım
          </button>
        </div>
      )}

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#1D1D1F] dark:bg-[#1D1D1F] transition-colors duration-300">
        
        {/* LEFT COLUMN: EDITOR CONTROL CENTER */}
        <div id="editor-controls" className={`w-full lg:w-[480px] bg-[#252528] dark:bg-[#252528] lg:rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)] lg:mb-2 lg:ml-2 flex-1 flex flex-col z-20 shrink-0 overflow-hidden transition-colors duration-300 ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          
          <nav className="workspace-tabs" aria-label="Çalışma modu">
            {([{id: 'presets', label: 'Şablonlar', icon: LayoutTemplate}, {id: 'phase2', label: 'İçerik', icon: Sparkles}, {id: 'phase1', label: 'Tasarım', icon: Sliders}] as const).map(item => (
              <button key={item.id} aria-pressed={activeTab === item.id} onClick={() => handleTabChange(item.id)}><item.icon size={16}/>{item.label}</button>
            ))}
          </nav>
          <div className="workspace-panel-heading">
            <span className="workspace-eyebrow">ÇALIŞMA ALANI</span>
            <h2>{activeTab === 'presets' ? 'Bir fikirle başla.' : activeTab === 'phase1' ? 'Her detay senin.' : 'İçeriğini oluştur.'}</h2>
            <p>{activeTab === 'presets' ? 'Bir şablon seç veya kendi tasarımını kur.' : activeTab === 'phase1' ? 'Katmanları, yerleşimi ve renkleri düzenle.' : 'Metin ve medyanı ekle, tasarımına hayat ver.'}</p>
          </div>
          {/* TAB SCROLLABLE BODY */}
          <div className="workspace-panel-body flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* TAB 1: PRESETS & SELECTION */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-wider text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase">ŞABLON KATALOĞU</h3>
                  <button
                    onClick={createNewTemplate}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#FF6B1A] hover:bg-[#FF6B1A] text-[rgba(255,255,255,0.95)] text-xs font-bold shadow-sm shadow-[rgba(255,107,26,0.2)]/10 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Özel Şablon Ekle</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {templates.map(temp => {
                    const isCustom = !TEMPLATE_PRESETS.some(p => p.id === temp.id);
                    const isSelected = temp.id === currentTemplateId;
                    const isEditing = editingTemplateId === temp.id;
                    
                    return (
                      <div
                        key={temp.id}
                        role="button" tabIndex={0} aria-label={`${temp.name} şablonunu seç`} aria-pressed={isSelected}
                        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setCurrentTemplateId(temp.id); setSelectedNodeId(null); } }}
                        onClick={() => {
                          if (!isEditing) {
                            setCurrentTemplateId(temp.id);
                            setSelectedNodeId(null);
                          }
                        }}
                        className={`template-card group relative p-4 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#252528]/40 dark:bg-[#252528]/60 border-[#FF6B1A] dark:border-[#FF6B1A]/50 shadow-md ring-1 ring-[#FF6B1A]/10'
                            : 'bg-[#252528] dark:bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/50 shadow-sm'
                        }`}
                      >
                        {!isEditing && <TemplateThumbnail template={temp} />}
                        {isEditing ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-2">
                              <span className="text-[11px] font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] uppercase tracking-wider">Şablon Düzenle</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#252528] dark:bg-[#2C2C2E]/30 text-[#FF9F0A] dark:text-[#FF9F0A] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]">DÜZENLEME MODU</span>
                            </div>
                            
                            <div>
                              <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Şablon Adı</label>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-full bg-[#1D1D1F] dark:bg-[#1D1D1F]/50 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] dark:focus:ring-[#FF6B1A] font-medium"
                                placeholder="Şablon İsmi"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Genişlik (px)</label>
                                <input
                                  type="number"
                                  value={editingWidth}
                                  onChange={(e) => setEditingWidth(parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#1D1D1F] dark:bg-[#1D1D1F]/50 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] dark:focus:ring-[#FF6B1A] font-mono"
                                  min={200}
                                  max={3000}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yükseklik (px)</label>
                                <input
                                  type="number"
                                  value={editingHeight}
                                  onChange={(e) => setEditingHeight(parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#1D1D1F] dark:bg-[#1D1D1F]/50 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] dark:focus:ring-[#FF6B1A] font-mono"
                                  min={200}
                                  max={3000}
                                />
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-1.5 justify-end border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                              <button
                                onClick={() => setEditingTemplateId(null)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#252528] dark:bg-[#2C2C2E] hover:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] text-[11px] font-semibold cursor-pointer transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>İptal</span>
                              </button>
                              <button
                                onClick={() => saveInlineTemplateEdit(temp.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#34C759] hover:bg-[#34C759] text-[rgba(255,255,255,0.95)] text-[11px] font-semibold cursor-pointer transition shadow-sm shadow-[rgba(52,199,89,0.2)]"
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
                                <h4 className="font-bold text-sm text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] group-hover:text-[rgba(255,255,255,0.95)] dark:group-hover:text-[#FF6B1A] transition">
                                  {temp.name}
                                </h4>
                                <p className="text-xs text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] mt-1 flex items-center space-x-2 font-medium">
                                  <span>{temp.width} × {temp.height} px</span>
                                  <span>•</span>
                                  <span className="font-mono text-[11px]">{temp.regions.length} Alan</span>
                                  <span>•</span>
                                  <span className="font-mono text-[11px]">{temp.fixedElements.length} Sabit</span>
                                </p>
                              </div>

                              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                {isCustom ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#252528] dark:bg-[#2C2C2E]/30 text-[#FF9F0A] dark:text-[#FF9F0A] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] font-bold">
                                    KULLANICI
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#252528] dark:bg-[#2C2C2E]/30 text-[#FF6B1A] dark:text-[#FF6B1A] border border-[rgba(255,255,255,0.08)] dark:border-[#FF6B1A] font-bold">
                                    HAZIR ŞABLON
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action row at the bottom of the card */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]" onClick={(e) => e.stopPropagation()}>
                              {/* Left side: color palette preview */}
                              <div className="flex items-center space-x-1.5">
                                <span className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-sm" style={{ backgroundColor: temp.palette.primary }} />
                                <span className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-sm" style={{ backgroundColor: temp.palette.accent }} />
                                <span className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-sm" style={{ backgroundColor: temp.palette.bg }} />
                                <span className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium ml-1">Renkler</span>
                              </div>

                              {/* Right side: Action buttons */}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentTemplateId(temp.id);
                                    setSelectedNodeId(null);
                                    setActiveTab('phase1');
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 rounded bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#FF6B1A] dark:hover:bg-[#FF6B1A] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] text-[11px] font-semibold transition cursor-pointer"
                                  title="Şablon Tasarımı Düzenle"
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
                                  className="flex items-center space-x-1 px-2 py-1 rounded bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] text-[11px] font-semibold transition cursor-pointer"
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
                                  className="p-1 rounded bg-[#1D1D1F] dark:bg-[#3A3A3C] hover:bg-[#252528] dark:hover:bg-[#2C2C2E]/40 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:text-[#FF453A] dark:hover:text-[#FF453A] transition cursor-pointer border border-transparent hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)]"
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
              <div className="space-y-6">
                
                {/* Şablon Tasarım Başlığı ve Kapatma Butonu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1D1D1F] dark:bg-[#1D1D1F]/50 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wider">Modül Modu</span>
                    <span className="text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)]">Şablon Tasarımı</span>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {isValidConfig && user && user.uid && (
                      <button
                        type="button"
                        onClick={saveDataToCloud}
                        disabled={cloudStatus === 'syncing'}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isCloudSynced
                            ? 'bg-[#252528] text-[#34C759] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)]'
                            : 'bg-[#FF9F0A] hover:bg-[#FF9F0A] text-[rgba(255,255,255,0.95)] shadow-sm shadow-[rgba(255,159,10,0.2)] animate-pulse'
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
                            <Check className="w-3.5 h-3.5 text-[#34C759] font-extrabold" />
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
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#2C2C2E] dark:bg-[#2C2C2E] hover:bg-[#303033] dark:hover:bg-[#3A3A3C] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-xs font-bold cursor-pointer transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Geri Dön</span>
                    </button>
                  </div>
                </div>
                
                {/* Şablon Sayfaları Seçici */}
                <div className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <h4 className="text-xs font-bold text-[rgba(255,255,255,0.72)] tracking-wider uppercase">ŞABLON SAYFALARI</h4>
                      <InfoTooltip text="Şablonunuz birden çok sayfadan oluşabilir. Her sayfa için farklı bir görsel düzeni (Kapak, 1, 2 veya 3 Görselli vb.) seçerek, çoklu resim yüklediğinizde resimlerin otomatik yerleşimini sağlayabilirsiniz." />
                    </div>
                    <span className="text-[10px] bg-[#252528] text-[#FF6B1A] px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {(currentTemplate.pages || []).length} Sayfa
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {(currentTemplate.pages || []).map((page, idx) => {
                      const isActive = activePageIndex === idx;
                      const imageCount = page.regions.filter(r => isTemplateImageFrame(r)).length;

                      let roleBadgeText = 'Özel';
                      let roleBadgeColor = 'bg-[#252528] text-[rgba(255,255,255,0.95)]';
                      if (page.pageRole === 'cover') {
                        roleBadgeText = 'Kapak';
                        roleBadgeColor = 'bg-[#252528] text-[#FF453A] border border-[rgba(255,255,255,0.08)]';
                      } else if (page.pageRole === '1-image') {
                        roleBadgeText = '1 Görsel';
                        roleBadgeColor = 'bg-[#252528] text-[#34C759] border border-[rgba(255,255,255,0.08)]';
                      } else if (page.pageRole === '2-image') {
                        roleBadgeText = '2 Görsel';
                        roleBadgeColor = 'bg-[#252528] text-[#FF6B1A] border border-[rgba(255,255,255,0.08)]';
                      } else if (page.pageRole === '3-image') {
                        roleBadgeText = '3 Görsel';
                        roleBadgeColor = 'bg-[#252528] text-[#FF9F0A] border border-[rgba(255,255,255,0.08)]';
                      }

                      return (
                        <div
                          key={page.id}
                          className={`rounded-lg border p-3 transition ${
                            isActive
                              ? 'border-[#FF6B1A] bg-[#252528]/20 dark:bg-[#252528]/40 shadow-sm'
                              : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] bg-[#1D1D1F]/40 dark:bg-[#252528]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePageIndex(idx);
                                setSelectedNodeId(null);
                              }}
                              className="flex-1 text-left font-bold text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] flex items-center space-x-1.5 cursor-pointer focus:outline-none"
                            >
                              <span className="text-[10px] font-mono text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]">#{idx + 1}</span>
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
                                  className="p-1 rounded text-[rgba(255,255,255,0.72)] hover:text-[#FF453A] hover:bg-[#252528] transition cursor-pointer"
                                  title="Sayfayı Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]/60 space-y-2.5">
                              <div>
                                <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold block mb-1">SAYFA İSMİ</label>
                                <input
                                  type="text"
                                  value={page.name}
                                  onChange={(e) => handlePagePropertyChange(idx, 'name', e.target.value)}
                                  className="w-full bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium focus:outline-none focus:border-[#FF6B1A]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold block mb-1">GÖRSELLİK / ŞABLON ROLÜ</label>
                                <select
                                  value={page.pageRole || 'custom'}
                                  onChange={(e) => handlePagePropertyChange(idx, 'pageRole', e.target.value)}
                                  className="w-full bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-semibold cursor-pointer focus:outline-none focus:border-[#FF6B1A]"
                                >
                                  <option value="cover">Kapak Sayfası (Cover Page)</option>
                                  <option value="1-image">Tek Görselli Kolaj (1-Image Collage)</option>
                                  <option value="2-image">2 Görselli Kolaj (2-Image Collage)</option>
                                  <option value="3-image">3 Görselli Kolaj (3-Image Collage)</option>
                                  <option value="custom">Özel/Diğer (Custom Layout)</option>
                                </select>
                              </div>

                              <div className="text-[9px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between">
                                <span>Bu sayfadaki dinamik görsel alanı sayısı:</span>
                                <span className="font-bold text-[rgba(255,255,255,0.72)]">{imageCount} adet</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Yeni Sayfa Ekleme Kontrolleri */}
                  <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block mb-2">YENİ SAYFA EKLE</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('1-image')}
                        className="py-1.5 px-2 bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#303033]/80 dark:hover:bg-[#3A3A3C]/80 text-[#FF6B1A] dark:text-[rgba(255,255,255,0.95)] rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tek Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('2-image')}
                        className="py-1.5 px-2 bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#303033]/80 dark:hover:bg-[#3A3A3C]/80 text-[#FF6B1A] dark:text-[rgba(255,255,255,0.95)] rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ 2 Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('3-image')}
                        className="py-1.5 px-2 bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#303033]/80 dark:hover:bg-[#3A3A3C]/80 text-[#FF6B1A] dark:text-[rgba(255,255,255,0.95)] rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ 3 Görselli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewTemplatePage('cover')}
                        className="py-1.5 px-2 bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#303033]/80 dark:hover:bg-[#3A3A3C]/80 text-[#FF6B1A] dark:text-[rgba(255,255,255,0.95)] rounded text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Kapak</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold leading-relaxed">
                    Kullanıcı çoklu fotoğraf yüklediğinde, sistem fotoğrafları yukarıda seçtiğiniz şablon rollerine (Kapak, Tek, 2 Görsel vb.) göre otomatik yerleştirir.
                  </p>
                </div>
                
                {/* Şablon Genel Ayarları */}
                <div className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-[rgba(255,255,255,0.72)] tracking-wider uppercase">1. ŞABLON BOYUT & TUVAL</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Şablon İsmi</label>
                      <input
                        type="text"
                        value={currentTemplate.name}
                        onChange={(e) => handleTemplatePropertyChange('name', e.target.value)}
                        className="w-full bg-[#1D1D1F] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6B1A]" />
                        <span>Kurumsal Dil / AI Prompt</span>
                      </label>
                      <textarea
                        value={currentTemplate.aiSystemPrompt || ''}
                        onChange={(e) => handleTemplatePropertyChange('aiSystemPrompt', e.target.value)}
                        placeholder="Örn: Genç ve samimi bir ton kullan, emojiler ekle, lüks marka dili, ingilizce yaz vb."
                        rows={2}
                        className="w-full bg-[#1D1D1F] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Genişlik (px)</label>
                        <input
                          type="number"
                          value={currentTemplate.width}
                          min={200}
                          max={3000}
                          onChange={(e) => handleTemplatePropertyChange('width', parseInt(e.target.value) || 1080)}
                          className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] font-mono text-[rgba(255,255,255,0.95)] font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yükseklik (px)</label>
                        <input
                          type="number"
                          value={currentTemplate.height}
                          min={200}
                          max={3000}
                          onChange={(e) => handleTemplatePropertyChange('height', parseInt(e.target.value) || 1080)}
                          className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] font-mono text-[rgba(255,255,255,0.95)] font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Tuval Varsayılan Arka Planı</label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.backgroundColor.startsWith('#') ? currentTemplate.backgroundColor : '#252528'}
                          onChange={(e) => handleTemplatePropertyChange('backgroundColor', e.target.value)}
                          className="w-10 h-8 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentTemplate.backgroundColor}
                          onChange={(e) => handleTemplatePropertyChange('backgroundColor', e.target.value)}
                          className="flex-1 bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5 text-xs font-mono text-[rgba(255,255,255,0.95)] focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A] font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Hazır Şablon Arka Plan Resmi</label>
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
                          className="flex-1 text-center bg-[#1D1D1F] dark:bg-[#3A3A3C] hover:bg-[#252528] dark:hover:bg-[#3A3A3C]/80 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-2 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                          <span>{currentTemplate.backgroundImageUrl ? 'Arka Planı Değiştir' : 'Görsel Yükle (PNG/JPG)'}</span>
                        </label>
                        {currentTemplate.backgroundImageUrl && (
                          <button
                            onClick={() => handleTemplatePropertyChange('backgroundImageUrl', undefined)}
                            className="px-3 py-2 bg-[#252528] dark:bg-[#252528]/40 hover:bg-[#252528] dark:hover:bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/40 text-[#FF453A] dark:text-[#FF453A] rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
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
                          <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] space-y-1.5 text-left">
                            <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase tracking-wider block">Yüklediğiniz Diğer Görseller</span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                              {uniqueImages.map((url, i) => (
                                <div key={i} className="relative group/thumb shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTemplatePropertyChange('backgroundImageUrl', url)}
                                    className="relative w-11 h-11 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)] hover:border-[#FF6B1A] shrink-0 bg-[#252528] cursor-pointer shadow-sm transition hover:scale-105 active:scale-95 group"
                                    title="Bu görseli şablon arka planı yap"
                                  >
                                    <img src={url} alt={`Varlık ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                      <Check className="w-3.5 h-3.5 text-[rgba(255,255,255,0.95)] stroke-[3]" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeUploadedImage(url);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF453A] hover:bg-[#FF453A] text-[rgba(255,255,255,0.95)] rounded-full flex items-center justify-center shadow hover:scale-110 active:scale-90 transition z-20 cursor-pointer opacity-0 group-hover/thumb:opacity-100"
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
                <div className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-4 shadow-sm" id="custom-palette-overrides-card">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[rgba(255,255,255,0.72)] tracking-wider uppercase flex items-center space-x-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      <span>2. ŞABLON RENK PALETİ</span>
                    </span>
                    <button
                      type="button"
                      onClick={resetTemplatePalette}
                      className="text-[10px] text-[#FF453A] hover:underline font-bold cursor-pointer"
                    >
                      Varsayılana Sıfırla
                    </button>
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.72)] font-medium leading-relaxed">
                    Tasarım şablonunuzun varsayılan renklerini dilediğiniz gibi özelleştirin. Başlık ve açıklamalardaki <strong>**kalın vurgu**</strong> yazılarının rengini en alttaki seçiciden belirleyebilirsiniz. Bu renkler şablona kaydedilir.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Birincil Renk */}
                    <div className="bg-[#1D1D1F]/80 dark:bg-[#3A3A3C] p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between">
                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] font-extrabold block mb-1 uppercase tracking-wider">Birincil Renk</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.primary || '#FF6B1A'}
                          onChange={(e) => handleTemplatePaletteChange('primary', e.target.value)}
                          className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.08)] cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold uppercase">{currentTemplate.palette?.primary || '#FF6B1A'}</span>
                      </div>
                    </div>

                    {/* Vurgu Rengi */}
                    <div className="bg-[#1D1D1F]/80 dark:bg-[#3A3A3C] p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between">
                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] font-extrabold block mb-1 uppercase tracking-wider">İkincil Accent</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.accent || '#FF9F0A'}
                          onChange={(e) => handleTemplatePaletteChange('accent', e.target.value)}
                          className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.08)] cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold uppercase">{currentTemplate.palette?.accent || '#FF9F0A'}</span>
                      </div>
                    </div>

                    {/* Metin Rengi */}
                    <div className="bg-[#1D1D1F]/80 dark:bg-[#3A3A3C] p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between">
                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] font-extrabold block mb-1 uppercase tracking-wider">Metin Rengi</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.text || '#1D1D1F'}
                          onChange={(e) => handleTemplatePaletteChange('text', e.target.value)}
                          className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.08)] cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold uppercase">{currentTemplate.palette?.text || '#1D1D1F'}</span>
                      </div>
                    </div>

                    {/* Arka Plan Rengi */}
                    <div className="bg-[#1D1D1F]/80 dark:bg-[#3A3A3C] p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between">
                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] font-extrabold block mb-1 uppercase tracking-wider">Arka Plan</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentTemplate.palette?.bg || '#1D1D1F'}
                          onChange={(e) => handleTemplatePaletteChange('bg', e.target.value)}
                          className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.08)] cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold uppercase">{currentTemplate.palette?.bg || '#1D1D1F'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kalın Vurgu Yazı Rengi */}
                  <div className="bg-[#252528]/50 dark:bg-[#252528]/40 p-3 rounded-xl border border-[#FF6B1A] dark:border-[#FF6B1A]/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] block">Kalın Vurgu Yazı Rengi</span>
                      <span className="text-[10px] text-[rgba(255,255,255,0.72)] block">**kalın yazılar** bu renkle vurgulanır.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTemplate.palette?.boldHighlight || currentTemplate.palette?.primary || '#FF6B1A'}
                        onChange={(e) => handleTemplatePaletteChange('boldHighlight', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-sm cursor-pointer p-0"
                      />
                      <span className="font-mono text-xs text-[#FF6B1A] font-extrabold uppercase">
                        {currentTemplate.palette?.boldHighlight || currentTemplate.palette?.primary || '#FF6B1A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Katman & Bölge Yönetimi */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[rgba(255,255,255,0.72)] tracking-wider uppercase">3. BÖLGELER & KATMANLAR</h4>
                    
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => addNewRegion('text')}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[10px] font-extrabold cursor-pointer shadow-sm transition"
                      >
                        <Type className="w-3 h-3 text-[#FF6B1A] font-bold" />
                        <span>Metin Bölgesi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addNewRegion('image')}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] bg-[#252528] dark:bg-[#3A3A3C] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[10px] font-extrabold cursor-pointer shadow-sm transition"
                      >
                        <ImageIcon className="w-3 h-3 text-[#FF6B1A] font-bold" />
                        <span>Boş Resim</span>
                      </button>
                      <label
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] bg-[#252528] hover:bg-[#252528]/80 text-[#34C759] text-[10px] font-extrabold cursor-pointer shadow-sm transition"
                      >
                        <Upload className="w-3 h-3 text-[#34C759] font-bold" />
                        <span>PNG/Görsel Yükle</span>
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
                          className={`flex items-center justify-between p-2 rounded-lg border transition ${
                            isSelected
                              ? 'bg-[#252528] dark:bg-[#252528]/60 border-[#FF6B1A] shadow-sm'
                              : 'bg-[#252528] dark:bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] shadow-sm'
                          } ${draggedIndex === origIndex ? 'opacity-40 border-dashed' : ''}`}
                          onClick={() => setSelectedNodeId(r.id)}
                        >
                          <div className="flex items-center space-x-2 w-full min-w-0">
                            {/* Drag handle */}
                            <div 
                              className="text-[rgba(255,255,255,0.72)] cursor-grab active:cursor-grabbing p-0.5 hover:bg-[#1D1D1F] rounded shrink-0"
                              title="Sürükleyerek Sırala"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)]" />
                            </div>

                            {/* Layer type icon */}
                            <div className="shrink-0">
                              {r.type === 'text' 
                                ? <Type className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)]" /> 
                                : <ImageIcon className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)]" />
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
                                  className="w-full bg-[#1D1D1F] border border-[#FF6B1A] rounded px-1.5 py-0.5 text-xs text-[rgba(255,255,255,0.95)] font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B1A]"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="flex items-center space-x-1 group/name">
                                  <span 
                                    className="text-xs font-bold text-[rgba(255,255,255,0.95)] truncate block cursor-pointer"
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
                                    className="opacity-0 group-hover/name:opacity-100 p-0.5 text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] transition cursor-pointer"
                                    title="İsmi Düzenle"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              <span className="text-[9px] text-[rgba(255,255,255,0.72)] block font-medium truncate">
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
                              className={`p-1 rounded transition cursor-pointer ${
                                r.hidden 
                                  ? 'text-[#FF453A] hover:text-[#FF6B1A] bg-[#252528] hover:bg-[#1D1D1F]' 
                                  : 'text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] hover:bg-[#1D1D1F]'
                              }`}
                              title={r.hidden ? "Katmanı Göster (Gizli)" : "Katmanı Gizle (Görünür)"}
                            >
                              {r.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {/* Toggle lock button (Lock / Unlock) */}
                            <button
                              type="button"
                              onClick={() => handleRegionPropertyChange(r.id, 'locked', !r.locked)}
                              className={`p-1 rounded transition cursor-pointer ${
                                r.locked 
                                  ? 'text-[#FF9F0A] hover:text-[#FF6B1A] bg-[#252528] hover:bg-[#1D1D1F] font-bold' 
                                  : 'text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] hover:bg-[#1D1D1F]'
                              }`}
                              title={r.locked ? "Kilidi Aç (Kilitli)" : "Katmanı Kilitle (Seçilebilir)"}
                            >
                              {r.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            <span className="w-px h-3.5 bg-[#2C2C2E] mx-0.5" />

                            {/* Move Up in hierarchy button (moves index up in array, closer to top of list/rendering last) */}
                            <button
                              type="button"
                              disabled={origIndex === editingTemplate.regions.length - 1}
                              onClick={() => moveRegionInList(origIndex, origIndex + 1)}
                              className="text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] hover:bg-[#1D1D1F] disabled:opacity-20 disabled:pointer-events-none p-1 rounded transition cursor-pointer"
                              title="Üste Taşı"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>

                            {/* Move Down in hierarchy button (moves index down in array, closer to bottom of list/rendering first) */}
                            <button
                              type="button"
                              disabled={origIndex === 0}
                              onClick={() => moveRegionInList(origIndex, origIndex - 1)}
                              className="text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] hover:bg-[#1D1D1F] disabled:opacity-20 disabled:pointer-events-none p-1 rounded transition cursor-pointer"
                              title="Alta Taşı"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => deleteElement(r.id)}
                              className="text-[rgba(255,255,255,0.72)] hover:text-[#FF453A] hover:bg-[#252528] p-1 rounded transition cursor-pointer"
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
                      className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-md rounded-xl p-4 space-y-4"
                    >
                      {/* Check if Region or FixedElement */}
                      {(() => {
                        const region = editingTemplate.regions.find(r => r.id === selectedNodeId);
                        const fixed = editingTemplate.fixedElements.find(el => el.id === selectedNodeId);

                        if (region) {
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-2">
                                <div className="flex items-center">
                                  <h5 className="text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] uppercase">KATMAN DÜZENLEYİCİ</h5>
                                  <InfoTooltip text="Seçtiğiniz bu katmanın ekrandaki yerini (X ve Y konumları), genişlik/yükseklik boyutlarını, yazı tipini, boyutunu, rengini ve metin hiyerarşisi rollerini buradan detaylıca ayarlayabilirsiniz." />
                                </div>
                                <span className="text-[9px] bg-[#252528] dark:bg-[#252528]/60 border border-[rgba(255,255,255,0.08)] dark:border-[#FF6B1A]/50 text-[#FF6B1A] dark:text-[#FF6B1A] px-2.5 py-0.5 rounded-md font-extrabold font-mono">Dinamik</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold block mb-1">Katman Adı</label>
                                  <input
                                    type="text"
                                    value={region.name}
                                    onChange={(e) => handleRegionPropertyChange(region.id, 'name', e.target.value)}
                                    className="w-full bg-[#1D1D1F] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium focus:outline-none focus:border-[#FF6B1A]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold block mb-1">Bölge Tipi</label>
                                  <span className="w-full bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] block font-bold">
                                    {region.type === 'text' ? 'Metin Alanı' : 'Resim Alanı'}
                                  </span>
                                </div>
                              </div>

                              {/* Quick states: Hidden / Locked */}
                              <div className="flex items-center space-x-3 bg-[#1D1D1F] dark:bg-[#252528] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs justify-between">
                                <span className="font-bold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] text-[10px] uppercase">Katman Durumu:</span>
                                
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRegionPropertyChange(region.id, 'hidden', !region.hidden)}
                                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm border ${
                                      region.hidden 
                                        ? 'bg-[#252528] dark:bg-[#252528]/40 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/40 text-[#FF453A] dark:text-[#FF453A]' 
                                        : 'bg-[#252528] dark:bg-[#3A3A3C] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:bg-[#252528] dark:hover:bg-[#3A3A3C]/80'
                                    }`}
                                  >
                                    {region.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    <span>{region.hidden ? 'Gizli' : 'Görünür'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRegionPropertyChange(region.id, 'locked', !region.locked)}
                                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm border ${
                                      region.locked 
                                        ? 'bg-[#252528] dark:bg-[#252528]/40 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/40 text-[#FF9F0A] dark:text-[#FF9F0A]' 
                                        : 'bg-[#252528] dark:bg-[#3A3A3C] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:bg-[#252528] dark:hover:bg-[#3A3A3C]/80'
                                    }`}
                                  >
                                    {region.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    <span>{region.locked ? 'Kilitli' : 'Serbest'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Geometry offsets */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Konum & Boyut (X, Y, W, H)</span>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Konum X</span>
                                      <span className="font-mono text-[#FF6B1A] font-bold">{region.x}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.width}
                                      value={region.x}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'x', parseInt(e.target.value))}
                                      className="w-full accent-[#FF6B1A] cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Konum Y</span>
                                      <span className="font-mono text-[#FF6B1A] font-bold">{region.y}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.height}
                                      value={region.y}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'y', parseInt(e.target.value))}
                                      className="w-full accent-[#FF6B1A] cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Genişlik</span>
                                      <span className="font-mono text-[#FF6B1A] font-bold">{region.width}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={20}
                                      max={currentTemplate.width}
                                      value={region.width}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'width', parseInt(e.target.value))}
                                      className="w-full accent-[#FF6B1A] cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Yükseklik</span>
                                      <span className="font-mono text-[#FF6B1A] font-bold">{region.height}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={20}
                                      max={currentTemplate.height}
                                      value={region.height}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'height', parseInt(e.target.value))}
                                      className="w-full accent-[#FF6B1A] cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="pt-1.5 pb-1">
                                  <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block mb-1.5">Katmanı Ortala</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('horizontal')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>↔ Yatay</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('vertical')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>↕ Dikey</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('both')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#252528] hover:bg-[#303033] border border-[#FF6B1A] text-[#FF6B1A] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>✛ Tam</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Stylings border radius etc */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Arka Plan (Dolgu) & Çerçeve</span>

                                {region.type === 'text' && (
                                  <div className="flex items-center justify-between bg-[#252528]/50 border border-[#FF6B1A] rounded-xl p-2.5">
                                    <div className="space-y-0.5 pr-2">
                                      <span className="text-[11px] font-extrabold text-[rgba(255,255,255,0.95)] block">Metin Arka Planını Sığdır</span>
                                      <span className="text-[9px] text-[rgba(255,255,255,0.72)] block leading-tight font-medium">Arka planı başlık/metin uzunluğuna göre eş zamanlı uyarla.</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={!!region.fitBackgroundToText}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'fitBackgroundToText', e.target.checked)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-8 h-4 bg-[#2C2C2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[rgba(255,255,255,0.08)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#252528] after:border-[rgba(255,255,255,0.08)] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#FF6B1A] peer-checked:after:bg-[#252528]"></div>
                                    </label>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={region.hasBackground === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block">Arka Plan Dolgu</label>
                                      <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={region.hasBackground !== false}
                                          onChange={(e) => handleRegionPropertyChange(region.id, 'hasBackground', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-7 h-3.5 bg-[#2C2C2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[12px] peer-checked:after:border-[rgba(255,255,255,0.08)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#252528] after:border-[rgba(255,255,255,0.08)] after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[#FF6B1A] peer-checked:after:bg-[#252528]"></div>
                                      </label>
                                    </div>
                                    <div className="flex space-x-1">
                                      <input
                                        type="color"
                                        value={region.backgroundColor?.startsWith('#') ? region.backgroundColor : '#252528'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'backgroundColor', e.target.value)}
                                        className="w-8 h-7 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer"
                                        disabled={region.hasBackground === false}
                                      />
                                      <input
                                        type="text"
                                        value={region.backgroundColor || 'transparent'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'backgroundColor', e.target.value)}
                                        placeholder="transparent"
                                        className="flex-1 bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-[11px] font-mono text-[rgba(255,255,255,0.95)] font-medium"
                                        disabled={region.hasBackground === false}
                                      />
                                    </div>
                                  </div>
                                  <div className={region.hasBorder === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block">Kenarlık Rengi</label>
                                      <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={region.hasBorder !== false}
                                          onChange={(e) => handleRegionPropertyChange(region.id, 'hasBorder', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-7 h-3.5 bg-[#2C2C2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[12px] peer-checked:after:border-[rgba(255,255,255,0.08)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#252528] after:border-[rgba(255,255,255,0.08)] after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[#FF6B1A] peer-checked:after:bg-[#252528]"></div>
                                      </label>
                                    </div>
                                    <div className="flex space-x-1">
                                      <input
                                        type="color"
                                        value={region.borderColor?.startsWith('#') ? region.borderColor : '#FF6B1A'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'borderColor', e.target.value)}
                                        className="w-8 h-7 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer"
                                        disabled={region.hasBorder === false}
                                      />
                                      <input
                                        type="text"
                                        value={region.borderColor || 'transparent'}
                                        onChange={(e) => handleRegionPropertyChange(region.id, 'borderColor', e.target.value)}
                                        placeholder="transparent"
                                        className="flex-1 bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-[11px] font-mono text-[rgba(255,255,255,0.95)] font-medium"
                                        disabled={region.hasBorder === false}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className={region.hasBackground === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Köşe Yuvarlama (Radius)</label>
                                    <input
                                      type="number"
                                      value={region.borderRadius}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'borderRadius', parseInt(e.target.value) || 0)}
                                      className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                      disabled={region.hasBackground === false}
                                    />
                                  </div>
                                  <div className={region.hasBorder === false ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Kenarlık Kalınlığı</label>
                                    <input
                                      type="number"
                                      value={region.borderWidth}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'borderWidth', parseInt(e.target.value) || 0)}
                                      className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                      disabled={region.hasBorder === false}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Typography settings for Text region */}
                              {region.type === 'text' && region.textStyle && (
                                <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                                  <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">YAZITİPİ (TYPOGRAPHY) AYARLARI</span>

                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block mb-1">Metin Rolü / Hiyerarşisi</label>
                                    <select
                                      value={region.textRole || 'normal'}
                                      onChange={(e) => handleRegionPropertyChange(region.id, 'textRole', e.target.value)}
                                      className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] font-semibold cursor-pointer mb-2"
                                    >
                                      <option value="normal">Normal / Diğer Metin</option>
                                      <option value="title">Başlık (Title)</option>
                                      <option value="subtitle">Alt Başlık (Subtitle)</option>
                                      <option value="description">Açıklama (Description)</option>
                                    </select>
                                    <p className="text-[9px] text-[rgba(255,255,255,0.72)]">Yapay Zeka içeriği doldururken bu role göre başlığı, alt başlığı veya açıklamayı otomatik eşleştirecektir.</p>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block mb-1">Font Ailesi</label>
                                    <select
                                      value={region.textStyle.fontFamily}
                                      onChange={(e) => handleRegionTextStyleChange(region.id, 'fontFamily', e.target.value)}
                                      className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] font-semibold cursor-pointer"
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
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Boyutu (px)</label>
                                      <input
                                        type="number"
                                        value={region.textStyle.fontSize}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'fontSize', parseInt(e.target.value) || 24)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Rengi</label>
                                      <div className="flex space-x-1.5">
                                        <input
                                          type="color"
                                          value={region.textStyle.color.startsWith('#') ? region.textStyle.color : '#252528'}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'color', e.target.value)}
                                          className="w-8 h-7 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer shrink-0"
                                        />
                                        <input
                                          type="text"
                                          value={region.textStyle.color}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'color', e.target.value)}
                                          className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-medium"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Satır Aralığı</label>
                                      <input
                                        type="number"
                                        step={0.1}
                                        value={region.textStyle.lineHeight}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'lineHeight', parseFloat(e.target.value) || 1.2)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Kalınlığı</label>
                                      <select
                                        value={region.textStyle.fontWeight}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'fontWeight', e.target.value)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs text-[rgba(255,255,255,0.95)] font-bold cursor-pointer"
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
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Harf Boşluğu (px)</label>
                                      <input
                                        type="number"
                                        value={region.textStyle.letterSpacing ?? 0}
                                        onChange={(e) => handleRegionTextStyleChange(region.id, 'letterSpacing', parseInt(e.target.value) || 0)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Hizalama</label>
                                      <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] p-0.5 bg-[#1D1D1F] gap-0.5 h-7">
                                        <button
                                          type="button"
                                          onClick={() => handleRegionTextStyleChange(region.id, 'align', 'left')}
                                          className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                            region.textStyle.align === 'left'
                                              ? 'bg-[#252528] text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)]'
                                              : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
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
                                              ? 'bg-[#252528] text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)]'
                                              : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
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
                                              ? 'bg-[#252528] text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)]'
                                              : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
                                          }`}
                                          title="Sağa Hizala"
                                        >
                                          <AlignRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Shadow settings */}
                                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Metin Arkası Gölge (Text Shadow)</span>
                                      <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={region.textStyle.hasShadow !== false}
                                          onChange={(e) => handleRegionTextStyleChange(region.id, 'hasShadow', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-8 h-4 bg-[#2C2C2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[rgba(255,255,255,0.08)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#252528] after:border-[rgba(255,255,255,0.08)] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#FF6B1A] peer-checked:after:bg-[#252528]"></div>
                                      </label>
                                    </div>
                                    <div className={`space-y-3 ${region.textStyle.hasShadow === false ? "opacity-45 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold block mb-1">Gölge Rengi</label>
                                          <div className="flex space-x-1">
                                            <input
                                              type="color"
                                              value={region.textStyle.shadowColor?.startsWith('#') ? region.textStyle.shadowColor : 'rgba(0,0,0,0.5)'}
                                              onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowColor', e.target.value)}
                                              className="w-8 h-7 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer"
                                              disabled={region.textStyle.hasShadow === false}
                                            />
                                            <input
                                              type="text"
                                              value={region.textStyle.shadowColor || 'transparent'}
                                              onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowColor', e.target.value)}
                                              placeholder="transparent"
                                              className="flex-1 bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-[11px] font-mono text-[rgba(255,255,255,0.95)] font-medium"
                                              disabled={region.textStyle.hasShadow === false}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Gölge Dağılımı (Blur)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowBlur ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowBlur', parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">X Kayması (Offset X)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowOffsetX ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowOffsetX', parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Y Kayması (Offset Y)</label>
                                          <input
                                            type="number"
                                            value={region.textStyle.shadowOffsetY ?? 0}
                                            onChange={(e) => handleRegionTextStyleChange(region.id, 'shadowOffsetY', parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-semibold"
                                            disabled={region.textStyle.hasShadow === false}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Layer Hierarchy Reordering Controls */}
                              <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Katman Hiyerarşisi (Sıralama)</span>
                                <div className="grid grid-cols-4 gap-1.5 text-center">
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'front')}
                                    className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition shadow-sm"
                                    title="En Üste Getir"
                                  >
                                    En Üst
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'up')}
                                    className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                    title="Bir Üste Çıkar"
                                  >
                                    <ChevronUp className="w-3 h-3 text-[#FF6B1A]" />
                                    <span>Öne</span>
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'down')}
                                    className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                    title="Bir Alta İndir"
                                  >
                                    <ChevronDown className="w-3 h-3 text-[#FF6B1A]" />
                                    <span>Arka</span>
                                  </button>
                                  <button
                                    onClick={() => moveLayerOrder(region.id, 'back')}
                                    className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition shadow-sm"
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
                              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-2">
                                <h5 className="text-xs font-bold text-[#FF9F0A] uppercase">SABİT ÖĞE DÜZENLEYİCİ</h5>
                                <span className="text-[9px] bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[#FF9F0A] px-2 py-0.5 rounded-md font-extrabold">Sabit</span>
                              </div>

                              <div>
                                <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block mb-1">Katman Adı</label>
                                <input
                                  type="text"
                                  value={fixed.name}
                                  onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'name', e.target.value)}
                                  className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium"
                                />
                              </div>

                              {/* Geometry offsets */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Konum & Boyut (X, Y, W, H)</span>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Konum X</span>
                                      <span className="font-mono text-[#FF9F0A] font-bold">{fixed.x}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.width}
                                      value={fixed.x}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'x', parseInt(e.target.value))}
                                      className="w-full accent-[#FF9F0A] cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Konum Y</span>
                                      <span className="font-mono text-[#FF9F0A] font-bold">{fixed.y}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={0}
                                      max={currentTemplate.height}
                                      value={fixed.y}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'y', parseInt(e.target.value))}
                                      className="w-full accent-[#FF9F0A] cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Genişlik</span>
                                      <span className="font-mono text-[#FF9F0A] font-bold">{fixed.width}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={5}
                                      max={currentTemplate.width}
                                      value={fixed.width}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'width', parseInt(e.target.value))}
                                      className="w-full accent-[#FF9F0A] cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-semibold flex justify-between mb-1">
                                      <span>Yükseklik</span>
                                      <span className="font-mono text-[#FF9F0A] font-bold">{fixed.height}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min={2}
                                      max={currentTemplate.height}
                                      value={fixed.height}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'height', parseInt(e.target.value))}
                                      className="w-full accent-[#FF9F0A] cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="pt-1.5 pb-1">
                                  <label className="text-[10px] text-[rgba(255,255,255,0.72)] font-bold block mb-1.5">Katmanı Ortala</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('horizontal')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>↔ Yatay</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('vertical')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>↕ Dikey</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => centerSelectedLayer('both')}
                                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#252528] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] text-[#FF9F0A] transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                    >
                                      <span>✛ Tam</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Details depending on type */}
                              {fixed.type === 'shape' && (
                                <div className="space-y-3 pt-2">
                                  <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Şekil Detayları</span>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Şekil Tipi</label>
                                      <select
                                        value={fixed.shapeType}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'shapeType', e.target.value)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs text-[rgba(255,255,255,0.95)] font-bold cursor-pointer"
                                      >
                                        <option value="rect">Dikdörtgen</option>
                                        <option value="circle">Daire</option>
                                        <option value="line">Çizgi</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Dolgu Rengi</label>
                                      <input
                                        type="text"
                                        value={fixed.backgroundColor || fixed.color}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'backgroundColor', e.target.value)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-semibold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(fixed.type === 'logo' || fixed.type === 'social') && (
                                <div className="space-y-3 pt-2">
                                  <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Metin & Simge Özellikleri</span>
                                  
                                  <div>
                                    <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">İçerik Metni</label>
                                    <input
                                      type="text"
                                      value={fixed.content}
                                      onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'content', e.target.value)}
                                      className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-semibold"
                                    />
                                  </div>

                                  {fixed.type === 'social' && (
                                    <div>
                                      <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Simge Tipi</label>
                                      <select
                                        value={fixed.iconType}
                                        onChange={(e) => handleFixedElementPropertyChange(fixed.id, 'iconType', e.target.value)}
                                        className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs text-[rgba(255,255,255,0.95)] font-bold cursor-pointer"
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
                                    <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                                      <div>
                                        <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Font Ailesi</label>
                                        <select
                                          value={fixed.textStyle.fontFamily || 'Space Grotesk'}
                                          onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontFamily', e.target.value)}
                                          className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.95)] font-bold cursor-pointer"
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
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Boyutu</label>
                                          <input
                                            type="number"
                                            value={fixed.textStyle.fontSize}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontSize', parseInt(e.target.value) || 14)}
                                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Rengi</label>
                                          <div className="flex space-x-1.5">
                                            <input
                                              type="color"
                                              value={fixed.textStyle.color.startsWith('#') ? fixed.textStyle.color : '#252528'}
                                              onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'color', e.target.value)}
                                              className="w-8 h-7 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer shrink-0"
                                            />
                                            <input
                                              type="text"
                                              value={fixed.textStyle.color}
                                              onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'color', e.target.value)}
                                              className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs font-mono text-[rgba(255,255,255,0.95)] font-medium"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Yazı Kalınlığı</label>
                                          <select
                                            value={fixed.textStyle.fontWeight || 'normal'}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'fontWeight', e.target.value)}
                                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-xs text-[rgba(255,255,255,0.95)] font-bold cursor-pointer"
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
                                          <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Harf Boşluğu (px)</label>
                                          <input
                                            type="number"
                                            value={fixed.textStyle.letterSpacing ?? 0}
                                            onChange={(e) => handleFixedElementTextStyleChange(fixed.id, 'letterSpacing', parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#1D1D1F] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-xs text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium font-mono"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block mb-1 font-semibold">Hizalama</label>
                                        <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] p-0.5 bg-[#1D1D1F] dark:bg-[#252528] gap-0.5 h-7">
                                          <button
                                            type="button"
                                            onClick={() => handleFixedElementTextStyleChange(fixed.id, 'align', 'left')}
                                            className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition cursor-pointer ${
                                              fixed.textStyle.align === 'left'
                                                ? 'bg-[#252528] dark:bg-[#3A3A3C] text-[#FF6B1A] dark:text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]'
                                                : 'text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)]'
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
                                                ? 'bg-[#252528] dark:bg-[#3A3A3C] text-[#FF6B1A] dark:text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]'
                                                : 'text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)]'
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
                                                ? 'bg-[#252528] dark:bg-[#3A3A3C] text-[#FF6B1A] dark:text-[#FF6B1A] shadow-sm border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]'
                                                : 'text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)]'
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
                                  <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)] mt-3">
                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] uppercase block">Katman Hiyerarşisi (Sıralama)</span>
                                    <div className="grid grid-cols-4 gap-1.5 text-center">
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'front')}
                                        className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition shadow-sm"
                                        title="En Üste Getir"
                                      >
                                        En Üst
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'up')}
                                        className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                        title="Bir Üste Çıkar"
                                      >
                                        <ChevronUp className="w-3 h-3 text-[#FF9F0A]" />
                                        <span>Öne</span>
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'down')}
                                        className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                                        title="Bir Alta İndir"
                                      >
                                        <ChevronDown className="w-3 h-3 text-[#FF9F0A]" />
                                        <span>Arka</span>
                                      </button>
                                      <button
                                        onClick={() => moveLayerOrder(fixed.id, 'back')}
                                        className="p-1.5 bg-[#1D1D1F] hover:bg-[#252528] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-[10px] rounded text-[rgba(255,255,255,0.95)] font-bold cursor-pointer transition shadow-sm"
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
              <div className="space-y-6">

                {/* Şablon Hızlı Seçici */}
                <div className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[20px] p-4 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[rgba(255,255,255,0.72)] tracking-wide uppercase flex items-center space-x-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)]" />
                      <span>Aktif Tasarım Şablonu</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presets')}
                      className="text-[10px] text-[#FF6B1A] dark:text-[#FF6B1A] hover:text-[#FF6B1A] dark:hover:text-[#FF6B1A] font-medium flex items-center space-x-0.5 cursor-pointer transition-colors"
                    >
                      <span>Tümünü Yönet ({templates.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <select aria-label="Aktif şablon" className="w-full" value={currentTemplateId} onChange={e => setCurrentTemplateId(e.target.value)}>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* Sihirbaz Modülü */}
                <div className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 space-y-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-[#252528] dark:bg-[#252528]/60 text-[#FF6B1A] dark:text-[#FF6B1A] rounded-[10px]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] tracking-tight">Medya ve içerik</h3>
                  </div>

<details className="workspace-ai-disclosure"><summary><Sparkles size={14}/>Yapay zekâ ile metin oluştur<ChevronDown size={14}/></summary>
                  <div className="space-y-3 bg-[#1D1D1F] dark:bg-[#252528] p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wide">Gönderiden kısaca bahset</span>
                      {currentTemplate.aiSystemPrompt && (
                        <span className="text-[9px] text-[#FF6B1A] dark:text-[#FF6B1A] font-medium bg-[#252528] dark:bg-[#252528]/60 px-2 py-0.5 rounded-full">
                          Kurumsal Dil Aktif
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <textarea
                        aria-label="AI için ek not"
                        value={aiCollageBrief}
                        onChange={(e) => setAiCollageBrief(e.target.value)}
                        placeholder="Örn: 'Butiğim için yaz koleksiyonu, keten elbiseler', 'fiyat odaklı ve sıcak bir dil kullan' vb."
                        rows={2}
                        className="w-full bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)]/80 dark:border-[rgba(255,255,255,0.08)] rounded-[12px] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10 text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium resize-y transition-all placeholder:text-[rgba(255,255,255,0.72)] dark:placeholder:text-[rgba(255,255,255,0.72)]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button type="button" className="workspace-button workspace-primary"
                        disabled={aiTextTarget !== null || isAiLoading} onClick={() => triggerAiGenerator()}>
                        {aiTextTarget === 'all' ? <Loader2 size={14} className="animate-spin"/> : <WandSparkles size={14}/>}
                        {aiTextTarget === 'all' ? 'Üretiliyor…' : 'Bu sayfanın metinlerini üret'}
                      </button>
                    </div>
                  </div>

                  </details>
                  {aiNoticeLocation === 'all' && aiError && <div className="workspace-ai-notice is-error" role="alert"><AlertCircle size={16}/><span>{aiError}</span></div>}
                  {aiNoticeLocation === 'all' && aiSuccessMessage && <div className="workspace-ai-notice" role="status"><CheckCircle2 size={16}/><span>{aiSuccessMessage}</span></div>}

                  <div 
                    onDragEnter={(e) => handleDrag(e, 'multi-collage')}
                    onDragLeave={(e) => handleDrag(e, 'multi-collage')}
                    onDragOver={(e) => handleDrag(e, 'multi-collage')}
                    onDrop={handleMultiDrop}
                    className={`rounded-[16px] p-6 text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center space-y-1.5 ${
                      dragActive['multi-collage']
                        ? 'bg-[#252528]/50 dark:bg-[#252528]/40 border-2 border-[#FF6B1A] dark:border-[#FF6B1A] scale-[1.01]'
                        : 'bg-[#1D1D1F] dark:bg-[#252528] hover:bg-[#1D1D1F] dark:hover:bg-[#252528]/80 border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] border-dashed'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/mp4,video/quicktime,video/webm"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleMultiImageFiles(e.target.files);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-full bg-[#252528] dark:bg-[#3A3A3C] shadow-sm flex items-center justify-center mb-1">
                      <UploadCloud className="w-4 h-4 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                    </div>
                    <div>
                      <p className="text-[13px] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium">Fotoğraf veya MP4 Video Yükle</p>
                      <p className="text-[11px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] mt-0.5">Görselleri ve videoları sürükleyip bırakın</p>
                    </div>
                  </div>

                  {/* Eklenen Fotoğraflar Küçük Resim Gösterimi */}
                  {(() => {
                    const uniqueUrls = getUniqueUploadedImages();
                    const bgUrl = activeTemplatePage?.backgroundImageUrl || currentTemplate.backgroundImageUrl;
                    const filteredUniqueUrls = bgUrl ? uniqueUrls.filter(url => url !== bgUrl) : uniqueUrls;
                    
                    if (filteredUniqueUrls.length === 0 && !bgUrl) return null;

                    return (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wider block">Yüklenen Fotoğraflar</span>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                          {/* 1. Background Image Thumbnail (Special Highlight Styling & Undeletable) */}
                          {bgUrl && (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-[#34C759] shrink-0 shadow-md bg-[#252528]/50 group/thumb transition-all hover:scale-105" title="Arka Plan Görseli (Silinemez)">
                              <img src={bgUrl} alt="Arka Plan Görseli" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 left-0 right-0 bg-[#34C759] text-[rgba(255,255,255,0.95)] text-[8px] font-bold py-0.5 text-center uppercase tracking-wider">
                                Arka Plan
                              </span>
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#34C759] text-[rgba(255,255,255,0.95)] rounded-full flex items-center justify-center shadow">
                                <Lock className="w-2 h-2" />
                              </div>
                            </div>
                          )}

                          {/* 2. Regular User Uploaded Images */}
                          {filteredUniqueUrls.map((url, i) => (
                            <div key={i} className="relative w-14 h-14 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0 shadow-sm bg-[#252528] dark:bg-[#252528] group/thumb transition-all hover:scale-105">
                              <div className="w-full h-full rounded-lg overflow-hidden">
                                <img src={url} alt={`Yüklenen ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="absolute bottom-0 right-0 bg-[#1D1D1F]/80 dark:bg-[#252528]/80 text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[9px] font-mono px-1.5 py-0.5 rounded-tl rounded-br-lg">
                                {i + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(url)}
                                className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-[#FF453A] hover:bg-[#FF453A] text-[rgba(255,255,255,0.95)] rounded-full flex items-center justify-center shadow active:scale-90 transition z-20 cursor-pointer opacity-100 lg:opacity-0 lg:group-hover/thumb:opacity-100"
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

                    {generatedPages.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] animate-fade-in mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] flex items-center space-x-1.5">
                            <ImageIcon className="w-4 h-4 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                            <span>Üretilen Sayfalar ({generatedPages.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedPages([]);
                              setActiveGeneratedPageIndex(0);
                              setAiSuccessMessage('Sayfa akışı temizlendi.');
                            }}
                            className="text-[10px] text-[#FF453A] hover:text-[#FF453A] font-medium transition-colors"
                          >
                            Sıfırla
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {generatedPages.map((page, index) => (
                            <button
                              key={page.id}
                              type="button"
                              onClick={() => setActiveGeneratedPageIndex(index)}
                              className={`px-3.5 py-1.5 rounded-[12px] text-xs font-medium transition-all flex items-center space-x-1.5 ${
                                activeGeneratedPageIndex === index
                                  ? 'bg-[#1D1D1F] dark:bg-[#2C2C2E] text-[rgba(255,255,255,0.95)] shadow-md scale-[1.02]'
                                  : 'bg-[#1D1D1F] dark:bg-[#252528] hover:bg-[#1D1D1F] dark:hover:bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)]/60 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] shadow-sm'
                              }`}
                            >
                              <span>{page.name || (index === 0 ? 'Kapak Sayfası' : `${index}. Sayfa`)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Dinamik Alanların Düzenlenmesi (Aşama 2 Form) */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-[11px] font-medium text-[rgba(255,255,255,0.72)] tracking-wide uppercase">Metinler</h4>
                  <p className="workspace-field-hint">Alan yanındaki sihirbaz yalnızca o metni, şablon promptuna göre üretir.</p>
                  {aiNoticeLocation === 'fields' && aiError && <div className="workspace-ai-notice is-error" role="alert"><AlertCircle size={16}/><span>{aiError}</span></div>}
                  {aiNoticeLocation === 'fields' && aiSuccessMessage && <div className="workspace-ai-notice" role="status"><CheckCircle2 size={16}/><span>{aiSuccessMessage}</span></div>}

                  {activeTemplatePage.regions.filter(r => r.isDynamic !== false).length === 0 && (
                    <div className="p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)]/60 bg-[#1D1D1F] dark:bg-[#252528]/50 text-center text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] text-xs font-medium">
                      Bu şablonda tanımlanmış dinamik bölge yok.
                    </div>
                  )}

                  {/* 1. TEXT REGIONS */}
                  {editingTemplate.regions
                    .filter(r => r.isDynamic !== false && r.type === 'text' && !r.hidden)
                    .map(r => {
                      const textVal = activePageData.dynamicTexts[r.id] !== undefined
                        ? activePageData.dynamicTexts[r.id]
                        : (r.placeholderText || '');
                      
                      return (
                        <div key={r.id} className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[20px] p-4.5 space-y-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] flex items-center space-x-1.5">
                              <Type className="w-3.5 h-3.5 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                              <span>{r.name}</span>
                            </span>
                            <button type="button" className="workspace-field-magic"
                              aria-label={`${r.name} için AI ile üret`} title={`${r.name} üret · Şablon promptunu kullanır`}
                              disabled={aiTextTarget !== null || isAiLoading} onClick={() => triggerAiGenerator(r.id)}>
                              {aiTextTarget === r.id ? <Loader2 size={15} className="animate-spin"/> : <WandSparkles size={15}/>}
                            </button>
                          </div>

                          <textarea
                            aria-label={r.name}
                            disabled={aiTextTarget === r.id || aiTextTarget === 'all'}
                            rows={3}
                            value={textVal}
                            onChange={(e) => updateActiveText(r.id, e.target.value)}
                            className="w-full bg-[#1D1D1F] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)] rounded-[14px] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10 text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium leading-relaxed resize-y transition-all"
                            placeholder="Metninizi yazın..."
                          />

                          <div className="flex justify-between items-center text-[10px] text-[rgba(255,255,255,0.72)] font-medium px-1">
                            <span>Markdown <strong className="text-[rgba(255,255,255,0.72)]">**kalın**</strong> ve <em className="text-[rgba(255,255,255,0.72)]">*eğik*</em> destekler.</span>
                            <span className="font-mono">{textVal.length} karakter</span>
                          </div>
                        </div>
                      );
                    })}

                  {/* 2. SINGLE UNIFIED IMAGE REGION CONTROLLER FOR SELECTED CANVAS PHOTO */}
                  {(() => {
                    const isStaticTemplatePNG = (region: any) => {
                      if (region.isDynamic === false) return true;
                      const n = (region.name || '').toLowerCase();
                      return n.includes('takım') || n.includes('logo') || n.includes('süs') || n.includes('rozet') || n.includes('ikon') || n.includes('çerçeve');
                    };

                    const dynamicImageRegions = activeTemplatePage.regions.filter(r => r.type === 'image' && !isStaticTemplatePNG(r));
                    if (dynamicImageRegions.length === 0) return null;

                    // Determine active image region (either selected on canvas, or editing, or default to first)
                    const activeImageRegion = dynamicImageRegions.find(r => r.id === selectedNodeId) ||
                                              dynamicImageRegions.find(r => r.id === editingImageRegionId) ||
                                              dynamicImageRegions[0];

                    const r = activeImageRegion;
                    const activeIndex = dynamicImageRegions.findIndex(item => item.id === r.id);
                    const activeDisplayName = activeIndex !== -1 ? `Görsel ${activeIndex + 1}` : r.name;

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
                      <div key="unified-image-section" className="bg-[#252528] dark:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                        {/* Selector header / tabs for choosing which photo to edit if multiple exist */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] flex items-center space-x-1.5">
                              <ImageIcon className="w-4 h-4 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                              <span>Fotoğraf Seçimi ve Değiştirme</span>
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${imgData.url ? 'bg-[#252528] dark:bg-[#252528]/30 text-[#34C759] dark:text-[#34C759]' : 'bg-[#252528] dark:bg-[#252528] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]'}`}>
                              {imgData.url ? 'Görsel Yüklendi' : 'Görsel Bekleniyor'}
                            </span>
                          </div>

                          {dynamicImageRegions.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
                              <span className="text-[10px] font-medium text-[rgba(255,255,255,0.72)] shrink-0 mr-1">Alanlar:</span>
                              {dynamicImageRegions.map((regionItem, idx) => {
                                const isItemActive = regionItem.id === r.id;
                                const itemImg = activePageData.dynamicImages[regionItem.id]?.url;
                                const itemLabel = `Görsel ${idx + 1}`;
                                return (
                                  <button
                                    key={regionItem.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedNodeId(regionItem.id);
                                      setEditingImageRegionId(regionItem.id);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center space-x-1.5 shrink-0 ${
                                      isItemActive
                                        ? 'bg-[#1D1D1F] dark:bg-[#3A3A3C] text-[rgba(255,255,255,0.95)] shadow-sm scale-[1.02]'
                                        : 'bg-[#1D1D1F] dark:bg-[#252528] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] border border-[rgba(255,255,255,0.08)]/50 dark:border-[rgba(255,255,255,0.08)]'
                                    }`}
                                  >
                                    {itemImg && (
                                      <img src={itemImg} alt="" className="w-4 h-4 rounded-full object-cover" />
                                    )}
                                    <span>{itemLabel}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* File Thumbnail or Drag & Drop Block */}
                        {hasImage ? (
                          <div className="flex items-center space-x-4 bg-[#1D1D1F] dark:bg-[#252528] p-3 rounded-[16px] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                            <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#252528] dark:bg-[#2C2C2E] shrink-0 shadow-sm relative group">
                              <img src={imgData.url} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] truncate block">
                                {imgData.isVideo ? '🎥 MP4 Video' : `${activeDisplayName} Dolu`}
                              </span>
                              <span className="text-[10px] text-[#34C759] font-medium flex items-center space-x-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                                <span>{imgData.isVideo ? 'Canlı Video Hazır' : 'Tasarımda Aktif'}</span>
                              </span>
                            </div>
                            <div className="flex flex-col space-y-1.5 shrink-0">
                              {imgData.isVideo && (
                                <button
                                  type="button"
                                  onClick={() => setPlayingVideoRegionId(prev => prev === r.id ? null : r.id)}
                                  className={`px-3 py-1.5 rounded-[10px] text-[10px] font-bold border cursor-pointer text-center transition-all shadow-sm ${
                                    playingVideoRegionId === r.id
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                      : 'bg-gradient-to-r from-[#FF6B1A] to-[#34C759] text-white border-transparent hover:opacity-90'
                                  }`}
                                >
                                  {playingVideoRegionId === r.id ? 'Durdur' : '▶ Oynat'}
                                </button>
                              )}
                              <label className="px-3 py-1.5 rounded-[10px] bg-[#252528] dark:bg-[#2C2C2E] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[10px] font-medium border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] cursor-pointer text-center transition-all shadow-sm">
                                <span>Değiştir</span>
                                <input
                                  type="file"
                                  accept="image/*,video/mp4,video/quicktime,video/webm"
                                  onChange={(e) => handleFileInput(e, r.id)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateActiveImageProp(r.id, 'url', '')}
                                className="px-3 py-1.5 rounded-[10px] bg-[#252528]/50 dark:bg-[#2C2C2E]/20 hover:bg-[#252528] dark:hover:bg-[#2C2C2E]/40 text-[#FF453A] dark:text-[#FF453A] text-[10px] font-medium border border-transparent cursor-pointer text-center transition-all"
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
                            className={`rounded-[16px] p-6 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                              dragActive[r.id]
                                ? 'bg-[#252528]/50 dark:bg-[#252528]/40 border-2 border-[#FF6B1A] dark:border-[#FF6B1A]'
                                : 'bg-[#1D1D1F] dark:bg-[#252528] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] border-dashed'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-[#252528] dark:bg-[#2C2C2E] shadow-sm flex items-center justify-center mb-1">
                              <UploadCloud className="w-4 h-4 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                            </div>
                            <div>
                              <p className="text-[12px] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-medium">Görsel veya video sürükleyin</p>
                              <p className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] mt-0.5">PNG, JPG veya MP4 ({activeDisplayName})</p>
                            </div>
                            
                            <label className="mt-2 px-4 py-2 rounded-[12px] bg-[#252528] dark:bg-[#2C2C2E] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[11px] font-medium border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] cursor-pointer inline-block transition-all shadow-sm">
                              <span>Dosya Seç</span>
                              <input
                                type="file"
                                accept="image/*,video/mp4,video/quicktime,video/webm"
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
                            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]/60 space-y-2.5 text-left">
                              <span className="text-[10px] font-medium text-[rgba(255,255,255,0.72)] uppercase tracking-wide block">Diğer Görseller</span>
                              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                                {uniqueImages.map((url, i) => (
                                  <div key={i} className="relative group/thumb shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => updateActiveImageProp(r.id, 'url', url)}
                                      className="relative w-12 h-12 rounded-[10px] overflow-hidden border border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)] hover:border-[#FF6B1A] shrink-0 bg-[#1D1D1F] dark:bg-[#3A3A3C] cursor-pointer shadow-sm transition-all hover:scale-[1.03] active:scale-95 group"
                                      title="Bu görseli buraya yerleştir"
                                    >
                                      <img src={url} alt={`Varlık ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Check className="w-4 h-4 text-[rgba(255,255,255,0.95)] stroke-[2.5]" />
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeUploadedImage(url);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:text-[#FF453A] rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition z-20 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100"
                                      title="Görseli Kaldır"
                                    >
                                      <X className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Collapsible Photo Alignment and Tweaks Bar */}
                        <div className="pt-1.5 border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                          <button
                            type="button"
                            onClick={() => setExpandedImageSettings(prev => ({
                              ...prev,
                              [r.id]: !isExpanded
                            }))}
                            className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.72)] hover:text-[#FF6B1A] dark:hover:text-[#FF6B1A] cursor-pointer transition select-none"
                          >
                            <div className="flex items-center space-x-1.5">
                              <Sliders className="w-3.5 h-3.5 text-[#FF6B1A] dark:text-[#FF6B1A]" />
                              <span>İnce Ayarlar ve Hizalama</span>
                            </div>
                            <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                              <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]" />
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="space-y-3.5 pt-3 border-t border-[rgba(255,255,255,0.08)]/80 dark:border-[rgba(255,255,255,0.08)]/80 mt-1 animate-fade-in">
                              <div className="flex justify-between items-center text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-semibold">
                                <span className="font-bold uppercase tracking-wider">Hizalama Komutları</span>
                                <button
                                  onClick={() => {
                                    updateActiveImageProp(r.id, 'scale', 1.0);
                                    updateActiveImageProp(r.id, 'offsetX', 0);
                                    updateActiveImageProp(r.id, 'offsetY', 0);
                                    updateActiveImageProp(r.id, 'rotation', 0);
                                  }}
                                  className="text-[#FF6B1A] hover:text-[#FF6B1A] font-bold flex items-center space-x-1 transition"
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
                                    ? 'bg-[#34C759] border-[#34C759] text-[rgba(255,255,255,0.95)] shadow-lg shadow-[rgba(52,199,89,0.2)] dark:shadow-[rgba(52,199,89,0.2)]/30'
                                    : 'bg-[#252528] dark:bg-[#2C2C2E]/20 border-[#FF6B1A] dark:border-[#FF6B1A]/50 hover:bg-[#303033] dark:hover:bg-[#2C2C2E]/40 text-[#FF6B1A] dark:text-[#FF6B1A]'
                                }`}
                              >
                                <MousePointer className={`w-3.5 h-3.5 ${editingImageRegionId === r.id ? 'animate-pulse' : ''}`} />
                                <span>
                                  {editingImageRegionId === r.id ? 'Mouse Düzenleme Aktif (Kapat)' : 'Görseli Mouse ile Sürükle ve Ölçekle'}
                                </span>
                              </button>

                              {/* Maske Sınırı Toggle */}
                              <div className="flex items-center justify-between bg-[#1D1D1F] dark:bg-[#252528] p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                <div>
                                  <span className="text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] block">Sınır Maskesi (Kırpma)</span>
                                  <span className="text-[10px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] block leading-tight">Görselin katman kutusuna sığmasını kısıtlar.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRegionPropertyChange(r.id, 'clipImage', r.clipImage !== false ? false : true);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-extrabold border transition cursor-pointer shrink-0 ${
                                    r.clipImage !== false
                                      ? 'bg-[#252528] dark:bg-[#2C2C2E]/30 border-[#FF6B1A] dark:border-[#FF6B1A]/50 text-[#FF6B1A] dark:text-[#FF6B1A]'
                                      : 'bg-[#252528] dark:bg-[#252528]/30 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/50 text-[#34C759] dark:text-[#34C759]'
                                  }`}
                                >
                                  {r.clipImage !== false ? 'Maskeli' : 'Serbest'}
                                </button>
                              </div>

                              {/* Scale / Zoom slider */}
                              <div>
                                <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium mb-1">
                                  <span>Ölçek (Yakınlaştır / Uzaklaştır)</span>
                                  <span className="font-mono text-[#FF6B1A] dark:text-[#FF6B1A] font-bold">{(imgData.scale || 1.0).toFixed(2)}x</span>
                                </div>
                                <input
                                  type="range"
                                  min={0.2}
                                  max={4.0}
                                  step={0.05}
                                  value={imgData.scale || 1.0}
                                  onChange={(e) => updateActiveImageProp(r.id, 'scale', parseFloat(e.target.value))}
                                  className="w-full accent-[#FF6B1A] dark:accent-[#FF6B1A] cursor-pointer h-1 bg-[#252528] dark:bg-[#2C2C2E] rounded-lg appearance-none"
                                />
                              </div>

                              {/* Offset X / Horizontal Shift slider */}
                              <div>
                                <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium mb-1">
                                  <span>Yatay Kaydırma (Sol - Sağ)</span>
                                  <span className="font-mono text-[#FF6B1A] dark:text-[#FF6B1A] font-bold">{imgData.offsetX}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={-1000}
                                  max={1000}
                                  value={imgData.offsetX}
                                  onChange={(e) => updateActiveImageProp(r.id, 'offsetX', parseInt(e.target.value))}
                                  className="w-full accent-[#FF6B1A] dark:accent-[#FF6B1A] cursor-pointer h-1 bg-[#252528] dark:bg-[#2C2C2E] rounded-lg appearance-none"
                                />
                              </div>

                              {/* Offset Y / Vertical Shift slider */}
                              <div>
                                <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium mb-1">
                                  <span>Dikey Kaydırma (Yukarı - Aşağı)</span>
                                  <span className="font-mono text-[#FF6B1A] dark:text-[#FF6B1A] font-bold">{imgData.offsetY}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={-1000}
                                  max={1000}
                                  value={imgData.offsetY}
                                  onChange={(e) => updateActiveImageProp(r.id, 'offsetY', parseInt(e.target.value))}
                                  className="w-full accent-[#FF6B1A] dark:accent-[#FF6B1A] cursor-pointer h-1 bg-[#252528] dark:bg-[#2C2C2E] rounded-lg appearance-none"
                                />
                              </div>

                              {/* Rotate slider */}
                              <div>
                                <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium mb-1">
                                  <span>Döndür (Açı)</span>
                                  <span className="font-mono text-[#FF6B1A] dark:text-[#FF6B1A] font-bold">{imgData.rotation}°</span>
                                </div>
                                <input
                                  type="range"
                                  min={-180}
                                  max={180}
                                  value={imgData.rotation}
                                  onChange={(e) => updateActiveImageProp(r.id, 'rotation', parseInt(e.target.value))}
                                  className="w-full accent-[#FF6B1A] dark:accent-[#FF6B1A] cursor-pointer h-1 bg-[#252528] dark:bg-[#2C2C2E] rounded-lg appearance-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: LIVE CANVAS PREVIEW STAGE */}
        <div id="canvas-stage" className={`flex-1 clay-inset dark:bg-[#1D1D1F]/50 mx-2 mb-2 flex flex-col items-center justify-between p-3 sm:p-4 lg:p-6 relative overflow-hidden h-full ${mobileView === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Top Info Bar */}
          <div className="w-full max-w-2xl clay-card dark:bg-[#252528] dark:border-[rgba(255,255,255,0.08)] px-4 py-2 mb-4 flex items-center justify-between text-xs font-semibold z-10 shrink-0 border-0">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#FF6B1A] dark:bg-[#FF6B1A] rounded-full animate-pulse" />
              <span className="text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-bold">Önizleme</span>
              <span className="text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]">|</span>
              <span className="text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-bold font-mono">{currentTemplate.width} × {currentTemplate.height} px</span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 text-[rgba(255,255,255,0.72)]">
              {/* Geri Al (Undo) */}
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndo}
                className="clay-btn flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 transition cursor-pointer font-bold text-[11px] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.72)] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Geri Al (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-[#FF6B1A] dark:text-[#FF6B1A]" />
                <span className="hidden xs:inline">Geri Al</span>
              </button>

              {/* İleri Al (Redo) */}
              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
                className="clay-btn flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 transition cursor-pointer font-bold text-[11px] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.72)] disabled:opacity-40 disabled:cursor-not-allowed"
                title="İleri Al (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5 text-[#FF6B1A] dark:text-[#FF6B1A]" />
                <span className="hidden xs:inline">İleri Al</span>
              </button>

              <span className="text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hidden xs:inline">|</span>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm ${
                  showGrid ? 'bg-[#252528] dark:bg-[#252528]/60 border border-[#FF6B1A] dark:border-[#FF6B1A]/50 text-[#FF6B1A] dark:text-[#FF6B1A]' : 'bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)]'
                }`}
                title="Kılavuz Çizgileri"
              >
                <Grid className="w-3.5 h-3.5 text-[#FF6B1A]" />
                <span className="hidden xs:inline">Kılavuz</span>
              </button>

              {/* Margin Toggle */}
              <button
                onClick={() => setShowSafeMargins(!showSafeMargins)}
                className={`flex items-center space-x-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-lg transition cursor-pointer font-bold text-[11px] shadow-sm ${
                  showSafeMargins ? 'bg-[#252528] dark:bg-[#252528]/60 border border-[#FF6B1A] dark:border-[#FF6B1A]/50 text-[#FF6B1A] dark:text-[#FF6B1A]' : 'bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80 text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)]'
                }`}
                title="Güvenli Baskı Alanı"
              >
                <Info className="w-3.5 h-3.5 text-[#FF6B1A]" />
                <span className="hidden xs:inline">Güvenli Alan</span>
              </button>
            </div>
          </div>

          {/* Canvas Wrapper Container with Scrollable Pages */}
          <div 
            id="canvas-viewport"
            className="flex-1 flex flex-col items-center w-full max-h-[calc(100dvh-180px)] sm:max-h-[calc(100dvh-200px)] my-2 sm:my-4 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-8 select-none scroll-smooth relative"
          >
            {/* The canvas background guide line grid for visual design style */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {editingImageRegionId && (
              <div className="sticky top-0 z-30 w-full max-w-md bg-[#34C759] text-[rgba(255,255,255,0.95)] text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between space-x-3 border border-[#34C759] animate-fade-in shrink-0">
                <div className="flex items-center space-x-2">
                  <MousePointer className="w-3.5 h-3.5 animate-bounce" />
                  <span>Görseli mouse ile sürükleyip kaydırın, tekerlek ile yakınlaştırın</span>
                </div>
                <button
                  onClick={() => setEditingImageRegionId(null)}
                  className="bg-[#34C759] hover:bg-[#34C759] text-[rgba(255,255,255,0.95)] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition cursor-pointer"
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
                const baseWidth = Math.min(canvasWidth, 620);
                const pageScale = zoomMode === 'fit' ? 1.0 : zoomScale;
                const displayWidth = baseWidth * pageScale;
                return (
                  <div 
                    key={page.id} 
                    className="flex flex-col items-center space-y-2.5 w-full shrink-0"
                    style={{ width: `${displayWidth}px`, maxWidth: 'none' }}
                  >
                    {/* Header with Page Info */}
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="text-[11px] font-extrabold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wider flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B1A] dark:bg-[#FF6B1A] animate-pulse"></span>
                        <span>{idx + 1}. Sayfa: {page.name || 'İsimsiz Sayfa'}</span>
                      </span>
                      {isActive && (
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const p1Imgs = activeGraphicData.dynamicImages || {};
                            const p1Regs = activeTemplatePage.regions || page.regions || [];
                            const p1VideoReg = p1Regs.find(
                              r => r.type === 'image' && p1Imgs[r.id]?.isVideo && (p1Imgs[r.id]?.videoUrl || p1Imgs[r.id]?.url)
                            );
                            if (!p1VideoReg) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => setPlayingVideoRegionId(prev => prev ? null : p1VideoReg.id)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 transition-all duration-200 cursor-pointer ${
                                  playingVideoRegionId === p1VideoReg.id
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-gradient-to-r from-[#FF6B1A] to-[#34C759] hover:opacity-90 text-white shadow'
                                }`}
                              >
                                <span>{playingVideoRegionId === p1VideoReg.id ? '⏸ Durdur' : '▶ Videoyu Oynat'}</span>
                              </button>
                            );
                          })()}
                          <span className="text-[10px] bg-[#FF6B1A] text-[rgba(255,255,255,0.95)] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Aktif Düzenleme
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Canvas Frame */}
                    <div 
                      className={`relative w-full p-1 bg-[#252528] dark:bg-[#252528]/50 border rounded-[16px] transition duration-200 ${
                        isActive 
                          ? 'border-[#FF6B1A] ring-4 ring-[#FF6B1A] dark:ring-[#FF6B1A]/30 shadow-[0_30px_60px_-15px_rgba(67,56,202,0.15)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]' 
                          : 'border-[rgba(255,255,255,0.08)]/80 dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12),0_10px_20px_-8px_rgba(0,0,0,0.06)]'
                      }`}
                      style={{ aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}` }}
                    >
                      {isActive ? (
                        <div className="relative w-full h-full overflow-hidden rounded-lg">
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
                            className="bg-[#252528] dark:bg-[#1D1D1F] rounded-lg shadow-inner select-none touch-none"
                          />
                          <CanvasVideoOverlay
                            templateWidth={currentTemplate.width}
                            templateHeight={currentTemplate.height}
                            displayWidth={displayWidth}
                            regions={activeTemplatePage.regions || page.regions || []}
                            dynamicImages={activeGraphicData.dynamicImages || {}}
                            playingRegionId={playingVideoRegionId}
                            onSetPlayingRegionId={setPlayingVideoRegionId}
                            isMuted={isVideoMuted}
                            onToggleMute={setIsVideoMuted}
                          />
                        </div>
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
                  const baseWidth = Math.min(canvasWidth, 620);
                  const pageScale = zoomMode === 'fit' ? 1.0 : zoomScale;
                  const displayWidth = baseWidth * pageScale;
                  return (
                    <div 
                      key={page.id} 
                      className="flex flex-col items-center space-y-2 w-full shrink-0"
                      style={{ width: `${displayWidth}px`, maxWidth: 'none' }}
                    >
                      {/* Header with Page Info */}
                      <div className="flex items-center justify-between w-full px-2">
                        <span className="text-[11px] font-extrabold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wider flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
                          <span>{page.name || `${idx + 1}. Sayfa`}</span>
                        </span>
                        {isActive && (
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const p2Imgs = activePageData.dynamicImages || {};
                              const p2Regs = activeTemplatePage.regions || pageDef.regions || [];
                              const p2VideoReg = p2Regs.find(
                                r => r.type === 'image' && p2Imgs[r.id]?.isVideo && (p2Imgs[r.id]?.videoUrl || p2Imgs[r.id]?.url)
                              );
                              if (!p2VideoReg) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => setPlayingVideoRegionId(prev => prev ? null : p2VideoReg.id)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 transition-all duration-200 cursor-pointer ${
                                    playingVideoRegionId === p2VideoReg.id
                                      ? 'bg-red-500 hover:bg-red-600 text-white'
                                      : 'bg-gradient-to-r from-[#FF6B1A] to-[#34C759] hover:opacity-90 text-white shadow'
                                  }`}
                                >
                                  <span>{playingVideoRegionId === p2VideoReg.id ? '⏸ Durdur' : '▶ Videoyu Oynat'}</span>
                                </button>
                              );
                            })()}
                            <span className="text-[10px] bg-[#34C759] text-[rgba(255,255,255,0.95)] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              Aktif Düzenleme
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Canvas Frame */}
                      <div 
                        className={`relative w-full p-1 bg-[#252528] dark:bg-[#252528]/50 border rounded-xl shadow-lg transition duration-200 ${
                          isActive 
                            ? 'border-[#34C759] ring-4 ring-[#34C759] dark:ring-[#34C759]/30 shadow-[rgba(52,199,89,0.2)]/50 dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]' 
                            : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)] hover:shadow-xl'
                        }`}
                        style={{ aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}` }}
                      >
                        {isActive ? (
                          <div className="relative w-full h-full overflow-hidden rounded-lg">
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
                              className="bg-[#252528] rounded-lg shadow-inner select-none touch-none"
                            />
                            <CanvasVideoOverlay
                              templateWidth={currentTemplate.width}
                              templateHeight={currentTemplate.height}
                              displayWidth={displayWidth}
                              regions={activeTemplatePage.regions || pageDef.regions || []}
                              dynamicImages={activePageData.dynamicImages || {}}
                              playingRegionId={playingVideoRegionId}
                              onSetPlayingRegionId={setPlayingVideoRegionId}
                              isMuted={isVideoMuted}
                              onToggleMute={setIsVideoMuted}
                            />
                          </div>
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
                <div className="flex flex-col items-center gap-3 shrink-0" style={{width: Math.min(canvasWidth, 620) * (zoomMode === 'fit' ? 1 : zoomScale)}}>
                  <div className="workspace-page-caption"><span>01 / Kapak</span><span>{currentTemplate.name}</span></div>
                  <div className="relative w-full" style={{aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}`}}>
                    <canvas ref={canvasRef} onMouseDown={handleCanvasPointerDown} onMouseMove={handleCanvasPointerMove} onMouseUp={handleCanvasPointerUp} onMouseLeave={handleCanvasPointerUp} onTouchStart={handleCanvasPointerDown} onTouchMove={handleCanvasPointerMove} onTouchEnd={handleCanvasPointerUp} onDoubleClick={handleCanvasDoubleClick} className="w-full h-full touch-none" aria-label="Aktif tasarım önizlemesi"/>
                    <CanvasVideoOverlay templateWidth={currentTemplate.width} templateHeight={currentTemplate.height} displayWidth={Math.min(canvasWidth, 620)} regions={editingTemplate.regions} dynamicImages={activeGraphicData.dynamicImages} playingRegionId={playingVideoRegionId} onSetPlayingRegionId={setPlayingVideoRegionId} isMuted={isVideoMuted} onToggleMute={setIsVideoMuted}/>
                  </div>
                </div>
              )
            )}
          </div>

          {/* FLOATING ZOOM AND PAN CONTROLS */}
          <div className="workspace-zoom absolute bottom-16 right-4 sm:bottom-6 sm:right-6 bg-[#252528]/95 dark:bg-[#2C2C2E]/95 backdrop-blur border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-xl rounded-full p-1.5 flex items-center space-x-1 z-20">
            {/* Zoom Out */}
            <button
              onClick={() => {
                if (zoomMode === 'fit') {
                  setZoomMode('custom');
                  setZoomScale(0.9);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoomScale(prev => Math.max(0.1, parseFloat((prev - 0.05).toFixed(2))));
                }
              }}
              className="p-1.5 hover:bg-[#252528] dark:hover:bg-[#2C2C2E] rounded-full text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] transition cursor-pointer"
              title="Uzaklaştır"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Current Zoom Indicator */}
            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] min-w-[45px] text-center font-mono">
              {zoomMode === 'fit' ? 'Sığdır' : `${Math.round(zoomScale * 100)}%`}
            </span>

            {/* Zoom In */}
            <button
              onClick={() => {
                if (zoomMode === 'fit') {
                  setZoomMode('custom');
                  setZoomScale(1.1);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoomScale(prev => Math.min(3.0, parseFloat((prev + 0.05).toFixed(2))));
                }
              }}
              className="p-1.5 hover:bg-[#252528] dark:hover:bg-[#2C2C2E] rounded-full text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] transition cursor-pointer"
              title="Yakınlaştır"
            >
              <Plus className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-[#2C2C2E] dark:bg-[#2C2C2E] mx-1" />

            {/* Fit Screen / Reset */}
            <button
              onClick={() => {
                setZoomMode('fit');
                setPanOffset({ x: 0, y: 0 });
              }}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                zoomMode === 'fit'
                  ? 'bg-[#252528] dark:bg-[#2C2C2E]/30 text-[#FF6B1A] dark:text-[#FF6B1A] font-bold'
                  : 'text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:bg-[#252528] dark:hover:bg-[#2C2C2E] hover:text-[rgba(255,255,255,0.95)] dark:hover:text-[rgba(255,255,255,0.95)]'
              }`}
              title="Ekrana Sığdır"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Info Status bar */}
          <div className="w-full max-w-xl text-center text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-medium text-[10px] sm:text-[11px] leading-relaxed select-none pb-2 shrink-0">
            Tuvalde bir öğeye tıklayarak seçin.
            Görseli çift tıklayarak kadrajını düzenleyin.
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ASSETS & EXPORT */}
        <div id="export-assets-bar" className={`w-full lg:w-[320px] clay-card dark:bg-[#252528] dark:border-[rgba(255,255,255,0.08)] border-0 lg:mb-2 lg:ml-2 lg:mr-2 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 ${mobileView === 'export' ? 'flex' : 'hidden lg:flex'}`}>
          
          <div className="space-y-6">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wider block">SAYFALAR</span>
                {generatedPages.length > 0 && (
                  <span className="text-[9.5px] font-extrabold text-[#FF6B1A] dark:text-[#FF6B1A] bg-[#252528] dark:bg-[#2C2C2E]/30 px-2 py-0.5 rounded-full">
                    {generatedPages.length} Sayfa Hazır
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
                            ? 'bg-[#252528]/50 dark:bg-[#252528]/60 border-[#FF6B1A] dark:border-[#FF6B1A]/50 shadow-sm ring-1 ring-[#FF6B1A] dark:ring-[#FF6B1A]/50'
                            : 'bg-[#1D1D1F]/50 dark:bg-[#1D1D1F] border-[rgba(255,255,255,0.08)]/80 dark:border-[rgba(255,255,255,0.08)] hover:bg-[#252528]/50 dark:hover:bg-[#3A3A3C]/50 hover:border-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.08)]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Mini Number Badge */}
                          <div className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                            isActive
                              ? 'bg-[#FF6B1A] dark:bg-[#FF6B1A] text-[rgba(255,255,255,0.95)]'
                              : 'bg-[#2C2C2E] dark:bg-[#3A3A3C] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)]'
                          }`}>
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] truncate block">
                              {page.name || `${idx + 1}. Sayfa`}
                            </span>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {/* Fill status */}
                              {imageRegions.length > 0 ? (
                                <span className={`text-[9.5px] font-bold ${isFullyFilled ? 'text-[#34C759] dark:text-[#34C759] font-extrabold' : 'text-[#FF9F0A] dark:text-[#FF9F0A]'}`}>
                                  {filledImages}/{imageRegions.length} Görsel
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-semibold">Sadece Metin</span>
                              )}
                              <span className="w-1 h-1 rounded-full bg-[#303033] dark:bg-[#3A3A3C]" />
                              <span className="text-[9.5px] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] truncate max-w-[90px] font-medium font-mono">
                                {currentTemplate.width} × {currentTemplate.height}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (Direct Single Export) */}
                        <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              // Directly call the single high-res exporter
                              exportSingleHighResPage(page, idx);
                            }}
                            className="p-1.5 rounded-lg bg-[#252528] dark:bg-[#3A3A3C] border border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:text-[#FF6B1A] dark:hover:text-[#FF6B1A] hover:border-[#FF6B1A] dark:hover:border-[#FF6B1A]/50 hover:bg-[#252528]/50 dark:hover:bg-[#252528]/60 transition cursor-pointer shadow-sm group-hover:scale-105"
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
                <div className="workspace-active-page">
                  <TemplateThumbnail template={editingTemplate} data={activeTab === 'phase1' ? undefined : activeGraphicData}/>
                  <div><strong>{activeTab === 'phase1' ? `${activePageIndex + 1} · ${activeTemplatePage.name}` : '01 · Kapak'}</strong><span>{currentTemplate.width} × {currentTemplate.height} px</span></div>
                  <Check size={15}/>
                </div>
              )}
            </div>
          </div>

          {/* PRINT & EXPORT PANEL */}
          <div className="pt-6 border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] space-y-5">
            
            <div className="space-y-4">
              <span className="text-[10px] font-medium text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] uppercase tracking-wide block px-1">Çıktı Ayarları</span>
              
              {/* Output format selectors */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('png')}
                  className={`py-2 rounded-[12px] text-xs font-medium border transition-all cursor-pointer ${
                    exportFormat === 'png'
                      ? 'bg-[#252528] dark:bg-[#252528]/60 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/50 text-[#FF6B1A] dark:text-[#FF6B1A]'
                      : 'bg-[#252528] dark:bg-[#3A3A3C] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80'
                  }`}
                >
                  PNG (Kayıpsız)
                </button>
                <button
                  onClick={() => setExportFormat('jpeg')}
                  className={`py-2 rounded-[12px] text-xs font-medium border transition-all cursor-pointer ${
                    exportFormat === 'jpeg'
                      ? 'bg-[#252528] dark:bg-[#252528]/60 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)]/50 text-[#FF6B1A] dark:text-[#FF6B1A]'
                      : 'bg-[#252528] dark:bg-[#3A3A3C] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.95)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80'
                  }`}
                >
                  JPEG (Optimize)
                </button>
              </div>

              {/* Scale DPI multipliers */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-[rgba(255,255,255,0.72)] px-1">
                  <span>Çözünürlük Ölçeği</span>
                  <span className="font-mono text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                    {Math.round(currentTemplate.width * exportScale)} × {Math.round(currentTemplate.height * exportScale)} px
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Web (1x)', val: 1.0 },
                    { label: 'Yüksek (1.5x)', val: 1.5 },
                    { label: 'En iyi (2x)', val: 2.0 }
                  ].map(sc => (
                    <button
                      key={sc.val}
                      onClick={() => setExportScale(sc.val)}
                      className={`py-1.5 rounded-[10px] text-[10px] border transition-all cursor-pointer ${
                        exportScale === sc.val
                          ? 'bg-[#252528] border-[rgba(255,255,255,0.08)] dark:bg-[#FF6B1A] dark:border-[#FF6B1A] text-[rgba(255,255,255,0.95)] font-medium'
                          : 'bg-[#1D1D1F] dark:bg-[#3A3A3C] border-[rgba(255,255,255,0.08)]/60 dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:bg-[#1D1D1F] dark:hover:bg-[#3A3A3C]/80'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Core download action */}
            <div className="space-y-2.5">
              <button
                onClick={exportHighResGraphic}
                disabled={isExporting || isExportingZip}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-[14px] bg-[#1D1D1F] hover:bg-[#252528] dark:bg-[#FF6B1A] dark:hover:bg-[#FF6B1A] text-[rgba(255,255,255,0.95)] text-[13px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.1)] dark:shadow-[rgba(255,107,26,0.2)]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.08)] border-t-white rounded-full animate-spin"></span>
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{generatedPages.length > 0 ? 'Tüm Sayfaları İndir' : 'Görseli İndir'}</span>
                  </>
                )}
              </button>

              {generatedPages.length > 0 && (
                <button
                  onClick={exportHighResZip}
                  disabled={isExporting || isExportingZip}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-[14px] bg-[#1D1D1F] hover:bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] dark:bg-[#3A3A3C] dark:hover:bg-[#3A3A3C]/80 dark:border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] text-[13px] font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExportingZip ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.08)] border-t-slate-600 rounded-full animate-spin"></span>
                      <span className="truncate">{exportStatusText || 'Arşivleniyor...'}</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4 h-4 text-[rgba(255,255,255,0.72)]" />
                      <span>ZIP Olarak İndir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {exportFiles.length > 0 && <section className="workspace-export-results" aria-label="Hazırlanan dosyalar">
            <p role="status"><CheckCircle2 size={15}/>{exportFiles.length} dosya hazır</p>
            <span>İndirme başlamadıysa dosyaya tıklayın.</span>
            {exportFiles.map(file => <div key={file.url}>{file.type.startsWith('image/') && <img className="export-result-preview" src={file.url} alt={file.name + ' çıktı önizlemesi'}/>}<a href={file.url} download={file.name}><Download size={14}/><span>{file.name}</span></a></div>)}
          </section>}

          {/* Minimalist Footer Signature */}
          <div className="pt-4 text-center border-t border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
            <span className="text-[9px] font-bold text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] font-mono tracking-widest uppercase">
              GRAFİK OTOMASYON MOTORU © 2026
            </span>
          </div>

        </div>

        {/* Floating Export Progress Toast */}
        {(isExporting || isExportingZip) && exportStatusText && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F]/95 backdrop-blur-md border border-white/20 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3.5 max-w-md animate-fade-in pointer-events-none">
            <div className="w-5 h-5 rounded-full border-2 border-[#FF6B1A] border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Dışa Aktarılıyor...</p>
              <p className="text-[11px] text-white/80 mt-0.5">{exportStatusText}</p>
            </div>
          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div id="mobile-nav-bar" className="lg:hidden bg-[#1D1D1F] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-2 z-30 shrink-0 select-none">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'editor' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px]">Şablon / Editör</span>
        </button>

        <button
          onClick={() => setMobileView('canvas')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'canvas' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Önizleme</span>
        </button>

        <button
          onClick={() => setMobileView('export')}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'export' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px]">Dışa Aktar</span>
        </button>

        <button
          onClick={() => setIsToolsModalOpen(true)}
          className="flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg text-amber-400 font-bold hover:text-amber-300"
        >
          <Wrench className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-[10px]">Araçlar</span>
        </button>
      </div>

      {/* CUSTOM CONFIRM DIALOG MODAL */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-[#1D1D1F]/80 dark:bg-[#1D1D1F]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="clay-card dark:bg-[#1D1D1F] dark:border-[rgba(255,255,255,0.08)] rounded-3xl border-0 max-w-sm w-full p-6 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] flex items-center space-x-2">
                  {confirmDialog.type === 'warning' ? (
                    <span className="p-1.5 bg-[#FF9F0A]/10 text-[#FF9F0A] rounded-lg">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  ) : confirmDialog.type === 'info' ? (
                    <span className="p-1.5 bg-[#FF6B1A]/10 text-[#FF6B1A] rounded-lg">
                      <Info className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 bg-[#FF453A]/10 text-[#FF453A] rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </span>
                  )}
                  <span>{confirmDialog.title}</span>
                </h3>
                <p className="text-xs text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="flex space-x-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-lg bg-[#252528] hover:bg-[#2C2C2E] text-[rgba(255,255,255,0.72)] text-xs font-semibold cursor-pointer transition"
                >
                  {confirmDialog.cancelText || 'İptal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className={`px-4 py-2 rounded-lg text-[rgba(255,255,255,0.95)] text-xs font-semibold cursor-pointer transition ${
                    confirmDialog.type === 'warning'
                      ? 'bg-[#FF9F0A] hover:bg-[#FF9F0A]'
                      : confirmDialog.type === 'info'
                      ? 'bg-[#FF6B1A] hover:bg-[#FF6B1A]'
                      : 'bg-[#FF453A] hover:bg-[#FF453A]'
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
          <div className="fixed inset-0 bg-[#1D1D1F]/85 dark:bg-[#1D1D1F]/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="clay-card dark:bg-[#1D1D1F] dark:border-[rgba(255,255,255,0.08)] rounded-3xl border-0 max-w-2xl w-full p-6 flex flex-col my-8"
            >
              <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.08)]/50 dark:border-[rgba(255,255,255,0.08)] pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FF6B1A]/10 text-[#FF6B1A] dark:text-[#FF6B1A] rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                      Görselleri Albüme Kaydet
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[rgba(255,255,255,0.72)] dark:text-[rgba(255,255,255,0.72)] mt-0.5">
                      iOS kısıtlamaları nedeniyle çoklu indirmeler albüme otomatik kaydedilemez.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIosExportImages(null)}
                  className="p-1.5 rounded-lg bg-[#252528] text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* IOS SAVE INSTRUCTION ALERT */}
              <div className="bg-gradient-to-r from-[#252528] to-[#1D1D1F] border border-[#FF6B1A]/20 rounded-xl p-4 mb-4 text-xs space-y-2 leading-relaxed text-left">
                <span className="font-bold text-[#FF6B1A] block uppercase tracking-wider text-[10px]">⚠️ Albüme Fotoğraf Olarak Kaydetme Adımları:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-[rgba(255,255,255,0.72)]">
                  <li>Aşağıdaki görsellerden kaydetmek istediğinizin üzerine <strong className="text-[rgba(255,255,255,0.95)] bg-[#FF6B1A]/20 px-1 py-0.5 rounded">basılı tutun (uzun basın)</strong>.</li>
                  <li>Açılan menüden <strong className="text-[rgba(255,255,255,0.95)]">"Fotoğraflara Ekle"</strong> veya <strong className="text-[rgba(255,255,255,0.95)]">"Görüntüyü Kaydet"</strong> seçeneğini seçin.</li>
                  <li>Görsel anında telefonunuzun fotoğraf albümüne eklenecektir. Her sayfa için bu işlemi tekrarlayın.</li>
                </ol>
              </div>

              {/* IMAGE SCROLLABLE LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {iosExportImages.map((img, idx) => (
                  <div key={idx} className="bg-[#1D1D1F]/60 border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[rgba(255,255,255,0.72)]">{img.name}</span>
                      <span className="text-[9px] font-mono text-[rgba(255,255,255,0.72)]">Uzun Basıp Kaydedin</span>
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)]/80 group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-contain pointer-events-auto select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-100 flex items-center justify-center transition pointer-events-none">
                        <span className="text-[10px] text-[rgba(255,255,255,0.95)] font-extrabold bg-[#1D1D1F]/80 px-2 py-1 rounded-full border border-[rgba(255,255,255,0.08)]/80 flex items-center space-x-1.5">
                          <Smartphone className="w-3 h-3 text-[#FF6B1A] animate-pulse" />
                          <span>Görsele Basılı Tutun</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.08)] mt-4">
                <button
                  type="button"
                  onClick={() => setIosExportImages(null)}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] hover:bg-[#FF6B1A] text-[rgba(255,255,255,0.95)] text-xs font-extrabold cursor-pointer transition shadow-lg shadow-[rgba(255,107,26,0.2)]/10"
                >
                  Tamam, Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isToolsModalOpen && <MediaDownloaderDialog
          onClose={() => setIsToolsModalOpen(false)} url={ytUrl}
          onUrlChange={value => { setYtUrl(value); setYtInfo(null); setYtError(null); setYtDownloadResult(null); }}
          info={ytInfo} loading={ytLoading} error={ytError} format={ytFormat}
          onFormatChange={value => { setYtFormat(value); setYtDownloadResult(null); }}
          onInspect={() => handleFetchYtInfo()} downloading={ytDownloading}
          onDownload={handleStartYtDownload} result={ytDownloadResult}
          history={recentDownloads} onClearHistory={handleClearYtHistory}
        />}
      </AnimatePresence>
    </div>
  );
}
