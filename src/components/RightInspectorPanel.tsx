import React, { useState, useRef, useEffect } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  WandSparkles, 
  Loader2, 
  Crop, 
  RotateCw, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Bold, 
  Italic, 
  Layers, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Palette, 
  Maximize2,
  Trash2,
  Copy,
  Upload,
  Download,
  X,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  Crosshair,
  MoveHorizontal
} from 'lucide-react';
import { DesignTemplate, Region, FixedElement, TextStyle, TextRole } from '../types';

const TEXT_ROLE_OPTIONS: {value: TextRole; label: string}[] = [
  {value: 'title', label: 'Başlık'},
  {value: 'subtitle', label: 'Alt başlık'},
  {value: 'description', label: 'Açıklama'},
  {value: 'callToAction', label: 'Eylem çağrısı (CTA)'},
  {value: 'label', label: 'Etiket / rozet'},
  {value: 'date', label: 'Tarih'},
  {value: 'price', label: 'Fiyat'},
  {value: 'normal', label: 'Genel metin'},
];

export type AlignmentPreset = 
  | 'left' 
  | 'safe-left' 
  | 'center-x' 
  | 'right' 
  | 'safe-right' 
  | 'top' 
  | 'safe-top' 
  | 'center-y' 
  | 'bottom' 
  | 'safe-bottom' 
  | 'center-both' 
  | 'fit-width' 
  | 'fit-width-safe'
  | 'fit-canvas';

export interface RightInspectorPanelProps {
  selectedNodeId: string | null;
  isOpen?: boolean;
  editingTemplate?: DesignTemplate;
  currentTemplate?: DesignTemplate;
  activePageData?: any;
  activeGraphicData?: any;
  regions?: Region[];
  fixedElements?: FixedElement[];
  vurguColor?: string;
  onCloseSelection?: () => void;
  onDeselect?: () => void;
  updateActiveText?: (regionId: string, text: string) => void;
  handleDynamicTextChange?: (regionId: string, text: string) => void;
  updateActiveImageProp?: (regionId: string, prop: any, value: any) => void;
  handleRegionTextStyleChange?: (regionId: string, prop: keyof TextStyle, value: any) => void;
  handleRegionPropertyChange?: (regionId: string, prop: keyof Region, value: any) => void;
  handleRegionPropertiesChange?: (regionId: string, updates: Partial<Region>) => void;
  handleFixedElementPropertyChange?: (elementId: string, prop: keyof FixedElement, value: any) => void;
  handleFixedElementPropertiesChange?: (elementId: string, updates: Partial<FixedElement>) => void;
  handleFixedElementChange?: (elementId: string, prop: string, value: any) => void;
  handleAlignElement?: (id: string, alignment: AlignmentPreset) => void;
  onAlignElement?: (id: string, alignment: AlignmentPreset) => void;
  handleDynamicImageUpload?: (regionId: string, file: File) => void;
  onOpenCrop?: (regionId: string) => void;
  handleCropPanTrigger?: (regionId: string) => void;
  onOpenMediaPicker?: (regionId: string) => void;
  triggerAiGenerator?: (regionId?: string) => void;
  onAiGenerateForField?: (regionId?: string) => void;
  aiTextTarget?: string | null;
  isAiLoading?: boolean;
  onUpdateHighlightColor?: (color: string) => void;
  onVurguColorChange?: (color: string) => void;
  handleDeleteNode?: (id: string) => void;
  onDeleteNode?: (id: string) => void;
  handleDuplicateNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  handleToggleLock?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onExportClick?: () => void;
  onTemplatePropertiesChange?: (updates: Partial<DesignTemplate>) => void;
  onMoveLayerOrder?: (id: string, direction: 'front' | 'back') => void;
}

type StyleableNode = Region | FixedElement;

function ElementStyleControls({
  node,
  allNodes,
  onUpdate,
  onMoveLayerOrder,
  showPadding = false
}: {
  node: StyleableNode;
  allNodes: StyleableNode[];
  onUpdate: (updates: any) => void;
  onMoveLayerOrder?: (id: string, direction: 'front' | 'back') => void;
  showPadding?: boolean;
}) {
  const fill = ('backgroundColor' in node && node.backgroundColor) || ('color' in node && node.color) || 'transparent';
  const maxZ = Math.max(0, ...allNodes.map(item => item.zIndex ?? 0));
  const minZ = Math.min(0, ...allNodes.map(item => item.zIndex ?? 0));
  const colorValue = (value?: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
  const shadowEnabled = node.hasShadow ?? !!(node.shadowColor && (node.shadowBlur || node.shadowOffsetX || node.shadowOffsetY));
  const isImageRegion = 'isDynamic' in node && node.type === 'image';

  return (
    <div className="space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
      <details className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1D1D1F]/70">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.75)]">
          Görünüm & Kenarlık <ChevronDown size={13} className="transition group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-[rgba(255,255,255,0.07)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-[10px] text-white/55">Dolgu rengi
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 p-1.5">
                <input type="color" value={colorValue(fill)} onChange={e => onUpdate({backgroundColor: e.target.value, hasBackground: true})} className="h-5 w-6 cursor-pointer bg-transparent" />
                <span className="truncate font-mono text-white/80">{fill === 'transparent' ? 'Yok' : fill}</span>
              </div>
            </label>
            <label className="space-y-1 text-[10px] text-white/55">Çizgi rengi
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 p-1.5">
                <input type="color" value={colorValue(node.borderColor)} onChange={e => onUpdate({borderColor: e.target.value, hasBorder: true})} className="h-5 w-6 cursor-pointer bg-transparent" />
                <span className="truncate font-mono text-white/80">{node.borderColor || 'Yok'}</span>
              </div>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] text-white/55">Çizgi
              <input type="number" min="0" max="80" value={node.borderWidth || 0} onChange={e => onUpdate({borderWidth: Math.max(0, Number(e.target.value)), hasBorder: Number(e.target.value) > 0})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" />
            </label>
            <label className="text-[10px] text-white/55">Köşe
              <input type="number" min="0" max="500" value={node.borderRadius || 0} onChange={e => {
                const borderRadius = Math.max(0, Number(e.target.value));
                onUpdate({borderRadius, ...(isImageRegion && borderRadius > 0 ? {clipImage: true} : {})});
              }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" />
            </label>
            {showPadding && <label className="text-[10px] text-white/55">İç boşluk
              <input type="number" min="0" max="200" value={(node as Region).padding || 0} onChange={e => onUpdate({padding: Math.max(0, Number(e.target.value))})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" />
            </label>}
          </div>
          <label className="block space-y-1 text-[10px] text-white/55">
            <span className="flex justify-between"><span>Opaklık</span><span>{Math.round((node.opacity ?? 1) * 100)}%</span></span>
            <input type="range" min="0" max="1" step="0.05" value={node.opacity ?? 1} onChange={e => onUpdate({opacity: Number(e.target.value)})} className="w-full accent-[#FF6B1A]" />
          </label>
          <label className="flex items-center justify-between text-[11px] text-white/70">
            En-boy oranını koru
            <input type="checkbox" checked={!!node.lockAspectRatio} onChange={e => onUpdate({lockAspectRatio: e.target.checked})} className="accent-[#FF6B1A]" />
          </label>
        </div>
      </details>

      <details className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1D1D1F]/70">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.75)]">
          Efekt & Dönüşüm <ChevronDown size={13} className="transition group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-[rgba(255,255,255,0.07)] p-3">
          <label className="flex items-center justify-between text-[11px] text-white/70">
            Gölgeyi etkinleştir
            <input type="checkbox" checked={shadowEnabled} onChange={e => onUpdate(e.target.checked
              ? {hasShadow: true, shadowColor: node.shadowColor || '#000000', shadowBlur: node.shadowBlur || 16, shadowOffsetX: node.shadowOffsetX || 0, shadowOffsetY: node.shadowOffsetY || 8}
              : {hasShadow: false})} className="accent-[#FF6B1A]" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([['rotation', 'Döndür'], ['skewX', 'Eğ X'], ['skewY', 'Eğ Y']] as const).map(([prop, label]) => (
              <label key={prop} className="text-[10px] text-white/55">{label}
                <input type="number" min="-180" max="180" value={node[prop] || 0} onChange={e => onUpdate({[prop]: Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-[auto_1fr] items-end gap-2">
            <label className="text-[10px] text-white/55">Gölge rengi
              <input type="color" value={colorValue(node.shadowColor)} onChange={e => onUpdate({hasShadow: true, shadowColor: e.target.value})} className="mt-1 block h-8 w-10 cursor-pointer rounded bg-transparent" />
            </label>
            <label className="text-[10px] text-white/55">Gölge bulanıklığı
              <input type="range" min="0" max="80" value={node.shadowBlur || 0} onChange={e => onUpdate({hasShadow: true, shadowBlur: Number(e.target.value)})} className="mt-2 w-full accent-[#FF6B1A]" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-white/55">Gölge X<input type="number" value={node.shadowOffsetX || 0} onChange={e => onUpdate({hasShadow: true, shadowOffsetX: Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" /></label>
            <label className="text-[10px] text-white/55">Gölge Y<input type="number" value={node.shadowOffsetY || 0} onChange={e => onUpdate({hasShadow: true, shadowOffsetY: Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" /></label>
          </div>
          <label className="block text-[10px] text-white/55">Karışım modu
            <select value={node.blendMode || 'source-over'} onChange={e => onUpdate({blendMode: e.target.value as GlobalCompositeOperation})} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171719] px-2 py-2 text-xs text-white">
              <option value="source-over">Normal</option><option value="multiply">Çarpma</option><option value="screen">Ekran</option><option value="overlay">Kaplama</option><option value="soft-light">Yumuşak ışık</option><option value="difference">Fark</option>
            </select>
          </label>
        </div>
      </details>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onMoveLayerOrder ? onMoveLayerOrder(node.id, 'back') : onUpdate({zIndex: minZ - 1})} className="rounded-lg border border-white/10 bg-[#1D1D1F] px-2 py-2 text-[11px] font-semibold text-white/75 hover:text-white">En arkaya gönder</button>
        <button type="button" onClick={() => onMoveLayerOrder ? onMoveLayerOrder(node.id, 'front') : onUpdate({zIndex: maxZ + 1})} className="rounded-lg border border-white/10 bg-[#1D1D1F] px-2 py-2 text-[11px] font-semibold text-white/75 hover:text-white">En öne getir</button>
      </div>
    </div>
  );
}

interface ElementAlignmentSectionProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked?: boolean;
  canvasWidth: number;
  canvasHeight: number;
  isCircle?: boolean;
  onToggleLock?: (id: string) => void;
  onAlign: (alignment: AlignmentPreset) => void;
  onUpdateProps: (updates: { x?: number; y?: number; width?: number; height?: number }) => void;
}

function ElementAlignmentSection({
  id,
  x,
  y,
  width,
  height,
  isLocked,
  canvasWidth,
  canvasHeight,
  isCircle,
  onToggleLock,
  onAlign,
  onUpdateProps
}: ElementAlignmentSectionProps) {
  return (
    <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Sliders size={13} className="text-[#FF6B1A]" />
          <label className="text-[11px] font-bold text-[rgba(255,255,255,0.85)] uppercase tracking-wider block">
            Hizalama & Tuval Konumu
          </label>
        </div>
        <span className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] bg-white/5 px-2 py-0.5 rounded">
          X:{Math.round(x)} Y:{Math.round(y)}
        </span>
      </div>

      {/* Locked Layer Notice */}
      {isLocked && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <Lock size={12} className="text-amber-400 shrink-0" />
            Katman kilitli. Hizalamak için kilidi açın.
          </span>
          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(id)}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-bold text-white transition cursor-pointer"
            >
              Kilidi Aç
            </button>
          )}
        </div>
      )}

      {/* 6-Button Quick Alignment Matrix */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
          <span>Tuvale Hizala</span>
          <span className="text-[9px] lowercase font-normal text-[rgba(255,255,255,0.4)]">tek tıkla yerleşim</span>
        </div>
        <div className="grid grid-cols-6 gap-1 bg-[#1D1D1F] p-1.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          {/* 1. Sola Yasla */}
          <button
            type="button"
            onClick={() => onAlign('left')}
            disabled={isLocked}
            title="Sola Yasla (Sol Kenar: 0px)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <ArrowLeftToLine size={15} />
          </button>

          {/* 2. Yatayda Ortala */}
          <button
            type="button"
            onClick={() => onAlign('center-x')}
            disabled={isLocked}
            title="Yatayda Ortala (Tuvalin Ortası)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <AlignCenterHorizontal size={15} />
          </button>

          {/* 3. Sağa Yasla */}
          <button
            type="button"
            onClick={() => onAlign('right')}
            disabled={isLocked}
            title="Sağa Yasla (Sağ Kenar)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <ArrowRightToLine size={15} />
          </button>

          {/* 4. Üste Yasla */}
          <button
            type="button"
            onClick={() => onAlign('top')}
            disabled={isLocked}
            title="Üste Yasla (Üst Kenar: 0px)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <ArrowUpToLine size={15} />
          </button>

          {/* 5. Dikeyde Ortala */}
          <button
            type="button"
            onClick={() => onAlign('center-y')}
            disabled={isLocked}
            title="Dikeyde Ortala (Tuvalin Ortası)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <AlignCenterVertical size={15} />
          </button>

          {/* 6. Alta Yasla */}
          <button
            type="button"
            onClick={() => onAlign('bottom')}
            disabled={isLocked}
            title="Alta Yasla (Alt Kenar)"
            className="h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#FF6B1A]/20 hover:border-[#FF6B1A]/40 border border-transparent transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <ArrowDownToLine size={15} />
          </button>
        </div>
      </div>

      {/* Ready-Made Presets (Hazır Ayarlar) */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider block">
          Hazır Yerleşim Ayarları
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {/* Tam Ortala */}
          <button
            type="button"
            onClick={() => onAlign('center-both')}
            disabled={isLocked}
            className="px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] text-[11px] font-semibold text-white flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Hem yatay hem dikey tam merkezde ortala"
          >
            <Crosshair size={13} className="text-[#FF6B1A] shrink-0" />
            <span className="truncate">Tam Ortala</span>
          </button>

          {/* Genişliğe Sığdır */}
          <button
            type="button"
            onClick={() => onAlign('fit-width')}
            disabled={isLocked}
            className="px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] text-[11px] font-semibold text-white flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Öğeyi tam tuval genişliğine yay (100% Genişlik)"
          >
            <Maximize2 size={13} className="text-[#34C759] shrink-0" />
            <span className="truncate">Genişliğe Sığdır</span>
          </button>

          {/* Sola Yasla (40px Pay) */}
          <button
            type="button"
            onClick={() => onAlign('safe-left')}
            disabled={isLocked}
            className="px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[rgba(255,255,255,0.85)] hover:text-white flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Sol kenar payına (40px) yasla"
          >
            <ArrowLeftToLine size={13} className="text-[rgba(255,255,255,0.5)] shrink-0" />
            <span className="truncate">Sola Yasla (40px)</span>
          </button>

          {/* Sağa Yasla (40px Pay) */}
          <button
            type="button"
            onClick={() => onAlign('safe-right')}
            disabled={isLocked}
            className="px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[rgba(255,255,255,0.85)] hover:text-white flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Sağ kenar payına (40px) yasla"
          >
            <ArrowRightToLine size={13} className="text-[rgba(255,255,255,0.5)] shrink-0" />
            <span className="truncate">Sağa Yasla (40px)</span>
          </button>

          {/* Kenar Paylı Genişlik */}
          <button
            type="button"
            onClick={() => onAlign('fit-width-safe')}
            disabled={isLocked}
            className="col-span-2 px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[rgba(255,255,255,0.85)] hover:text-white flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="İki taraftan 40px kenar boşluğu bırakarak genişliğe sığdır"
          >
            <MoveHorizontal size={13} className="text-[#FF9F0A] shrink-0" />
            <span>Kenar Paylı Genişlik (40px Boşluk)</span>
          </button>
        </div>
      </div>

      {/* Coordinate & Dimension Precision Inputs (X, Y, W, H) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
          <span>Konum & Boyut (px)</span>
          <span className="text-[9px] lowercase font-normal text-[rgba(255,255,255,0.4)]">hassas ayar</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-1.5 flex flex-col items-center">
            <span className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono uppercase">X (Sol)</span>
            <input
              type="number"
              value={Math.round(x)}
              disabled={isLocked}
              onChange={(e) => onUpdateProps({ x: Number(e.target.value) })}
              className="w-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
            />
          </div>

          <div className="bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-1.5 flex flex-col items-center">
            <span className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono uppercase">Y (Üst)</span>
            <input
              type="number"
              value={Math.round(y)}
              disabled={isLocked}
              onChange={(e) => onUpdateProps({ y: Number(e.target.value) })}
              className="w-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
            />
          </div>

          <div className="bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-1.5 flex flex-col items-center">
            <span className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono uppercase">Genişlik</span>
            <input
              type="number"
              min={10}
              value={Math.round(width)}
              disabled={isLocked}
              onChange={(e) => onUpdateProps({ width: Math.max(10, Number(e.target.value)) })}
              className="w-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
            />
          </div>

          <div className="bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-1.5 flex flex-col items-center">
            <span className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono uppercase">Yükseklik</span>
            <input
              type="number"
              min={10}
              value={Math.round(height)}
              disabled={isLocked}
              onChange={(e) => onUpdateProps({ height: Math.max(10, Number(e.target.value)) })}
              className="w-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const FONT_OPTIONS = [
  { label: 'Varsayılan (Inter)', value: 'Inter, sans-serif' },
  { label: 'Modern (Outfit)', value: 'Outfit, sans-serif' },
  { label: 'Gövde (Roboto)', value: 'Roboto, sans-serif' },
  { label: 'Başlık (Montserrat)', value: 'Montserrat, sans-serif' },
  { label: 'Display (Space Grotesk)', value: "'Space Grotesk', sans-serif" },
  { label: 'Zarif (Playfair)', value: "'Playfair Display', serif" },
  { label: 'Şık (Plus Jakarta)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Kondanse (Oswald)', value: 'Oswald, sans-serif' },
  { label: 'Modern (Poppins)', value: 'Poppins, sans-serif' }
];

export function RightInspectorPanel(props: RightInspectorPanelProps) {
  const {
    selectedNodeId,
    isOpen = true,
    editingTemplate,
    currentTemplate,
    activePageData = {},
    activeGraphicData = {},
    regions,
    fixedElements,
    vurguColor = '#FF6B1A',
    onCloseSelection,
    onDeselect,
    updateActiveText,
    handleDynamicTextChange,
    updateActiveImageProp,
    handleRegionTextStyleChange,
    handleRegionPropertyChange,
    handleFixedElementPropertyChange,
    handleFixedElementChange,
    handleDynamicImageUpload,
    onOpenCrop,
    handleCropPanTrigger,
    onOpenMediaPicker,
    triggerAiGenerator,
    onAiGenerateForField,
    aiTextTarget,
    isAiLoading = false,
    onUpdateHighlightColor,
    onVurguColorChange,
    handleDeleteNode,
    onDeleteNode,
    handleDuplicateNode,
    onDuplicateNode,
    handleToggleLock,
    onToggleLock,
    handleRegionPropertiesChange,
    handleFixedElementPropertiesChange,
    handleAlignElement,
    onAlignElement,
    onExportClick,
    onTemplatePropertiesChange,
    onMoveLayerOrder
  } = props;

  const panelBody = useRef<HTMLDivElement>(null);
  useEffect(() => { panelBody.current?.scrollTo({ top: 0 }); }, [selectedNodeId]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Unify handlers
  const onTextChange = updateActiveText || handleDynamicTextChange;
  const onCrop = onOpenCrop || handleCropPanTrigger;
  const onClose = onDeselect || onCloseSelection;
  const onAi = triggerAiGenerator || onAiGenerateForField;
  const onColorChange = onUpdateHighlightColor || onVurguColorChange;
  const onDelete = onDeleteNode || handleDeleteNode;
  const onDuplicate = onDuplicateNode || handleDuplicateNode;
  const onLock = onToggleLock || handleToggleLock;
  const onFixedProp = handleFixedElementPropertyChange || ((id: string, prop: keyof FixedElement, val: any) => {
    if (handleFixedElementChange) handleFixedElementChange(id, prop as string, val);
  });

  // Safe list lookups
  const regionList: Region[] = regions || editingTemplate?.regions || [];
  const fixedList: FixedElement[] = fixedElements || editingTemplate?.fixedElements || [];

  const selectedRegion = selectedNodeId 
    ? regionList.find(r => r.id === selectedNodeId) 
    : null;

  const selectedFixed = selectedNodeId && !selectedRegion
    ? fixedList.find(el => el.id === selectedNodeId)
    : null;

  const templateWidth = editingTemplate?.width || currentTemplate?.width || 1080;
  const templateHeight = editingTemplate?.height || currentTemplate?.height || 1080;

  // Unified batch update for region
  const onUpdateRegionProps = (id: string, updates: Partial<Region>) => {
    if (handleRegionPropertiesChange) {
      handleRegionPropertiesChange(id, updates);
      return;
    }
    if (handleRegionPropertyChange) {
      (Object.keys(updates) as (keyof Region)[]).forEach((k) => {
        handleRegionPropertyChange(id, k, updates[k]);
      });
    }
  };

  // Unified batch update for fixed elements
  const onUpdateFixedProps = (id: string, updates: Partial<FixedElement>) => {
    if (handleFixedElementPropertiesChange) {
      handleFixedElementPropertiesChange(id, updates);
      return;
    }
    if (handleFixedElementPropertyChange) {
      (Object.keys(updates) as (keyof FixedElement)[]).forEach((k) => {
        handleFixedElementPropertyChange(id, k, updates[k]);
      });
    } else if (handleFixedElementChange) {
      Object.entries(updates).forEach(([k, v]) => {
        handleFixedElementChange(id, k, v);
      });
    }
  };

  const preserveAspectRatio = <T extends {width: number; height: number; lockAspectRatio?: boolean}>(node: T, updates: Partial<T>): Partial<T> => {
    if (!node.lockAspectRatio || (!('width' in updates) && !('height' in updates))) return updates;
    const ratio = node.width / Math.max(1, node.height);
    if ('width' in updates && updates.width !== undefined && !('height' in updates)) {
      return {...updates, height: Math.max(1, Number(updates.width) / ratio)};
    }
    if ('height' in updates && updates.height !== undefined && !('width' in updates)) {
      return {...updates, width: Math.max(1, Number(updates.height) * ratio)};
    }
    return updates;
  };

  // Unified element alignment handler
  const onAlign = (id: string, alignment: AlignmentPreset) => {
    if (onAlignElement) {
      onAlignElement(id, alignment);
      return;
    }
    if (handleAlignElement) {
      handleAlignElement(id, alignment);
      return;
    }

    const canvasW = templateWidth;
    const canvasH = templateHeight;
    const safePadding = 40;

    const reg = regionList.find(r => r.id === id);
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
      onUpdateRegionProps(id, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    const el = fixedList.find(e => e.id === id);
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
      onUpdateFixedProps(id, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  if (isOpen === false) return null;

  const handleImageFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedRegion) {
      const file = e.target.files[0];
      if (handleDynamicImageUpload) {
        handleDynamicImageUpload(selectedRegion.id, file);
      } else if (updateActiveImageProp) {
        const objectUrl = URL.createObjectURL(file);
        updateActiveImageProp(selectedRegion.id, 'url', objectUrl);
      }
    }
  };

  return (
    <aside data-selected={!!selectedNodeId}
      className="workspace-inspector w-full lg:w-[340px] bg-[#252528] border-l border-[rgba(255,255,255,0.08)] flex flex-col z-20 shrink-0 overflow-hidden select-none transition-all duration-300"
      aria-label="Öğe ayarları paneli"
    >
      {/* Hidden File Input for direct image replacement */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFilePicked} 
        accept="image/*" 
        className="hidden" 
      />
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (!file || !selectedFixed || selectedFixed.type !== 'logo') return;
          const reader = new FileReader();
          reader.onload = () => onFixedProp(selectedFixed.id, 'content', String(reader.result || ''));
          reader.readAsDataURL(file);
          event.target.value = '';
        }}
      />

      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0 bg-[#252528]">
        <div className="flex items-center space-x-2 truncate">
          <span className={`w-2 h-2 rounded-full ${selectedRegion ? (selectedRegion.type === 'text' ? 'bg-[#FF6B1A]' : 'bg-[#34C759]') : selectedFixed ? 'bg-[#FF9F0A]' : 'bg-[rgba(255,255,255,0.4)]'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-[rgba(255,255,255,0.95)] truncate">
            {selectedRegion 
              ? selectedRegion.name 
              : selectedFixed 
                ? (selectedFixed.name || 'Sabit Öğe') 
                : 'Öğe ayarları'}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {selectedNodeId && onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(selectedNodeId)}
              className="p-1.5 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Öğeyi Çoğalt"
            >
              <Copy size={13} />
            </button>
          )}
          {selectedNodeId && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(selectedNodeId)}
              className="p-1.5 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
              title="Öğeyi Sil"
            >
              <Trash2 size={13} />
            </button>
          )}
          {selectedNodeId && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              title="Seçimi Kapat"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div ref={panelBody} className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* ═══════════════════════════════════════════════
            CASE 1: TEXT REGION (Başlık, Açıklama, Metin)
           ═══════════════════════════════════════════════ */}
        {selectedRegion && selectedRegion.type === 'text' && (() => {
          const r = selectedRegion;
          const style: Partial<TextStyle> = r.textStyle || {};
          const textVal = activePageData?.dynamicTexts?.[r.id] !== undefined
            ? activePageData.dynamicTexts[r.id]
            : (activeGraphicData?.dynamicTexts?.[r.id] !== undefined
                ? activeGraphicData.dynamicTexts[r.id]
                : (r.placeholderText || ''));
          const isAiGenerating = aiTextTarget === r.id;

          const isTitle = (r.name || '').toLowerCase().includes('başlık') || (r.textRole === 'title');

          return (
            <div className="space-y-4">
              {/* Type identifier pill & AI generate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#FF6B1A] bg-[#FF6B1A]/10 px-2.5 py-0.5 rounded-full">
                    {isTitle ? 'Başlık Metni' : 'Metin Alanı'}
                  </span>
                  {onLock && (
                    <button
                      type="button"
                      onClick={() => onLock(r.id)}
                      className="text-[11px] text-[rgba(255,255,255,0.6)] hover:text-white flex items-center gap-1 cursor-pointer"
                      title={r.locked ? 'Kilidi Aç' : 'Kilitle'}
                    >
                      {r.locked ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} />}
                      <span>{r.locked ? 'Kilitli' : 'Kilitle'}</span>
                    </button>
                  )}
                </div>
                {onAi && (
                  <button
                    type="button"
                    onClick={() => onAi(r.id)}
                    disabled={isAiGenerating || isAiLoading}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF6B1A] to-[#FF9F0A] hover:opacity-90 text-white text-xs font-bold shadow transition cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Bu metni AI ile üret"
                  >
                    {isAiGenerating ? <Loader2 size={13} className="animate-spin" /> : <WandSparkles size={13} />}
                    <span>{isTitle ? 'Başlığı AI ile Üret' : 'Metni AI ile Üret'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`text-role-${r.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">
                  AI metin kategorisi
                </label>
                <select
                  id={`text-role-${r.id}`}
                  value={r.textRole || 'normal'}
                  onChange={event => onUpdateRegionProps(r.id, {textRole: event.target.value as TextRole})}
                  className="w-full cursor-pointer rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1D1D1F] px-3 py-2 text-xs text-white outline-none transition focus:border-[#FF6B1A]"
                >
                  {TEXT_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <p className="text-[10px] leading-relaxed text-[rgba(255,255,255,0.4)]">
                  AI bu alanı üretirken seçilen içerik türünün kurallarını uygular.
                </p>
              </div>

              {/* Text Input Content */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                  İçerik
                </label>
                <textarea
                  id="text-inspector-input"
                  rows={isTitle ? 3 : 5}
                  value={textVal}
                  onChange={(e) => onTextChange && onTextChange(r.id, e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/20 transition resize-y font-medium leading-relaxed"
                  placeholder="Metninizi buraya yazın..."
                />
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] text-right font-mono">
                  {textVal.length} karakter
                </div>
              </div>

              {/* Core Typography Controls */}
              <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <label className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                  Yazı Tipi & Boyut
                </label>

                {/* Font Family Dropdown */}
                {handleRegionTextStyleChange && (
                  <select
                    value={style.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => handleRegionTextStyleChange(r.id, 'fontFamily', e.target.value)}
                    className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B1A] transition cursor-pointer"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value} className="bg-[#252528] text-white">
                        {font.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Font Size & Steppers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'fontSize', Math.max(8, (style.fontSize || 24) - 2))}
                      className="w-6 h-6 rounded flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/10 transition cursor-pointer text-xs font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={style.fontSize || 24}
                      onChange={(e) => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'fontSize', Number(e.target.value))}
                      className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'fontSize', Math.min(200, (style.fontSize || 24) + 2))}
                      className="w-6 h-6 rounded flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/10 transition cursor-pointer text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Alignment Controls */}
                  <div className="flex items-center justify-around bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'align', 'left')}
                      className={`p-1.5 rounded transition cursor-pointer ${style.align === 'left' ? 'bg-[#FF6B1A] text-white' : 'text-[rgba(255,255,255,0.5)] hover:text-white'}`}
                      title="Sola Hizala"
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'align', 'center')}
                      className={`p-1.5 rounded transition cursor-pointer ${style.align === 'center' ? 'bg-[#FF6B1A] text-white' : 'text-[rgba(255,255,255,0.5)] hover:text-white'}`}
                      title="Ortala"
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'align', 'right')}
                      className={`p-1.5 rounded transition cursor-pointer ${style.align === 'right' ? 'bg-[#FF6B1A] text-white' : 'text-[rgba(255,255,255,0.5)] hover:text-white'}`}
                      title="Sağa Hizala"
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Styling: Bold, Italic & Color */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!handleRegionTextStyleChange) return;
                      const isBold = style.fontWeight === 'bold' || style.fontWeight === '700' || style.fontWeight === '900';
                      handleRegionTextStyleChange(r.id, 'fontWeight', isBold ? 'normal' : 'bold');
                    }}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer ${
                      (style.fontWeight === 'bold' || style.fontWeight === '700' || style.fontWeight === '900')
                        ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white' 
                        : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] hover:text-white'
                    }`}
                  >
                    <Bold size={13} />
                    <span>Kalın</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!handleRegionTextStyleChange) return;
                      const isItalic = style.fontStyle === 'italic';
                      handleRegionTextStyleChange(r.id, 'fontStyle', isItalic ? 'normal' : 'italic');
                    }}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer ${
                      style.fontStyle === 'italic'
                        ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white' 
                        : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] hover:text-white'
                    }`}
                  >
                    <Italic size={13} />
                    <span>İtalik</span>
                  </button>

                  {/* Color Picker */}
                  <div className="flex items-center space-x-1 bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl px-2 py-1">
                    <input
                      type="color"
                      value={style.color || '#FFFFFF'}
                      onChange={(e) => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'color', e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                      title="Metin Rengi"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#1D1D1F]/70 p-3">
                <label className="flex items-center justify-between gap-2 text-[10px] text-white/65">Metin arka planı
                  <input type="checkbox" checked={r.hasBackground !== false && r.backgroundColor !== 'transparent'} onChange={e => onUpdateRegionProps(r.id, {hasBackground: e.target.checked, backgroundColor: e.target.checked && r.backgroundColor === 'transparent' ? '#FF6B1A' : r.backgroundColor})} className="accent-[#FF6B1A]" />
                </label>
                <label className="flex items-center justify-between gap-2 text-[10px] text-white/65">Metne sığdır
                  <input type="checkbox" checked={!!r.fitBackgroundToText} onChange={e => onUpdateRegionProps(r.id, {fitBackgroundToText: e.target.checked})} className="accent-[#FF6B1A]" />
                </label>
              </div>

              <ElementStyleControls
                node={r}
                allNodes={[...regionList, ...fixedList]}
                showPadding
                onMoveLayerOrder={onMoveLayerOrder}
                onUpdate={(updates) => onUpdateRegionProps(r.id, updates)}
              />

              {/* Element Alignment & Canvas Placement */}
              <ElementAlignmentSection
                id={r.id}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                isLocked={r.locked}
                canvasWidth={templateWidth}
                canvasHeight={templateHeight}
                onToggleLock={onLock}
                onAlign={(alignment) => onAlign(r.id, alignment)}
                onUpdateProps={(updates) => onUpdateRegionProps(r.id, preserveAspectRatio(r, updates))}
              />

              {/* Collapsible Advanced Typography Settings */}
              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-[rgba(255,255,255,0.6)] hover:text-white py-1 transition cursor-pointer"
                >
                  <span>Gelişmiş Tipografi (Satır / Harf)</span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvanced && (
                  <div className="space-y-3 pt-3">
                    {/* Line height */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[rgba(255,255,255,0.6)]">
                        <span>Satır Yüksekliği</span>
                        <span>{style.lineHeight || 1.2}</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.5"
                        step="0.05"
                        value={style.lineHeight || 1.2}
                        onChange={(e) => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'lineHeight', parseFloat(e.target.value))}
                        className="w-full accent-[#FF6B1A]"
                      />
                    </div>

                    {/* Letter spacing */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[rgba(255,255,255,0.6)]">
                        <span>Harf Aralığı</span>
                        <span>{style.letterSpacing || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="10"
                        step="0.5"
                        value={style.letterSpacing || 0}
                        onChange={(e) => handleRegionTextStyleChange && handleRegionTextStyleChange(r.id, 'letterSpacing', parseFloat(e.target.value))}
                        className="w-full accent-[#FF6B1A]"
                      />
                    </div>

                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <label className="flex items-center justify-between text-[11px] text-white/70">Alt çizgi
                        <input type="checkbox" checked={!!style.underline} onChange={e => handleRegionTextStyleChange?.(r.id, 'underline', e.target.checked)} className="accent-[#FF6B1A]" />
                      </label>
                      <label className="flex items-center justify-between text-[11px] text-white/70">Başlangıç harfi (drop cap)
                        <input type="checkbox" checked={!!style.dropCap} onChange={e => handleRegionTextStyleChange?.(r.id, 'dropCap', e.target.checked)} className="accent-[#FF6B1A]" />
                      </label>
                      <div className="grid grid-cols-[auto_1fr] items-end gap-3">
                        <label className="text-[10px] text-white/55">Marker rengi
                          <input type="color" value={style.highlightColor && /^#[0-9a-f]{6}$/i.test(style.highlightColor) ? style.highlightColor : '#FFE66D'} onChange={e => handleRegionTextStyleChange?.(r.id, 'highlightColor', e.target.value)} className="mt-1 block h-8 w-10 bg-transparent" />
                        </label>
                        <label className="text-[10px] text-white/55">Marker yoğunluğu
                          <input type="range" min="0" max="1" step="0.05" value={style.highlightOpacity ?? 0.7} onChange={e => handleRegionTextStyleChange?.(r.id, 'highlightOpacity', Number(e.target.value))} className="mt-2 w-full accent-[#FF6B1A]" />
                        </label>
                      </div>
                      <label className="flex items-center justify-between text-[11px] text-white/70">Metin gölgesi
                        <input type="checkbox" checked={!!style.hasShadow} onChange={e => handleRegionTextStyleChange?.(r.id, 'hasShadow', e.target.checked)} className="accent-[#FF6B1A]" />
                      </label>
                      {style.hasShadow && <div className="grid grid-cols-2 gap-2">
                        <input type="color" value={style.shadowColor && /^#[0-9a-f]{6}$/i.test(style.shadowColor) ? style.shadowColor : '#000000'} onChange={e => handleRegionTextStyleChange?.(r.id, 'shadowColor', e.target.value)} className="h-8 w-full bg-transparent" title="Metin gölge rengi" />
                        <input type="number" min="0" max="60" value={style.shadowBlur ?? 4} onChange={e => handleRegionTextStyleChange?.(r.id, 'shadowBlur', Number(e.target.value))} className="rounded-lg border border-white/10 bg-black/15 px-2 text-xs text-white" title="Metin gölge bulanıklığı" />
                      </div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════
            CASE 2: IMAGE REGION (Fotoğraf / Görsel)
           ═══════════════════════════════════════════════ */}
        {selectedRegion && selectedRegion.type === 'image' && (() => {
          const r = selectedRegion;
          const imgData = activePageData?.dynamicImages?.[r.id] || activeGraphicData?.dynamicImages?.[r.id] || {
            url: '',
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full">
                  Fotoğraf Alanı
                </span>
                {onLock && (
                  <button
                    type="button"
                    onClick={() => onLock(r.id)}
                    className="text-[11px] text-[rgba(255,255,255,0.6)] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {r.locked ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} />}
                    <span>{r.locked ? 'Kilitli' : 'Kilitle'}</span>
                  </button>
                )}
              </div>

              {/* Photo Preview Thumbnail */}
              <div className="relative aspect-video rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] overflow-hidden flex items-center justify-center">
                {imgData.url ? (
                  <img src={imgData.url} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-3 text-[rgba(255,255,255,0.4)] text-xs">
                    <ImageIcon size={24} className="mx-auto mb-1 opacity-50" />
                    <span>Görsel seçilmedi</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
                >
                  <Upload size={14} />
                  <span>Fotoğrafı Değiştir</span>
                </button>

                {onCrop && (
                  <button
                    type="button"
                    onClick={() => onCrop(r.id)}
                    className="py-2.5 px-3 rounded-xl bg-[#1D1D1F] hover:bg-[#2C2C2E] border border-[rgba(255,255,255,0.1)] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Crop size={14} />
                    <span>Kırp & Konumla</span>
                  </button>
                )}
              </div>

              {/* Zoom and Rotate controls */}
              <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                {updateActiveImageProp && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.7)]">
                      <span>Ölçek / Yakınlaştırma</span>
                      <span>{Math.round((imgData.scale || 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.05"
                      value={imgData.scale || 1.0}
                      onChange={(e) => updateActiveImageProp(r.id, 'scale', parseFloat(e.target.value))}
                      className="w-full accent-[#FF6B1A]"
                    />
                  </div>
                )}

                {updateActiveImageProp && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[rgba(255,255,255,0.7)] font-medium">Döndürme</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = imgData.rotation || 0;
                        updateActiveImageProp(r.id, 'rotation', (cur + 90) % 360);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] text-xs text-white hover:bg-white/10 flex items-center space-x-1 transition cursor-pointer active:scale-95"
                    >
                      <RotateCw size={13} />
                      <span>+90° ({imgData.rotation || 0}°)</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-[#1D1D1F]/70 p-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Görsel yerleşimi
                  <select value={r.objectFit || 'cover'} onChange={e => onUpdateRegionProps(r.id, {objectFit: e.target.value as Region['objectFit']})} className="mt-2 w-full rounded-lg border border-white/10 bg-[#171719] px-2 py-2 text-xs text-white">
                    <option value="cover">Alanı kapla (cover)</option><option value="contain">Tamamını göster (contain)</option><option value="fill">Alanı doldur (fill)</option>
                  </select>
                </label>
                <label className="flex items-center justify-between text-[11px] text-white/70">Görsel maskesi / kırpma
                  <input type="checkbox" checked={r.clipImage !== false} onChange={e => onUpdateRegionProps(r.id, {clipImage: e.target.checked})} className="accent-[#FF6B1A]" />
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['Kare', 0], ['Yumuşak', 24], ['Daire', Math.round(Math.min(r.width, r.height) / 2)]].map(([label, radius]) => <button key={String(label)} type="button" onClick={() => onUpdateRegionProps(r.id, {borderRadius: Number(radius), clipImage: true})} className="rounded-lg border border-white/10 bg-black/15 py-1.5 text-[10px] text-white/70 hover:text-white">{label}</button>)}
                </div>
              </div>

              <ElementStyleControls
                node={r}
                allNodes={[...regionList, ...fixedList]}
                showPadding
                onMoveLayerOrder={onMoveLayerOrder}
                onUpdate={(updates) => onUpdateRegionProps(r.id, updates)}
              />

              {/* Element Alignment & Canvas Placement */}
              <ElementAlignmentSection
                id={r.id}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                isLocked={r.locked}
                canvasWidth={templateWidth}
                canvasHeight={templateHeight}
                onToggleLock={onLock}
                onAlign={(alignment) => onAlign(r.id, alignment)}
                onUpdateProps={(updates) => onUpdateRegionProps(r.id, preserveAspectRatio(r, updates))}
              />
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════
            CASE 3: FIXED ELEMENT (Şekil, Logo, Dekorasyon)
           ═══════════════════════════════════════════════ */}
        {selectedFixed && (() => {
          const el = selectedFixed;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 px-2.5 py-0.5 rounded-full">
                  Sabit Öğe / Şekil
                </span>
                {el.locked && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                    <Lock size={12} /> Kilitli
                  </span>
                )}
              </div>

              {(el.type === 'logo' || el.type === 'social' || el.type === 'text') && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-[#1D1D1F]/70 p-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/55">İçerik
                    <input type="text" value={el.content || ''} onChange={e => onFixedProp(el.id, 'content', e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 text-xs text-white" />
                  </label>
                  {el.type === 'logo' && <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full rounded-lg border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 px-2 py-2 text-[11px] font-bold text-[#FF9F0A]">Logo görseli yükle</button>}
                  {el.type === 'social' && <label className="block text-[10px] text-white/55">İkon
                    <select value={el.iconType || 'none'} onChange={e => onFixedProp(el.id, 'iconType', e.target.value as FixedElement['iconType'])} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171719] px-2 py-2 text-xs text-white">
                      <option value="none">Yok</option><option value="instagram">Instagram</option><option value="globe">Web</option><option value="mail">E-posta</option><option value="phone">Telefon</option>
                    </select>
                  </label>}
                </div>
              )}

              <ElementStyleControls
                node={el}
                allNodes={[...regionList, ...fixedList]}
                onMoveLayerOrder={onMoveLayerOrder}
                onUpdate={(updates) => onUpdateFixedProps(el.id, updates)}
              />

              {/* Element Alignment & Canvas Placement */}
              <ElementAlignmentSection
                id={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                isLocked={el.locked}
                isCircle={el.type === 'shape' && el.shapeType === 'circle'}
                canvasWidth={templateWidth}
                canvasHeight={templateHeight}
                onToggleLock={onLock}
                onAlign={(alignment) => onAlign(el.id, alignment)}
                onUpdateProps={(updates) => onUpdateFixedProps(el.id, preserveAspectRatio(el, updates))}
              />

              {/* Lock toggle */}
              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => onFixedProp(el.id, 'locked', !el.locked)}
                  className={`w-full py-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 ${
                    el.locked 
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                      : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.1)] text-white hover:bg-white/5'
                  }`}
                >
                  {el.locked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{el.locked ? 'Kilidi Aç' : 'Öğeyi Kilitle'}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════
            CASE 4: NO SELECTION (Sayfa ve Tuval Ayarları)
           ═══════════════════════════════════════════════ */}
        {!selectedNodeId && (
          <div className="space-y-5">
            {/* Friendly guidance card */}
            <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] flex items-center justify-center mx-auto">
                <Sliders size={18} />
              </div>
              <h3 className="text-xs font-bold text-white">Öğe Seçilmedi</h3>
              <p className="text-[11px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                Düzenlemek istediğiniz başlığa, fotoğrafa veya şekle tuval üzerinden tıklayın.
              </p>
            </div>

            {/* Quick Page Settings */}
            <div className="space-y-4 pt-1">
              <label className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                Sayfa & Tema Ayarları
              </label>

              {/* Highlight Color */}
              <div className="space-y-1.5">
                <span className="text-xs text-[rgba(255,255,255,0.8)] block">Vurgu Rengi</span>
                <div className="flex items-center space-x-2 bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl p-2">
                  <input
                    type="color"
                    value={vurguColor}
                    onChange={(e) => onColorChange && onColorChange(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="Vurgu Rengi"
                  />
                  <span className="text-xs font-mono text-white">{vurguColor}</span>
                </div>
              </div>

              {onTemplatePropertiesChange && editingTemplate && (
                <details className="group rounded-xl border border-white/10 bg-[#1D1D1F]/70" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Arka plan & Desen <ChevronDown size={13} className="transition group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 border-t border-white/10 p-3">
                    <label className="flex items-center justify-between text-[11px] text-white/70">Arka plan rengi
                      <input type="color" value={editingTemplate.palette?.bg || editingTemplate.backgroundColor || '#1D1D1F'} onChange={e => onTemplatePropertiesChange({backgroundColor: e.target.value, palette: {...editingTemplate.palette, bg: e.target.value}})} className="h-7 w-10 bg-transparent" />
                    </label>

                    <label className="block text-[10px] text-white/55">Gradyan
                      <select value={editingTemplate.backgroundGradient?.type || 'none'} onChange={e => onTemplatePropertiesChange({backgroundGradient: e.target.value === 'none' ? undefined : {type: e.target.value as 'linear' | 'radial', colors: editingTemplate.backgroundGradient?.colors || [editingTemplate.palette?.bg || '#1D1D1F', editingTemplate.palette?.primary || '#FF6B1A'], angle: editingTemplate.backgroundGradient?.angle || 0}})} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171719] px-2 py-2 text-xs text-white">
                        <option value="none">Yok</option><option value="linear">Doğrusal</option><option value="radial">Dairesel</option>
                      </select>
                    </label>
                    {editingTemplate.backgroundGradient && <div className="grid grid-cols-[auto_auto_1fr] items-end gap-2">
                      <input type="color" value={editingTemplate.backgroundGradient.colors[0] || '#1D1D1F'} onChange={e => onTemplatePropertiesChange({backgroundGradient: {...editingTemplate.backgroundGradient!, colors: [e.target.value, editingTemplate.backgroundGradient!.colors[1] || '#FF6B1A']}})} className="h-8 w-10 bg-transparent" title="Gradyan başlangıç rengi" />
                      <input type="color" value={editingTemplate.backgroundGradient.colors[1] || '#FF6B1A'} onChange={e => onTemplatePropertiesChange({backgroundGradient: {...editingTemplate.backgroundGradient!, colors: [editingTemplate.backgroundGradient!.colors[0] || '#1D1D1F', e.target.value]}})} className="h-8 w-10 bg-transparent" title="Gradyan bitiş rengi" />
                      <label className="text-[10px] text-white/55">Açı<input type="number" min="0" max="360" value={editingTemplate.backgroundGradient.angle || 0} onChange={e => onTemplatePropertiesChange({backgroundGradient: {...editingTemplate.backgroundGradient!, angle: Number(e.target.value)}})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs text-white" /></label>
                    </div>}

                    <label className="block text-[10px] text-white/55">Desen
                      <select value={editingTemplate.backgroundPattern?.type || 'none'} onChange={e => onTemplatePropertiesChange({backgroundPattern: {type: e.target.value as NonNullable<DesignTemplate['backgroundPattern']>['type'], color: editingTemplate.backgroundPattern?.color || '#FFFFFF', size: editingTemplate.backgroundPattern?.size || 28, opacity: editingTemplate.backgroundPattern?.opacity ?? 0.16}})} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171719] px-2 py-2 text-xs text-white">
                        <option value="none">Yok</option><option value="grid">Kareli / grafik kâğıdı</option><option value="dots">Nokta deseni</option><option value="circles">Daire sırası</option>
                      </select>
                    </label>
                    {editingTemplate.backgroundPattern && editingTemplate.backgroundPattern.type !== 'none' && <div className="grid grid-cols-[auto_1fr] items-end gap-3">
                      <input type="color" value={editingTemplate.backgroundPattern.color} onChange={e => onTemplatePropertiesChange({backgroundPattern: {...editingTemplate.backgroundPattern!, color: e.target.value}})} className="h-8 w-10 bg-transparent" title="Desen rengi" />
                      <label className="text-[10px] text-white/55">Desen aralığı
                        <input type="range" min="8" max="120" value={editingTemplate.backgroundPattern.size} onChange={e => onTemplatePropertiesChange({backgroundPattern: {...editingTemplate.backgroundPattern!, size: Number(e.target.value)}})} className="mt-2 w-full accent-[#FF6B1A]" />
                      </label>
                    </div>}
                    {editingTemplate.backgroundPattern && editingTemplate.backgroundPattern.type !== 'none' && <label className="block text-[10px] text-white/55">Desen opaklığı
                      <input type="range" min="0" max="1" step="0.02" value={editingTemplate.backgroundPattern.opacity} onChange={e => onTemplatePropertiesChange({backgroundPattern: {...editingTemplate.backgroundPattern!, opacity: Number(e.target.value)}})} className="mt-2 w-full accent-[#FF6B1A]" />
                    </label>}

                    <div className="grid grid-cols-[auto_1fr] items-end gap-3 border-t border-white/10 pt-3">
                      <label className="text-[10px] text-white/55">Kaplama
                        <input type="color" value={editingTemplate.overlay?.color || '#000000'} onChange={e => onTemplatePropertiesChange({overlay: {...(editingTemplate.overlay || {opacity: 0}), color: e.target.value}})} className="mt-1 block h-8 w-10 bg-transparent" />
                      </label>
                      <label className="text-[10px] text-white/55">Kaplama opaklığı
                        <input type="range" min="0" max="1" step="0.05" value={editingTemplate.overlay?.opacity || 0} onChange={e => onTemplatePropertiesChange({overlay: {...(editingTemplate.overlay || {color: '#000000'}), opacity: Number(e.target.value)}})} className="mt-2 w-full accent-[#FF6B1A]" />
                      </label>
                    </div>
                    <label className="block text-[10px] text-white/55">Vinyet
                      <input type="range" min="0" max="1" step="0.05" value={editingTemplate.overlay?.vignette || 0} onChange={e => onTemplatePropertiesChange({overlay: {...(editingTemplate.overlay || {color: '#000000', opacity: 0}), vignette: Number(e.target.value)}})} className="mt-2 w-full accent-[#FF6B1A]" />
                    </label>
                  </div>
                </details>
              )}

              {/* Template Dimension Info */}
              <div className="p-3 rounded-xl bg-[#1D1D1F]/60 border border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
                <span className="text-[rgba(255,255,255,0.5)]">Şablon Ölçüsü</span>
                <span className="font-mono text-white font-bold">
                  {templateWidth} × {templateHeight} px
                </span>
              </div>

              {/* Quick Export CTA */}
              {onExportClick && (
                <button
                  type="button"
                  onClick={onExportClick}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow active:scale-95"
                >
                  <Download size={14} />
                  <span>Tasarımı İndir</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
