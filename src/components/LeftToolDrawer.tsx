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
  Sparkles,
  Maximize2,
  ArrowDownToLine,
  ArrowUpToLine
} from 'lucide-react';
import { DesignTemplate, Region, FixedElement, TextRole } from '../types';

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

export type ToolDrawerTab = 'templates' | 'size' | 'add' | 'media' | 'layers' | 'ai' | null;

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
  onResizeTemplate?: (width: number, height: number) => void;
  // Add tools
  onAddTextRegion?: () => void;
  onAddImageRegion?: () => void;
  onAddShape?: (type: 'rect' | 'circle') => void;
  onAddDecoration?: (type: 'badge' | 'ribbon' | 'divider' | 'icon' | 'logo' | 'watermark') => void;
  onAddNewRegion?: (type: 'text' | 'image', role?: 'title' | 'body') => void;
  onAddNewFixedElement?: (type: 'rect' | 'circle' | 'image' | 'video') => void;
  // Media tools
  uploadedImages?: string[];
  onUploadImage?: (file: File) => void;
  onUploadMedia?: (file: File) => void;
  backgroundImageUrl?: string;
  onSetBackgroundImage?: (file: File) => void;
  onRemoveBackgroundImage?: () => void;
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
  onMoveLayerOrder?: (id: string, direction: 'front' | 'back') => void;
  hiddenElementIds?: string[];
  // AI
  aiSystemPrompt?: string;
  onAiSystemPromptChange?: (prompt: string) => void;
  onTextRegionAiChange?: (regionId: string, updates: Pick<Region, 'textRole' | 'aiPrompt'>) => void;
  isTemplateEditing?: boolean;
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
    onResizeTemplate,
    onAddTextRegion,
    onAddImageRegion,
    onAddShape,
    onAddDecoration,
    onAddNewRegion,
    onAddNewFixedElement,
    uploadedImages = [],
    onUploadImage,
    onUploadMedia,
    backgroundImageUrl,
    onSetBackgroundImage,
    onRemoveBackgroundImage,
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
    onMoveLayerOrder,
    hiddenElementIds = [],
    aiSystemPrompt,
    onAiSystemPromptChange,
    onTextRegionAiChange,
    isTemplateEditing = false,
    onGeneratePageTexts,
    onGenerateAiBrief,
    isAiLoading = false
  } = props;

  const [templateMenuOpenId, setTemplateMenuOpenId] = useState<string | null>(null);
  const [aiBrief, setAiBrief] = useState('');
  const [aiPromptDraft, setAiPromptDraft] = useState(aiSystemPrompt || '');
  const [selectedAiRegionId, setSelectedAiRegionId] = useState<string | null>(null);
  const selectedTemplate = templates.find(template => template.id === currentTemplateId);
  const [customWidth, setCustomWidth] = useState(String(selectedTemplate?.width || 1080));
  const [customHeight, setCustomHeight] = useState(String(selectedTemplate?.height || 1080));
  const [sizeError, setSizeError] = useState('');
  const [templateNameDraft, setTemplateNameDraft] = useState(selectedTemplate?.name || '');

  React.useEffect(() => {
    setAiPromptDraft(aiSystemPrompt || '');
  }, [aiSystemPrompt, currentTemplateId]);

  React.useEffect(() => {
    setCustomWidth(String(selectedTemplate?.width || 1080));
    setCustomHeight(String(selectedTemplate?.height || 1080));
    setSizeError('');
  }, [currentTemplateId, selectedTemplate?.width, selectedTemplate?.height]);

  React.useEffect(() => {
    setTemplateNameDraft(selectedTemplate?.name || '');
  }, [currentTemplateId, selectedTemplate?.name]);

  const isAiPromptDirty = aiPromptDraft.trim() !== (aiSystemPrompt || '').trim();
  const isTemplateNameDirty = templateNameDraft.trim() !== (selectedTemplate?.name || '').trim();

  const commitTemplateName = () => {
    const nextName = templateNameDraft.trim();
    if (!nextName || !selectedTemplate || !onRenameTemplate) return;
    onRenameTemplate(selectedTemplate.id, nextName);
  };

  const applyTemplateSize = (width: number, height: number) => {
    if (!onResizeTemplate || !isTemplateEditing) return;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320 || width > 4096 || height > 4096) {
      setSizeError('En ve boy 320–4096 px arasında tam sayı olmalıdır.');
      return;
    }
    setSizeError('');
    setCustomWidth(String(width));
    setCustomHeight(String(height));
    onResizeTemplate(width, height);
  };

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
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFn = onUploadImage || onUploadMedia;
    if (uploadFn && e.target.files && e.target.files[0]) {
      uploadFn(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSetBackgroundImage) {
      onSetBackgroundImage(file);
    }
    e.target.value = '';
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
  const aiTextRegions = allRegions.filter(region => region.type === 'text' && region.isDynamic !== false);
  const selectedAiRegion = aiTextRegions.find(region => region.id === selectedAiRegionId) || aiTextRegions[0];

  return (
    <div className="flex z-20 shrink-0 select-none">
      {/* Daily editor tools: keep the reusable template catalog outside the canvas. */}
      <nav 
        className="workspace-tool-rail w-14 bg-[#1D1D1F] border-r border-[rgba(255,255,255,0.08)] flex flex-col items-center py-3 space-y-2 shrink-0 z-20"
        aria-label="Araç çubuğu"
      >
        {isTemplateEditing && (
          <button
            type="button"
            onClick={() => handleToolClick('size')}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
              activeTab === 'size'
                ? 'bg-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20'
                : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/5'
            }`}
            title="Şablon boyutu ve en-boy oranı"
          >
            <Maximize2 size={18} />
            <span className="text-[8.5px] mt-0.5 font-medium">Boyut</span>
          </button>
        )}

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
          title="Şablon AI ayarları"
        >
          <WandSparkles size={18} />
          <span className="text-[8.5px] mt-0.5 font-medium">AI</span>
        </button>

      </nav>

      {/* ═══════════════════════════════════════════════
          SLIDE-OUT DRAWER (320px)
         ═══════════════════════════════════════════════ */}
      {activeTab && (
        <aside className="workspace-tool-drawer w-80 bg-[#252528] border-r border-[rgba(255,255,255,0.08)] flex flex-col z-10 shrink-0 overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Drawer Header */}
          <div className="h-14 px-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold text-white">
              {activeTab === 'templates' && 'Şablonlar'}
              {activeTab === 'size' && 'Şablon ayarları'}
              {activeTab === 'add' && 'Öğe ekle'}
              {activeTab === 'media' && 'Medya Kütüphanesi'}
              {activeTab === 'layers' && 'Katmanlar'}
              {activeTab === 'ai' && 'Metin asistanı'}
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

            {activeTab === 'size' && (
              <div className="space-y-5">
                <div className="space-y-2 rounded-xl border border-white/10 bg-[#1D1D1F]/70 p-3">
                  <label htmlFor="template-name" className="text-xs font-bold text-white">Şablon adı</label>
                  <div className="flex gap-2">
                    <input id="template-name" type="text" value={templateNameDraft} maxLength={80}
                      onChange={event => setTemplateNameDraft(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') commitTemplateName(); }}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#171719] px-2.5 py-2 text-xs text-white outline-none focus:border-[#FF6B1A]"
                      placeholder="Şablon adı" />
                    <button type="button" onClick={commitTemplateName} disabled={!isTemplateNameDirty || !templateNameDraft.trim()}
                      className="rounded-lg bg-[#FF6B1A] px-3 text-[11px] font-bold text-white transition hover:bg-[#FF7D35] disabled:bg-white/10 disabled:text-white/35">
                      Kaydet
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/45">Ad değişikliği otomatik olarak bulut hesabınızla eşitlenir.</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instagram hazır ölçüleri</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-[rgba(255,255,255,0.55)]">
                    Ölçü değiştiğinde bütün sayfalardaki katmanlar yeni tuvale orantılı olarak uyarlanır.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Kare gönderi', detail: '1:1', width: 1080, height: 1080 },
                    { label: 'Dikey gönderi', detail: '4:5', width: 1080, height: 1350 },
                    { label: 'Hikâye / Reels', detail: '9:16', width: 1080, height: 1920 },
                    { label: 'Yatay gönderi', detail: '1.91:1', width: 1080, height: 566 },
                  ].map(preset => {
                    const active = selectedTemplate?.width === preset.width && selectedTemplate?.height === preset.height;
                    return <button
                      type="button"
                      key={preset.label}
                      onClick={() => applyTemplateSize(preset.width, preset.height)}
                      className={`rounded-xl border p-3 text-left transition ${active ? 'border-[#FF6B1A] bg-[#FF6B1A]/15' : 'border-white/10 bg-[#1D1D1F] hover:border-white/25'}`}
                    >
                      <span className="block text-[11px] font-bold text-white">{preset.label}</span>
                      <span className="mt-1 block text-[10px] text-white/50">{preset.width} × {preset.height} · {preset.detail}</span>
                    </button>;
                  })}
                </div>
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <h4 className="text-xs font-bold text-white">Özel boyut</h4>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <label className="text-[10px] font-semibold text-white/60">En (px)
                      <input type="number" min={320} max={4096} step={1} value={customWidth} onChange={event => setCustomWidth(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#1D1D1F] px-2.5 py-2 text-xs text-white focus:border-[#FF6B1A] focus:outline-none" />
                    </label>
                    <span className="pb-2 text-white/35">×</span>
                    <label className="text-[10px] font-semibold text-white/60">Boy (px)
                      <input type="number" min={320} max={4096} step={1} value={customHeight} onChange={event => setCustomHeight(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#1D1D1F] px-2.5 py-2 text-xs text-white focus:border-[#FF6B1A] focus:outline-none" />
                    </label>
                  </div>
                  {sizeError && <p className="text-[11px] leading-relaxed text-red-400" role="alert">{sizeError}</p>}
                  <button type="button" onClick={() => applyTemplateSize(Number(customWidth), Number(customHeight))} className="w-full rounded-xl bg-[#FF6B1A] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#FF7D35]">
                    Özel boyutu uygula
                  </button>
                </div>
              </div>
            )}

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

                {onAddDecoration && (
                  <div className="space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Hazır tasarım öğeleri</span>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['badge', 'Rozet'], ['ribbon', 'Kurdele'], ['divider', 'Ayırıcı çizgi'],
                        ['icon', 'İkon'], ['logo', 'Logo alanı'], ['watermark', 'Filigran']
                      ] as const).map(([type, label]) => (
                        <button key={type} type="button" onClick={() => onAddDecoration(type)} className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1D1D1F] px-2 py-2 text-[11px] font-semibold text-[rgba(255,255,255,0.75)] transition hover:border-[#FF6B1A]/60 hover:text-white">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. MEDIA LIBRARY DRAWER */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <section className="space-y-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1D1D1F] p-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Şablon arka planı</h4>
                    <p className="mt-1 text-[10px] leading-4 text-[rgba(255,255,255,0.5)]">
                      Tüm sayfalara sabitlenir; seçilemez, taşınamaz veya yeniden boyutlandırılamaz.
                    </p>
                  </div>

                  {backgroundImageUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111214]">
                      <img src={backgroundImageUrl} alt="Şablon arka planı" className="h-full w-full object-cover" />
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                        Sabit arka plan
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={backgroundInputRef}
                    onChange={handleBackgroundFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => backgroundInputRef.current?.click()}
                      className="flex-1 rounded-lg border border-[#FF6B1A]/50 bg-[#FF6B1A]/10 px-3 py-2 text-[11px] font-bold text-[#FF9F0A] transition hover:border-[#FF6B1A] hover:bg-[#FF6B1A]/15"
                    >
                      {backgroundImageUrl ? 'Arka planı değiştir' : 'Arka plan ekle'}
                    </button>
                    {backgroundImageUrl && onRemoveBackgroundImage && (
                      <button
                        type="button"
                        onClick={onRemoveBackgroundImage}
                        className="rounded-lg border border-[rgba(255,255,255,0.1)] px-2.5 text-[rgba(255,255,255,0.6)] transition hover:border-[#FF453A]/60 hover:text-[#FF453A]"
                        title="Arka planı kaldır"
                        aria-label="Arka planı kaldır"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </section>

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
                          {onMoveLayerOrder && <>
                            <button type="button" onClick={e => { e.stopPropagation(); onMoveLayerOrder(reg.id, 'back'); }} className="p-1 rounded text-white/40 hover:text-white" title="En arkaya gönder"><ArrowDownToLine size={12} /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); onMoveLayerOrder(reg.id, 'front'); }} className="p-1 rounded text-white/40 hover:text-white" title="En öne getir"><ArrowUpToLine size={12} /></button>
                          </>}
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
                          {onMoveLayerOrder && <>
                            <button type="button" onClick={e => { e.stopPropagation(); onMoveLayerOrder(el.id, 'back'); }} className="p-1 rounded text-white/40 hover:text-white" title="En arkaya gönder"><ArrowDownToLine size={12} /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); onMoveLayerOrder(el.id, 'front'); }} className="p-1 rounded text-white/40 hover:text-white" title="En öne getir"><ArrowUpToLine size={12} /></button>
                          </>}
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
              <div className="space-y-5">
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B1A] text-[10px] font-bold text-white">1</span>
                    <h4 className="text-xs font-bold text-white">Genel kurallar</h4>
                  </div>
                  <textarea
                    id="template-ai-system-prompt"
                    aria-label="Genel AI kuralları"
                    rows={4}
                    value={aiPromptDraft}
                    onChange={(e) => setAiPromptDraft(e.target.value)}
                    disabled={!isTemplateEditing || !onAiSystemPromptChange}
                    placeholder="Örnek: Türkçe, sade ve profesyonel yaz. Fiyat uydurma."
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#1D1D1F] px-3 py-2.5 text-xs leading-relaxed text-white outline-none transition focus:border-[#FF6B1A] disabled:opacity-60"
                  />
                  {isTemplateEditing && onAiSystemPromptChange && (
                    <button type="button" onClick={() => onAiSystemPromptChange(aiPromptDraft.trim())} disabled={!isAiPromptDirty}
                      className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#FF9F0A] transition hover:bg-white/5 disabled:text-white/35">
                      <Check size={12} />
                      {isAiPromptDirty ? 'Değişikliği kaydet' : 'Kaydedildi'}
                    </button>
                  )}
                </section>

                <div className="h-px bg-white/10" />

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B1A] text-[10px] font-bold text-white">2</span>
                    <h4 className="text-xs font-bold text-white">Alan ayarı</h4>
                  </div>
                  {selectedAiRegion ? (
                    <>
                      <select aria-label="Düzenlenecek metin alanı" value={selectedAiRegion.id} onChange={event => setSelectedAiRegionId(event.target.value)}
                        className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#1D1D1F] px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF6B1A]">
                        {aiTextRegions.map(region => <option key={region.id} value={region.id}>{region.name || 'Metin alanı'}</option>)}
                      </select>
                      <div className="grid grid-cols-[82px_1fr] items-center gap-2">
                        <label htmlFor="selected-ai-role" className="text-[11px] text-white/55">Kategori</label>
                        <select id="selected-ai-role" value={selectedAiRegion.textRole || 'normal'}
                          onChange={event => onTextRegionAiChange?.(selectedAiRegion.id, {textRole:event.target.value as TextRole, aiPrompt:selectedAiRegion.aiPrompt || ''})}
                          disabled={!isTemplateEditing || !onTextRegionAiChange}
                          className="min-w-0 cursor-pointer rounded-lg border border-white/10 bg-[#1D1D1F] px-2.5 py-2 text-xs text-white outline-none focus:border-[#FF6B1A] disabled:opacity-60">
                          {TEXT_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <textarea aria-label="Seçili alana özel prompt" rows={3} value={selectedAiRegion.aiPrompt || ''}
                        onChange={event => onTextRegionAiChange?.(selectedAiRegion.id, {textRole:selectedAiRegion.textRole || 'normal', aiPrompt:event.target.value})}
                        disabled={!isTemplateEditing || !onTextRegionAiChange}
                        placeholder="Bu alana özel talimat (isteğe bağlı)"
                        className="w-full resize-y rounded-xl border border-white/10 bg-[#1D1D1F] px-3 py-2.5 text-xs leading-relaxed text-white outline-none focus:border-[#FF6B1A] disabled:opacity-60" />
                    </>
                  ) : (
                    <p className="rounded-xl bg-[#1D1D1F] p-3 text-[11px] text-white/50">Bu sayfada dinamik metin alanı yok.</p>
                  )}
                </section>

                <div className="h-px bg-white/10" />

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B1A] text-[10px] font-bold text-white">3</span>
                    <h4 className="text-xs font-bold text-white">Metinleri üret</h4>
                  </div>
                  <textarea
                    aria-label="İçerik konusu"
                    rows={3}
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    placeholder="Konu veya kampanya brief'i..."
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#1D1D1F] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF6B1A]"
                  />
                  <button type="button" onClick={handleAiAction} disabled={isAiLoading || !aiBrief.trim() || aiTextRegions.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B1A] px-3 py-3 text-xs font-bold text-white transition hover:bg-[#FF7D35] disabled:cursor-default disabled:opacity-45">
                    {isAiLoading ? <Loader2 size={15} className="animate-spin" /> : <WandSparkles size={15} />}
                    <span>{isAiLoading ? 'Oluşturuluyor...' : 'Sayfanın metinlerini oluştur'}</span>
                  </button>
                </section>
              </div>
            )}

          </div>
        </aside>
      )}
    </div>
  );
}
