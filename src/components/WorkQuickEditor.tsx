import React, { useRef, useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  Bold, ChevronLeft, ChevronRight, Image as ImageIcon, Minus, Move, Plus, Ratio, Type, Upload, X, ChevronDown, ChevronUp
} from 'lucide-react';
import type { DesignTemplate, Region } from '../types';

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
  imageData: Record<string, WorkImageData>;
  onUpdateImageProp: (id: string, prop: keyof WorkImageData, value: any) => void;
  onResizeWork: (width: number, height: number) => void;
  pageCount?: number;
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState<'content' | 'ratio'>('content');
  const [showCoords, setShowCoords] = useState(false);

  const editable = props.regions.filter(region => region.type === 'text' || region.type === 'image');
  const selected = (props.selectedNodeId ? editable.find(region => region.id === props.selectedNodeId) : null) || editable[0];
  const isOpen = !!props.selectedNodeId;

  const textValue = selected?.type === 'text'
    ? props.activePageData?.dynamicTexts?.[selected.id] ?? selected.placeholderText ?? ''
    : '';
  const fontSize = selected?.textStyle?.fontSize ?? 24;
  const currentTextColor = selected?.textStyle?.color ?? '#FFFFFF';
  const currentTextAlign = selected?.textStyle?.align ?? 'left';
  const imgData: WorkImageData = (selected && props.imageData[selected.id]) || { url: '', scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };

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
    props.onRegionChange(selected.id, { textStyle: { ...baseStyle, color } });
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

  const toggleBoldOnSelection = () => {
    const el = textareaRef.current;
    if (!selected) return;
    
    // If text is selected in textarea, bold that selection
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

    // On mobile / touch (no selection range), toggle bold on the entire text block!
    const isWholeBold = textValue.startsWith('**') && textValue.endsWith('**') && textValue.length >= 4;
    const nextText = isWholeBold ? textValue.slice(2, -2) : `**${textValue}**`;
    props.onTextChange(selected.id, nextText);
  };

  return (
    <>
      {/* Mobile Backdrop: Tapping outside the sheet closes it cleanly */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 transition-opacity select-none"
          onClick={() => props.onSelectNode(null)}
          aria-hidden="true"
        />
      )}

      <aside
        data-open={isOpen}
        className="work-quick-editor"
        aria-label="Mevcut tasarım ayarları"
      >
        {/* Mobile Drag Handle: tap or drag to dismiss */}
        <div
          onClick={() => props.onSelectNode(null)}
          className="w-12 h-1.5 bg-white/30 hover:bg-white/50 rounded-full mx-auto my-2 lg:hidden shrink-0 cursor-pointer"
          title="Kapat"
        />

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.08)] bg-[#1D1D1F] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B1A] shrink-0" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-bold text-white truncate block">
                {activeTab === 'ratio' ? 'Tasarım Ölçüsü ve Oranı' : (selected ? selected.name : 'Tasarımı Düzenle')}
              </strong>
              <span className="text-[10px] text-[rgba(255,255,255,0.5)] block truncate">
                {activeTab === 'ratio' ? 'Tüm sayfalara orantılı uygulanır' : 'Yalnızca bu çalışma güncellenir'}
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
              onClick={() => props.onSelectNode(null)}
              className="p-1.5 sm:p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px]"
              title="Düzenleyiciyi Kapat"
              aria-label="Düzenleyiciyi Kapat"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Quick Horizontal Layer & Ratio Selector Strip */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[rgba(255,255,255,0.08)] bg-[#171719] overflow-x-auto scrollbar-none shrink-0">
          {editable.map(region => {
            const isSelected = activeTab === 'content' && selected?.id === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  props.onSelectNode(region.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[34px] ${
                  isSelected
                    ? 'bg-[#FF6B1A] text-white shadow-md shadow-[#FF6B1A]/20'
                    : 'bg-[#222225] text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {region.type === 'text' ? <Type size={13} className="shrink-0" /> : <ImageIcon size={13} className="shrink-0" />}
                <span className="max-w-[110px] truncate">{region.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab('ratio')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ml-auto min-h-[34px] ${
              activeTab === 'ratio'
                ? 'bg-[#FF6B1A] text-white shadow-md shadow-[#FF6B1A]/20'
                : 'bg-[#222225] text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
            title="Tasarım Oranını Değiştir"
          >
            <Ratio size={13} className="shrink-0" />
            <span>Oran ({props.template.width}×{props.template.height})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="work-quick-editor-body flex-1 overflow-y-auto p-4 space-y-4 pb-8">

          {/* TAB 1: RATIO SELECTOR */}
          {activeTab === 'ratio' && (
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] block">
                Sosyal Medya Hazır Ölçüleri
              </label>
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
                Ölçü değiştirildiğinde tüm sayfalardaki katmanlar yeni tuvale orantılı olarak yeniden konumlandırılır.
              </p>
            </div>
          )}

          {/* TAB 2: SELECTED REGION (TEXT OR IMAGE) */}
          {activeTab === 'content' && selected && (
            <div className="space-y-4">
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
                        value={currentTextColor}
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
                    accept="image/*"
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

              {/* Alignment & Centering Row */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] flex items-center justify-between">
                  <span>Tuval Hizalama</span>
                  <button
                    type="button"
                    onClick={() => props.onCenter(selected.id)}
                    className="text-[#FF6B1A] hover:underline flex items-center gap-1 text-[11px] normal-case cursor-pointer"
                  >
                    <AlignCenter size={13} />
                    <span>Tuvalin Ortasına Al</span>
                  </button>
                </label>

                <div className="grid grid-cols-6 gap-1.5">
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
            <div className="p-4 text-center text-xs text-white/50">
              Düzenlenebilir bir katman bulunamadı.
            </div>
          )}

        </div>
      </aside>
    </>
  );
}

