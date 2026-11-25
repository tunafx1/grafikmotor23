import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Images, X, Plus, Check, Sparkles, ArrowRight, Bold, Loader2 } from 'lucide-react';
import type { DesignTemplate, SequenceMediaItem } from '../types';
import { TemplateThumbnail } from './TemplateThumbnail';
import { RichTextField } from './RichTextField';
import { usePhotoDrag } from './usePhotoDrag';
import { moveToIndex } from '../utils/photoReorder';
import { applyManualTexts, buildBatchPages, getManualTextGroups, type ManualTextGroup, type ManualTexts } from '../utils/batchProduction';
import { resolveExportTemplate } from '../utils/exportAssets';
import { fieldCharLimit, fieldPlaceholder, isSingleLineField, visibleLength } from '../utils/textLimits';
import { IMAGE_ACCEPT } from '../utils/heicUtils';
import './CreateScreen.css';

const MAX_PHOTOS = 25;

function StepMark({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  if (done) return <span className="cs-step is-done" aria-label="Tamamlandı"><Check size={14} strokeWidth={3}/></span>;
  return <span className={`cs-step${active ? ' is-active' : ''}`}>{n}</span>;
}

function TemplateMeta({ template }: { template: DesignTemplate }) {
  const count = getManualTextGroups(template).reduce((sum, group) => sum + group.fields.length, 0);
  return <>{template.width} × {template.height} · {count ? `${count} metin alanı` : 'metin yok'}</>;
}

function TemplateSwatch({ template, selected }: { template: DesignTemplate; selected: boolean }) {
  const ratio = template.width / template.height;
  const size = 30;
  const width = ratio >= 1 ? size : Math.round(size * ratio);
  const height = ratio >= 1 ? Math.round(size / ratio) : size;
  return <span className="cs-swatch"><span style={{ width, height }} className={selected ? 'is-selected' : ''}/></span>;
}

/** Floating "Kalın" button shown above a text selection inside the texts card. */
function BoldBubble({ scopeRef }: { scopeRef: React.RefObject<HTMLElement | null> }) {
  const [pos, setPos] = useState<{ left: number; top: number; bold: boolean } | null>(null);
  useEffect(() => {
    const update = () => {
      const selection = document.getSelection();
      const scope = scopeRef.current;
      if (!selection || selection.isCollapsed || !selection.rangeCount || !scope) { setPos(null); return; }
      const field = (selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement)?.closest('.rich-text-input');
      if (!field || !scope.contains(field)) { setPos(null); return; }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setPos({ left: rect.left + rect.width / 2, top: rect.top, bold: document.queryCommandState('bold') });
    };
    document.addEventListener('selectionchange', update);
    window.addEventListener('scroll', update, true);
    return () => { document.removeEventListener('selectionchange', update); window.removeEventListener('scroll', update, true); };
  }, [scopeRef]);
  if (!pos) return null;
  return createPortal(
    <button
      type="button"
      className={`cs-bold-bubble${pos.bold ? ' is-on' : ''}`}
      style={{ left: pos.left, top: pos.top }}
      // Keep the selection: pressing the button must not move focus out of the field.
      onMouseDown={event => event.preventDefault()}
      onPointerDown={event => event.preventDefault()}
      onClick={() => {
        const field = document.getSelection()?.anchorNode;
        const el = (field instanceof Element ? field : field?.parentElement)?.closest('.rich-text-input');
        document.execCommand('bold');
        el?.dispatchEvent(new Event('input', { bubbles: true }));
        setPos(old => old && { ...old, bold: document.queryCommandState('bold') });
      }}
    >
      <Bold size={14} strokeWidth={2.6}/> {pos.bold ? 'Normal' : 'Kalın'}
    </button>,
    document.body,
  );
}

export function CreateScreen(p: {
  templates: DesignTemplate[];
  source?: DesignTemplate;
  onSelectTemplate: (id: string) => void;
  onAllTemplates: () => void;
  onNewTemplate: () => void;
  photos: SequenceMediaItem[];
  setPhotos: React.Dispatch<React.SetStateAction<SequenceMediaItem[]>>;
  addFiles: (files: File[]) => Promise<void>;
  mediaLibrary: string[];
  loadingFiles: boolean;
  fileError: string;
  groups: ManualTextGroup[];
  texts: ManualTexts;
  setText: (pageId: string, fieldId: string, value: string) => void;
  brief: string;
  setBrief: (value: string) => void;
  onAiFill?: () => Promise<void>;
  aiBusy: boolean;
  aiError: string;
  planned: number;
  error: string;
  busy: boolean;
  progress: string;
  disabled: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<HTMLElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileDragDepth = useRef(0);
  const { photos, source } = p;

  const drag = usePhotoDrag({
    gridRef,
    disabled: p.disabled,
    count: photos.length,
    getSrc: id => photos.find(photo => photo.id === id)?.thumbnailUrl || '',
    indexOf: id => photos.findIndex(photo => photo.id === id),
    onDrop: (id, index) => p.setPhotos(old => moveToIndex(old, photo => photo.id, new Set([id]), index)),
  });
  const dragState = drag.drag;
  // While dragging, the list is shown in its would-be order: the others slide aside to open the gap.
  const shown = dragState ? moveToIndex(photos, photo => photo.id, new Set([dragState.id]), dragState.index) : photos;

  const fields = p.groups.flatMap(group => group.fields.map(field => ({ group, field })));
  const filled = fields.filter(({ group, field }) => visibleLength(p.texts[group.pageId]?.[field.id] ?? '') > 0).length;
  const photosDone = photos.length > 0;
  const templateDone = photosDone && !!source;
  const showPicker = !templateDone || pickerOpen;
  const pickerList = useMemo(() => {
    const list = p.templates.slice(0, 4);
    if (source && !list.some(t => t.id === source.id)) list[list.length - 1] = source;
    return list;
  }, [p.templates, source]);

  const preview = useMemo(() => {
    if (!source) return null;
    if (!photos.length) {
      const firstTexts = p.groups[0] ? Object.fromEntries(Object.entries(p.texts[p.groups[0].pageId] || {}).filter(([, v]) => v)) : {};
      return { template: source, data: { templateId: source.id, dynamicTexts: firstTexts, dynamicImages: {} }, label: `${source.width} × ${source.height} px` };
    }
    try {
      const [page] = applyManualTexts(buildBatchPages(source, photos.slice(0, 4)), p.texts);
      return { template: resolveExportTemplate(source, page), data: page, label: `Sayfa 1 / ${Math.max(1, p.planned)}` };
    } catch { return null; }
  }, [source, photos, p.texts, p.groups, p.planned]);

  const onFileDrag = (event: React.DragEvent, kind: 'enter' | 'over' | 'leave' | 'drop') => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    if (kind === 'enter') { fileDragDepth.current++; setFileDragOver(true); }
    if (kind === 'over') event.dataTransfer.dropEffect = 'copy';
    if (kind === 'leave') { fileDragDepth.current = Math.max(0, fileDragDepth.current - 1); if (!fileDragDepth.current) setFileDragOver(false); }
    if (kind === 'drop') { fileDragDepth.current = 0; setFileDragOver(false); void p.addFiles(Array.from(event.dataTransfer.files)); }
  };

  const generateLabel = p.busy ? (p.progress || 'Hazırlanıyor…') : p.planned ? `${p.planned} tasarım oluştur` : 'Tasarımları oluştur';
  const canGenerate = !p.disabled && p.planned > 0 && !!source;

  return (
    <div className="cs-page">
      <header className="cs-heading">
        <span className="cs-eyebrow">YENİ ÜRETİM</span>
        <h1>Fotoğraflarından tasarımlar oluştur</h1>
        <p>Fotoğraflarını ekle, şablonunu seç ve metinlerini yaz. Gerisini Grafik Motoru hazırlasın.</p>
      </header>

      <div className="cs-grid">
        <div className="cs-col cs-col-left">
          <section
            className={`cs-card cs-photos${fileDragOver ? ' is-file-over' : ''}`}
            aria-labelledby="cs-photos-title"
            onDragEnter={e => onFileDrag(e, 'enter')} onDragOver={e => onFileDrag(e, 'over')}
            onDragLeave={e => onFileDrag(e, 'leave')} onDrop={e => onFileDrag(e, 'drop')}
          >
            <div className="cs-card-head">
              <StepMark n={1} done={photosDone}/>
              <h2 id="cs-photos-title">Fotoğraflar</h2>
              <span className={`cs-count${photosDone ? ' is-on' : ''}`}>{photos.length} / {MAX_PHOTOS}</span>
            </div>
            <input ref={fileInput} type="file" multiple accept={IMAGE_ACCEPT} hidden aria-label="Fotoğraf seç"
              onChange={e => { void p.addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}/>

            {!photosDone ? <>
              <button type="button" className="cs-dropzone" disabled={p.disabled} onClick={() => fileInput.current?.click()}>
                <span className="cs-dropzone-icon">{p.loadingFiles ? <Loader2 size={20} className="cs-spin"/> : <Upload size={20}/>}</span>
                <strong>{p.loadingFiles ? 'Fotoğraflar hazırlanıyor…' : 'Sürükle bırak veya seç'}</strong>
                <span>JPG, PNG, HEIC · en fazla 25 MB</span>
              </button>
              {p.mediaLibrary.length > 0 && <button type="button" className="cs-btn cs-btn-outline cs-btn-block" disabled={p.disabled} onClick={() => setLibraryOpen(v => !v)}>
                <ImageIcon size={16}/> Kütüphaneden seç
              </button>}
            </> : <>
              <div className="cs-photo-grid" ref={gridRef}>
                {shown.map(photo => {
                  const number = photos.findIndex(item => item.id === photo.id) + 1;
                  const isDragged = dragState?.id === photo.id;
                  return (
                    <motion.div
                      key={photo.id}
                      layout
                      transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.7 }}
                      data-photo-id={photo.id}
                      className={`cs-photo${isDragged ? ' is-gap' : ''}`}
                      aria-label={`${number}. fotoğraf — sırasını değiştirmek için sürükle`}
                      {...drag.handlers(photo.id)}
                    >
                      <img src={photo.thumbnailUrl} alt={photo.originalName || `Fotoğraf ${number}`} draggable={false}/>
                      <span className="cs-photo-num">{dragState ? shown.indexOf(photo) + 1 : number}</span>
                      <button type="button" className="cs-photo-remove" disabled={p.disabled} aria-label={`${number}. fotoğrafı kaldır`}
                        onClick={() => p.setPhotos(old => old.filter(item => item.id !== photo.id))}><X size={13} strokeWidth={2.6}/></button>
                    </motion.div>
                  );
                })}
                {photos.length < MAX_PHOTOS && <motion.button layout type="button" className="cs-photo-add" disabled={p.disabled} aria-label="Fotoğraf ekle" onClick={() => fileInput.current?.click()}>
                  {p.loadingFiles ? <Loader2 size={20} className="cs-spin"/> : <Plus size={22}/>}
                </motion.button>}
              </div>
              <div className="cs-photo-actions">
                {p.mediaLibrary.length > 0 && <button type="button" className="cs-btn cs-btn-outline" disabled={p.disabled} onClick={() => setLibraryOpen(v => !v)}>Kütüphaneden seç</button>}
                <button type="button" className="cs-btn cs-btn-ghost" disabled={p.disabled} onClick={() => p.setPhotos([])}>Tümünü kaldır</button>
              </div>
              <p className="cs-hint">Sırayı değiştirmek için fotoğrafı sürükleyip bırak. Telefonda basılı tutup sürükle.</p>
            </>}

            {libraryOpen && <div className="cs-library" aria-label="Medya kütüphanesi">
              {p.mediaLibrary.map((url, i) => <button key={url} type="button" disabled={p.disabled || photos.length >= MAX_PHOTOS} aria-label={`${i + 1}. görseli ekle`}
                onClick={() => p.setPhotos(old => old.length >= MAX_PHOTOS ? old : [...old, { id: crypto.randomUUID(), type: 'image', url, thumbnailUrl: url, originalName: `Kütüphane ${i + 1}` }])}>
                <img src={url} alt="" draggable={false}/></button>)}
            </div>}
            {p.fileError && <p className="cs-error" role="alert">{p.fileError}</p>}
            {fileDragOver && <div className="cs-file-overlay"><Upload size={28}/><strong>Fotoğrafları buraya bırak</strong></div>}
          </section>

          <section className="cs-card cs-templates" aria-labelledby="cs-template-title">
            <div className="cs-card-head">
              <StepMark n={2} done={templateDone}/>
              <h2 id="cs-template-title">Şablon</h2>
              {showPicker
                ? <button type="button" className="cs-link" onClick={p.onAllTemplates}>Tümü</button>
                : <button type="button" className="cs-btn cs-btn-outline cs-btn-sm" disabled={p.disabled} onClick={() => setPickerOpen(true)}>Değiştir</button>}
            </div>
            {!source && <button type="button" className="cs-btn cs-btn-outline cs-btn-block" onClick={p.onNewTemplate}><Plus size={16}/> Şablon oluştur</button>}
            {source && <ul className="cs-template-list">
              {(showPicker ? pickerList : [source]).map(t => {
                const selected = t.id === source.id;
                return <li key={t.id}>
                  <button type="button" className={`cs-template${selected ? ' is-selected' : ''}`} aria-pressed={selected} disabled={p.disabled}
                    onClick={() => { p.onSelectTemplate(t.id); if (photosDone) setPickerOpen(false); }}>
                    <TemplateSwatch template={t} selected={selected}/>
                    <span className="cs-template-text"><strong>{t.name}</strong><small><TemplateMeta template={t}/></small></span>
                    {selected && showPicker && <Check size={18} className="cs-template-check"/>}
                  </button>
                </li>;
              })}
            </ul>}
          </section>
        </div>

        <section className="cs-card cs-texts" ref={textsRef} aria-labelledby="cs-texts-title">
          <div className="cs-texts-head">
            <StepMark n={3} active/>
            <div>
              <h2 id="cs-texts-title">Metinler</h2>
              <p>{source ? `${source.name} şablonunun metin alanları` : 'Önce bir şablon seç'}</p>
            </div>
            {fields.length > 0 && p.onAiFill && <button type="button" className="cs-btn cs-btn-ai" disabled={p.disabled || p.aiBusy} onClick={() => void p.onAiFill?.()}>
              {p.aiBusy ? <Loader2 size={16} className="cs-spin"/> : <Sparkles size={16}/>} {p.aiBusy ? 'Yazılıyor…' : 'AI ile doldur'}
            </button>}
          </div>
          {p.aiError && <p className="cs-error" role="alert">{p.aiError}</p>}

          {!fields.length && source && <p className="cs-hint">Bu şablonda metin alanı yok. Tasarımlar yalnızca fotoğraflarla oluşturulur.</p>}
          {p.groups.map(group => <div key={group.pageId} className="cs-field-group">
            {p.groups.length > 1 && <h3 className="cs-group-title">{group.pageName}</h3>}
            {group.fields.map(field => {
              const id = `cs-field-${group.pageId}-${field.id}`;
              const value = p.texts[group.pageId]?.[field.id] ?? '';
              const limit = fieldCharLimit(field);
              const length = visibleLength(value);
              return <div key={field.id} className="cs-field">
                <div className="cs-field-label">
                  <span id={`${id}-label`}>{field.name}</span>
                  {limit && <small className={length > limit ? 'is-over' : ''}>{length ? `${length} / ${limit}` : `en fazla ${limit} karakter`}</small>}
                </div>
                <RichTextField id={id} labelledBy={`${id}-label`} value={value} disabled={p.disabled}
                  placeholder={fieldPlaceholder(field, field.defaultText)} singleLine={isSingleLineField(field)}
                  invalid={!!limit && length > limit} onChange={next => p.setText(group.pageId, field.id, next)}/>
              </div>;
            })}
          </div>)}

          <div className="cs-field">
            <div className="cs-field-label"><label htmlFor="cs-brief">Komut</label><small>İsteğe bağlı</small></div>
            <textarea id="cs-brief" className="cs-textarea" value={p.brief} maxLength={3000} disabled={p.disabled}
              onChange={e => p.setBrief(e.target.value)} placeholder="Örn. Yüzleri ortala, fotoğrafları sıcak tonlarla eşitle, en net kareyi kapakta kullan."/>
          </div>
          <p className="cs-hint">Metinler aynı düzenden üretilen tüm sayfalara uygulanır. Sonra her sayfayı ayrı düzenleyebilirsin. Bir kısmı kalın yapmak için seçip <strong>Kalın</strong>'a bas.</p>
          <BoldBubble scopeRef={textsRef}/>
        </section>

        <div className="cs-col cs-col-right">
          <section className="cs-card cs-preview" aria-labelledby="cs-preview-title">
            <div className="cs-card-head">
              <h2 id="cs-preview-title">Önizleme</h2>
              {preview && <span className="cs-muted">{preview.label}</span>}
            </div>
            <div className="cs-preview-stage">
              {preview ? <TemplateThumbnail template={preview.template} data={preview.data as any}/> : <div className="cs-preview-empty"><Images size={22}/><span>Görsel alanı</span></div>}
            </div>
          </section>

          <section className="cs-card cs-summary" aria-live="polite">
            <dl>
              <div><dt>Fotoğraf</dt><dd>{photos.length} / {MAX_PHOTOS}</dd></div>
              <div><dt>Şablon</dt><dd>{source?.name || '—'}</dd></div>
              {photosDone && fields.length > 0 && <div><dt>Metinler</dt><dd>{filled} / {fields.length} dolu</dd></div>}
            </dl>
            <div className="cs-total"><span>Oluşturulacak tasarım</span><strong>{p.planned}</strong></div>
            {p.error && <p className="cs-error" role="alert">{p.error}</p>}
            <button type="button" className={`cs-generate${canGenerate ? ' is-ready' : ''}`} disabled={!canGenerate} onClick={p.onGenerate}>
              <Sparkles size={18}/> {generateLabel} {canGenerate && <ArrowRight size={18}/>}
            </button>
            {p.busy
              ? <button type="button" className="cs-link cs-center" onClick={p.onCancel}>Üretimi iptal et</button>
              : <p className="cs-muted cs-center">{photosDone ? 'Seçimin ve metinlerin bu ekranda korunur.' : 'Başlamak için en az 1 fotoğraf ekle.'}</p>}
          </section>
        </div>
      </div>

      <div className="cs-mobile-bar">
        <span><strong>{p.planned}</strong> tasarım</span>
        <button type="button" className={`cs-generate${canGenerate ? ' is-ready' : ''}`} disabled={!canGenerate} onClick={p.onGenerate}>
          <Sparkles size={17}/> {generateLabel}
        </button>
      </div>

      {dragState && createPortal(
        <div className="cs-drag-ghost" style={{ left: dragState.left, top: dragState.top, width: dragState.width, height: dragState.height }}>
          <img src={dragState.src} alt=""/>
        </div>,
        document.body,
      )}
    </div>
  );
}
