import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  Bold, ChevronLeft, ChevronRight, Image as ImageIcon, Minus, Move, Plus, Ratio, Type, Upload, X, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, Crop, Trash2, Frame, Layers, Sparkles
} from 'lucide-react';
import type { DesignTemplate, Region } from '../types';
import { IMAGE_ACCEPT } from '../utils/heicUtils';

type WorkAlignment = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'center-both';
type WorkImageData = { url: string; scale: number; offsetX: number; offsetY: number; rotation: number };

const QUICK_COLORS = [
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Siyah', hex: '#111111' },
  { name: 'Turuncu', hex: '#FF6B1A' },
  { name: 'Sarı', hex: '#FBBF24' },
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'Yeşil', hex: '#10B981' },
  { name: 'Kırmızı', hex: '#EF4444' },
];

export function isWorkOverlayFrameRegion(region: Region, imageData?: Record<string, WorkImageData>): boolean {
  if (region.type !== 'image') return false;
  if (region.id.startsWith('work-overlay-frame-') || region.isDynamic === false) return true;
  const hasStaticDataUrl =
    !!region.placeholderImage &&
    (region.placeholderImage.startsWith('data:') || region.placeholderImage.startsWith('https://res.cloudinary.com/'));
  const hasDynamicPhoto = !!imageData?.[region.id]?.url && imageData[region.id].url !== region.placeholderImage;
  return hasStaticDataUrl && !hasDynamicPhoto;
}

export function WorkQuickEditor(props: {
  template: DesignTemplate;
  regions: Region[];
  activePageData: any;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onTextChange: (id: string, text: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onRegionChange: (id: string, updates: Partial<Region>) => void;
  onCenter: (id: string) => void;
  onAlign: (id: string, alignment: WorkAlignment) => void;
  onOpenCrop?: (id: string) => void;
  imageData: Record<string, WorkImageData>;
  onUpdateImageProp: (id: string, prop: keyof WorkImageData, value: any) => void;
  onResizeWork: (width: number, height: number) => void;
  onAddRegion?: (type: 'image' | 'text') => void;
  onDeleteRegion?: (id: string) => void;
  onUploadTemplateFrame?: (file: File, mode: 'overlay' | 'background', scope: 'active' | 'all') => void;
  onRemoveTemplateFrame?: (targetIdOrType: 'overlay' | 'background' | 'all' | string, scope: 'active' | 'all') => void;
  activeBackgroundImageUrl?: string;
  forceOpenTab?: 'content' | 'ratio' | null;
  onClearForceOpenTab?: () => void;
  pageCount?: number;
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const overlayFrameInput = useRef<HTMLInputElement>(null);
  const bgFrameInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState<'content' | 'ratio'>('content');
  const [frameScope, setFrameScope] = useState<'active' | 'all'>('active');
  const [showCoords, setShowCoords] = useState(false);
  const [nudgeStep, setNudgeStep] = useState<1 | 10>(10);

  useEffect(() => {
    if (props.forceOpenTab) {
      setActiveTab(props.forceOpenTab);
    }
  }, [props.forceOpenTab]);

  useEffect(() => {
    if (props.selectedNodeId) {
      setActiveTab('content');
    }
  }, [props.selectedNodeId]);

  const allRegions = props.regions.filter(region => region.type === 'text' || region.type === 'image');
  const overlayFrames = allRegions.filter(region => isWorkOverlayFrameRegion(region, props.imageData));
  const editable = allRegions.filter(region => !isWorkOverlayFrameRegion(region, props.imageData) || region.id === props.selectedNodeId);

  const selected = (props.selectedNodeId ? allRegions.find(region => region.id === props.selectedNodeId) : null) || editable[0] || null;
  const isOpen = !!props.selectedNodeId || !!props.forceOpenTab;

  const textValue = selected?.type === 'text'
    ? props.activePageData?.dynamicTexts?.[selected.id] ?? selected.placeholderText ?? ''
    : '';
  const fontSize = selected?.textStyle?.fontSize ?? 24;
  const currentTextColor = selected?.textStyle?.color ?? '#FFFFFF';
  const currentTextAlign = selected?.textStyle?.align ?? 'left';
  const imgData: WorkImageData = (selected && props.imageData[selected.id]) || { url: '', scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };

  const hasActiveBorder = !!selected && selected.hasBorder !== false && (selected.borderWidth || 0) > 0 && !!selected.borderColor && selected.borderColor !== 'transparent';
  const currentBorderWidth = hasActiveBorder ? (selected?.borderWidth || 0) : 0;
  const currentBorderColor = (selected?.borderColor && selected.borderColor !== 'transparent') ? selected.borderColor : '#FFFFFF';
  const currentBorderRadius = selected?.borderRadius || 0;

  const handleCloseEditor = () => {
    props.onSelectNode(null);
    props.onClearForceOpenTab?.();
  };

  const applyFontSize = (next: number) => {
    if (!selected) return;
    const clamped = Math.max(8, Math.min(200, next));
    const baseStyle = selected.textStyle || {
      fontFamily: 'Inter',
      color: '#FFFFFF',
      fontWeight: 'bold' as const,
      lineHeight: 1.2,
      align: 'left' as const,
      fontSize: 24,
    };
    props.onRegionChange(selected.id, { textStyle: { ...baseStyle, fontSize: clamped } });
  };

  const applyTextColor = (color: string) => {
    if (!selected) return;
    const baseStyle = selected.textStyle || {
      fontFamily: 'Inter',
      color: '#FFFFFF',
      fontWeight: 'bold' as const,
      lineHeight: 1.2,
      align: 'left' as const,
      fontSize: 24,
    };
    props.onRegionChange(selected.id, { textStyle: { ...baseStyle, color, isCustomColor: true } });
  };

  const applyTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!selected) return;
    const baseStyle = selected.textStyle || {
      fontFamily: 'Inter',
      color: '#FFFFFF',
      fontWeight: 'bold' as const,
      lineHeight: 1.2,
      align: 'left' as const,
      fontSize: 24,
    };
    props.onRegionChange(selected.id, { textStyle: { ...baseStyle, align } });
  };

  const handleAddBorderToSelected = () => {
    if (!selected) return;
    const nextWidth = (selected.borderWidth && selected.borderWidth > 0) ? selected.borderWidth : 6;
    const nextColor = (selected.borderColor && selected.borderColor !== 'transparent') ? selected.borderColor : '#FFFFFF';
    props.onRegionChange(selected.id, {
      hasBorder: true,
      borderWidth: nextWidth,
      borderColor: nextColor,
    });
  };

  const handleRemoveBorderFromSelected = () => {
    if (!selected) return;
    props.onRegionChange(selected.id, {
      hasBorder: false,
      borderWidth: 0,
      borderColor: 'transparent',
    });
  };

  const handleBorderWidthChange = (nextWidth: number) => {
    if (!selected) return;
    const clamped = Math.max(0, Math.min(60, nextWidth));
    if (clamped === 0) {
      handleRemoveBorderFromSelected();
      return;
    }
    const nextColor = (selected.borderColor && selected.borderColor !== 'transparent') ? selected.borderColor : '#FFFFFF';
    props.onRegionChange(selected.id, {
      hasBorder: true,
      borderWidth: clamped,
      borderColor: nextColor,
    });
  };

  const handleBorderColorChange = (color: string) => {
    if (!selected) return;
    const nextWidth = (selected.borderWidth && selected.borderWidth > 0) ? selected.borderWidth : 6;
    props.onRegionChange(selected.id, {
      hasBorder: true,
      borderWidth: nextWidth,
      borderColor: color,
    });
  };

  const handleBorderRadiusChange = (radius: number) => {
    if (!selected) return;
    const clamped = Math.max(0, Math.min(500, radius));
    props.onRegionChange(selected.id, {
      borderRadius: clamped,
      ...(selected.type === 'image' ? { clipImage: true } : {}),
    });
  };

  const toggleBoldOnSelection = () => {
    const el = textareaRef.current;
    if (!selected) return;

    if (el && el.selectionStart !== el.selectionEnd) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = textValue.slice(0, start);
      const middle = textValue.slice(start, end);
      const after = textValue.slice(end);
      const isAlreadyBold = middle.startsWith('**') && middle.endsWith('**') && middle.length >= 4;
      const nextMiddle = isAlreadyBold ? middle.slice(2, -2) : `**${middle}**`;
      const nextText = before + nextMiddle + after;
      props.onTextChange(selected.id, nextText);
      requestAnimationFrame(() => {
        const delta = nextMiddle.length - middle.length;
        el.focus();
        el.setSelectionRange(start, end + delta);
      });
      return;
    }

    const isWholeBold = textValue.startsWith('**') && textValue.endsWith('**') && textValue.length >= 4;
    const nextText = isWholeBold ? textValue.slice(2, -2) : `**${textValue}**`;
    props.onTextChange(selected.id, nextText);
  };

  return (
    <>
      <aside
        data-open={isOpen}
        className="work-quick-editor"
        aria-label="Mevcut tasarım ayarları"
      >
        {/* Mobile Drag Handle: tap or drag to dismiss */}
        <div
          onClick={handleCloseEditor}
          className="w-12 h-1.5 bg-white/30 hover:bg-white/50 rounded-full mx-auto my-2 lg:hidden shrink-0 cursor-pointer"
          title="Kapat"
        />

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.08)] bg-[#1D1D1F] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B1A] shrink-0" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-bold text-white truncate block">
                {activeTab === 'ratio' ? 'Şablon & Çerçeve Ayarları' : (selected ? selected.name : 'Tasarımı Düzenle')}
              </strong>
              <span className="text-[10px] text-[rgba(255,255,255,0.5)] block truncate">
                Yalnızca bu çalışma düzenleniyor · Ana şablon korunur
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-page mini navigator inside editor header */}
            {typeof props.pageCount === 'number' && props.pageCount > 1 && props.onSelectPage && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs text-white">
                <button
                  type="button"
                  disabled={(props.activePageIndex || 0) <= 0}
                  onClick={() => props.onSelectPage!((props.activePageIndex || 0) - 1)}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  title="Önceki Sayfa"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-1 text-[11px] font-mono font-bold">
                  {(props.activePageIndex || 0) + 1}/{props.pageCount}
                </span>
                <button
                  type="button"
                  disabled={(props.activePageIndex || 0) >= props.pageCount - 1}
                  onClick={() => props.onSelectPage!((props.activePageIndex || 0) + 1)}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  title="Sonraki Sayfa"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCloseEditor}
              className="p-1.5 sm:p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px]"
              title="Düzenleyiciyi Kapat"
              aria-label="Düzenleyiciyi Kapat"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Quick Horizontal Layer & Template Settings Selector Strip */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[rgba(255,255,255,0.08)] bg-[#171719] overflow-x-auto scrollbar-none shrink-0">
          {editable.map(region => {
            const isSelected = activeTab === 'content' && selected?.id === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  props.onClearForceOpenTab?.();
                  props.onSelectNode(region.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[34px] ${
                  isSelected
                    ? 'bg-[#FF6B1A] text-white shadow-md shadow-[#FF6B1A]/20'
                    : 'bg-[#222225] text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {region.type === 'text' ? <Type size={13} className="shrink-0" /> : <ImageIcon size={13} className="shrink-0" />}
                <span className="max-w-[100px] truncate">{region.name}</span>
              </button>
            );
          })}

          {props.onAddRegion && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('content');
                props.onClearForceOpenTab?.();
                props.onAddRegion!('image');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[34px] bg-[#34C759]/15 text-[#34C759] hover:bg-[#34C759]/25 border border-[#34C759]/30"
              title="Bu çalışmaya yeni görsel çerçevesi ekle"
            >
              <Plus size={13} className="shrink-0" />
              <span>Çerçeve Ekle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('ratio')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ml-auto min-h-[34px] ${
              activeTab === 'ratio'
                ? 'bg-[#FF6B1A] text-white shadow-md shadow-[#FF6B1A]/20'
                : 'bg-[#222225] text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
            title="Şablon, Çerçeve ve Ölçü Ayarları"
          >
            <Frame size={13} className="shrink-0" />
            <span>Şablon Ayarları</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="work-quick-editor-body flex-1 overflow-y-auto p-4 space-y-4 pb-8">

          {/* TAB 1: TEMPLATE, FRAME & RATIO SETTINGS (WORK-SCOPED) */}
          {activeTab === 'ratio' && (
            <div className="space-y-5">

              {/* SECTION 1: FULL-PAGE TEMPLATE FRAME (PNG OVERLAY OR BACKGROUND) */}
              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#1D1D1F] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Frame size={14} className="text-[#FF6B1A] shrink-0" />
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white block">
                      Şablon Çerçevesi (PNG / Arka Plan)
                    </label>
                  </div>
                  {(props.pageCount || 1) > 1 && (
                    <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setFrameScope('active')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                          frameScope === 'active' ? 'bg-[#FF6B1A] text-white' : 'text-white/55 hover:text-white'
                        }`}
                      >
                        Bu Sayfa
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrameScope('all')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                          frameScope === 'all' ? 'bg-[#FF6B1A] text-white' : 'text-white/55 hover:text-white'
                        }`}
                      >
                        Tüm Sayfalar
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-white/55 leading-relaxed">
                  Tasarımın üzerine şeffaf PNG çerçeve ekleyebilir veya mevcut şablon çerçevesini/arka planını yalnızca bu çalışma için kaldırabilirsiniz.
                </p>

                <input
                  ref={overlayFrameInput}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  hidden
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file && props.onUploadTemplateFrame) {
                      props.onUploadTemplateFrame(file, 'overlay', frameScope);
                    }
                    event.target.value = '';
                  }}
                />
                <input
                  ref={bgFrameInput}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  hidden
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file && props.onUploadTemplateFrame) {
                      props.onUploadTemplateFrame(file, 'background', frameScope);
                    }
                    event.target.value = '';
                  }}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => overlayFrameInput.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-[#FF6B1A]/15 hover:bg-[#FF6B1A]/25 border border-[#FF6B1A]/40 text-white text-xs font-bold transition cursor-pointer min-h-[54px]"
                  >
                    <span className="flex items-center gap-1 text-[#FF6B1A]">
                      <Plus size={14} />
                      <span>Üst Çerçeve Ekle</span>
                    </span>
                    <span className="text-[10px] font-normal text-white/60">Şeffaf PNG Kaplama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => bgFrameInput.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition cursor-pointer min-h-[54px]"
                  >
                    <span className="flex items-center gap-1 text-white/90">
                      <Upload size={14} />
                      <span>Arka Plan Ekle</span>
                    </span>
                    <span className="text-[10px] font-normal text-white/50">Sabit Zemin Görseli</span>
                  </button>
                </div>

                {/* Active Overlay Frames & Background Frame List */}
                {(overlayFrames.length > 0 || props.activeBackgroundImageUrl) ? (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                      Aktif Şablon Çerçeveleri
                    </span>

                    {overlayFrames.map(frame => {
                      const previewUrl = props.imageData[frame.id]?.url || frame.placeholderImage;
                      return (
                        <div
                          key={frame.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#171719] border border-white/10"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={frame.name}
                                className="w-9 h-9 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Frame size={15} className="text-[#FF6B1A]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-white truncate block">{frame.name}</strong>
                              <span className="text-[10px] text-white/45 block">Üst Çerçeve Katmanı</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => props.onRemoveTemplateFrame?.(frame.id, frameScope)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-[#FF453A] text-[11px] font-bold transition cursor-pointer shrink-0"
                            title="Bu çerçeveyi çalışmadan kaldır"
                          >
                            <Trash2 size={12} />
                            <span>Çerçeveyi Kaldır</span>
                          </button>
                        </div>
                      );
                    })}

                    {props.activeBackgroundImageUrl && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#171719] border border-white/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={props.activeBackgroundImageUrl}
                            alt="Şablon arka planı"
                            className="w-9 h-9 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <strong className="text-xs font-bold text-white truncate block">Arka Plan Çerçevesi</strong>
                            <span className="text-[10px] text-white/45 block">Sabit Şablon Zemini</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => props.onRemoveTemplateFrame?.('background', frameScope)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-[#FF453A] text-[11px] font-bold transition cursor-pointer shrink-0"
                          title="Arka plan çerçevesini bu çalışmadan kaldır"
                        >
                          <Trash2 size={12} />
                          <span>Çerçeveyi Kaldır</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-[#171719] border border-white/5 text-[11px] text-white/45 text-center">
                    Bu sayfada aktif bir sabit şablon çerçevesi bulunmuyor.
                  </div>
                )}
              </div>

              {/* SECTION 2: ADD / REMOVE PHOTO & TEXT FRAMES ON THIS WORK */}
              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#1D1D1F] space-y-3">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-[#34C759] shrink-0" />
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white block">
                    Görsel & Metin Çerçeveleri (Bu Sayfa)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      props.onAddRegion?.('image');
                      setActiveTab('content');
                      props.onClearForceOpenTab?.();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#34C759]/15 hover:bg-[#34C759]/25 border border-[#34C759]/40 text-[#34C759] text-xs font-bold transition cursor-pointer min-h-[42px]"
                  >
                    <Plus size={14} />
                    <span>Görsel Çerçevesi Ekle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      props.onAddRegion?.('text');
                      setActiveTab('content');
                      props.onClearForceOpenTab?.();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FF6B1A]/15 hover:bg-[#FF6B1A]/25 border border-[#FF6B1A]/40 text-[#FF6B1A] text-xs font-bold transition cursor-pointer min-h-[42px]"
                  >
                    <Plus size={14} />
                    <span>Metin Çerçevesi Ekle</span>
                  </button>
                </div>

                {editable.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {editable.map(region => (
                      <div
                        key={region.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[#171719] border border-white/5 hover:border-white/15 transition"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            props.onSelectNode(region.id);
                            setActiveTab('content');
                            props.onClearForceOpenTab?.();
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          {region.type === 'text' ? (
                            <Type size={13} className="text-[#FF6B1A] shrink-0" />
                          ) : (
                            <ImageIcon size={13} className="text-[#34C759] shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-white truncate">{region.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              props.onSelectNode(region.id);
                              setActiveTab('content');
                              props.onClearForceOpenTab?.();
                            }}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-white/75 hover:text-white transition cursor-pointer"
                          >
                            Düzenle
                          </button>
                          {props.onDeleteRegion && (
                            <button
                              type="button"
                              onClick={() => props.onDeleteRegion!(region.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF453A]/15 hover:bg-[#FF453A]/25 text-[#FF453A] text-[10px] font-bold transition cursor-pointer"
                              title="Bu çerçeveyi çalışmadan kaldır"
                            >
                              <Trash2 size={11} />
                              <span>Kaldır</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/45 text-center py-2">
                    Bu sayfada henüz fotoğraf veya metin çerçevesi yok.
                  </p>
                )}
              </div>

              {/* SECTION 3: RATIO SELECTOR */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <Ratio size={14} className="text-[#FF6B1A] shrink-0" />
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] block">
                    Sosyal Medya Hazır Ölçüleri
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Kare Gönderi', 1080, 1080, '1:1'],
                    ['Dikey Gönderi', 1080, 1350, '4:5'],
                    ['Hikâye / Reels', 1080, 1920, '9:16'],
                    ['Yatay Gönderi', 1080, 566, '1.91:1'],
                  ].map(([name, width, height, ratio]) => {
                    const isActive = props.template.width === width && props.template.height === height;
                    return (
                      <button
                        key={String(name)}
                        type="button"
                        onClick={() => props.onResizeWork(Number(width), Number(height))}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[72px] ${
                          isActive
                            ? 'bg-[#FF6B1A]/15 border-[#FF6B1A] ring-1 ring-[#FF6B1A]'
                            : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] hover:bg-[#252528]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className={`text-xs font-bold ${isActive ? 'text-[#FF6B1A]' : 'text-white'}`}>
                            {name}
                          </strong>
                          <span className="text-[10px] font-mono text-white/50">{ratio}</span>
                        </div>
                        <span className="text-[11px] font-mono text-white/60 mt-1">{width} × {height} px</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                  Ölçü değiştirildiğinde bu çalışmadaki tüm sayfalarda bulunan katmanlar yeni tuvale orantılı olarak uyarlanır.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SELECTED REGION (TEXT OR IMAGE) */}
          {activeTab === 'content' && selected && (
            <div className="space-y-4">
              {/* Quick Top Bar: Frame Type Badge & Remove Frame Action */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  selected.type === 'text'
                    ? 'bg-[#FF6B1A]/15 text-[#FF6B1A]'
                    : 'bg-[#34C759]/15 text-[#34C759]'
                }`}>
                  {selected.type === 'text' ? 'Metin Çerçevesi' : 'Görsel Çerçevesi'}
                </span>

                {props.onDeleteRegion && (
                  <button
                    type="button"
                    onClick={() => props.onDeleteRegion!(selected.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-[#FF453A] text-[11px] font-bold transition cursor-pointer"
                    title="Bu çerçeveyi yalnızca bu çalışmadan kaldır (Ana şablon korunur)"
                  >
                    <Trash2 size={12} />
                    <span>Çerçeveyi Kaldır</span>
                  </button>
                )}
              </div>

              {/* If TEXT Region */}
              {selected.type === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">
                      Metin İçeriği
                    </label>
                    <span className="text-[10px] text-white/40">{textValue.length} karakter</span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={textValue}
                    onChange={event => props.onTextChange(selected.id, event.target.value)}
                    placeholder="Başlık veya açıklama metnini buraya yazın..."
                    className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.12)] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition resize-y leading-relaxed"
                  />

                  {/* Font Size & Bold Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 border border-white/10 rounded-xl bg-[#1D1D1F] p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => applyFontSize(fontSize - 2)}
                        aria-label="Yazıyı küçült"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold text-white font-mono px-2 min-w-[42px] text-center">
                        {fontSize} pt
                      </span>
                      <button
                        type="button"
                        onClick={() => applyFontSize(fontSize + 2)}
                        aria-label="Yazıyı büyüt"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleBoldOnSelection}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-[#1D1D1F] hover:bg-[#FF6B1A]/10 hover:border-[#FF6B1A] text-white text-xs font-bold transition cursor-pointer shrink-0 min-h-[38px]"
                      title="Metni kalınlaştır (seçili alan yoksa tüm metni kalınlaştırır)"
                    >
                      <Bold size={14} />
                      <span>Kalınlaştır</span>
                    </button>

                    {/* Text Alignment (Left, Center, Right) */}
                    <div className="flex items-center border border-white/10 rounded-xl bg-[#1D1D1F] p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => applyTextAlign('left')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
                          currentTextAlign === 'left' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title="Metni sola hizala"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTextAlign('center')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
                          currentTextAlign === 'center' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title="Metni ortala"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTextAlign('right')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
                          currentTextAlign === 'right' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title="Metni sağa hizala"
                      >
                        <AlignRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Color Palette */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                      Yazı Rengi
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {QUICK_COLORS.map(col => {
                        const isColActive = currentTextColor.toLowerCase() === col.hex.toLowerCase();
                        return (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => applyTextColor(col.hex)}
                            className={`w-7 h-7 rounded-full border-2 transition cursor-pointer shrink-0 flex items-center justify-center ${
                              isColActive ? 'border-[#FF6B1A] scale-110 shadow-md' : 'border-white/20 hover:scale-105'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          />
                        );
                      })}
                      <input
                        type="color"
                        value={currentTextColor.startsWith('#') ? currentTextColor : '#FFFFFF'}
                        onChange={e => applyTextColor(e.target.value)}
                        className="w-7 h-7 rounded-full border border-white/20 bg-transparent cursor-pointer shrink-0"
                        title="Özel Renk Seç"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* If IMAGE Region */}
              {selected.type === 'image' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] block">
                    Görsel Seçimi & Yerleşim
                  </label>

                  <input
                    ref={fileInput}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    hidden
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (file) props.onImageUpload(selected.id, file);
                      event.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF6B1A] hover:bg-[#FF7D35] text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-[#FF6B1A]/20 min-h-[44px]"
                  >
                    <Upload size={16} />
                    <span>Yeni Görsel Yükle</span>
                  </button>

                  {props.onOpenCrop && (
                    <button
                      type="button"
                      onClick={() => props.onOpenCrop?.(selected.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1E3A28] to-[#172E20] hover:from-[#264A33] hover:to-[#1E3B29] border border-[#34C759]/40 text-[#34C759] hover:text-white font-bold text-xs transition cursor-pointer shadow-md min-h-[42px] active:scale-[0.98]"
                    >
                      <Crop size={15} className="shrink-0" />
                      <span>Çerçeve İçi Görseli Konumlandır ve Kırp</span>
                    </button>
                  )}

                  <div className="p-3 rounded-xl border border-white/10 bg-[#1D1D1F] space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-white/70">
                        <span>Yakınlaştırma (Ölçek)</span>
                        <span className="font-mono text-[#FF6B1A] font-bold">{Math.round((imgData.scale ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={3}
                        step={0.05}
                        value={imgData.scale ?? 1}
                        onChange={event => props.onUpdateImageProp(selected.id, 'scale', parseFloat(event.target.value))}
                        className="w-full accent-[#FF6B1A] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-white/70">
                        <span>Döndürme Açısı</span>
                        <span className="font-mono text-[#FF6B1A] font-bold">
                          {((((imgData.rotation ?? 0) + 180) % 360 + 360) % 360 - 180).toFixed(0)}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={(((imgData.rotation ?? 0) + 180) % 360 + 360) % 360 - 180}
                        onChange={event => props.onUpdateImageProp(selected.id, 'rotation', Number(event.target.value))}
                        className="w-full accent-[#FF6B1A] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BORDER FRAME & CORNER RADIUS CONTROLS (ÇERÇEVE EKLE / KALDIR) */}
              <div className="p-3 rounded-xl border border-white/10 bg-[#1D1D1F] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Frame size={13} className="text-[#FF6B1A] shrink-0" />
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Kenarlık Çerçevesi
                    </label>
                  </div>

                  {hasActiveBorder ? (
                    <button
                      type="button"
                      onClick={handleRemoveBorderFromSelected}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-[#FF453A] text-[10px] font-bold transition cursor-pointer"
                    >
                      <Trash2 size={11} />
                      <span>Çerçeveyi Kaldır</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddBorderToSelected}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B1A]/15 hover:bg-[#FF6B1A]/25 border border-[#FF6B1A]/40 text-[#FF6B1A] text-[10px] font-bold transition cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>Çerçeve Ekle</span>
                    </button>
                  )}
                </div>

                {/* Border Width Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/70">
                    <span>Çerçeve Kalınlığı</span>
                    <span className="font-mono text-[#FF6B1A] font-bold">{currentBorderWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={currentBorderWidth}
                    onChange={event => handleBorderWidthChange(Number(event.target.value))}
                    className="w-full accent-[#FF6B1A] cursor-pointer"
                  />
                </div>

                {/* Border Color Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                    Çerçeve Rengi
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {QUICK_COLORS.map(col => {
                      const isColActive = hasActiveBorder && currentBorderColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => handleBorderColorChange(col.hex)}
                          className={`w-6 h-6 rounded-full border-2 transition cursor-pointer shrink-0 ${
                            isColActive ? 'border-[#FF6B1A] scale-110 shadow-md' : 'border-white/20 hover:scale-105'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={`Çerçeve rengi: ${col.name}`}
                        />
                      );
                    })}
                    <input
                      type="color"
                      value={currentBorderColor.startsWith('#') ? currentBorderColor : '#FFFFFF'}
                      onChange={e => handleBorderColorChange(e.target.value)}
                      className="w-6 h-6 rounded-full border border-white/20 bg-transparent cursor-pointer shrink-0"
                      title="Özel Çerçeve Rengi"
                    />
                  </div>
                </div>

                {/* Corner Radius Presets & Slider */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-[11px] text-white/70">
                    <span>Köşe Yuvarlaklığı</span>
                    <span className="font-mono text-[#FF6B1A] font-bold">{currentBorderRadius} px</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      ['Keskin', 0],
                      ['Yumuşak', 24],
                      ['Yuvarlak', 48],
                      ['Daire', Math.round(Math.min(selected.width, selected.height) / 2)],
                    ] as const).map(([label, radius]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleBorderRadiusChange(radius)}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                          currentBorderRadius === radius
                            ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white'
                            : 'bg-black/20 border-white/10 text-white/65 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={2}
                    value={Math.min(250, currentBorderRadius)}
                    onChange={event => handleBorderRadiusChange(Number(event.target.value))}
                    className="w-full accent-[#FF6B1A] cursor-pointer"
                  />
                </div>
              </div>

              {/* Alignment & Position Section */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)]">
                    Konum & Hizalama
                  </label>
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNudgeStep(1)}
                      className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${nudgeStep === 1 ? 'bg-[#FF6B1A] text-white' : 'text-white/50 hover:text-white'}`}
                      title="1 piksel hassas kaydırma"
                    >
                      1 px
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeStep(10)}
                      className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${nudgeStep === 10 ? 'bg-[#FF6B1A] text-white' : 'text-white/50 hover:text-white'}`}
                      title="10 piksel hızlı kaydırma"
                    >
                      10 px
                    </button>
                  </div>
                </div>

                {/* Tactile Nudge Control Pad */}
                <div className="bg-[#171719] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <div className="grid grid-cols-3 gap-1.5 w-full max-w-[210px]">
                    <div />
                    <button
                      type="button"
                      onClick={() => props.onRegionChange(selected.id, { y: Math.round(selected.y - nudgeStep) })}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#222225] hover:bg-[#2C2C30] active:bg-[#FF6B1A] active:text-white text-white flex items-center justify-center transition cursor-pointer min-h-[40px] shadow-sm"
                      title="Yukarı Kaydır"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <div />

                    <button
                      type="button"
                      onClick={() => props.onRegionChange(selected.id, { x: Math.round(selected.x - nudgeStep) })}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#222225] hover:bg-[#2C2C30] active:bg-[#FF6B1A] active:text-white text-white flex items-center justify-center transition cursor-pointer min-h-[40px] shadow-sm"
                      title="Sola Kaydır"
                    >
                      <ArrowLeftIcon size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => props.onCenter(selected.id)}
                      className="p-1 rounded-xl border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 hover:bg-[#FF6B1A]/20 text-[#FF6B1A] flex flex-col items-center justify-center text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[40px]"
                      title="Tuvalin Tam Ortasına Al"
                    >
                      <AlignCenter size={14} />
                      <span className="text-[9px] mt-0.5">Ortala</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => props.onRegionChange(selected.id, { x: Math.round(selected.x + nudgeStep) })}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#222225] hover:bg-[#2C2C30] active:bg-[#FF6B1A] active:text-white text-white flex items-center justify-center transition cursor-pointer min-h-[40px] shadow-sm"
                      title="Sağa Kaydır"
                    >
                      <ArrowRightIcon size={16} />
                    </button>

                    <div />
                    <button
                      type="button"
                      onClick={() => props.onRegionChange(selected.id, { y: Math.round(selected.y + nudgeStep) })}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#222225] hover:bg-[#2C2C30] active:bg-[#FF6B1A] active:text-white text-white flex items-center justify-center transition cursor-pointer min-h-[40px] shadow-sm"
                      title="Aşağı Kaydır"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <div />
                  </div>
                </div>

                {/* 6 Quick Canvas Alignment Buttons */}
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'left')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Sola yasla"
                  >
                    <AlignHorizontalJustifyStart size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'center-x')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Yatayda ortala"
                  >
                    <AlignHorizontalJustifyCenter size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'right')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Sağa yasla"
                  >
                    <AlignHorizontalJustifyEnd size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'top')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Üste yasla"
                  >
                    <AlignVerticalJustifyStart size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'center-y')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Dikeyde ortala"
                  >
                    <AlignVerticalJustifyCenter size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAlign(selected.id, 'bottom')}
                    className="p-2.5 rounded-lg border border-white/10 bg-[#1D1D1F] hover:border-[#FF6B1A] text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer min-h-[38px]"
                    title="Alta yasla"
                  >
                    <AlignVerticalJustifyEnd size={15} />
                  </button>
                </div>
              </div>

              {/* Optional Collapsible Coordinate Tweaks */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCoords(prev => !prev)}
                  className="flex items-center justify-between w-full text-[11px] font-semibold text-white/50 hover:text-white transition py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Move size={12} />
                    <span>Piksel Hassas Konum (X, Y, En, Boy)</span>
                  </span>
                  {showCoords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showCoords && (
                  <div className="grid grid-cols-4 gap-2 pt-2 animate-fade-in">
                    {([['X', 'x'], ['Y', 'y'], ['En', 'width'], ['Boy', 'height']] as const).map(([label, key]) => (
                      <label key={key} className="text-[10px] text-white/60 block">
                        {label}
                        <input
                          type="number"
                          min={key === 'width' || key === 'height' ? 10 : undefined}
                          value={Math.round(selected[key])}
                          onChange={event => props.onRegionChange(selected.id, {
                            [key]: Math.max(key === 'width' || key === 'height' ? 10 : 0, Number(event.target.value))
                          })}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg bg-[#1D1D1F] border border-white/10 text-white font-mono text-xs focus:border-[#FF6B1A] outline-none"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && !selected && (
            <div className="p-5 text-center space-y-3 rounded-2xl bg-[#1D1D1F] border border-white/10">
              <p className="text-xs text-white/60">
                Bu sayfada düzenlenebilir çerçeve bulunamadı. Yeni bir görsel veya metin çerçevesi ekleyebilirsiniz.
              </p>
              {props.onAddRegion && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => props.onAddRegion!('image')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#34C759]/15 hover:bg-[#34C759]/25 border border-[#34C759]/40 text-[#34C759] text-xs font-bold transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Görsel Çerçevesi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onAddRegion!('text')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FF6B1A]/15 hover:bg-[#FF6B1A]/25 border border-[#FF6B1A]/40 text-[#FF6B1A] text-xs font-bold transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Metin Çerçevesi</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
