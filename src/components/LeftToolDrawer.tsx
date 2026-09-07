import React, { useState } from 'react';
import { 
  LayoutTemplate, 
  PlusCircle, 
  Image as ImageIcon, 
  Layers, 
  WandSparkles, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Copy, 
  Sliders, 
  Download, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Type, 
  Square, 
  Circle, 
  Video, 
  ExternalLink,
  Loader2,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { DesignTemplate, Region, FixedElement } from '../types';

export type ToolDrawerTab = 'templates' | 'add' | 'media' | 'layers' | 'ai' | null;

export interface LeftToolDrawerProps {
  activeTab: ToolDrawerTab;
  onTabChange?: (tab: ToolDrawerTab) => void;
  onSelectTab?: (tab: ToolDrawerTab) => void;
  onOpenBatchProduction?: () => void;
  isBatchActive?: boolean;
  templates: DesignTemplate[];
  currentTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate?: () => void;
  onDuplicateTemplate?: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onOpenTemplateEditor?: (template: DesignTemplate) => void;
  onOpenRenameModal?: (template: DesignTemplate) => void;
  onRenameTemplate?: (id: string, newName: string) => void;
  // Add tools
  onAddTextRegion?: () => void;
  onAddImageRegion?: () => void;
  onAddShape?: (type: 'rect' | 'circle') => void;
  onAddNewRegion?: (type: 'text' | 'image', role?: 'title' | 'body') => void;
  onAddNewFixedElement?: (type: 'rect' | 'circle' | 'image' | 'video') => void;
  // Media tools
  uploadedImages?: string[];
  onUploadImage?: (file: File) => void;
  onUploadMedia?: (file: File) => void;
  onSelectMediaImage?: (url: string) => void;
  onOpenMediaDownloader?: () => void;
  onOpenYouTubeModal?: () => void;
  // Layers
  currentRegions?: Region[];
  regions?: Region[];
  currentFixedElements?: FixedElement[];
  fixedElements?: FixedElement[];
  selectedNodeId?: string | null;
  onSelectNode?: (id: string | null) => void;
  onToggleLock?: (id: string, isLocked: boolean) => void;
  onToggleNodeLock?: (id: string) => void;
  onToggleVisibility?: (id: string, isVisible: boolean) => void;
  onToggleNodeVisibility?: (id: string) => void;
  onDeleteNode?: (id: string) => void;
  onReorderRegions?: (from: number, to: number) => void;
  hiddenElementIds?: string[];
  // AI
  aiSystemPrompt?: string;
  onGeneratePageTexts?: (brief: string) => Promise<void> | void;
  onGenerateAiBrief?: (brief: string) => void;
  isAiLoading?: boolean;
}

export function LeftToolDrawer(props: LeftToolDrawerProps) {
  const {
    activeTab,
    onTabChange,
    onSelectTab,
    onOpenBatchProduction,
    isBatchActive,
    templates = [],
    currentTemplateId,
    onSelectTemplate,
    onCreateTemplate,
    onDuplicateTemplate,
    onDeleteTemplate,
    onOpenTemplateEditor,
    onOpenRenameModal,
    onRenameTemplate,
    onAddTextRegion,
    onAddImageRegion,
    onAddShape,
    onAddNewRegion,
    onAddNewFixedElement,
    uploadedImages = [],
    onUploadImage,
    onUploadMedia,
    onSelectMediaImage,
    onOpenMediaDownloader,
    onOpenYouTubeModal,
    currentRegions,
    regions,
    currentFixedElements,
    fixedElements,
    selectedNodeId = null,
    onSelectNode,
    onToggleLock,
    onToggleNodeLock,
    onToggleVisibility,
    onToggleNodeVisibility,
    onDeleteNode,
    onReorderRegions,
    hiddenElementIds = [],
    aiSystemPrompt,
    onGeneratePageTexts,
    onGenerateAiBrief,
    isAiLoading = false
  } = props;

  const [templateMenuOpenId, setTemplateMenuOpenId] = useState<string | null>(null);
  const [aiBrief, setAiBrief] = useState('');

  const changeTab = onTabChange || onSelectTab;

  const handleToolClick = (tab: ToolDrawerTab) => {
    if (!changeTab) return;
    if (activeTab === tab) {
      changeTab(null); // Toggle close
    } else {
      changeTab(tab);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFn = onUploadImage || onUploadMedia;
    if (uploadFn && e.target.files && e.target.files[0]) {
      uploadFn(e.target.files[0]);
    }
  };

  const handleAddText = () => {
    if (onAddTextRegion) {
      onAddTextRegion();
    } else if (onAddNewRegion) {
      onAddNewRegion('text', 'title');
    }
  };

  const handleAddImage = () => {
    if (onAddImageRegion) {
      onAddImageRegion();
    } else if (onAddNewRegion) {
      onAddNewRegion('image');
    }
  };

  const handleAddShape = (type: 'rect' | 'circle') => {
    if (onAddShape) {
      onAddShape(type);
    } else if (onAddNewFixedElement) {
      onAddNewFixedElement(type);
    }
  };

  const handleOpenDownloader = () => {
    if (onOpenMediaDownloader) {
      onOpenMediaDownloader();
    } else if (onOpenYouTubeModal) {
      onOpenYouTubeModal();
    }
  };

  const handleToggleLockAction = (id: string, currentlyLocked?: boolean) => {
    if (onToggleLock) {
      onToggleLock(id, !currentlyLocked);
    } else if (onToggleNodeLock) {
      onToggleNodeLock(id);
    }
  };

  const handleToggleVisibilityAction = (id: string, currentlyHidden?: boolean) => {
    if (onToggleVisibility) {
      onToggleVisibility(id, !currentlyHidden);
    } else if (onToggleNodeVisibility) {
      onToggleNodeVisibility(id);
    }
  };

  const handleAiAction = async () => {
    if (onGeneratePageTexts) {
      await onGeneratePageTexts(aiBrief);
    } else if (onGenerateAiBrief) {
      onGenerateAiBrief(aiBrief);
    }
  };

  const allRegions = currentRegions || regions || [];
  const allFixedElements = currentFixedElements || fixedElements || [];

  return (
    <div className="flex z-20 shrink-0 select-none">
      {/* ═══════════════════════════════════════════════
          NARROW 56px ICON TOOLBAR
         ═══════════════════════════════════════════════ */}
      <nav 
        className="w-14 bg-[#1D1D1F] border-r border-[rgba(255,255,255,0.08)] flex flex-col items-center py-3 space-y-2 shrink-0 z-20"
        aria-label="Araç çubuğu"
      >
        {/* SİTENİN ASIL AMACI: TOPLU ÜRETİM BUTONU */}
        {onOpenBatchProduction && (
          <>
            <button
              type="button"
              onClick={onOpenBatchProduction}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 group shadow-lg ${
                isBatchActive
                  ? 'bg-[#FF6B1A] text-white ring-2 ring-[#FF6B1A]/50 shadow-[#FF6B1A]/40 scale-105'
                  : 'bg-gradient-to-b from-[#FF6B1A] to-[#E05307] text-white shadow-[#FF6B1A]/20 hover:scale-105'
              }`}
              title="✨ Toplu Tasarım Üret (Sitenin Asıl Amacı: Fotoğraflar + AI + Şablon)"
            >
              <Sparkles size={18} className="animate-pulse text-amber-200" />
              <span className="text-[7.5px] mt-0.5 font-black tracking-tight leading-none text-white">ÜRETİM</span>
            </button>
            <div className="w-6 h-[1px] bg-white/10 my-0.5" />
          </>
        )}

        <button
          type="button"
          onClick={() => handleToolClick('templates')}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
            activeTab === 'templates' 
              ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20' 
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
          }`}
          title="Şablonlarım & Çalışmalarım"
        >
          <LayoutTemplate size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">Şablon</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('add')}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
            activeTab === 'add' 
              ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20' 
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
          }`}
          title="Öğe Ekle"
        >
          <PlusCircle size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">Ekle</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('media')}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
            activeTab === 'media' 
              ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20' 
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
          }`}
          title="Medya Kütüphanesi"
        >
          <ImageIcon size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">Medya</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('layers')}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
            activeTab === 'layers' 
              ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20' 
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
          }`}
          title="Katmanlar"
        >
          <Layers size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">Katman</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('ai')}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
            activeTab === 'ai' 
              ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20' 
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
          }`}
          title="AI Metin Asistanı"
        >
          <WandSparkles size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">AI</span>
        </button>
      </nav>

      {/* ═══════════════════════════════════════════════
          SLIDE-OUT DRAWER (320px)
         ═══════════════════════════════════════════════ */}
      {activeTab && (
        <aside className="w-80 bg-[#252528] border-r border-[rgba(255,255,255,0.08)] flex flex-col z-10 shrink-0 overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Drawer Header */}
          <div className="h-14 px-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {activeTab === 'templates' && 'Şablonlarım & Çalışmalarım'}
              {activeTab === 'add' && 'Yeni Öğe Ekle'}
              {activeTab === 'media' && 'Medya Kütüphanesi'}
              {activeTab === 'layers' && 'Katmanlar'}
              {activeTab === 'ai' && 'AI İçerik Asistanı'}
            </h3>
            <button
              type="button"
              onClick={() => changeTab && changeTab(null)}
              className="p-1 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Çekmeceyi Kapat"
            >
              <X size={15} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* 1. TEMPLATES DRAWER */}
            {activeTab === 'templates' && (
              <div className="space-y-3">
                {onOpenBatchProduction && (
                  <button
                    type="button"
                    onClick={onOpenBatchProduction}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8843] hover:from-[#FF782D] hover:to-[#FFA066] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#FF6B1A]/20 active:scale-98"
                  >
                    <Sparkles size={15} className="animate-pulse text-amber-200" />
                    <span>Şablonla Toplu Tasarım Üret</span>
                  </button>
                )}

                {onCreateTemplate && (
                  <button
                    type="button"
                    onClick={onCreateTemplate}
                    className="w-full py-2 px-3 rounded-xl bg-[#2C2C2E] hover:bg-[#38383C] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-98 border border-white/10"
                  >
                    <Plus size={14} />
                    <span>Yeni Şablon Oluştur</span>
                  </button>
                )}

                <div className="space-y-2 pt-1">
                  {templates.map(temp => {
                    const isSelected = temp.id === currentTemplateId;
                    const isMenuOpen = templateMenuOpenId === temp.id;

                    return (
                      <div
                        key={temp.id}
                        className={`group relative p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-[#2E2E32] border-[#FF6B1A] ring-1 ring-[#FF6B1A]' 
                            : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-xs font-bold text-white truncate">{temp.name}</h4>
                            <p className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] mt-0.5">
                              {temp.width} × {temp.height} px · {temp.pages?.length || 1} Sayfa
                            </p>
                          </div>

                          {/* 3-dots Menu Toggle */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateMenuOpenId(isMenuOpen ? null : temp.id);
                              }}
                              className="p-1 rounded text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 transition cursor-pointer"
                              title="Seçenekler"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div 
                                className="absolute right-0 top-6 w-48 bg-[#2C2C2E] border border-[rgba(255,255,255,0.15)] rounded-xl shadow-2xl py-1 z-50 animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTemplateMenuOpenId(null);
                                    if (onOpenTemplateEditor) {
                                      onOpenTemplateEditor(temp);
                                    } else {
                                      onSelectTemplate(temp.id);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10 flex items-center space-x-2 transition cursor-pointer"
                                >
                                  <Sliders size={13} className="text-[rgba(255,255,255,0.7)]" />
                                  <span>Şablonu Düzenle</span>
                                </button>
                                {(onOpenRenameModal || onRenameTemplate) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTemplateMenuOpenId(null);
                                      if (onOpenRenameModal) {
                                        onOpenRenameModal(temp);
                                      } else if (onRenameTemplate) {
                                        const newName = window.prompt('Şablon Adı:', temp.name);
                                        if (newName && newName.trim()) {
                                          onRenameTemplate(temp.id, newName.trim());
                                        }
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10 flex items-center space-x-2 transition cursor-pointer"
                                  >
                                    <Edit3 size={13} className="text-[rgba(255,255,255,0.7)]" />
                                    <span>Adını Değiştir</span>
                                  </button>
                                )}
                                {onDuplicateTemplate && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTemplateMenuOpenId(null);
                                      onDuplicateTemplate(temp.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10 flex items-center space-x-2 transition cursor-pointer"
                                  >
                                    <Copy size={13} className="text-[rgba(255,255,255,0.7)]" />
                                    <span>Kopyala</span>
                                  </button>
                                )}
                                {onDeleteTemplate && templates.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTemplateMenuOpenId(null);
                                      if (window.confirm(`"${temp.name}" şablonunu silmek istediğinizden emin misiniz?`)) {
                                        onDeleteTemplate(temp.id);
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition cursor-pointer border-t border-[rgba(255,255,255,0.08)]"
                                  >
                                    <Trash2 size={13} />
                                    <span>Şablonu Sil</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Primary Action Button */}
                        <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            {isSelected ? (
                              <span className="text-[11px] text-[#34C759] font-bold flex items-center gap-1">
                                <Check size={12} /> Aktif Düzenleme
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectTemplate(temp.id)}
                                className="text-[11px] text-[rgba(255,255,255,0.7)] hover:text-white font-medium transition cursor-pointer"
                              >
                                Tek Sayfayı Aç →
                              </button>
                            )}
                          </div>

                          {onOpenBatchProduction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTemplate(temp.id);
                                onOpenBatchProduction();
                              }}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-[#FF6B1A]/20 hover:bg-[#FF6B1A] text-[#FF9F0A] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-sm"
                              title="Bu şablonu seçerek toplu fotoğraf üretim ekranına git"
                            >
                              <Sparkles size={12} />
                              <span>Bu Şablonla Toplu Üret</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. ADD ELEMENTS DRAWER */}
            {activeTab === 'add' && (
              <div className="space-y-3">
                <p className="text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
                  Tasarıma yeni metin veya görsel alanı ekleyerek şablonunuzu zenginleştirin:
                </p>

                <button
                  type="button"
                  onClick={handleAddText}
                  className="w-full p-3 rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] hover:border-[#FF6B1A] text-left flex items-center space-x-3 transition cursor-pointer group active:scale-98"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B1A]/10 text-[#FF6B1A] flex items-center justify-center group-hover:scale-105 transition">
                    <Type size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Metin Ekle</h4>
                    <p className="text-[10px] text-[rgba(255,255,255,0.5)]">Başlık veya açıklama metin alanı</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleAddImage}
                  className="w-full p-3 rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] hover:border-[#34C759] text-left flex items-center space-x-3 transition cursor-pointer group active:scale-98"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center group-hover:scale-105 transition">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Görsel Alanı Ekle</h4>
                    <p className="text-[10px] text-[rgba(255,255,255,0.5)]">Fotoğraf veya arka plan görsel alanı</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddShape('rect')}
                  className="w-full p-3 rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.08)] hover:border-[#FF9F0A] text-left flex items-center space-x-3 transition cursor-pointer group active:scale-98"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/10 text-[#FF9F0A] flex items-center justify-center group-hover:scale-105 transition">
                    <Square size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Dikdörtgen Şekil</h4>
                    <p className="text-[10px] text-[rgba(255,255,255,0.5)]">Arka plan kartı veya renkli blok</p>
                  </div>
                </button>
              </div>
            )}

            {/* 3. MEDIA LIBRARY DRAWER */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                {/* Upload Action */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-3 rounded-xl border border-dashed border-[rgba(255,255,255,0.2)] hover:border-[#FF6B1A] hover:bg-[#FF6B1A]/10 text-white text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition cursor-pointer active:scale-98"
                >
                  <ImageIcon size={18} className="text-[#FF6B1A]" />
                  <span>Cihazdan Tekil Fotoğraf Yükle</span>
                </button>

                {onOpenBatchProduction && (
                  <button
                    type="button"
                    onClick={onOpenBatchProduction}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B1A]/25 to-[#FF9F0A]/20 border border-[#FF6B1A]/40 hover:border-[#FF6B1A] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
                  >
                    <Sparkles size={14} className="text-[#FF9F0A]" />
                    <span>Toplu Fotoğraf Üretimini Başlat →</span>
                  </button>
                )}

                {/* YouTube Link Downloader Tool */}
                {(onOpenMediaDownloader || onOpenYouTubeModal) && (
                  <button
                    type="button"
                    onClick={handleOpenDownloader}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] hover:border-[#FF453A] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
                  >
                    <Video size={15} className="text-[#FF453A]" />
                    <span>Bağlantıdan İndir (YouTube / MP3-MP4)</span>
                  </button>
                )}

                {/* Uploaded Images Grid */}
                <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <span className="text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider block">
                    Yüklenen Görseller
                  </span>

                  {uploadedImages.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#1D1D1F] text-center text-xs text-[rgba(255,255,255,0.4)]">
                      Henüz görsel yüklenmedi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => onSelectMediaImage && onSelectMediaImage(url)}
                          className="relative aspect-square rounded-xl bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] overflow-hidden cursor-pointer group hover:border-[#FF6B1A]"
                        >
                          <img src={url} alt={`Yüklenen ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition">
                            Seç
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. LAYERS DRAWER */}
            {activeTab === 'layers' && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider block">
                  Sayfa Katmanları
                </span>

                <div className="space-y-1">
                  {/* Regions list */}
                  {allRegions.map(reg => {
                    const isSelected = reg.id === selectedNodeId;
                    const isHidden = !!reg.hidden || hiddenElementIds.includes(reg.id);

                    return (
                      <div
                        key={reg.id}
                        onClick={() => onSelectNode && onSelectNode(reg.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white font-bold'
                            : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)] hover:bg-[#2A2A2E]'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {reg.type === 'text' ? <Type size={13} className="text-[#FF6B1A] shrink-0" /> : <ImageIcon size={13} className="text-[#34C759] shrink-0" />}
                          <span className="truncate">{reg.name}</span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLockAction(reg.id, reg.locked);
                            }}
                            className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-white transition"
                            title={reg.locked ? "Kilidi Aç" : "Kilitle"}
                          >
                            {reg.locked ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibilityAction(reg.id, isHidden);
                            }}
                            className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-white transition"
                            title={isHidden ? "Görünür Yap" : "Gizle"}
                          >
                            {isHidden ? <EyeOff size={12} className="text-red-400" /> : <Eye size={12} />}
                          </button>
                          {onDeleteNode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNode(reg.id);
                              }}
                              className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-red-400 transition"
                              title="Katmanı Sil"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Fixed elements */}
                  {allFixedElements.map(el => {
                    const isSelected = el.id === selectedNodeId;

                    return (
                      <div
                        key={el.id}
                        onClick={() => onSelectNode && onSelectNode(el.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#FF9F0A]/20 border-[#FF9F0A] text-white font-bold'
                            : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)] hover:bg-[#2A2A2E]'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Square size={13} className="text-[#FF9F0A] shrink-0" />
                          <span className="truncate">{el.name || 'Sabit Şekil'}</span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLockAction(el.id, el.locked);
                            }}
                            className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-white transition"
                            title={el.locked ? "Kilidi Aç" : "Kilitle"}
                          >
                            {el.locked ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {allRegions.length === 0 && allFixedElements.length === 0 && (
                    <div className="p-4 rounded-xl bg-[#1D1D1F] text-center text-xs text-[rgba(255,255,255,0.4)]">
                      Bu sayfada henüz katman bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. AI ASSISTANT DRAWER */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {onOpenBatchProduction && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#FF6B1A]/20 via-[#FF9F0A]/10 to-transparent border border-[#FF6B1A]/35 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF6B1A] text-white">SİTENİN ASIL AMACI</span>
                      <Sparkles size={15} className="text-[#FF9F0A] animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">⚡ Toplu Fotoğraf & AI Tasarımı</h4>
                      <p className="text-[11px] text-[rgba(255,255,255,0.7)] mt-1 leading-relaxed">
                        Çoklu fotoğraf yükleyin, tek bir AI komutu verin; seçili şablonunuza göre tüm sayfalarınız tek seferde hazırlansın.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenBatchProduction}
                      className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#FF6B1A] to-[#FF8843] hover:from-[#FF782D] hover:to-[#FFA066] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-[#FF6B1A]/20 active:scale-98"
                    >
                      <Sparkles size={13} />
                      <span>Toplu Tasarım Üretimini Başlat →</span>
                    </button>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-gradient-to-br from-[#FF6B1A]/10 to-[#FF9F0A]/10 border border-[#FF6B1A]/20 space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <WandSparkles size={14} className="text-[#FF6B1A]" />
                    <span>Mevcut Sayfanın Metinlerini Üret</span>
                  </h4>
                  <p className="text-[11px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                    Yalnızca açık olan sayfanızdaki başlık ve açıklamaları AI komutuna göre yeniden yazar.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                    İçerik Konusu / Kampanya Brief'i
                  </label>
                  <textarea
                    rows={4}
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    placeholder="Örnek: Yaz sonu indirim kampanyası için enerjik ve dikkat çekici metinler..."
                    className="w-full bg-[#1D1D1F] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B1A] transition resize-y"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAiAction}
                  disabled={isAiLoading || !aiBrief.trim()}
                  className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF9F0A] hover:opacity-90 text-white text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-[#FF6B1A]/20 disabled:opacity-50 active:scale-98"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Metinler Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <WandSparkles size={15} />
                      <span>Sayfanın Metinlerini Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </aside>
      )}
    </div>
  );
}
