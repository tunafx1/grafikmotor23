import React, { useState, useRef } from 'react';
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
  X
} from 'lucide-react';
import { DesignTemplate, Region, FixedElement, TextStyle } from '../types';

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
  handleFixedElementPropertyChange?: (elementId: string, prop: keyof FixedElement, value: any) => void;
  handleFixedElementChange?: (elementId: string, prop: string, value: any) => void;
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
    onExportClick
  } = props;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <aside 
      className="w-full lg:w-[340px] bg-[#252528] border-l border-[rgba(255,255,255,0.08)] flex flex-col z-20 shrink-0 overflow-hidden select-none transition-all duration-300"
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

      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0 bg-[#252528]">
        <div className="flex items-center space-x-2 truncate">
          <span className={`w-2 h-2 rounded-full ${selectedRegion ? (selectedRegion.type === 'text' ? 'bg-[#FF6B1A]' : 'bg-[#34C759]') : selectedFixed ? 'bg-[#FF9F0A]' : 'bg-[rgba(255,255,255,0.4)]'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-[rgba(255,255,255,0.95)] truncate">
            {selectedRegion 
              ? selectedRegion.name 
              : selectedFixed 
                ? (selectedFixed.name || 'Sabit Öğe') 
                : 'Sayfa & Tasarım Ayarları'}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* ═══════════════════════════════════════════════
            CASE 1: TEXT REGION (Başlık, Açıklama, Metin)
           ═══════════════════════════════════════════════ */}
        {selectedRegion && selectedRegion.type === 'text' && (() => {
          const r = selectedRegion;
          const style = r.textStyle || {};
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
                <span className="text-[11px] font-semibold text-[#FF6B1A] bg-[#FF6B1A]/10 px-2.5 py-0.5 rounded-full">
                  {isTitle ? 'Başlık Metni' : 'Metin Alanı'}
                </span>
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

              {/* Collapsible Advanced Settings */}
              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-[rgba(255,255,255,0.6)] hover:text-white py-1 transition cursor-pointer"
                >
                  <span>Gelişmiş Yazı & Yerleşim Ayarları</span>
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

                    {/* Position and Dimensions */}
                    {handleRegionPropertyChange && (
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-[10px] text-[rgba(255,255,255,0.5)] block">Genişlik</span>
                          <input
                            type="number"
                            value={Math.round(r.width)}
                            onChange={(e) => handleRegionPropertyChange(r.id, 'width', Number(e.target.value))}
                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-[rgba(255,255,255,0.5)] block">Yükseklik</span>
                          <input
                            type="number"
                            value={Math.round(r.height)}
                            onChange={(e) => handleRegionPropertyChange(r.id, 'height', Number(e.target.value))}
                            className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </div>
                      </div>
                    )}
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

              {/* Color fill */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                  Dolgu Rengi
                </label>
                <div className="flex items-center space-x-2 bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl p-2">
                  <input
                    type="color"
                    value={el.color || '#000000'}
                    onChange={(e) => onFixedProp(el.id, 'color', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-mono text-white">{el.color || '#000000'}</span>
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.7)]">
                  <span>Opaklık</span>
                  <span>{Math.round((el.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={el.opacity ?? 1}
                  onChange={(e) => onFixedProp(el.id, 'opacity', parseFloat(e.target.value))}
                  className="w-full accent-[#FF6B1A]"
                />
              </div>

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
