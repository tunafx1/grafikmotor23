import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X, Plus, Images, Download, FolderOpen, LayoutTemplate, Trash2, Pencil, Share2 } from 'lucide-react';
import type { DesignTemplate, SequenceMediaItem } from '../types';
import { TemplateThumbnail } from './TemplateThumbnail';
import { resolveExportTemplate } from '../utils/exportAssets';
import { buildBatchPages, getManualTextGroups, mergeManualTexts, type ManualTexts, type BatchGenerateResult } from '../utils/batchProduction';
import { CreateScreen } from './CreateScreen';
import { createSequenceMediaItem } from '../utils/mediaUtils';
import { ProductionLoadingMotion } from './ProductionLoadingMotion';
import { ShareTemplateDialog, ImportTemplateDialog } from './TemplateShareDialogs';
import type { SharedTemplateInfo } from '../lib/templatesDb';
import './BatchWorkspace.css';
import './BatchWorkspace.simple.css';
import './BatchCreate.css';
import './BatchSelection.css';
import './TemplateShare.css';
import { IMAGE_ACCEPT, isImageFile, normalizeImageFile } from '../utils/heicUtils';

/** Rectangle-intersection test used by marquee (mouse box) selection. Ids come from
 * a data attribute on each selectable card so this stays generic across grids. */
function marqueeHitIds(container: HTMLElement, rect: { x: number; y: number; w: number; h: number }, attr: string): string[] {
  const cRect = container.getBoundingClientRect();
  const ids: string[] = [];
  container.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => {
    const r = el.getBoundingClientRect();
    const ex = r.left - cRect.left, ey = r.top - cRect.top;
    const hit = rect.x < ex + r.width && rect.x + rect.w > ex && rect.y < ey + r.height && rect.y + rect.h > ey;
    if (hit) { const id = el.getAttribute(attr); if (id) ids.push(id); }
  });
  return ids;
}

/** Moves the dragged item (or, if it's part of a multi-selection, the whole group,
 * keeping their relative order) to sit right where dropId currently is. Identity is by
 * id rather than index so this stays correct as the list live-reorders mid-drag. */
function reorderById<T>(list: T[], getId: (item: T) => string, selectedIds: Set<string>, dragId: string, dropId: string): T[] {
  const dropIndex = list.findIndex(item => getId(item) === dropId);
  if (dropIndex === -1 || dragId === dropId) return list;
  const movingIds = selectedIds.has(dragId) && selectedIds.size > 1 ? selectedIds : new Set([dragId]);
  const moving = list.filter(item => movingIds.has(getId(item)));
  if (!moving.length) return list;
  const rest = list.filter(item => !movingIds.has(getId(item)));
  const movedBefore = list.slice(0, dropIndex).filter(item => movingIds.has(getId(item))).length;
  const insertAt = Math.max(0, Math.min(rest.length, dropIndex - movedBefore));
  return [...rest.slice(0, insertAt), ...moving, ...rest.slice(insertAt)];
}

/** Pointer-Events-based card reorder shared by the photo grid and the works gallery —
 * replaces native HTML5 drag&drop (mouse-only) so dragging works on touch too. Mouse
 * starts reordering as soon as the pointer moves past a small threshold (classic drag
 * feel); touch requires a brief hold with no movement first, so a plain scroll swipe
 * over a card isn't mistaken for a reorder drag. */
function usePointerCardReorder(opts: {
  attr: string;
  disabled: boolean;
  onDragOver: (overId: string) => void;
  onDragEnd: () => void;
  setDraggedId: (id: string | null) => void;
}) {
  const infoRef = useRef<{
    id: string;
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    dragging: boolean;
    longPressTimer: number | null;
  } | null>(null);

  const startDragging = (id: string, pointerId: number, el: HTMLElement) => {
    infoRef.current!.dragging = true;
    opts.setDraggedId(id);
    try { el.setPointerCapture(pointerId); } catch { /* pointer may already be gone */ }
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent<HTMLElement>) => {
    if (opts.disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = e.currentTarget;
    const info = {
      id, pointerId: e.pointerId, pointerType: e.pointerType,
      startX: e.clientX, startY: e.clientY, dragging: false,
      longPressTimer: null as number | null
    };
    if (e.pointerType === 'touch') {
      info.longPressTimer = window.setTimeout(() => {
        if (infoRef.current === info) startDragging(id, info.pointerId, el);
      }, 350);
    }
    infoRef.current = info;
  };

  const onPointerMove = (id: string) => (e: React.PointerEvent<HTMLElement>) => {
    const info = infoRef.current;
    if (!info || info.id !== id) return;
    if (!info.dragging) {
      const moved = Math.hypot(e.clientX - info.startX, e.clientY - info.startY) > 6;
      if (!moved) return;
      if (info.pointerType === 'touch') {
        if (info.longPressTimer) window.clearTimeout(info.longPressTimer);
        infoRef.current = null;
        return;
      }
      startDragging(id, info.pointerId, e.currentTarget);
    }
    e.preventDefault();
    const hovered = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const overEl = hovered?.closest(`[${opts.attr}]`) as HTMLElement | null;
    const overId = overEl?.getAttribute(opts.attr);
    if (overId) opts.onDragOver(overId);
  };

  const endDrag = (id: string) => (e: React.PointerEvent<HTMLElement>) => {
    const info = infoRef.current;
    if (!info || info.id !== id) return;
    if (info.longPressTimer) window.clearTimeout(info.longPressTimer);
    infoRef.current = null;
    opts.setDraggedId(null);
    opts.onDragEnd();
  };

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag };
}

export type WorkspaceScreen = 'create' | 'results' | 'works' | 'templates' | 'editor';
export function ProductionNavigation({ screen, disabled, onChange }: { screen: WorkspaceScreen; disabled: boolean; onChange: (screen: WorkspaceScreen) => void }) {
  const primaryScreen = screen === 'results' || screen === 'editor' ? null : screen;
  return (
    <nav className="production-nav" aria-label="Çalışma alanı">
      <div className="production-nav-left">
        <button
          disabled={disabled}
          aria-current={primaryScreen === 'create' ? 'page' : undefined}
          className="production-nav-btn"
          onClick={() => onChange('create')}
        >
          <Sparkles size={15} />
          <span>Toplu Oluştur</span>
        </button>

        <button
          disabled={disabled}
          aria-current={primaryScreen === 'works' ? 'page' : undefined}
          className="production-nav-btn"
          onClick={() => onChange('works')}
          title="Önceki üretimlerin ve kayıtlı çalışmaların"
        >
          <FolderOpen size={15} />
          <span>Çalışmalarım</span>
        </button>

        <button
          disabled={disabled}
          aria-current={primaryScreen === 'templates' ? 'page' : undefined}
          className="production-nav-btn"
          onClick={() => onChange('templates')}
          title="Tasarım şablonlarını incele ve düzenle"
        >
          <LayoutTemplate size={15} />
          <span>Şablonlarım</span>
        </button>

      </div>
    </nav>
  );
}

export function BatchWorkspace(p: {
  screen: WorkspaceScreen; templates: DesignTemplate[]; current: DesignTemplate; projects: Record<string, any[]>;
  busy: boolean; progress: string; error: string | null;
  mediaLibrary: string[];
  onGenerate: (template: DesignTemplate, media: SequenceMediaItem[], brief: string, manualTexts?: ManualTexts) => Promise<BatchGenerateResult>;
  /** Fills the text fields with AI once, using the brief and the first photo. */
  onAiFill?: (template: DesignTemplate, media: SequenceMediaItem[], brief: string) => Promise<ManualTexts>;
  onOpen: (id: string, page?: number) => void; onSelectTemplate: (id: string) => void;
  onNewTemplate: () => void; onEditTemplate: (id: string) => void; onDeleteTemplate: (id: string) => void;
  onDeleteWorks: (ids: string[]) => void; onDownloadWorks: (ids: string[]) => Promise<void>;
  onExport: () => void; onRetry: () => void; onCancel: () => void; onScreen: (screen: WorkspaceScreen) => void;
  onShareTemplate?: (template: DesignTemplate) => Promise<string>;
  onRevokeShareTemplate?: (code: string) => Promise<void>;
  onFetchSharedTemplate?: (code: string) => Promise<SharedTemplateInfo>;
  onImportSharedTemplate?: (info: SharedTemplateInfo) => string;
  initialShareCode?: string | null;
  onClearInitialShareCode?: () => void;
}) {
  const [photos, setPhotos] = useState<SequenceMediaItem[]>([]);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [shareTargetTemplate, setShareTargetTemplate] = useState<DesignTemplate | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(Boolean(p.initialShareCode));
  useEffect(() => {
    if (p.initialShareCode) setImportModalOpen(true);
  }, [p.initialShareCode]);
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [workQuery, setWorkQuery] = useState('');
  const loadingRef = useRef(false);
  const cancelGenerationButton = useRef<HTMLButtonElement>(null);
  const sourceTemplates = p.templates.filter(t => !t.sourceTemplateId);
  const source = sourceTemplates.find(t => t.id === p.current.sourceTemplateId) || sourceTemplates.find(t => t.id === p.current.id) || sourceTemplates[0];
  const disabled = p.busy || loading;
  const manualGroups = useMemo(() => source ? getManualTextGroups(source) : [], [source]);
  // Fields start empty (the template's example text is shown as a placeholder instead).
  const blankGroups = manualGroups.map(group => ({ ...group, fields: group.fields.map(field => ({ ...field, defaultText: '' })) }));
  const [manualTexts, setManualTexts] = useState<ManualTexts>({});
  useEffect(() => { setManualTexts({}); setAiError(''); }, [source?.id]);
  // The template can be edited while this screen stays mounted: always read fields from it.
  const effectiveManualTexts = mergeManualTexts(blankGroups, manualTexts);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiFill = async () => {
    if (!source || !p.onAiFill || aiBusy) return;
    setAiBusy(true); setAiError('');
    try {
      const texts = await p.onAiFill(source, photos, brief);
      setManualTexts(old => mergeManualTexts(blankGroups, { ...mergeManualTexts(blankGroups, old), ...texts }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI metinleri dolduramadı. Metinleri elle yazabilirsin.');
    } finally { setAiBusy(false); }
  };
  const setManualText = (pageId: string, fieldId: string, value: string) =>
    setManualTexts(old => ({ ...old, [pageId]: { ...old[pageId], [fieldId]: value } }));
  const generate = async () => {
    if (!source) return;
    await p.onGenerate(source, photos, brief, effectiveManualTexts);
  };
  useEffect(() => {
    if (p.busy && p.screen === 'create') cancelGenerationButton.current?.focus();
  }, [p.busy, p.screen]);
  const archivedWorksUnordered = p.templates.filter(template => !!p.projects[template.id]?.length);
  const failedPages = (p.projects[p.current.id] || []).filter(page => page.productionError);
  useEffect(() => { if (p.screen !== 'works') setSelectedWorks(new Set()); }, [p.screen]);
  const toggleWork = (id: string) => setSelectedWorks(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // --- Works gallery: local display order + drag-to-reorder (live-shift) + marquee multi-select ---
  const [worksOrder, setWorksOrder] = useState<string[]>([]);
  useEffect(() => {
    setWorksOrder(previous => {
      const ids = archivedWorksUnordered.map(w => w.id);
      const kept = previous.filter(id => ids.includes(id));
      const added = ids.filter(id => !kept.includes(id));
      return [...kept, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivedWorksUnordered.map(w => w.id).join(',')]);
  const archivedWorks = worksOrder.map(id => archivedWorksUnordered.find(w => w.id === id)).filter((w): w is DesignTemplate => !!w);
  const normalizedWorkQuery = workQuery.trim().toLocaleLowerCase('tr');
  const visibleWorks = normalizedWorkQuery
    ? archivedWorks.filter(work => work.name.toLocaleLowerCase('tr').includes(normalizedWorkQuery))
    : archivedWorks;
  const [draggedWorkId, setDraggedWorkId] = useState<string | null>(null);
  const lastWorkOverId = useRef<string | null>(null);
  const [worksMarquee, setWorksMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const worksMarqueeStart = useRef<{ x: number; y: number } | null>(null);
  const worksGridRef = useRef<HTMLDivElement>(null);

  const startWorksMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = worksGridRef.current!.getBoundingClientRect();
    worksMarqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setWorksMarquee({ x: worksMarqueeStart.current.x, y: worksMarqueeStart.current.y, w: 0, h: 0 });
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) setSelectedWorks(new Set());
  };
  useEffect(() => {
    if (!worksMarquee) return;
    const onMove = (e: PointerEvent) => {
      const container = worksGridRef.current;
      const start = worksMarqueeStart.current;
      if (!container || !start) return;
      const rect = container.getBoundingClientRect();
      const curX = e.clientX - rect.left, curY = e.clientY - rect.top;
      const box = { x: Math.min(start.x, curX), y: Math.min(start.y, curY), w: Math.abs(curX - start.x), h: Math.abs(curY - start.y) };
      setWorksMarquee(box);
      setSelectedWorks(new Set(marqueeHitIds(container, box, 'data-work-id')));
    };
    const onUp = () => { setWorksMarquee(null); worksMarqueeStart.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [Boolean(worksMarquee)]);
  const handleWorkDragOver = (overId: string) => {
    if (!draggedWorkId || draggedWorkId === overId || lastWorkOverId.current === overId) return;
    lastWorkOverId.current = overId;
    setWorksOrder(old => reorderById(old, id => id, selectedWorks, draggedWorkId, overId));
  };
  const endWorkDrag = () => { setDraggedWorkId(null); lastWorkOverId.current = null;
  };
  const workDrag = usePointerCardReorder({
    attr: 'data-work-id',
    disabled: p.busy,
    onDragOver: handleWorkDragOver,
    onDragEnd: endWorkDrag,
    setDraggedId: setDraggedWorkId
  });
  let planned = 0; let layoutError = '';
  if (source && photos.length) { try { planned = buildBatchPages(source, photos).length; } catch (e) { layoutError = (e as Error).message; } }
  const addFiles = async (files: File[]) => {
    if (loadingRef.current || p.busy) return;
    loadingRef.current = true; setLoading(true); setFileError('');
    const errors: string[] = [];
    const valid = files.filter(isImageFile);
    if (valid.length !== files.length) errors.push('Bu üretim ekranında yalnızca fotoğraflar kullanılabilir.');
    const remaining = Math.max(0, 25 - photos.length);
    if (valid.length > remaining) errors.push('Bir üretimde en fazla 25 fotoğraf seçebilirsiniz.');
    const next: SequenceMediaItem[] = [];
    for (const file of valid.slice(0, remaining)) {
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error('Dosya 25 MB sınırını aşıyor');
        let timer: ReturnType<typeof setTimeout>;
        const item = await Promise.race([normalizeImageFile(file).then(createSequenceMediaItem), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Dosya hazırlanamadı')), 20000); })]).finally(() => clearTimeout(timer!));
        // Decode before admitting the photo to production; corrupt files must not create blank pages.
        await new Promise<void>((resolve, reject) => { const img = new Image(); const timer = setTimeout(() => reject(new Error('Görsel açılamadı')), 10000); img.onload = () => { clearTimeout(timer); resolve(); }; img.onerror = () => { clearTimeout(timer); reject(new Error('Görsel açılamadı')); }; img.src = item.thumbnailUrl; });
        next.push({ ...item, file: undefined, originalName: file.name });
      } catch { errors.push(`${file.name} yüklenemedi. Başka bir fotoğraf deneyin.`); }
    }
    setPhotos(old => [...old, ...next]); setFileError(errors.join(' ')); setLoading(false); loadingRef.current = false;
  };
  const pages = p.projects[p.current.id] || [];
  return <section className="batch-workspace" data-screen={p.screen} hidden={p.screen === 'editor'}>
    {p.screen === 'create' && p.busy && <div className="production-loading-screen" role="dialog" aria-modal="true" aria-labelledby="production-loading-title" aria-describedby="production-loading-progress" onKeyDown={event => {
      if (event.key === 'Tab') { event.preventDefault(); cancelGenerationButton.current?.focus(); }
      if (event.key === 'Escape') p.onCancel();
    }}>
      <ProductionLoadingMotion
        template={source || p.current}
        photos={photos}
        brief={brief}
        progress={p.progress}
        onCancel={p.onCancel}
        cancelButtonRef={cancelGenerationButton}
      />
    </div>}
    {p.screen === 'create' && <CreateScreen
      templates={sourceTemplates} source={source}
      onSelectTemplate={p.onSelectTemplate} onAllTemplates={() => p.onScreen('templates')} onNewTemplate={p.onNewTemplate}
      photos={photos} setPhotos={setPhotos} addFiles={addFiles} mediaLibrary={p.mediaLibrary}
      loadingFiles={loading} fileError={fileError}
      groups={manualGroups} texts={effectiveManualTexts} setText={setManualText}
      brief={brief} setBrief={setBrief}
      onAiFill={p.onAiFill && aiFill} aiBusy={aiBusy} aiError={aiError}
      planned={planned} error={p.error || layoutError} busy={p.busy} progress={p.progress}
      disabled={disabled} onGenerate={() => void generate()} onCancel={p.onCancel}
    />}
    {p.screen === 'results' && <div className="production-container"><div className="production-heading production-heading-row"><div><h1>{pages.length ? `${pages.length} sayfan hazır` : 'Henüz bir sonuç yok'}</h1><p>{pages.length ? 'Toplu indir veya bir sayfaya tıklayıp son dokunuşları yap.' : 'Fotoğraflarını ekleyerek ilk tasarımlarını oluştur.'}</p></div>{pages.length > 0 && <button className="production-primary" disabled={p.busy} onClick={p.onExport}><Download size={18}/>Tümünü indir</button>}</div>
      {failedPages.length > 0 && <div className="production-error production-ai-error" role="alert">
        <strong>{failedPages.length} sayfada metin üretimi tamamlanamadı.</strong>
        <p>Başarılı metinler ve şablondaki mevcut içerikler korundu.</p>
        <ul>{failedPages.map(page => <li key={page.id}><span>{page.name}</span><small>{page.productionError}</small></li>)}</ul>
        <button disabled={p.busy} onClick={p.onRetry}>{p.busy ? p.progress : 'Yalnızca başarısız metinleri yeniden dene'}</button>
      </div>}
      {p.error && <p role="alert" className="production-error">{p.error}</p>}
      <div className="production-gallery">{pages.map((page, i) => <button key={page.id} className="production-result" disabled={p.busy} onClick={() => p.onOpen(p.current.id, i)}><TemplateThumbnail template={resolveExportTemplate(p.current, page)} data={page}/><div><strong>{page.name}</strong><span>{page.productionError ? 'Metin üretilemedi' : `Sayfa ${i + 1}`}</span><span className="production-card-action">Düzenle <ArrowRight size={13}/></span></div></button>)}</div>
      <button className="production-link" disabled={p.busy} onClick={() => p.onScreen('create')}>{pages.length ? 'Üretim ayarlarına dön' : 'Toplu oluşturmaya başla'}</button>
    </div>}
    {(p.screen === 'works' || p.screen === 'templates') && <div className="production-container"><div className="production-heading production-heading-row"><div><span className="production-eyebrow">{p.screen === 'works' ? 'ARŞİV' : 'ŞABLON KÜTÜPHANESİ'}</span><h1>{p.screen === 'works' ? 'Çalışmalarım' : 'Şablonlarım'}</h1><p>{p.screen === 'works' ? 'Önceki üretimlerini aç ve kaldığın yerden devam et.' : 'Bir şablon seç veya kendi düzenini hazırla.'}</p></div>
      {p.screen === 'works' ? (
        <button className="production-primary" onClick={() => p.onScreen('create')}><Plus size={18}/>Yeni üretim</button>
      ) : (
        <div className="production-heading-actions">
          {p.onImportSharedTemplate && <button className="production-secondary-btn" onClick={() => setImportModalOpen(true)} title="Paylaşılan bir şablonu kod ile hesabına ekle"><Download size={15}/><span>Kod ile ekle</span></button>}
          <button className="production-primary" onClick={p.onNewTemplate}><Plus size={18}/>Yeni şablon</button>
        </div>
      )}
    </div>
      {p.screen === 'works' && archivedWorks.length > 0 && <div className="archive-controls">
        <label className="archive-search"><span>Çalışma ara</span><input value={workQuery} onChange={event => setWorkQuery(event.target.value)} placeholder="İsimle ara…" aria-label="Çalışmalarımda ara" /></label>
        <div className="archive-selection-bar">
        <label><input type="checkbox" checked={selectedWorks.size === archivedWorks.length} onChange={() => setSelectedWorks(selectedWorks.size === archivedWorks.length ? new Set() : new Set(archivedWorks.map(work => work.id)))}/><span>{selectedWorks.size ? `${selectedWorks.size} çalışma seçildi` : 'Tümünü seç'}</span></label>
        <div><button disabled={!selectedWorks.size || p.busy} onClick={() => void p.onDownloadWorks([...selectedWorks])}><Download size={14}/> İndir</button><button className="danger" disabled={!selectedWorks.size || p.busy} onClick={() => { p.onDeleteWorks([...selectedWorks]); setSelectedWorks(new Set()); }}><Trash2 size={14}/> Sil</button></div>
        </div>
      </div>}
      {p.screen === 'works' ? (
        <div className="production-gallery" ref={worksGridRef} onPointerDown={startWorksMarquee}>
          {worksMarquee && <div className="marquee-box" style={{ left: worksMarquee.x, top: worksMarquee.y, width: worksMarquee.w, height: worksMarquee.h }} />}
          {visibleWorks.map(t => <motion.article
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            className={[
              'production-result',
              selectedWorks.has(t.id) && 'is-selected',
              draggedWorkId === t.id && 'is-dragging',
            ].filter(Boolean).join(' ')}
            key={t.id}
            data-work-id={t.id}
            onPointerDown={workDrag.onPointerDown(t.id)}
            onPointerMove={workDrag.onPointerMove(t.id)}
            onPointerUp={workDrag.onPointerUp(t.id)}
            onPointerCancel={workDrag.onPointerCancel(t.id)}
          >
            <div className="production-result-preview-wrap">
              <TemplateThumbnail template={resolveExportTemplate(t, p.projects[t.id][0])} data={p.projects[t.id][0]}/>
              <label className="production-work-check" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedWorks.has(t.id)} onChange={() => toggleWork(t.id)} aria-label={`${t.name} çalışmasını seç`}/><span/></label>
              <button className="production-work-edit" onClick={() => p.onOpen(t.id, 0)} title="Yalnızca bu çalışmayı düzenle" aria-label={`${t.name} çalışmasını düzenle`}><Pencil size={16}/><span>Mevcut tasarımı düzenle</span></button>
            </div>
            <div><strong>{t.name}</strong><span>{p.projects[t.id].length} sayfa · Ana şablondan bağımsız</span></div>
            <div className="production-result-actions"><button className="production-card-primary" onClick={() => { p.onSelectTemplate(t.id); p.onScreen('results'); }}>Çalışmayı aç <ArrowRight size={13}/></button><button className="production-card-secondary production-work-edit-secondary" onClick={() => p.onOpen(t.id, 0)}><Pencil size={13}/> Tasarımı düzenle</button></div>
          </motion.article>)}
        </div>
      ) : (
        <div className="production-gallery production-template-gallery">{p.templates.filter(t => !t.sourceTemplateId).map(t => <article className="production-result" key={t.id}>
          <div className="production-result-preview-wrap">
            <TemplateThumbnail template={t}/>
          </div>
          <div><strong>{t.name}</strong><span>{`${t.width} × ${t.height} px · ${t.pages?.length || 1} düzen`}</span></div>
          <div className="production-result-actions">
            <button className="production-card-primary" onClick={() => { p.onSelectTemplate(t.id); p.onScreen('create'); }}>Bu şablonla oluştur</button>
            <button className="production-card-secondary" onClick={() => p.onEditTemplate(t.id)}>Düzenle</button>
            {p.onShareTemplate && (
              <button className="production-card-share" onClick={() => setShareTargetTemplate(t)} aria-label={`${t.name} şablonunu paylaş`} title="Şablonu başka bir hesapla paylaş"><Share2 size={14}/></button>
            )}
            <button className="production-card-delete" onClick={() => p.onDeleteTemplate(t.id)} aria-label={`${t.name} şablonunu sil`} title="Şablonu sil"><Trash2 size={14}/></button>
          </div>
        </article>)}</div>
      )}
      {p.screen === 'works' && normalizedWorkQuery && visibleWorks.length === 0 && <div className="production-empty"><FolderOpen size={36}/><h2>Çalışma bulunamadı.</h2><p>Farklı bir isimle tekrar arayabilirsin.</p></div>}
      {p.screen === 'works' && archivedWorks.length > 0 && <p className="selection-drag-hint">İpucu: kartları sürükleyerek sırasını değiştirebilir, boş alana tıklayıp sürükleyerek birden fazla çalışma seçebilirsin.</p>}
      {p.screen === 'works' && !Object.values(p.projects).some(pages => pages.length) && <div className="production-empty"><Images size={36}/><h2>İlk üretimin için hazırsın.</h2><p>Fotoğraflarını ve komutunu ekle; tasarımlarını birlikte hazırlayalım.</p><button className="production-primary" onClick={() => p.onScreen('create')}>Toplu oluştur</button></div>}
      {p.screen === 'templates' && sourceTemplates.length === 0 && <div className="production-empty"><LayoutTemplate size={36}/><h2>Henüz bir şablonun yok.</h2><p>İlk şablonunu oluşturarak kendi tasarım düzenini hazırla veya paylaşılan bir şablon ekle.</p><div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}><button className="production-primary" onClick={p.onNewTemplate}><Plus size={16}/>Şablon oluştur</button>{p.onImportSharedTemplate && <button className="production-secondary-btn" onClick={() => setImportModalOpen(true)}><Download size={16}/>Kod ile ekle</button>}</div></div>}
    </div>}
    {shareTargetTemplate && p.onShareTemplate && p.onRevokeShareTemplate && (
      <ShareTemplateDialog
        template={shareTargetTemplate}
        onShare={() => p.onShareTemplate!(shareTargetTemplate)}
        onRevoke={code => p.onRevokeShareTemplate!(code)}
        onClose={() => setShareTargetTemplate(null)}
      />
    )}

    {importModalOpen && p.onFetchSharedTemplate && p.onImportSharedTemplate && (
      <ImportTemplateDialog
        initialCode={p.initialShareCode || undefined}
        onFetch={code => p.onFetchSharedTemplate!(code)}
        onImport={info => p.onImportSharedTemplate!(info)}
        onUseTemplate={id => {
          p.onSelectTemplate(id);
          p.onScreen('create');
        }}
        onClose={() => {
          setImportModalOpen(false);
          p.onClearInitialShareCode?.();
        }}
      />
    )}
  </section>;
}
