import React, { useEffect, useRef, useState } from 'react';
import { Upload, Sparkles, ArrowRight, X, ArrowLeft, Plus, Images, Download, FolderOpen, LayoutTemplate, Check, Trash2, Pencil } from 'lucide-react';
import type { DesignTemplate, SequenceMediaItem } from '../types';
import { TemplateThumbnail } from './TemplateThumbnail';
import { resolveExportTemplate } from '../utils/exportAssets';
import { buildBatchPages } from '../utils/batchProduction';
import { createSequenceMediaItem } from '../utils/mediaUtils';
import './BatchWorkspace.css';
import './BatchWorkspace.simple.css';
import './BatchCreate.css';

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
  const fileInput = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const sourceTemplates = p.templates.filter(t => !t.sourceTemplateId);
  const source = sourceTemplates.find(t => t.id === p.current.sourceTemplateId) || sourceTemplates.find(t => t.id === p.current.id) || sourceTemplates[0];
  const disabled = p.busy || loading;
  const archivedWorks = p.templates.filter(template => !!p.projects[template.id]?.length);
  useEffect(() => { if (p.screen !== 'works') setSelectedWorks(new Set()); }, [p.screen]);
  const toggleWork = (id: string) => setSelectedWorks(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
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
          <div className="production-photos">{photos.map((photo, index) => <article key={photo.id + index}>
            <img src={photo.thumbnailUrl} alt={photo.originalName || `Fotoğraf ${index + 1}`}/><span className="photo-number">{index + 1}</span>
            <button className="photo-remove" disabled={disabled} aria-label={`${index + 1}. fotoğrafı seçimden çıkar`} onClick={() => setPhotos(old => old.filter((_, i) => i !== index))}><X size={14}/></button>
            <div><button disabled={disabled || index === 0} aria-label={`${index + 1}. fotoğrafı önceye taşı`} onClick={() => move(index, -1)}><ArrowLeft size={14}/></button><span>{photo.originalName}</span><button disabled={disabled || index === photos.length - 1} aria-label={`${index + 1}. fotoğrafı sonraya taşı`} onClick={() => move(index, 1)}><ArrowRight size={14}/></button></div>
          </article>)}</div>
          {!!photos.length && <p className="production-hint">Fotoğraflar bu sırayla yerleştirilir. İlk fotoğraflar kapakta kullanılır.</p>}
        </section>
        <div className="production-settings">
          <section className="production-card production-template-card"><h2><span>2</span> Şablon</h2>
            {source ? <><label htmlFor="production-template">Kullanılacak şablon</label><select id="production-template" disabled={disabled} value={source.id} onChange={e => p.onSelectTemplate(e.target.value)}>{sourceTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <div className="production-template-preview"><TemplateThumbnail template={source}/><div><strong>{source.name}</strong><p>{source.width} × {source.height} px</p><small>Fotoğraflar şablonun kapak ve kolaj alanlarına yerleştirilir.</small></div></div></> : <button onClick={p.onNewTemplate}>Şablon oluştur</button>}
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
      {pages.some(page => page.productionError) && <div className="production-error" role="alert">Bazı metinler üretilemedi. Bu sayfalarda şablon metinleri korunuyor. <button disabled={p.busy} onClick={p.onRetry}>{p.busy ? p.progress : 'Başarısız metinleri yeniden dene'}</button></div>}
      {p.error && <p role="alert" className="production-error">{p.error}</p>}
      <div className="production-gallery">{pages.map((page, i) => <button key={page.id} className="production-result" disabled={p.busy} onClick={() => p.onOpen(p.current.id, i)}><TemplateThumbnail template={resolveExportTemplate(p.current, page)} data={page}/><div><strong>{page.name}</strong><span>{page.productionError ? 'Metin üretilemedi' : `Sayfa ${i + 1}`}</span><span className="production-card-action">Düzenle <ArrowRight size={13}/></span></div></button>)}</div>
      <button className="production-link" disabled={p.busy} onClick={() => p.onScreen('create')}>{pages.length ? 'Üretim ayarlarına dön' : 'Toplu oluşturmaya başla'}</button>
    </div>}
    {(p.screen === 'works' || p.screen === 'templates') && <div className="production-container"><div className="production-heading production-heading-row"><div><span className="production-eyebrow">{p.screen === 'works' ? 'ARŞİV' : 'ŞABLON KÜTÜPHANESİ'}</span><h1>{p.screen === 'works' ? 'Çalışmalarım' : 'Şablonlarım'}</h1><p>{p.screen === 'works' ? 'Önceki üretimlerini aç ve kaldığın yerden devam et.' : 'Bir şablon seç veya kendi düzenini hazırla.'}</p></div><button className="production-primary" onClick={p.screen === 'works' ? () => p.onScreen('create') : p.onNewTemplate}><Plus size={18}/>{p.screen === 'works' ? 'Yeni üretim' : 'Yeni şablon'}</button></div>
      {p.screen === 'works' && archivedWorks.length > 0 && <div className="archive-selection-bar">
        <label><input type="checkbox" checked={selectedWorks.size === archivedWorks.length} onChange={() => setSelectedWorks(selectedWorks.size === archivedWorks.length ? new Set() : new Set(archivedWorks.map(work => work.id)))}/><span>{selectedWorks.size ? `${selectedWorks.size} çalışma seçildi` : 'Tümünü seç'}</span></label>
        <div><button disabled={!selectedWorks.size || p.busy} onClick={() => void p.onDownloadWorks([...selectedWorks])}><Download size={14}/> İndir</button><button className="danger" disabled={!selectedWorks.size || p.busy} onClick={() => { p.onDeleteWorks([...selectedWorks]); setSelectedWorks(new Set()); }}><Trash2 size={14}/> Sil</button></div>
      </div>}
      <div className="production-gallery">{p.templates.filter(t => p.screen === 'works' ? !!p.projects[t.id]?.length : !t.sourceTemplateId).map(t => <article className="production-result" key={t.id}>
        <div className="production-result-preview-wrap">
          <TemplateThumbnail template={p.screen === 'works' ? resolveExportTemplate(t, p.projects[t.id][0]) : t} data={p.screen === 'works' ? p.projects[t.id][0] : undefined}/>
          {p.screen === 'works' && <><label className="production-work-check"><input type="checkbox" checked={selectedWorks.has(t.id)} onChange={() => toggleWork(t.id)} aria-label={`${t.name} çalışmasını seç`}/><span/></label><button className="production-work-edit" onClick={() => p.onOpen(t.id, 0)} title="Yalnızca bu çalışmayı düzenle" aria-label={`${t.name} çalışmasını düzenle`}><Pencil size={16}/><span>Mevcut tasarımı düzenle</span></button></>}
        </div>
        <div><strong>{t.name}</strong><span>{p.screen === 'works' ? `${p.projects[t.id].length} sayfa · Ana şablondan bağımsız` : `${t.width} × ${t.height} px · ${t.pages?.length || 1} düzen`}</span></div>
        <div className="production-result-actions">{p.screen === 'works' ? <><button className="production-card-primary" onClick={() => { p.onSelectTemplate(t.id); p.onScreen('results'); }}>Çalışmayı aç <ArrowRight size={13}/></button><button className="production-card-secondary production-work-edit-secondary" onClick={() => p.onOpen(t.id, 0)}><Pencil size={13}/> Tasarımı düzenle</button></> : <><button className="production-card-primary" onClick={() => { p.onSelectTemplate(t.id); p.onScreen('create'); }}>Bu şablonla oluştur</button><button className="production-card-secondary" onClick={() => p.onEditTemplate(t.id)}>Düzenle</button><button className="production-card-delete" disabled={sourceTemplates.length <= 1} onClick={() => p.onDeleteTemplate(t.id)} aria-label={`${t.name} şablonunu sil`} title={sourceTemplates.length <= 1 ? 'Son şablon silinemez' : 'Şablonu sil'}><Trash2 size={14}/></button></>}</div>
      </article>)}</div>
      {p.screen === 'works' && !Object.values(p.projects).some(pages => pages.length) && <div className="production-empty"><Images size={36}/><h2>İlk üretimin için hazırsın.</h2><p>Fotoğraflarını ve komutunu ekle; tasarımlarını birlikte hazırlayalım.</p><button className="production-primary" onClick={() => p.onScreen('create')}>Toplu oluştur</button></div>}
      {p.screen === 'templates' && sourceTemplates.length === 0 && <div className="production-empty"><LayoutTemplate size={36}/><h2>Henüz bir şablonun yok.</h2><p>İlk şablonunu oluşturarak kendi tasarım düzenini hazırla.</p><button className="production-primary" onClick={p.onNewTemplate}>Şablon oluştur</button></div>}
    </div>}
  </section>;
}
