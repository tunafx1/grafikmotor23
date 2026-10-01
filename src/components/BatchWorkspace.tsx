import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, ArrowRight, X, ArrowLeft, Plus, Images, Download, FolderOpen, LayoutTemplate, Check, Trash2, Pencil } from 'lucide-react';
import type { DesignTemplate, SequenceMediaItem } from '../types';
import { TemplateThumbnail } from './TemplateThumbnail';
import { resolveExportTemplate } from '../utils/exportAssets';
import { buildBatchPages } from '../utils/batchProduction';
import { createSequenceMediaItem } from '../utils/mediaUtils';
import './BatchWorkspace.css';
import './BatchWorkspace.simple.css';
import './BatchCreate.css';
import './BatchSelection.css';

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
  onGenerate: (template: DesignTemplate, media: SequenceMediaItem[], brief: string) => Promise<void>;
  onOpen: (id: string, page?: number) => void; onSelectTemplate: (id: string) => void;
  onNewTemplate: () => void; onEditTemplate: (id: string) => void; onDeleteTemplate: (id: string) => void;
  onDeleteWorks: (ids: string[]) => void; onDownloadWorks: (ids: string[]) => Promise<void>;
  onExport: () => void; onRetry: () => void; onCancel: () => void; onScreen: (screen: WorkspaceScreen) => void;
}) {
  const [photos, setPhotos] = useState<SequenceMediaItem[]>([]);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [workQuery, setWorkQuery] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const sourceTemplates = p.templates.filter(t => !t.sourceTemplateId);
  const source = sourceTemplates.find(t => t.id === p.current.sourceTemplateId) || sourceTemplates.find(t => t.id === p.current.id) || sourceTemplates[0];
  const disabled = p.busy || loading;
  const archivedWorksUnordered = p.templates.filter(template => !!p.projects[template.id]?.length);
  const failedPages = (p.projects[p.current.id] || []).filter(page => page.productionError);
  useEffect(() => { if (p.screen !== 'works') setSelectedWorks(new Set()); }, [p.screen]);
  const toggleWork = (id: string) => setSelectedWorks(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // --- Photo grid: drag-to-reorder (siblings live-shift out of the way) + mouse marquee multi-select ---
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const lastPhotoOverId = useRef<string | null>(null);
  const [photoMarquee, setPhotoMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const photoMarqueeStart = useRef<{ x: number; y: number } | null>(null);
  const photosGridRef = useRef<HTMLDivElement>(null);

  const startPhotoMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = photosGridRef.current!.getBoundingClientRect();
    photoMarqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPhotoMarquee({ x: photoMarqueeStart.current.x, y: photoMarqueeStart.current.y, w: 0, h: 0 });
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) setSelectedPhotos(new Set());
  };
  useEffect(() => {
    if (!photoMarquee) return;
    const onMove = (e: PointerEvent) => {
      const container = photosGridRef.current;
      const start = photoMarqueeStart.current;
      if (!container || !start) return;
      const rect = container.getBoundingClientRect();
      const curX = e.clientX - rect.left, curY = e.clientY - rect.top;
      const box = { x: Math.min(start.x, curX), y: Math.min(start.y, curY), w: Math.abs(curX - start.x), h: Math.abs(curY - start.y) };
      setPhotoMarquee(box);
      setSelectedPhotos(new Set(marqueeHitIds(container, box, 'data-photo-id')));
    };
    const onUp = () => { setPhotoMarquee(null); photoMarqueeStart.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [photoMarquee]);
  const togglePhotoSelected = (id: string) => setSelectedPhotos(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const handlePhotoDragOver = (overId: string) => {
    if (!draggedPhotoId || draggedPhotoId === overId || lastPhotoOverId.current === overId) return;
    lastPhotoOverId.current = overId;
    setPhotos(old => reorderById(old, photo => photo.id, selectedPhotos, draggedPhotoId, overId));
  };
  const endPhotoDrag = () => { setDraggedPhotoId(null); lastPhotoOverId.current = null; };
  const photoDrag = usePointerCardReorder({
    attr: 'data-photo-id',
    disabled,
    onDragOver: handlePhotoDragOver,
    onDragEnd: endPhotoDrag,
    setDraggedId: setDraggedPhotoId
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
  }, [worksMarquee]);
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
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length !== files.length) errors.push('Bu üretim ekranında yalnızca fotoğraflar kullanılabilir.');
    const remaining = Math.max(0, 25 - photos.length);
    if (valid.length > remaining) errors.push('Bir üretimde en fazla 25 fotoğraf seçebilirsiniz.');
    const next: SequenceMediaItem[] = [];
    for (const file of valid.slice(0, remaining)) {
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error('Dosya 25 MB sınırını aşıyor');
        let timer: ReturnType<typeof setTimeout>;
        const item = await Promise.race([createSequenceMediaItem(file), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Dosya hazırlanamadı')), 20000); })]).finally(() => clearTimeout(timer!));
        // Decode before admitting the photo to production; corrupt files must not create blank pages.
        await new Promise<void>((resolve, reject) => { const img = new Image(); const timer = setTimeout(() => reject(new Error('Görsel açılamadı')), 10000); img.onload = () => { clearTimeout(timer); resolve(); }; img.onerror = () => { clearTimeout(timer); reject(new Error('Görsel açılamadı')); }; img.src = item.thumbnailUrl; });
        next.push({ ...item, file: undefined, originalName: file.name });
      } catch { errors.push(`${file.name} yüklenemedi. Başka bir fotoğraf deneyin.`); }
    }
    setPhotos(old => [...old, ...next]); setFileError(errors.join(' ')); setLoading(false); loadingRef.current = false;
  };
  const move = (index: number, direction: number) => setPhotos(old => { const next = [...old]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next; });
  const pages = p.projects[p.current.id] || [];
  return <section className="batch-workspace" data-screen={p.screen} hidden={p.screen === 'editor'}>
    {p.screen === 'create' && <div className="production-container production-create-container">
      <div className="production-heading">
        <span className="production-eyebrow">YENİ ÜRETİM</span>
        <h1>Fotoğraflarından tasarımlar oluştur</h1>
        <p>Fotoğraflarını ekle, şablonunu seç ve komutunu yaz. Geri kalanını Grafik Motoru hazırlasın.</p>
      </div>
      <div className="production-builder">
        <div className="production-grid">
        <section className="production-card production-photo-card"><h2><span>1</span> Fotoğraflar <small>{photos.length} / 25</small></h2>
          <input ref={fileInput} type="file" multiple accept="image/*" aria-label="Toplu fotoğraf seç" hidden onChange={e => { void addFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
          <button className={`production-drop ${dragging ? 'dragging' : ''}`} disabled={disabled} onClick={() => fileInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void addFiles(Array.from(e.dataTransfer.files)); }}>
            <Upload size={30}/><strong>{loading ? 'Fotoğraflar hazırlanıyor…' : 'Fotoğrafları seç veya buraya bırak'}</strong><span>Birden fazla fotoğraf seçebilirsin · Dosya başına en fazla 25 MB</span>
          </button>
          {!!p.mediaLibrary.length && <button className="production-link" disabled={disabled} onClick={() => setLibraryOpen(v => !v)}>Kütüphaneden seç</button>}
          {libraryOpen && <div className="production-photos" aria-label="Medya kütüphanesi">{p.mediaLibrary.map((url, i) => <button key={url} disabled={disabled || photos.length >= 25} aria-label={`${i + 1}. görseli üretime ekle`} onClick={() => setPhotos(old => [...old, {id: crypto.randomUUID(), type: 'image', url, thumbnailUrl: url, originalName: `Kütüphane ${i + 1}`}])}><img src={url} alt={`Kütüphane ${i + 1}`}/></button>)}</div>}
          {fileError && <p className="production-error" role="alert">{fileError}</p>}
          {selectedPhotos.size > 0 && <div className="archive-selection-bar">
            <label><span>{selectedPhotos.size} fotoğraf seçildi</span></label>
            <div><button onClick={() => setSelectedPhotos(new Set())}>Seçimi kaldır</button><button className="danger" onClick={() => { setPhotos(old => old.filter(photo => !selectedPhotos.has(photo.id))); setSelectedPhotos(new Set()); }}><Trash2 size={14}/> Sil</button></div>
          </div>}
          <div className="production-photos" ref={photosGridRef} onPointerDown={startPhotoMarquee}>
            {photoMarquee && <div className="marquee-box" style={{ left: photoMarquee.x, top: photoMarquee.y, width: photoMarquee.w, height: photoMarquee.h }} />}
            {photos.map((photo, index) => <motion.article
              key={photo.id}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              data-photo-id={photo.id}
              className={[selectedPhotos.has(photo.id) && 'is-selected', draggedPhotoId === photo.id && 'is-dragging'].filter(Boolean).join(' ')}
              onPointerDown={photoDrag.onPointerDown(photo.id)}
              onPointerMove={photoDrag.onPointerMove(photo.id)}
              onPointerUp={photoDrag.onPointerUp(photo.id)}
              onPointerCancel={photoDrag.onPointerCancel(photo.id)}
            >
              <label className="photo-select" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedPhotos.has(photo.id)} onChange={() => togglePhotoSelected(photo.id)} aria-label={`${index + 1}. fotoğrafı seç`}/>
              </label>
              <img src={photo.thumbnailUrl} alt={photo.originalName || `Fotoğraf ${index + 1}`} draggable={false}/><span className="photo-number">{index + 1}</span>
              <button className="photo-remove" disabled={disabled} aria-label={`${index + 1}. fotoğrafı seçimden çıkar`} onClick={() => setPhotos(old => old.filter((_, i) => i !== index))}><X size={14}/></button>
              <div><button disabled={disabled || index === 0} aria-label={`${index + 1}. fotoğrafı önceye taşı`} onClick={() => move(index, -1)}><ArrowLeft size={14}/></button><span>{photo.originalName}</span><button disabled={disabled || index === photos.length - 1} aria-label={`${index + 1}. fotoğrafı sonraya taşı`} onClick={() => move(index, 1)}><ArrowRight size={14}/></button></div>
            </motion.article>)}
          </div>
          {!!photos.length && <p className="production-hint">Fotoğrafları sürükleyerek sırasını değiştirebilir, boş alana tıklayıp sürükleyerek birden fazla fotoğraf seçebilirsin. Birer görsel alanlı çok sayfalı şablonlarda fotoğraflar sayfa sırasıyla yerleştirilir.</p>}
        </section>
        <div className="production-settings">
          <section className="production-card production-template-card"><h2><span>2</span> Şablon</h2>
            {source ? <><label htmlFor="production-template">Kullanılacak şablon</label><select id="production-template" disabled={disabled} value={source.id} onChange={e => p.onSelectTemplate(e.target.value)}>{sourceTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <div className="production-template-preview"><TemplateThumbnail template={source}/><div><strong>{source.name}</strong><p>{source.width} × {source.height} px</p><small>Fotoğraflar, şablonun sayfa ve görsel alanı sırasına göre yerleştirilir.</small></div></div></> : <button onClick={p.onNewTemplate}>Şablon oluştur</button>}
          </section>
          <section className="production-card production-brief-card"><h2><span>3</span> İçerik komutu</h2><label htmlFor="production-brief">Bu fotoğraflarla ne anlatalım?</label><textarea id="production-brief" disabled={disabled} value={brief} maxLength={3000} onChange={e => setBrief(e.target.value)} placeholder="Örnek: Okulumuzun yıl sonu etkinliği için samimi bir başlık ve kısa açıklama oluştur." rows={5}/>
            <p className="production-hint">{source?.aiSystemPrompt ? 'Şablonun marka dili kullanılacak.' : 'Komutun, şablonun metin alanlarına uygulanacak.'} Fotoğraflarının yerine yeni görsel üretilmez.</p>
          </section>
        </div>
        </div>
        <div className="production-submit" aria-live="polite">
          <div className="production-submit-copy">
            <p className="production-summary">{planned ? <><Check size={15}/><span><strong>{photos.length} fotoğraf</strong> ile yaklaşık <strong>{planned} sayfa</strong> hazırlanacak</span></> : <span><strong>Başlamak için fotoğraflarını ekle</strong><small>Seçimin ve komutun bu ekranda korunur.</small></span>}</p>
            {(p.error || layoutError) && <p className="production-error" role="alert">{p.error || layoutError}</p>}
            {p.busy ? <button className="production-link" onClick={p.onCancel}>Üretimi iptal et</button> : planned > 0 && !brief.trim() ? <small>Devam etmek için içerik komutunu yaz.</small> : planned > 0 ? <small>Yeni üretim önceki çalışmalarını değiştirmez.</small> : null}
          </div>
          <button className="production-primary" disabled={disabled || !planned || !brief.trim()} onClick={() => source && void p.onGenerate(source, photos, brief)}><Sparkles size={18}/>{p.busy ? p.progress : 'Tasarımları oluştur'}{!p.busy && <ArrowRight size={18}/>}</button>
        </div>
      </div>
    </div>}
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
    {(p.screen === 'works' || p.screen === 'templates') && <div className="production-container"><div className="production-heading production-heading-row"><div><span className="production-eyebrow">{p.screen === 'works' ? 'ARŞİV' : 'ŞABLON KÜTÜPHANESİ'}</span><h1>{p.screen === 'works' ? 'Çalışmalarım' : 'Şablonlarım'}</h1><p>{p.screen === 'works' ? 'Önceki üretimlerini aç ve kaldığın yerden devam et.' : 'Bir şablon seç veya kendi düzenini hazırla.'}</p></div><button className="production-primary" onClick={p.screen === 'works' ? () => p.onScreen('create') : p.onNewTemplate}><Plus size={18}/>{p.screen === 'works' ? 'Yeni üretim' : 'Yeni şablon'}</button></div>
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
          <div className="production-result-actions"><button className="production-card-primary" onClick={() => { p.onSelectTemplate(t.id); p.onScreen('create'); }}>Bu şablonla oluştur</button><button className="production-card-secondary" onClick={() => p.onEditTemplate(t.id)}>Düzenle</button><button className="production-card-delete" disabled={sourceTemplates.length <= 1} onClick={() => p.onDeleteTemplate(t.id)} aria-label={`${t.name} şablonunu sil`} title={sourceTemplates.length <= 1 ? 'Son şablon silinemez' : 'Şablonu sil'}><Trash2 size={14}/></button></div>
        </article>)}</div>
      )}
      {p.screen === 'works' && normalizedWorkQuery && visibleWorks.length === 0 && <div className="production-empty"><FolderOpen size={36}/><h2>Çalışma bulunamadı.</h2><p>Farklı bir isimle tekrar arayabilirsin.</p></div>}
      {p.screen === 'works' && archivedWorks.length > 0 && <p className="selection-drag-hint">İpucu: kartları sürükleyerek sırasını değiştirebilir, boş alana tıklayıp sürükleyerek birden fazla çalışma seçebilirsin.</p>}
      {p.screen === 'works' && !Object.values(p.projects).some(pages => pages.length) && <div className="production-empty"><Images size={36}/><h2>İlk üretimin için hazırsın.</h2><p>Fotoğraflarını ve komutunu ekle; tasarımlarını birlikte hazırlayalım.</p><button className="production-primary" onClick={() => p.onScreen('create')}>Toplu oluştur</button></div>}
      {p.screen === 'templates' && sourceTemplates.length === 0 && <div className="production-empty"><LayoutTemplate size={36}/><h2>Henüz bir şablonun yok.</h2><p>İlk şablonunu oluşturarak kendi tasarım düzenini hazırla.</p><button className="production-primary" onClick={p.onNewTemplate}>Şablon oluştur</button></div>}
    </div>}
  </section>;
}
