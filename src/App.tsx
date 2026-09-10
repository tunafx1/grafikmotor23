import { BatchWorkspace, ProductionNavigation, type WorkspaceScreen } from './components/BatchWorkspace';
import { buildBatchPages, generateBatchTexts } from './utils/batchProduction';
import { describeGoogleLoginError } from './lib/authErrors';
import { getAiTextFields, requestAiText } from './utils/aiText';
import { resizePageLayout, resizeTemplate } from './utils/templateResize';
import { MediaDownloaderDialog } from './components/MediaDownloaderDialog';
import { LandingPage } from './components/LandingPage';
import { AuthPortal } from './components/AuthPortal';
import { createExportAsset, safeFileName } from './utils/exportAssets';
import { findTopmostUnlockedElement } from './utils/canvasHitTest';
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
import './workspace-refined.css';
import { CanvasVideoOverlay } from './components/CanvasVideoOverlay';
import { LeftToolDrawer, ToolDrawerTab } from './components/LeftToolDrawer';
import { RightInspectorPanel } from './components/RightInspectorPanel';
import { PageFilmstrip } from './components/PageFilmstrip';
import { ExportModal } from './components/ExportModal';
import { WorkQuickEditor } from './components/WorkQuickEditor';

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
import { 
  getCloudTemplates, 
  saveCloudTemplate, 
  deleteCloudTemplate,
  saveUserGraphicProject,
  getUserGraphicProject,
  subscribeUserGraphicProject
} from './lib/templatesDb';
import { 
  auth, 
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
    // Synthesized collage pages below all reuse a single caption region with
    // textRole 'description' — inherit that role's custom AI instruction (or,
    // failing that, any text region's) so per-role AI commands set on the
    // cover page still apply to batch-generated collage pages.
    const sourceTextRegions = (t.regions || []).filter(r => r.type === 'text');
    const collageAiPrompt = sourceTextRegions.find(r => r.textRole === 'description')?.aiPrompt
      || sourceTextRegions.find(r => r.aiPrompt)?.aiPrompt;

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
          aiPrompt: collageAiPrompt,
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
          aiPrompt: collageAiPrompt,
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
          aiPrompt: collageAiPrompt,
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
  const [cloudInitialized, setCloudInitialized] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
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
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'editor'>(() => {
    const wasLoggedIn = storage.getItem('gm_user_logged_in') === 'true';
    const savedView = storage.getItem('gm_current_view');
    if (wasLoggedIn || savedView === 'editor') return 'editor';
    if (savedView === 'portal') return 'portal';
    return 'landing';
  });

  useEffect(() => {
    storage.setItem('gm_current_view', currentView);
  }, [currentView]);

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
  const cropSnapshot = useRef<{id: string; image: any} | null>(null);

  // General App configuration
  const [templateEditing, setTemplateEditing] = useState(false);
  const [workspaceScreen, setWorkspaceScreen] = useState<WorkspaceScreen>('create');
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchController = useRef<AbortController | null>(null);
  useEffect(() => () => batchController.current?.abort(), [user?.uid, currentView]);
  const [activeTab, setActiveTab] = useState<'presets' | 'phase1' | 'phase2'>('phase2');

  const handleTabChange = (targetTab: 'presets' | 'phase1' | 'phase2') => {
    setActiveTab(targetTab);
  };

  // --- MULTI-PAGE TEMPLATE AND COLLAGE AUTOMATION STATES ---
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [storedGeneratedPages, setGeneratedPages, pagesByTemplate, setPagesByTemplate] = useProjectPages(currentTemplateId);
  const generatedPages = useMemo(() => templateEditing ? [] : storedGeneratedPages, [templateEditing, storedGeneratedPages]);
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
    setEditingImageRegionId(null);
    cropSnapshot.current = null;
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
    if (generatedPages.length > 0) {
      const pageId = activePageData?.templatePageId;
      return pages.find(p => p.id === pageId) || pages[activeGeneratedPageIndex] || pages[0] || fallbackPage;
    }
    return pages[activePageIndex] || pages[0] || fallbackPage;
  }, [currentTemplate, activePageIndex, activeGeneratedPageIndex, generatedPages, activePageData?.templatePageId]);

  const editingTemplate = useMemo(() => {
    const pageRegions = (activePageData as any)?.regions ?? activeTemplatePage.regions ?? currentTemplate.regions ?? [];
    const pageFixed = (activePageData as any)?.fixedElements ?? activeTemplatePage.fixedElements ?? currentTemplate.fixedElements ?? [];
    return {
      ...currentTemplate,
      backgroundImageUrl: (activePageData as any)?.backgroundImageUrl ?? activeTemplatePage.backgroundImageUrl ?? currentTemplate.backgroundImageUrl,
      regions: pageRegions,
      fixedElements: pageFixed,
    };
  }, [currentTemplate, activeTemplatePage, activePageData]);

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportScale, setExportScale] = useState<number>(1.5); // 1.5x, 2x, 4x for Ultra-HD
  const [exportFiles, setExportFiles] = useState<{url:string; name:string; type:string}[]>([]);
  const exportUrls = useRef<string[]>([]);
  useEffect(() => () => exportUrls.current.forEach(url => URL.revokeObjectURL(url)), []);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});

  // AI Content Assistant
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiCollageBrief, setAiCollageBrief] = useState<string>('');
  const [aiProposal, setAiProposal] = useState<{texts: Record<string,string>; templateId: string; pageId?: string; regionId?: string; context: {id:string;name:string}[]} | null>(null);
  const [aiTextTarget, setAiTextTarget] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNoticeLocation, setAiNoticeLocation] = useState<'all' | 'fields'>('fields');
  const aiRequestRef = useRef<AbortController | null>(null);
  useEffect(() => {
    aiRequestRef.current?.abort();
    aiRequestRef.current = null;
    setAiTextTarget(null);
    setAiProposal(null);
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
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    const onError = () => setStorageError('Tarayıcı depolaması dolu veya kullanılamıyor. Son değişiklikler kaydedilemedi.');
    const onRestored = () => setStorageError(null);
    window.addEventListener('workspace-storage-error', onError);
    window.addEventListener('workspace-storage-restored', onRestored);

    // Auto-clean legacy duplicate storage entries on mount
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (storage.getItem('generated_pages_by_template')) {
          storage.removeItem('active_generated_pages');
        }
        storage.clearDisposableData();
      }
    } catch {}

    return () => {
      window.removeEventListener('workspace-storage-error', onError);
      window.removeEventListener('workspace-storage-restored', onRestored);
    };
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
    setTemplates(previous => previous.map(template => template.id === currentTemplateId
      ? {...template, palette: {...template.palette, boldHighlight: color}}
      : template));
  };
  useEffect(() => {
    const templateHighlight = currentTemplate.palette.boldHighlight || currentTemplate.palette.primary;
    if (templateHighlight && templateHighlight !== vurguColor) {
      setVurguColor(templateHighlight);
      storage.setItem('vurgu_color', templateHighlight);
    }
  }, [currentTemplateId, currentTemplate.palette.boldHighlight, currentTemplate.palette.primary]);

  // --- UI-UX REDESIGN STATES & HELPERS ---
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [leftDrawerTab, setLeftDrawerTab] = useState<ToolDrawerTab | null>(null);

  const handleDuplicateTemplate = (templateId: string) => {
    const target = templates.find(t => t.id === templateId);
    if (!target) return;
    const newId = `custom-tpl-${Date.now()}`;
    const duplicated: DesignTemplate = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Kopya)`,
      isCustom: true
    };
    setTemplates(prev => [duplicated, ...prev]);
    setCurrentTemplateId(newId);
    setSelectedNodeId(null);
  };

  const handleAddNewPage = () => {
    if (generatedPages.length > 0) {
      const lastPage = generatedPages[generatedPages.length - 1];
      const newPage = {
        id: `page-${Date.now()}`,
        templatePageId: lastPage.templatePageId || '1',
        name: `${generatedPages.length + 1}. Sayfa`,
        dynamicTexts: { ...lastPage.dynamicTexts },
        dynamicImages: { ...lastPage.dynamicImages },
        hiddenElements: []
      };
      setGeneratedPages([...generatedPages, newPage]);
      setActiveGeneratedPageIndex(generatedPages.length);
    } else {
      const pages = currentTemplate.pages || [];
      const newPage: TemplatePage = {
        id: `tpl-page-${Date.now()}`,
        name: `${pages.length + 1}. Sayfa`,
        regions: currentTemplate.regions ? JSON.parse(JSON.stringify(currentTemplate.regions)) : [],
        fixedElements: currentTemplate.fixedElements ? JSON.parse(JSON.stringify(currentTemplate.fixedElements)) : []
      };
      const nextPages = [...pages, newPage];
      setTemplates(prev => prev.map(t => t.id === currentTemplateId ? { ...t, pages: nextPages } : t));
      setActivePageIndex(nextPages.length - 1);
    }
  };

  const handleDuplicatePage = (index: number) => {
    if (generatedPages.length > 0) {
      const pageToDup = generatedPages[index];
      if (!pageToDup) return;
      const newPage = {
        ...JSON.parse(JSON.stringify(pageToDup)),
        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `${pageToDup.name || (index + 1) + '. Sayfa'} (Kopya)`
      };
      const next = [...generatedPages];
      next.splice(index + 1, 0, newPage);
      setGeneratedPages(next);
      setActiveGeneratedPageIndex(index + 1);
    } else {
      const pages = currentTemplate.pages || [];
      const pageToDup = pages[index] || { id: '1', name: 'Kapak', regions: currentTemplate.regions, fixedElements: currentTemplate.fixedElements };
      const newPage: TemplatePage = {
        ...JSON.parse(JSON.stringify(pageToDup)),
        id: `tpl-page-${Date.now()}`,
        name: `${pageToDup.name || (index + 1) + '. Sayfa'} (Kopya)`
      };
      const nextPages = [...pages];
      nextPages.splice(index + 1, 0, newPage);
      setTemplates(prev => prev.map(t => t.id === currentTemplateId ? { ...t, pages: nextPages } : t));
      setActivePageIndex(index + 1);
    }
  };

  const handleDeletePage = (index: number) => {
    if (generatedPages.length > 0) {
      if (generatedPages.length <= 1) return;
      const next = generatedPages.filter((_, i) => i !== index);
      setGeneratedPages(next);
      setActiveGeneratedPageIndex(Math.min(index, next.length - 1));
    } else {
      const pages = currentTemplate.pages || [];
      if (pages.length <= 1) return;
      const nextPages = pages.filter((_, i) => i !== index);
      setTemplates(prev => prev.map(t => t.id === currentTemplateId ? { ...t, pages: nextPages } : t));
      setActivePageIndex(Math.min(index, nextPages.length - 1));
    }
  };

  const handleReorderPages = (startIndex: number, endIndex: number) => {
    if (generatedPages.length > 0) {
      const result = Array.from(generatedPages);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      setGeneratedPages(result);
      setActiveGeneratedPageIndex(endIndex);
    } else {
      const pages = currentTemplate.pages || [];
      if (pages.length <= 1) return;
      const result = Array.from(pages);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      setTemplates(prev => prev.map(t => t.id === currentTemplateId ? { ...t, pages: result } : t));
      setActivePageIndex(endIndex);
    }
  };

  const handleDuplicateNode = (nodeId: string) => {
    const reg = editingTemplate.regions.find(r => r.id === nodeId);
    if (reg) {
      const newId = `region-${Date.now()}`;
      const newReg = {
        ...JSON.parse(JSON.stringify(reg)),
        id: newId,
        name: `${reg.name} (Kopya)`,
        x: Math.min(reg.x + 20, currentTemplate.width - reg.width),
        y: Math.min(reg.y + 20, currentTemplate.height - reg.height)
      };
      setTemplates(prev => prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return { ...p, regions: [...p.regions, newReg] };
            }
            return p;
          });
          return { ...t, pages: updatedPages, regions: updatedPages[0].regions, fixedElements: updatedPages[0].fixedElements };
        }
        return t;
      }));
      setSelectedNodeId(newId);
      return;
    }
    const el = editingTemplate.fixedElements.find(e => e.id === nodeId);
    if (el) {
      const newId = `fixed-${Date.now()}`;
      const newEl = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        name: `${el.name} (Kopya)`,
        x: Math.min(el.x + 20, currentTemplate.width - el.width),
        y: Math.min(el.y + 20, currentTemplate.height - el.height)
      };
      setTemplates(prev => prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (idx === activePageIndex) {
              return { ...p, fixedElements: [...p.fixedElements, newEl] };
            }
            return p;
          });
          return { ...t, pages: updatedPages, regions: updatedPages[0].regions, fixedElements: updatedPages[0].fixedElements };
        }
        return t;
      }));
      setSelectedNodeId(newId);
    }
  };

  const handleToggleLock = (nodeId: string) => {
    const reg = editingTemplate.regions.find(r => r.id === nodeId);
    if (reg) {
      const nextLocked = !reg.locked;
      handleRegionPropertyChange(nodeId, 'locked', nextLocked);
      if (nextLocked && editingImageRegionId === nodeId) {
        setEditingImageRegionId(null);
      }
      return;
    }
    const el = editingTemplate.fixedElements.find(e => e.id === nodeId);
    if (el) {
      handleFixedElementPropertyChange(nodeId, 'locked', !el.locked);
    }
  };

  const handleDynamicImageUpload = (regionId: string, file: File) => {
    void handleImageFile(file, regionId);
  };

  const handleCropPanTrigger = (regionId: string) => {
    const reg = editingTemplate.regions.find(r => r.id === regionId);
    if (reg?.locked) return;
    cropSnapshot.current = {id: regionId, image: {...activePageData.dynamicImages[regionId]}};
    setEditingImageRegionId(regionId);
    setSelectedNodeId(regionId);
  };

  const cancelCrop = () => {
    if (cropSnapshot.current) {
      const {id, image} = cropSnapshot.current;
      const keys: Array<'scale' | 'offsetX' | 'offsetY' | 'rotation'> = ['scale', 'offsetX', 'offsetY', 'rotation'];
      keys.forEach(key => updateActiveImageProp(id, key, image[key] ?? (key === 'scale' ? 1 : 0)));
    }
    cropSnapshot.current = null; setEditingImageRegionId(null);
  };
  useEffect(() => {
    if (!editingImageRegionId) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancelCrop(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [editingImageRegionId, activePageData.id]);

  const handleImageScaleChange = (regionId: string, scale: number) => {
    updateActiveImageProp(regionId, 'scale', scale);
  };

  const handleImageRotate90 = (regionId: string) => {
    const currentImg = activePageData.dynamicImages?.[regionId] || activeGraphicData.dynamicImages?.[regionId];
    const currentRot = currentImg?.rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    updateActiveImageProp(regionId, 'rotation', nextRot);
  };

  const handleFixedElementChange = (elemId: string, prop: string, value: any) => {
    handleFixedElementPropertyChange(elemId, prop as keyof FixedElement, value);
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteElement(nodeId);
  };

  const handleMediaUpload = (file: File) => {
    if (selectedNodeId) {
      const reg = editingTemplate.regions.find(r => r.id === selectedNodeId && r.type === 'image');
      if (reg) {
        void handleImageFile(file, reg.id);
        return;
      }
    }
    addImageRegionFromFile(file);
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
  }, [isAppLoaded, mobileView, workspaceScreen]);
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

    // Use active page dynamic texts, images, and hidden elements with safe fallbacks
    const texts = activePageData.dynamicTexts || {};
    const images = activePageData.dynamicImages || {};
    const hidden = activePageData.hiddenElements || [];

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
        boldHighlightColor: vurguColor,
        editingImageRegionId
      }
    );
  }, [editingTemplate, activePageData, activeGraphicData.paletteOverrides, showGrid, showSafeMargins, selectedNodeId, vurguColor, editingImageRegionId, isAppLoaded, mobileView, workspaceScreen]);

  // --- FIREBASE CLOUD STORAGE INTEGRATION & SYNCING ---
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const lastSavedRef = useRef<string>('');
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const graphicDataRef = useRef(graphicData);
  const pagesByTemplateRef = useRef(pagesByTemplate);
  const currentTemplateIdRef = useRef(currentTemplateId);
  graphicDataRef.current = graphicData;
  pagesByTemplateRef.current = pagesByTemplate;
  currentTemplateIdRef.current = currentTemplateId;

  const projectHash = (data: Record<string, GraphicData>, pages: Record<string, any[]>, templateId: string) =>
    JSON.stringify({graphicData:data, pagesByTemplate:pages, currentTemplateId:templateId});

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
      templatesRef.current = nextTemplates;
      setTemplatesState(nextTemplates);
      setGraphicData(nextData);
      setPagesByTemplate(nextPages);
      setCurrentTemplateId(nextId);
      setUndoStack([]);
      setRedoStack([]);
      lastSavedRef.current = JSON.stringify(nextTemplates);
      lastSavedProjectRef.current = projectHash(nextData, nextPages, nextId);
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
        setCloudInitialized(false);
        setUser(currentUser);
        const isVerified = currentUser.emailVerified || currentUser.providerData.some((p: any) => p.providerId === 'google.com');
        if (isVerified) {
          storage.setItem('gm_user_logged_in', 'true');
          storage.setItem('gm_current_view', 'editor');
          setCurrentView('editor');
        }
        await syncAndLoadUserData(currentUser.uid);
        isLoadedRef.current = true;
        setCloudInitialized(true);
        setIsAppLoaded(true);
      } else {
        setUser(null);
        storage.removeItem('gm_user_logged_in');
        setCurrentView((prev) => {
          if (prev === 'editor') {
            storage.setItem('gm_current_view', 'landing');
            return 'landing';
          }
          return prev;
        });
        setCloudStatus('offline');
        setCloudInitialized(false);
        isLoadedRef.current = true;
        setIsAppLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- REAL-TIME CLOUD SYNCHRONIZATION ---
  useEffect(() => {
    if (!isValidConfig || !user?.uid || user.isAnonymous || firestoreQuotaExceeded) return;
    const uid = user.uid;
    return subscribeUserGraphicProject(uid, async (saved, metadata) => {
      if (!saved || metadata.hasPendingWrites || metadata.fromCache || auth.currentUser?.uid !== uid) return;
      const nextTemplates: DesignTemplate[] = Array.isArray(saved.templates) && saved.templates.length ? saved.templates : templatesRef.current;
      const nextId = nextTemplates.some(template => template.id === saved.currentTemplateId)
        ? saved.currentTemplateId : nextTemplates[0]?.id || currentTemplateIdRef.current;
      const nextData = saved.graphicData || {};
      const nextPages = saved.pagesByTemplate || {[nextId]:saved.generatedPages || []};
      const remoteTemplatesHash = JSON.stringify(nextTemplates);
      const remoteProjectHash = projectHash(nextData, nextPages, nextId);
      const localTemplatesHash = JSON.stringify(templatesRef.current);
      const localProjectHash = projectHash(graphicDataRef.current, pagesByTemplateRef.current, currentTemplateIdRef.current);

      if (remoteTemplatesHash === localTemplatesHash && remoteProjectHash === localProjectHash) {
        lastSavedRef.current = remoteTemplatesHash;
        lastSavedProjectRef.current = remoteProjectHash;
        storage.setItem('project_dirty', 'false');
        setIsCloudSynced(true);
        setCloudStatus('synced');
        return;
      }
      // Never overwrite unsaved local edits. The debounce below sends the newer local snapshot.
      if (storage.getItem('project_dirty') === 'true' || saveInFlightRef.current) return;

      restoringHistory.current = true;
      templatesRef.current = nextTemplates;
      setTemplatesState(nextTemplates);
      setGraphicData(nextData);
      setPagesByTemplate(nextPages);
      setCurrentTemplateId(nextId);
      setUndoStack([]);
      setRedoStack([]);
      lastSavedRef.current = remoteTemplatesHash;
      lastSavedProjectRef.current = remoteProjectHash;
      storage.setItem('project_dirty', 'false');
      setIsCloudSynced(true);
      setCloudStatus('synced');
    }, error => {
      console.error('Real-time cloud sync failed:', error);
      setCloudError('Firestore gerçek zamanlı bağlantısı kurulamadı. Güvenlik kurallarını ve internet bağlantısını kontrol edin.');
      setCloudStatus('error');
      setIsCloudSynced(false);
    });
  }, [user?.uid, user?.isAnonymous, firestoreQuotaExceeded]);

  // Synchronize Firestore network state with firestoreQuotaExceeded state to prevent infinite background write retries and console spam
  useEffect(() => {
    if (!isValidConfig) return;
    if (firestoreQuotaExceeded) {
      disableFirestoreNetwork();
    } else {
      enableFirestoreNetwork();
    }
  }, [firestoreQuotaExceeded]);

  // Debounced, serialized autosave. If state changes during an upload, one final snapshot is queued.
  const saveDataToCloud = async () => {
    if (!isValidConfig || !auth.currentUser?.uid || auth.currentUser.isAnonymous || firestoreQuotaExceeded) return;
    if (saveInFlightRef.current) { saveQueuedRef.current = true; return; }
    saveInFlightRef.current = true;
    try {
      do {
        saveQueuedRef.current = false;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const templatesToSave = templatesRef.current;
        const id = currentTemplateIdRef.current;
        const data = graphicDataRef.current;
        const allPages = pagesByTemplateRef.current;
        const savedTemplates = JSON.stringify(templatesToSave);
        const savedProject = projectHash(data, allPages, id);
        setCloudStatus('syncing');
        setCloudError(null);
        await Promise.race([
          saveUserGraphicProject(uid, id, data, allPages[id] || [], templatesToSave, allPages),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(Object.assign(new Error('Bulut kaydı zaman aşımına uğradı.'), {code:'sync/timeout'})), 30_000)),
        ]);
        lastSavedRef.current = savedTemplates;
        lastSavedProjectRef.current = savedProject;
        const unchanged = savedTemplates === JSON.stringify(templatesRef.current) &&
          savedProject === projectHash(graphicDataRef.current, pagesByTemplateRef.current, currentTemplateIdRef.current);
        storage.setItem('project_dirty', unchanged ? 'false' : 'true');
        setIsCloudSynced(unchanged);
        setCloudStatus(unchanged ? 'synced' : 'syncing');
        if (!unchanged) saveQueuedRef.current = true;
      } while (saveQueuedRef.current);
    } catch (error: any) {
      console.error('Cloud save failed:', error);
      if (/resource-exhausted|quota/i.test(String(error?.code || error?.message || ''))) setFirestoreQuotaExceeded(true);
      const detail = String(error?.code || error?.message || '');
      setCloudError(/storage\/|media\//i.test(detail)
        ? 'Medya yedeklemesi tamamlanamadı. Cloudinary bağlantısını ve dosya sınırını kontrol edin.'
        : /permission-denied/i.test(detail)
          ? 'Firestore erişimi reddedildi. Canlı güvenlik kurallarının yayımlandığını kontrol edin.'
          : 'Bulut kaydı tamamlanamadı. İnternet bağlantısını ve Firebase yapılandırmasını kontrol edin.');
      setCloudStatus('error');
      setIsCloudSynced(false);
    } finally {
      saveInFlightRef.current = false;
    }
  };
  useEffect(() => {
    if (!user?.uid || user.isAnonymous || !cloudInitialized || !isLoadedRef.current || firestoreQuotaExceeded || cloudStatus === 'error') return;
    const unchanged = JSON.stringify(templates) === lastSavedRef.current &&
      projectHash(graphicData, pagesByTemplate, currentTemplateId) === lastSavedProjectRef.current;
    setIsCloudSynced(unchanged);
    if (unchanged) return;
    storage.setItem('project_dirty', 'true');
    const timer = window.setTimeout(() => void saveDataToCloud(), 1800);
    return () => window.clearTimeout(timer);
  }, [templates, graphicData, pagesByTemplate, currentTemplateId, user?.uid, user?.isAnonymous, firestoreQuotaExceeded, cloudInitialized]);

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
        storage.setItem('gm_user_logged_in', 'true');
        storage.setItem('gm_current_view', 'editor');
        setCurrentView('editor');
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
      storage.removeItem('gm_user_logged_in');
      storage.setItem('gm_current_view', 'landing');
      setCloudStatus('offline');
      setCurrentView('landing');
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

  // Remove obsolete active_generated_pages duplicate key if present
  useEffect(() => {
    try {
      if (storage.getItem('active_generated_pages')) {
        storage.removeItem('active_generated_pages');
      }
    } catch {}
  }, []);

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
      if (/^https?:\/\//i.test(dataUrl)) img.crossOrigin = 'anonymous';
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

  const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.76): Promise<string> => {
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

  const updateTemplateBackground = (backgroundImageUrl?: string) => {
    setTemplates(prev => {
      const updated = prev.map(template => {
        if (template.id !== currentTemplateId) return template;

        const templateWithPages = ensureMultiPageSupport(template);
        // Store the asset once on the template. Page-level values are cleared so
        // every page consistently inherits the same fixed background without
        // duplicating a large data URL in local/cloud persistence.
        const pages = (templateWithPages.pages || []).map(page => ({
          ...page,
          backgroundImageUrl: undefined
        }));

        return {
          ...templateWithPages,
          backgroundImageUrl,
          pages
        };
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleTemplateBackgroundUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      window.alert('Lütfen geçerli bir görsel dosyası seçin.');
      return;
    }

    const backgroundImageUrl = await compressImage(file, 2400, 2400, 0.9);
    if (!backgroundImageUrl) {
      window.alert('Arka plan görseli hazırlanamadı.');
      return;
    }
    updateTemplateBackground(backgroundImageUrl);
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
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, [prop]: value} : node)
      } : page));
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleRegionPropertiesChange = (regionId: string, updates: Partial<Region>) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, ...updates} : node)
      } : page));
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementPropertiesChange = (elementId: string, updates: Partial<FixedElement>) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        fixedElements: (page.fixedElements ?? editingTemplate.fixedElements).map(node => node.id === elementId ? {...node, ...updates} : node)
      } : page));
    }
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleRegionTextStyleChange = (regionId: string, prop: keyof TextStyle, value: any) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        regions: (page.regions ?? editingTemplate.regions).map(node => node.id === regionId ? {...node, textStyle: {...node.textStyle, [prop]: value}} : node)
      } : page));
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementPropertyChange = (elementId: string, prop: keyof FixedElement, value: any) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        fixedElements: (page.fixedElements ?? editingTemplate.fixedElements).map(node => node.id === elementId ? {...node, [prop]: value} : node)
      } : page));
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  const handleFixedElementTextStyleChange = (elementId: string, prop: keyof TextStyle, value: any) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((page, idx) => idx === activeGeneratedPageIndex ? {
        ...page,
        fixedElements: (page.fixedElements ?? editingTemplate.fixedElements).map(node => node.id === elementId ? {...node, textStyle: {...node.textStyle, [prop]: value}} : node)
      } : page));
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
          };
        }
        return t;
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
  };

  // Align selected layer on canvas (center, align sides, snap margins)
  const handleAlignElement = (
    id: string,
    alignment: 'left' | 'safe-left' | 'center-x' | 'right' | 'safe-right' | 'top' | 'safe-top' | 'center-y' | 'bottom' | 'safe-bottom' | 'center-both' | 'fit-width' | 'fit-width-safe' | 'fit-canvas'
  ) => {
    const canvasW = currentTemplate.width || 1080;
    const canvasH = currentTemplate.height || 1080;
    const safePadding = 40;

    const reg = editingTemplate.regions.find(r => r.id === id);
    if (reg) {
      if (reg.locked) return;
      let newX = reg.x;
      let newY = reg.y;
      let newW = reg.width;
      let newH = reg.height;

      switch (alignment) {
        case 'left': newX = 0; break;
        case 'safe-left': newX = safePadding; break;
        case 'center-x': newX = Math.round((canvasW - reg.width) / 2); break;
        case 'right': newX = Math.round(canvasW - reg.width); break;
        case 'safe-right': newX = Math.round(canvasW - reg.width - safePadding); break;
        case 'top': newY = 0; break;
        case 'safe-top': newY = safePadding; break;
        case 'center-y': newY = Math.round((canvasH - reg.height) / 2); break;
        case 'bottom': newY = Math.round(canvasH - reg.height); break;
        case 'safe-bottom': newY = Math.round(canvasH - reg.height - safePadding); break;
        case 'center-both':
          newX = Math.round((canvasW - reg.width) / 2);
          newY = Math.round((canvasH - reg.height) / 2);
          break;
        case 'fit-width':
          newX = 0;
          newW = canvasW;
          break;
        case 'fit-width-safe':
          newX = safePadding;
          newW = Math.max(80, canvasW - (safePadding * 2));
          break;
        case 'fit-canvas':
          newX = 0;
          newY = 0;
          newW = canvasW;
          newH = canvasH;
          break;
      }

      handleRegionPropertiesChange(id, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    const el = editingTemplate.fixedElements.find(e => e.id === id);
    if (el) {
      if (el.locked) return;
      const isCircle = el.type === 'shape' && el.shapeType === 'circle';
      let newX = el.x;
      let newY = el.y;
      let newW = el.width;
      let newH = el.height;

      switch (alignment) {
        case 'left': newX = isCircle ? Math.round(el.width / 2) : 0; break;
        case 'safe-left': newX = isCircle ? Math.round(safePadding + el.width / 2) : safePadding; break;
        case 'center-x': newX = isCircle ? Math.round(canvasW / 2) : Math.round((canvasW - el.width) / 2); break;
        case 'right': newX = isCircle ? Math.round(canvasW - el.width / 2) : Math.round(canvasW - el.width); break;
        case 'safe-right': newX = isCircle ? Math.round(canvasW - el.width / 2 - safePadding) : Math.round(canvasW - el.width - safePadding); break;
        case 'top': newY = isCircle ? Math.round(el.height / 2) : 0; break;
        case 'safe-top': newY = isCircle ? Math.round(safePadding + el.height / 2) : safePadding; break;
        case 'center-y': newY = isCircle ? Math.round(canvasH / 2) : Math.round((canvasH - el.height) / 2); break;
        case 'bottom': newY = isCircle ? Math.round(canvasH - el.height / 2) : Math.round(canvasH - el.height); break;
        case 'safe-bottom': newY = isCircle ? Math.round(canvasH - el.height / 2 - safePadding) : Math.round(canvasH - el.height - safePadding); break;
        case 'center-both':
          newX = isCircle ? Math.round(canvasW / 2) : Math.round((canvasW - el.width) / 2);
          newY = isCircle ? Math.round(canvasH / 2) : Math.round((canvasH - el.height) / 2);
          break;
        case 'fit-width':
          newX = isCircle ? Math.round(canvasW / 2) : 0;
          newW = canvasW;
          break;
        case 'fit-width-safe':
          newX = isCircle ? Math.round(canvasW / 2) : safePadding;
          newW = Math.max(80, canvasW - (safePadding * 2));
          break;
        case 'fit-canvas':
          newX = isCircle ? Math.round(canvasW / 2) : 0;
          newY = isCircle ? Math.round(canvasH / 2) : 0;
          newW = canvasW;
          newH = canvasH;
          break;
      }

      handleFixedElementPropertiesChange(id, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  const centerSelectedLayer = (axis: 'horizontal' | 'vertical' | 'both') => {
    if (!selectedNodeId) return;
    if (axis === 'horizontal') handleAlignElement(selectedNodeId, 'center-x');
    else if (axis === 'vertical') handleAlignElement(selectedNodeId, 'center-y');
    else handleAlignElement(selectedNodeId, 'center-both');
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
        setGraphicData(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setPagesByTemplate(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

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

  const deleteArchivedWorks = (ids: string[]) => {
    const workIds = new Set(ids.filter(id => templates.some(template => template.id === id && template.sourceTemplateId)));
    if (!workIds.size) return;
    setConfirmDialog({
      isOpen: true,
      title: workIds.size === 1 ? 'Çalışmayı arşivden sil' : `${workIds.size} çalışmayı arşivden sil`,
      message: 'Seçilen çalışmalar ve oluşturulmuş sayfaları kalıcı olarak silinecek. Kaynak şablonlar korunacak.',
      onConfirm: () => {
        const updated = templates.filter(template => !workIds.has(template.id));
        setTemplates(updated);
        saveTemplatesToLocalStorage(updated);
        setGraphicData(previous => {
          const next = { ...previous };
          workIds.forEach(id => delete next[id]);
          return next;
        });
        setPagesByTemplate(previous => {
          const next = { ...previous };
          workIds.forEach(id => delete next[id]);
          return next;
        });
        const deletedIds: string[] = JSON.parse(storage.getItem('deleted_template_ids') || '[]');
        storage.setItem('deleted_template_ids', JSON.stringify([...new Set([...deletedIds, ...workIds])]));
        if (isValidConfig && !firestoreQuotaExceeded) {
          void Promise.all([...workIds].map(id => deleteCloudTemplate(id).catch(error => console.error('Failed to delete archived work:', error))));
        }
        if (workIds.has(currentTemplateId)) {
          const fallback = updated.find(template => !template.sourceTemplateId) || updated[0];
          if (fallback) setCurrentTemplateId(fallback.id);
        }
        setSelectedNodeId(null);
        setConfirmDialog(null);
      },
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
  const addNewFixedElement = (type: 'logo' | 'social' | 'shape', shapeType: 'rect' | 'circle' = 'rect') => {
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
      name: shapeType === 'circle' ? 'Dekoratif Daire' : 'Dekoratif Dikdörtgen',
      x: 80,
      y: 130,
      width: 100,
      height: 4,
      shapeType,
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

  const addDesignDecoration = (preset: 'badge' | 'ribbon' | 'divider' | 'icon' | 'logo' | 'watermark') => {
    const stamp = Date.now();
    const id = `decoration-${preset}-${stamp}`;
    const accent = currentTemplate.palette?.accent || '#FF9F0A';
    const primary = currentTemplate.palette?.primary || '#FF6B1A';
    const textColor = currentTemplate.palette?.text || '#FFFFFF';
    let region: Region | undefined;
    let fixed: FixedElement | undefined;

    if (preset === 'badge' || preset === 'ribbon') {
      region = {
        id,
        name: preset === 'badge' ? 'Rozet' : 'Kurdele',
        type: 'text',
        x: Math.round(currentTemplate.width * 0.08),
        y: Math.round(currentTemplate.height * (preset === 'badge' ? 0.08 : 0.16)),
        width: Math.round(currentTemplate.width * (preset === 'badge' ? 0.24 : 0.42)),
        height: Math.round(currentTemplate.height * 0.08),
        backgroundColor: preset === 'badge' ? accent : primary,
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: preset === 'badge' ? 999 : 8,
        rotation: preset === 'ribbon' ? -5 : 0,
        fitBackgroundToText: true,
        hasBackground: true,
        isDynamic: true,
        textRole: 'label',
        placeholderText: preset === 'badge' ? 'YENİ' : 'ÖNE ÇIKAN',
        textStyle: {fontFamily: 'Inter', fontSize: 22, color: '#FFFFFF', fontWeight: 'bold', lineHeight: 1, align: 'center', letterSpacing: 1}
      };
    } else if (preset === 'divider') {
      fixed = {id, type: 'shape', shapeType: 'line', name: 'Ayırıcı Çizgi', x: Math.round(currentTemplate.width * 0.1), y: Math.round(currentTemplate.height * 0.5), width: Math.round(currentTemplate.width * 0.8), height: 3, color: accent, opacity: 1};
    } else if (preset === 'icon') {
      fixed = {id, type: 'social', name: 'İkon', x: Math.round(currentTemplate.width * 0.08), y: Math.round(currentTemplate.height * 0.86), width: 80, height: 50, iconType: 'globe', content: '', textStyle: {fontFamily: 'Inter', fontSize: 30, color: accent, fontWeight: 'bold', lineHeight: 1, align: 'left'}};
    } else if (preset === 'logo') {
      fixed = {id, type: 'logo', name: 'Logo Alanı', x: Math.round(currentTemplate.width * 0.08), y: Math.round(currentTemplate.height * 0.07), width: Math.round(currentTemplate.width * 0.35), height: 50, content: '✦ MARKANIZ', textStyle: {fontFamily: 'Space Grotesk', fontSize: 22, color: primary, fontWeight: 'bold', lineHeight: 1, align: 'left', letterSpacing: 2}};
    } else {
      fixed = {id, type: 'text', name: 'Filigran', x: Math.round(currentTemplate.width * 0.15), y: Math.round(currentTemplate.height * 0.44), width: Math.round(currentTemplate.width * 0.7), height: 100, content: 'MARKANIZ', opacity: 0.14, rotation: -24, locked: true, zIndex: 50, textStyle: {fontFamily: 'Space Grotesk', fontSize: 72, color: textColor, fontWeight: '900', lineHeight: 1, align: 'center', letterSpacing: 5}};
    }

    setTemplates(previous => {
      const updated = previous.map(template => {
        if (template.id !== currentTemplateId) return template;
        const normalized = ensureMultiPageSupport(template);
        const pages = normalized.pages!.map((page, index) => index === activePageIndex ? {
          ...page,
          regions: region ? [...page.regions, region] : page.regions,
          fixedElements: fixed ? [...page.fixedElements, fixed] : page.fixedElements
        } : page);
        return {...template, pages, regions: pages[0].regions, fixedElements: pages[0].fixedElements};
      });
      saveTemplatesToLocalStorage(updated);
      return updated;
    });
    setSelectedNodeId(id);
  };

  // Delete element from current template
  const deleteElement = (id: string) => {
    if (generatedPages.length > 0) {
      setGeneratedPages(prev => prev.map((p, idx) => idx === activeGeneratedPageIndex ? {
        ...p,
        regions: (p.regions ?? editingTemplate.regions).filter(r => r.id !== id),
        fixedElements: (p.fixedElements ?? editingTemplate.fixedElements).filter(el => el.id !== id)
      } : p));
    }
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === currentTemplateId) {
          const pageWithFallback = ensureMultiPageSupport(t);
          const updatedPages = pageWithFallback.pages!.map((p, idx) => {
            if (p.id === activeTemplatePage.id || idx === activePageIndex) {
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
            regions: updatedPages[0]?.regions ?? t.regions,
            fixedElements: updatedPages[0]?.fixedElements ?? t.fixedElements
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
    const nodes = [...(editingTemplate.regions || []), ...(editingTemplate.fixedElements || [])];
    const current = nodes.find(node => node.id === id);
    if (!current) return;
    const zIndexes = nodes.map(node => node.zIndex ?? 0);
    const nextZ = direction === 'front' ? Math.max(0, ...zIndexes) + 1
      : direction === 'back' ? Math.min(0, ...zIndexes) - 1
        : (current.zIndex ?? 0) + (direction === 'up' ? 1 : -1);
    if ((editingTemplate.regions || []).some(region => region.id === id)) {
      handleRegionPropertiesChange(id, {zIndex: nextZ});
    } else {
      handleFixedElementPropertiesChange(id, {zIndex: nextZ});
    }
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
      const activeReg = (editingTemplate.regions || []).find(r => r.id === editingImageRegionId);
      if (activeReg && !activeReg.locked) {
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
      } else {
        setEditingImageRegionId(null);
      }
    }

    // First check if user clicked on any resize handles of the currently selected node
    let isResizeAction = false;
    let hitHandle: 'TL' | 'TR' | 'BL' | 'BR' | null = null;
    let selectedElType: 'region' | 'fixed' | null = null;
    let selectedEl: any = null;

    if (selectedNodeId) {
      const region = (editingTemplate.regions || []).find(r => r.id === selectedNodeId);
      if (region) {
        selectedEl = region;
        selectedElType = 'region';
      } else {
        const fixed = (editingTemplate.fixedElements || []).find(el => el.id === selectedNodeId);
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

    if (isResizeAction && selectedEl && !selectedEl.locked && hitHandle) {
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

    // Find topmost UNLOCKED element at click coordinates (locked layers pass-through)
    const hitTarget = findTopmostUnlockedElement(
      editingTemplate,
      x,
      y,
      activeGraphicData.hiddenElements || []
    );

    if (hitTarget) {
      setSelectedNodeId(hitTarget.id);
      const activeEl = hitTarget.item;
      if (activeEl && !activeEl.locked) {
        dragStartRef.current = {
          elementId: hitTarget.id,
          elementType: hitTarget.type,
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
      const region = editingTemplate.regions.find(r => r.id === ref.elementId);
      if (!region || region.locked) {
        dragStartRef.current = null;
        setIsDragging(false);
        return;
      }

      let newOffsetX = Math.round(ref.startX + dx);
      let newOffsetY = Math.round(ref.startY + dy);

      // Görselin pan (kaydırma) sınırlarını hesaplama ve clamp işlemi (bölge dışına çıkmayı önleme)
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
      const isLocked = ref.elementType === 'region'
        ? editingTemplate.regions.find(r => r.id === ref.elementId)?.locked
        : editingTemplate.fixedElements.find(el => el.id === ref.elementId)?.locked;
      if (isLocked) {
        dragStartRef.current = null;
        setIsDragging(false);
        return;
      }

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
      const isLocked = dragStartRef.current.elementType === 'region'
        ? editingTemplate.regions.find(r => r.id === dragStartRef.current?.elementId)?.locked
        : editingTemplate.fixedElements.find(el => el.id === dragStartRef.current?.elementId)?.locked;
      if (isLocked) {
        dragStartRef.current = null;
        setIsDragging(false);
        return;
      }

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

    // Find topmost UNLOCKED element under double click (locked layers pass-through)
    const hitTarget = findTopmostUnlockedElement(
      editingTemplate,
      x,
      y,
      activeGraphicData.hiddenElements || []
    );

    if (!hitTarget) return;

    if (hitTarget.type === 'region') {
      const reg = hitTarget.item as Region;
      if (reg.type === 'image') {
        handleCropPanTrigger(reg.id);
      } else if (reg.type === 'text') {
        setSelectedNodeId(reg.id);
        setTimeout(() => {
          const textarea = document.getElementById('text-inspector-input') as HTMLTextAreaElement;
          if (textarea) textarea.focus();
        }, 50);
      } else {
        setSelectedNodeId(reg.id);
      }
    } else {
      setSelectedNodeId(hitTarget.id);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      const targetRegionId = editingImageRegionId || (selectedNodeId && (editingTemplate.regions || []).find(r => r.id === selectedNodeId && r.type === 'image')?.id);
      if (!targetRegionId) return;

      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const scaleX = currentTemplate.width / rect.width;
      const scaleY = currentTemplate.height / rect.height;

      const x = relativeX * scaleX;
      const y = relativeY * scaleY;

      const reg = editingTemplate.regions.find(r => r.id === targetRegionId);
      if (reg && !reg.locked) {
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
  const triggerAiGenerator = async (regionId?: string, brief = aiCollageBrief) => {
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
      const visualSources = [
        ...Object.values(activePageData.dynamicImages || {}).flatMap((item: any) => [item?.thumbnailUrl, item?.url]),
        ...(editingTemplate.regions || []).filter(region => region.type === 'image').map(region => region.placeholderImage),
        editingTemplate.backgroundImageUrl,
      ].filter((source): source is string => typeof source === 'string' && /^(data:image\/|blob:|https?:\/\/)/i.test(source));
      for (const source of visualSources) {
        try {
          image = await compressDataUrl(source, 360, 360, 0.6);
          if (image) break;
        } catch { /* Try the next visual on the page. */ }
      }
      if (controller.signal.aborted) throw controller.signal.reason;
      const texts = await requestAiText({
        systemPrompt:currentTemplate.aiSystemPrompt || '', templateName:currentTemplate.name,
        brief, fields, context, ...(image ? {image} : {}),
      }, controller.signal);
      if (controller.signal.aborted || aiRequestRef.current !== controller) return;
      setAiProposal({texts, templateId, pageId, regionId, context: fields});

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

  const applyAiProposal = () => {
    if (!aiProposal) return;
    const {texts, templateId, pageId} = aiProposal;
    if (pageId) setGeneratedPages(pages => pages.map(page => page.id === pageId ? {...page, dynamicTexts: {...page.dynamicTexts, ...texts}} : page), templateId);
    else setGraphicData(prev => ({...prev, [templateId]: {...(prev[templateId] || activeGraphicData), dynamicTexts: {...(prev[templateId]?.dynamicTexts || activeGraphicData.dynamicTexts), ...texts}}}));
    setAiProposal(null); setAiSuccessMessage('Öneri uygulandı.');
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
  const exportPages = async (pages: any[], asZip = false, format = exportFormat, scale = exportScale) => {
    if (isExporting || isExportingZip) return;
    resetExportResults();
    setIsExporting(!asZip);
    setIsExportingZip(asZip);
    try {
      const zip = asZip ? new (await import('jszip')).default() : null;
      for (const [index, page] of pages.entries()) {
        setExportStatusText(`${index + 1} / ${pages.length} sayfa hazırlanıyor…`);
        const {blob, extension} = await createExportAsset(currentTemplate, page, {
          format, scale, highlightColor:vurguColor, boldHighlightColor:vurguColor,
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
  const downloadArchivedWorks = async (ids: string[]) => {
    const works = ids.map(id => templates.find(template => template.id === id)).filter((template): template is DesignTemplate => !!template?.sourceTemplateId);
    if (!works.length || isExportingZip) return;
    resetExportResults();
    setIsExportingZip(true);
    try {
      const Zip = (await import('jszip')).default;
      const zip = new Zip();
      const total = works.reduce((sum, work) => sum + (pagesByTemplate[work.id]?.length || 0), 0);
      let completed = 0;
      for (const work of works) {
        const pages = pagesByTemplate[work.id] || [];
        for (const [index, page] of pages.entries()) {
          setExportStatusText(`${completed + 1} / ${total} tasarım hazırlanıyor…`);
          const { blob, extension } = await createExportAsset(work, page, {
            format: exportFormat,
            scale: exportScale,
            highlightColor: vurguColor,
            boldHighlightColor: vurguColor,
            paletteOverrides: graphicData[work.id]?.paletteOverrides,
            onProgress: percent => setExportStatusText(`${completed + 1} / ${total} · %${percent}`),
          });
          zip.file(`${safeFileName(work.name)}/${String(index + 1).padStart(2, '0')}.${extension}`, blob);
          completed++;
        }
      }
      publishExport(await zip.generateAsync({ type: 'blob' }), `grafik-motoru-arsiv-${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (error) {
      setConfirmDialog({ isOpen: true, title: 'Arşiv indirilemedi', message: error instanceof Error ? error.message : 'Dosyalar hazırlanırken bir hata oluştu.', type: 'info', onConfirm: () => setConfirmDialog(null) });
    } finally {
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

  const runBatch = async (source: DesignTemplate, media: SequenceMediaItem[], brief: string) => {
    if (batchController.current) return;
    const controller = new AbortController();
    batchController.current = controller;
    setBatchBusy(true); setBatchError(null); setBatchProgress('Sayfalar hazırlanıyor…');
    try {
      const snapshot = structuredClone(ensureMultiPageSupport(source));
      const draft = buildBatchPages(snapshot, media);
      const pages = await generateBatchTexts(snapshot, draft, brief, {
        signal: controller.signal, onProgress: (n, total) => setBatchProgress(`Metinler oluşturuluyor · ${n}/${total}`),
        prepareImage: source => compressDataUrl(source, 360, 360, 0.6),
      });
      if (controller.signal.aborted) return;
      const id = `work-${crypto.randomUUID()}`;
      const work = { ...snapshot, id, sourceTemplateId: source.id, productionBrief: brief,
        createdAt: new Date().toISOString(), name: `${source.name} · ${new Date().toLocaleString('tr-TR')}` };
      setTemplates(prev => [...prev, work]);
      setGeneratedPages(pages, id);
      setGraphicData(prev => ({ ...prev, [id]: { templateId: id, dynamicTexts: {}, dynamicImages: {}, hiddenElements: [] } }));
      setCurrentTemplateId(id); setActiveGeneratedPageIndex(0); setSelectedNodeId(null);
      setTemplateEditing(false); setActiveTab('phase2'); setWorkspaceScreen('results');
    } catch (error) {
      setBatchError(controller.signal.aborted ? 'Üretim iptal edildi. Fotoğrafların ve komutun korundu.' : error instanceof Error ? error.message : 'Üretim tamamlanamadı.');
    } finally { batchController.current = null; setBatchBusy(false); }
  };
  const retryBatch = async () => {
    if (batchController.current) return;
    const controller = new AbortController(); batchController.current = controller;
    const id = currentTemplateId;
    setBatchBusy(true); setBatchError(null);
    try {
      const pages = await generateBatchTexts(currentTemplate, generatedPages, currentTemplate.productionBrief || '', {
        signal: controller.signal, retryOnly: true, onProgress: (n, total) => setBatchProgress(`Yeniden deneniyor · ${n}/${total}`),
        prepareImage: source => compressDataUrl(source, 360, 360, 0.6),
      });
      setGeneratedPages(pages, id);
    } catch (error) { setBatchError(error instanceof Error ? error.message : 'Yeniden deneme tamamlanamadı.'); }
    finally { batchController.current = null; setBatchBusy(false); }
  };

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
  if (currentView === 'landing') {
    const isLoggedIn = !!user || storage.getItem('gm_user_logged_in') === 'true';
    return (
      <LandingPage 
        isLoggedIn={isLoggedIn}
        onEnter={() => {
          setWorkspaceScreen('create');
          if (isLoggedIn) {
            storage.setItem('gm_current_view', 'editor');
            setCurrentView('editor');
          } else {
            storage.setItem('gm_current_view', 'portal');
            setCurrentView('portal');
          }
        }} 
        onLogin={() => {
          setWorkspaceScreen('create');
          if (isLoggedIn) {
            storage.setItem('gm_current_view', 'editor');
            setCurrentView('editor');
          } else {
            storage.setItem('gm_current_view', 'portal');
            setCurrentView('portal');
          }
        }}
      />
    );
  }

  // --- AUTH PORTAL ---
  if (currentView === 'portal') {
    return (
      <AuthPortal
        onBackToLanding={() => {
          storage.setItem('gm_current_view', 'landing');
          setCurrentView('landing');
        }}
        onCompleteAuth={(authedUser) => {
          setUser(authedUser);
          storage.setItem('gm_user_logged_in', 'true');
          storage.setItem('gm_current_view', 'editor');
          setWorkspaceScreen('create');
          setCurrentView('editor');
        }}
      />
    );
  }

  return (
    <div id="graphics-engine-app" data-export-open={exportPanelOpen} data-workspace-screen={workspaceScreen} className="h-[100dvh] bg-[#1D1D1F] dark:bg-[#1D1D1F] text-[rgba(255,255,255,0.95)] dark:text-[rgba(255,255,255,0.95)] font-sans flex flex-col selection:bg-[#FF6B1A] selection:text-[rgba(255,255,255,0.95)] overflow-hidden relative transition-colors duration-300">
      <WorkspaceHeader
        templateName={currentTemplate.name}
        isDark={isDarkMode} onTheme={() => setIsDarkMode(v => !v)}
        userName={user && !user.isAnonymous ? user.displayName || 'Hesabım' : null}
        user={user}
        cloudStatus={cloudStatus} isCloudSynced={isCloudSynced}
        onLogin={handleGoogleLogin} onLogout={handleLogout} isSigningIn={isGoogleSigningIn}
        onSave={() => saveDataToCloud()} onTools={() => setIsToolsModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
        exportPanelOpen={isExportModalOpen}
        onOpenBatch={() => {
          setTemplateEditing(false);
          setWorkspaceScreen('create');
        }}
        isBatchActive={workspaceScreen === 'create'}
        onRename={(newName) => {
          if (!newName.trim()) return;
          setTemplates(prev => prev.map(t => t.id === currentTemplateId ? { ...t, name: newName.trim() } : t));
        }}
        onUserUpdated={async () => {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
          }
        }}
        onOpenTemplates={() => {
          if (!batchBusy) setWorkspaceScreen('works');
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        editorMode={workspaceScreen === 'editor'}
      />
      {cloudError && (
        <div className="workspace-warning flex items-center justify-between gap-3 border-b border-red-500/25 bg-red-500/10 px-4 py-2.5 text-xs text-red-200 sm:px-6" role="alert">
          <span><strong>Bulut senkronizasyonu:</strong> {cloudError} Çalışmanız bu cihazda korunuyor.</span>
          <button
            type="button"
            onClick={() => {
              setCloudError(null);
              setCloudStatus('idle');
              window.setTimeout(() => void saveDataToCloud(), 0);
            }}
            className="shrink-0 rounded px-2 py-1 font-bold text-red-200 hover:bg-white/10"
          >
            Yeniden dene
          </button>
        </div>
      )}
      {storageError && (
        <div 
          className="workspace-warning bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs sm:text-sm z-40 transition-colors"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Tarayıcı Depolama Uyarısı:</strong> {storageError} Tarayıcı yerel hafızası dolu olduğu için son değişiklikler kaydedilemedi.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                storage.clearDisposableData();
                const probeKey = '__gm_probe__';
                try {
                  window.localStorage.setItem(probeKey, '1');
                  window.localStorage.removeItem(probeKey);
                  setStorageError(null);
                } catch {
                  storage.clearAllCache();
                  setStorageError(null);
                }
              }}
              className="px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-amber-200 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition shrink-0"
              title="Gereksiz önbellek dosyalarını temizleyerek yer açar"
            >
              Önbelleği Temizle
            </button>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-white hover:text-white rounded bg-white/10 hover:bg-white/20 transition shrink-0"
            >
              Çalışmayı İndir
            </button>
            <button
              type="button"
              onClick={() => setStorageError(null)}
              className="text-xs font-bold text-amber-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition shrink-0"
              aria-label="Kapat"
            >
              ✕ Kapat
            </button>
          </div>
        </div>
      )}
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

      {workspaceScreen !== 'editor' && (
        <ProductionNavigation
          screen={workspaceScreen}
          disabled={batchBusy}
          onChange={screen => { setTemplateEditing(false); setWorkspaceScreen(screen); }}
        />
      )}
      <BatchWorkspace screen={workspaceScreen} templates={templates.map(ensureMultiPageSupport)} current={currentTemplate}
        projects={pagesByTemplate} mediaLibrary={getUniqueUploadedImages()} busy={batchBusy || isExportingZip} progress={batchProgress} error={batchError}
        onGenerate={runBatch} onRetry={retryBatch} onCancel={() => batchController.current?.abort()}
        onSelectTemplate={id => { setTemplateEditing(false); setCurrentTemplateId(id); setActiveGeneratedPageIndex(0); setSelectedNodeId(null); }}
        onOpen={(id, index = 0) => { setTemplateEditing(false); setCurrentTemplateId(id); setActiveGeneratedPageIndex(index); setSelectedNodeId(null); setWorkspaceScreen('editor'); setActiveTab('phase2'); }}
        onNewTemplate={() => { setTemplateEditing(true); createNewTemplate(); setWorkspaceScreen('editor'); setLeftDrawerTab('add'); }}
        onEditTemplate={id => { setTemplateEditing(true); setActivePageIndex(0); setCurrentTemplateId(id); setActiveGeneratedPageIndex(0); setWorkspaceScreen('editor'); setSelectedNodeId(null); setLeftDrawerTab('layers'); }}
        onDeleteTemplate={deleteTemplate}
        onDeleteWorks={deleteArchivedWorks}
        onDownloadWorks={downloadArchivedWorks}
        onExport={() => setIsExportModalOpen(true)} onScreen={screen => { setTemplateEditing(false); setWorkspaceScreen(screen); }}/>
      {workspaceScreen === 'editor' && (
        <div className="production-editor-actions bg-[#222225] border-b border-white/10 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { setTemplateEditing(false); setWorkspaceScreen(templateEditing ? 'templates' : 'results'); }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition font-medium cursor-pointer"
            >
              {templateEditing ? '← Şablonlarım' : '← Tüm sonuçlar'}
            </button>
            <strong className="truncate text-white/80">{currentTemplate.name}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-[11px]">
              {templateEditing ? 'Şablon düzenleniyor' : 'Yalnızca bu çalışma düzenleniyor · Ana şablon korunur'}
            </span>
          </div>
        </div>
      )}

      {workspaceScreen === 'editor' && aiError && <div role="alert" className="workspace-warning">{aiError}</div>}
      {/* WORKSPACE AREA: 3-COLUMN MODERN CANVAS LAYOUT */}
      <main className={`${workspaceScreen !== 'editor' ? 'workspace-editor-hidden' : ''} flex-1 flex flex-row overflow-hidden bg-[#18181A] transition-colors duration-300 relative`}>
        
        {/* 1. LEFT TOOL DRAWER (56px rail + 320px collapsible drawer) */}
        {templateEditing && <LeftToolDrawer
          activeTab={leftDrawerTab}
          onTabChange={setLeftDrawerTab}
          onSelectTab={setLeftDrawerTab}
          onOpenBatchProduction={() => {
            setTemplateEditing(false);
            setWorkspaceScreen('create');
          }}
          isBatchActive={workspaceScreen === 'create'}
          templates={templates}
          currentTemplateId={currentTemplateId}
          onSelectTemplate={(id) => {
            setCurrentTemplateId(id);
            setActiveGeneratedPageIndex(0);
            setSelectedNodeId(null);
          }}
          onCreateTemplate={createNewTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
          onRenameTemplate={(id, newName) => {
            setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
          }}
          onDeleteTemplate={(id) => deleteTemplate(id)}
          onResizeTemplate={(width, height) => {
            if (!templateEditing) return;
            setTemplates(prev => prev.map(template => template.id === currentTemplateId
              ? resizeTemplate(template, width, height)
              : template));
            setZoomMode('fit');
            setPanOffset({ x: 0, y: 0 });
            setSelectedNodeId(null);
          }}
          onAddNewRegion={(type) => addNewRegion(type)}
          onAddNewFixedElement={(type) => type === 'rect' || type === 'circle' ? addNewFixedElement('shape', type) : undefined}
          onAddTextRegion={() => addNewRegion('text')}
          onAddImageRegion={() => addNewRegion('image')}
          onAddShape={(type) => addNewFixedElement('shape', type)}
          onAddDecoration={addDesignDecoration}
          uploadedImages={getUniqueUploadedImages()}
          onUploadMedia={handleMediaUpload}
          backgroundImageUrl={editingTemplate.backgroundImageUrl}
          onSetBackgroundImage={handleTemplateBackgroundUpload}
          onRemoveBackgroundImage={() => updateTemplateBackground(undefined)}
          onSelectMediaImage={(url) => {
            if (selectedNodeId) {
              const isImageRegion = (editingTemplate.regions || []).some(r => r.id === selectedNodeId && r.type === 'image');
              if (isImageRegion) {
                updateActiveImageProp(selectedNodeId, 'url', url);
                return;
              }
            }
            const firstImg = (editingTemplate.regions || []).find(r => r.type === 'image');
            if (firstImg) {
              setSelectedNodeId(firstImg.id);
              updateActiveImageProp(firstImg.id, 'url', url);
            } else {
              addNewRegion('image');
              setTimeout(() => {
                const latestImg = (editingTemplate.regions || []).filter(r => r.type === 'image').slice(-1)[0];
                if (latestImg) updateActiveImageProp(latestImg.id, 'url', url);
              }, 50);
            }
          }}
          onOpenMediaDownloader={() => setIsToolsModalOpen(true)}
          onOpenYouTubeModal={() => setIsToolsModalOpen(true)}
          regions={editingTemplate.regions || []}
          currentRegions={editingTemplate.regions || []}
          fixedElements={editingTemplate.fixedElements || []}
          currentFixedElements={editingTemplate.fixedElements || []}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onToggleNodeVisibility={(id) => toggleElementVisibility(id)}
          onToggleVisibility={(id, isVisible) => toggleElementVisibility(id)}
          onToggleNodeLock={(id) => handleToggleLock(id)}
          onToggleLock={(id, isLocked) => handleToggleLock(id)}
          onDeleteNode={(id) => deleteElement(id)}
          onReorderRegions={(from, to) => moveRegionInList(from, to)}
          onMoveLayerOrder={(id, direction) => moveLayerOrder(id, direction)}
          hiddenElementIds={activePageData.hiddenElements || activeGraphicData.hiddenElements || []}
          aiSystemPrompt={currentTemplate.aiSystemPrompt || ''}
          isTemplateEditing={templateEditing}
          onAiSystemPromptChange={(prompt) => {
            setTemplates(prev => prev.map(template => template.id === currentTemplateId
              ? { ...template, aiSystemPrompt: prompt }
              : template));
          }}
          onTextRegionAiChange={(regionId, updates) => {
            handleRegionPropertiesChange(regionId, updates);
          }}
          onGenerateAiBrief={(brief) => {
            setAiCollageBrief(brief);
            void triggerAiGenerator(undefined, brief);
          }}
          onGeneratePageTexts={async (brief) => {
            setAiCollageBrief(brief);
            void triggerAiGenerator(undefined, brief);
          }}
          isAiLoading={!!aiRequestRef.current || isAiLoading}
        />}

        {/* 2. CENTER STAGE: LARGE SINGLE-PAGE CANVAS + BOTTOM FILMSTRIP */}
        <div id="canvas-stage" className="flex-1 flex flex-col items-center justify-between min-w-0 h-full relative overflow-hidden bg-[#18181A]">
          {/* Top Info Bar */}
          <div className="w-full max-w-2xl px-4 py-2 mt-2 flex items-center justify-between text-xs font-semibold z-10 shrink-0 bg-[#252528]/80 backdrop-blur rounded-2xl border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#FF6B1A] rounded-full animate-pulse" />
              <span className="text-[rgba(255,255,255,0.95)] font-bold">Önizleme</span>
              <span className="text-[rgba(255,255,255,0.4)]">|</span>
              <span className="text-[rgba(255,255,255,0.7)] font-mono">{currentTemplate.width} × {currentTemplate.height} px</span>
            </div>

            <div className="flex items-center space-x-2 text-[rgba(255,255,255,0.7)]">
              {/* Grid Toggle */}
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold text-[11px] ${
                  showGrid ? 'bg-[#FF6B1A]/20 border border-[#FF6B1A] text-[#FF6B1A]' : 'bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:text-white'
                }`}
                title="Kılavuz Çizgileri"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kılavuz</span>
              </button>

              {/* Safe Margin Toggle */}
              <button
                type="button"
                onClick={() => setShowSafeMargins(!showSafeMargins)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold text-[11px] ${
                  showSafeMargins ? 'bg-[#FF6B1A]/20 border border-[#FF6B1A] text-[#FF6B1A]' : 'bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:text-white'
                }`}
                title="Güvenli Baskı Alanı"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Güvenli Alan</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport (Center Stage) */}
          <div
            id="canvas-viewport"
            className="flex-1 flex flex-col items-center justify-center w-full min-h-0 p-4 sm:p-6 overflow-auto select-none relative"
          >
            {/* Canvas Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Interactive image pan/zoom helper banner */}
            {editingImageRegionId && (
              <div className="absolute top-4 z-30 bg-[#34C759] text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center space-x-3 border border-[#34C759]">
                <MousePointer className="w-3.5 h-3.5 animate-bounce" />
                <span>Görseli mouse ile sürükleyip kaydırın, tekerlek ile yakınlaştırın</span>
                <button
                  type="button"
                  onClick={() => setEditingImageRegionId(null)}
                  className="bg-black/30 hover:bg-black/50 text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition cursor-pointer"
                >
                  Uygula
                </button>
                <button type="button" onClick={cancelCrop} className="underline">Vazgeç</button>
              </div>
            )}

            {/* The Single Active Canvas */}
            <div 
              className="relative max-w-full max-h-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-[rgba(255,255,255,0.1)] transition-all duration-300"
              style={{
                aspectRatio: `${currentTemplate.width} / ${currentTemplate.height}`,
                width: zoomMode === 'fit' ? 'auto' : `${Math.min(canvasWidth, 720) * zoomScale}px`,
                height: zoomMode === 'fit' ? '100%' : 'auto',
                maxHeight: '100%'
              }}
            >
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
                className="bg-[#252528] select-none touch-none object-contain"
                aria-label="Aktif tasarım tuvali"
              />

              <CanvasVideoOverlay
                templateWidth={currentTemplate.width}
                templateHeight={currentTemplate.height}
                displayWidth={Math.min(canvasWidth, 720)}
                regions={activeTemplatePage.regions || editingTemplate.regions || []}
                dynamicImages={activePageData.dynamicImages || {}}
                playingRegionId={playingVideoRegionId}
                onSetPlayingRegionId={setPlayingVideoRegionId}
                isMuted={isVideoMuted}
                onToggleMute={setIsVideoMuted}
              />
            </div>

            {/* Floating Zoom & Pan Controls */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#252528]/95 backdrop-blur border border-[rgba(255,255,255,0.1)] shadow-2xl rounded-full p-1.5 flex items-center space-x-1 z-20">
              <button
                type="button"
                onClick={() => {
                  if (zoomMode === 'fit') {
                    setZoomMode('custom');
                    setZoomScale(0.9);
                    setPanOffset({ x: 0, y: 0 });
                  } else {
                    setZoomScale(prev => Math.max(0.1, parseFloat((prev - 0.05).toFixed(2))));
                  }
                }}
                className="p-1.5 hover:bg-[#1D1D1F] rounded-full text-[rgba(255,255,255,0.7)] hover:text-white transition cursor-pointer"
                title="Uzaklaştır"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-[11px] font-bold text-white min-w-[45px] text-center font-mono">
                {zoomMode === 'fit' ? 'Sığdır' : `${Math.round(zoomScale * 100)}%`}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (zoomMode === 'fit') {
                    setZoomMode('custom');
                    setZoomScale(1.1);
                    setPanOffset({ x: 0, y: 0 });
                  } else {
                    setZoomScale(prev => Math.min(3.0, parseFloat((prev + 0.05).toFixed(2))));
                  }
                }}
                className="p-1.5 hover:bg-[#1D1D1F] rounded-full text-[rgba(255,255,255,0.7)] hover:text-white transition cursor-pointer"
                title="Yakınlaştır"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-[rgba(255,255,255,0.1)] mx-1" />

              <button
                type="button"
                onClick={() => {
                  setZoomMode('fit');
                  setPanOffset({ x: 0, y: 0 });
                }}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  zoomMode === 'fit' ? 'bg-[#FF6B1A]/20 text-[#FF6B1A]' : 'text-[rgba(255,255,255,0.7)] hover:text-white'
                }`}
                title="Ekrana Sığdır"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Filmstrip */}
          <PageFilmstrip
            pages={
              generatedPages.length > 0
                ? generatedPages.map((p, i) => ({ id: p.id, name: p.name || `${i + 1}. Sayfa` }))
                : (currentTemplate.pages && currentTemplate.pages.length > 0
                    ? currentTemplate.pages.map((p, i) => ({ id: p.id, name: p.name || `${i + 1}. Sayfa` }))
                    : [{ id: '1', name: 'Kapak Sayfası' }])
            }
            activePageIndex={generatedPages.length > 0 ? activeGeneratedPageIndex : activePageIndex}
            onSelectPage={(index) => {
              if (generatedPages.length > 0) {
                setActiveGeneratedPageIndex(index);
              } else {
                setActivePageIndex(index);
              }
              setSelectedNodeId(null);
            }}
            onAddPage={handleAddNewPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onReorderPages={handleReorderPages}
            aspectRatio={`${currentTemplate.width} / ${currentTemplate.height}`}
          />
        </div>

        {/* 3. RIGHT CONTEXTUAL INSPECTOR PANEL */}
        {templateEditing ? <RightInspectorPanel
          selectedNodeId={selectedNodeId}
          isOpen={true}
          editingTemplate={editingTemplate}
          currentTemplate={currentTemplate}
          regions={editingTemplate.regions || []}
          fixedElements={editingTemplate.fixedElements || []}
          activeGraphicData={activeGraphicData}
          activePageData={activePageData}
          vurguColor={vurguColor}
          onCloseSelection={() => setSelectedNodeId(null)}
          onDeselect={() => setSelectedNodeId(null)}
          updateActiveText={(regionId, text) => updateActiveText(regionId, text)}
          handleDynamicTextChange={(regionId, text) => updateActiveText(regionId, text)}
          updateActiveImageProp={updateActiveImageProp}
          handleRegionTextStyleChange={handleRegionTextStyleChange}
          handleRegionPropertyChange={handleRegionPropertyChange}
          handleRegionPropertiesChange={handleRegionPropertiesChange}
          handleFixedElementPropertyChange={handleFixedElementPropertyChange}
          handleFixedElementPropertiesChange={handleFixedElementPropertiesChange}
          handleFixedElementChange={handleFixedElementChange}
          handleFixedElementTextStyleChange={handleFixedElementTextStyleChange}
          handleAlignElement={handleAlignElement}
          onAlignElement={handleAlignElement}
          handleDynamicImageUpload={(regionId, file) => handleDynamicImageUpload(regionId, file)}
          onOpenCrop={handleCropPanTrigger}
          handleCropPanTrigger={handleCropPanTrigger}
          handleDeleteNode={handleDeleteNode}
          onDeleteNode={handleDeleteNode}
          handleDuplicateNode={handleDuplicateNode}
          onDuplicateNode={handleDuplicateNode}
          handleToggleLock={handleToggleLock}
          onToggleLock={handleToggleLock}
          triggerAiGenerator={(regionId) => triggerAiGenerator(regionId)}
          onAiGenerateForField={(regionId) => triggerAiGenerator(regionId)}
          aiTextTarget={aiTextTarget}
          isAiLoading={!!aiRequestRef.current || isAiLoading}
          onUpdateHighlightColor={handleVurguColorChange}
          onVurguColorChange={handleVurguColorChange}
          onMoveLayerOrder={(id, direction) => moveLayerOrder(id, direction)}
          onTemplatePropertiesChange={(updates) => {
            setTemplates(previous => previous.map(template => template.id === currentTemplateId
              ? {...template, ...updates}
              : template));
          }}
          onExportClick={() => setIsExportModalOpen(true)}
        /> : <WorkQuickEditor
          template={currentTemplate}
          regions={editingTemplate.regions || []}
          activePageData={activePageData}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onTextChange={updateActiveText}
          onImageUpload={(regionId, file) => handleDynamicImageUpload(regionId, file)}
          onRegionChange={handleRegionPropertiesChange}
          onCenter={(regionId) => handleAlignElement(regionId, 'center-both')}
          onResizeWork={(width, height) => {
            const oldWidth = currentTemplate.width;
            const oldHeight = currentTemplate.height;
            setTemplates(previous => previous.map(template => template.id === currentTemplateId ? resizeTemplate(template, width, height) : template));
            setGeneratedPages(previous => previous.map(page => resizePageLayout(page, oldWidth, oldHeight, width, height)), currentTemplateId);
            setZoomMode('fit');
            setPanOffset({ x: 0, y: 0 });
            setSelectedNodeId(null);
          }}
        />}

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

        {/* 4. INDEPENDENT EXPORT MODAL */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          template={currentTemplate}
          pageCount={generatedPages.length > 0 ? generatedPages.length : (currentTemplate.pages?.length || 1)}
          activePageIndex={generatedPages.length > 0 ? activeGeneratedPageIndex : activePageIndex}
          onExportCurrent={(fmt, sc) => exportPages([activePageData], false, fmt, sc)}
          onExportAll={(fmt, sc) => exportPages(generatedPages.length ? generatedPages : [activePageData], false, fmt, sc)}
          onExportZip={(fmt, sc) => exportPages(generatedPages.length ? generatedPages : [activePageData], true, fmt, sc)}
          isExporting={isExporting}
          isExportingZip={isExportingZip}
          exportStatusText={exportStatusText || ''}
        />


      {aiProposal && <div className="production-dialog-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="ai-proposal-title" className="production-dialog" onKeyDown={e => { if (e.key === 'Escape') setAiProposal(null); }}>
        <h2 id="ai-proposal-title">AI metin önerisi</h2><p>Mevcut metnin, Kullan düğmesine basana kadar korunur.</p>
        {aiProposal.context.map(field => <div key={field.id}><strong>{field.name}</strong><p>{aiProposal.texts[field.id]}</p></div>)}
        <div className="production-dialog-actions"><button autoFocus onClick={() => setAiProposal(null)}>Vazgeç</button><button onClick={() => { const target = aiProposal.regionId; setAiProposal(null); void triggerAiGenerator(target); }}>Yeniden üret</button><button className="production-primary" onClick={applyAiProposal}>Kullan</button></div>
      </section></div>}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div id="mobile-nav-bar" style={{display: workspaceScreen === 'editor' ? undefined : 'none'}} className="lg:hidden bg-[#1D1D1F] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-2 z-30 shrink-0 select-none">
        <button
          onClick={() => { setMobileView('editor'); if (!leftDrawerTab) setLeftDrawerTab('add'); }}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'editor' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px]">Araçlar</span>
        </button>

        <button
          onClick={() => { setMobileView('canvas'); setLeftDrawerTab(null); }}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'canvas' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Önizleme</span>
        </button>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className={`flex flex-col items-center space-y-1 text-xs transition cursor-pointer px-3 py-1 rounded-lg ${
            mobileView === 'export' ? 'text-[#FF6B1A] font-bold bg-[#FF6B1A]/10' : 'text-[rgba(255,255,255,0.72)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px]">İndir</span>
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
