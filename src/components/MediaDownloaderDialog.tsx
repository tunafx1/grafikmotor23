import { useEffect, useRef } from 'react';
import { Download, X, Video, Music, Loader2, Link2, ExternalLink, AlertCircle, Trash2, Check } from 'lucide-react';

type Props = {
  onClose: () => void; url: string; onUrlChange: (value:string) => void;
  info: {title:string;author:string;thumbnail:string;videoId:string} | null;
  loading:boolean; error:string|null; format:'mp3'|'mp4'; onFormatChange:(value:'mp3'|'mp4')=>void;
  onInspect:()=>void; downloading:boolean; onDownload:()=>void;
  result:{downloadUrl:string;quality:string}|null;
  history:{title:string;format:string;date:string;url:string;thumbnail:string}[];
  onClearHistory:()=>void;
};

export function MediaDownloaderDialog(props: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const busy = props.loading || props.downloading;
  return <div className="workspace-modal-backdrop" onClick={event => {if (event.target === event.currentTarget) props.onClose();}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="media-dialog-title" aria-describedby="media-dialog-description"
      className="workspace-media-dialog" onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Escape') {event.preventDefault(); props.onClose();}
        if (event.key === 'Tab') {
          const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') || []);
          const first = items[0], last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
          if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
        }
      }}>
      <header className="media-dialog-header">
        <span className="media-dialog-icon"><Download size={20}/></span>
        <div><span className="workspace-eyebrow">MEDYA ARAÇLARI</span><h2 id="media-dialog-title">MP3 · MP4 indir</h2></div>
        <button type="button" className="workspace-icon-button" aria-label="Medya penceresini kapat" onClick={props.onClose}><X size={19}/></button>
      </header>
      <p id="media-dialog-description" className="workspace-field-hint">YouTube bağlantısını ekle, dosya biçimini seç ve indir.</p>
      <form className="media-link-form" onSubmit={event => {event.preventDefault(); if (!busy && props.url.trim()) props.onInspect();}}>
        <label htmlFor="media-source-url">YouTube bağlantısı</label>
        <div className="media-link-row"><div className="media-link-input"><Link2 size={16}/><input ref={input} id="media-source-url"
          type="url" placeholder="https://www.youtube.com/watch?v=…" value={props.url} disabled={busy}
          onChange={event => props.onUrlChange(event.target.value)}/></div>
          <button type="submit" className="workspace-button" disabled={busy || !props.url.trim()}>
            {props.loading && <Loader2 size={14} className="animate-spin"/>}İncele
          </button>
        </div>
      </form>
      {props.info && <div className="media-preview">
        <img src={props.info.thumbnail} alt=""/><div><strong>{props.info.title}</strong><span>{props.info.author}</span>
          <a href={`https://www.youtube.com/watch?v=${props.info.videoId}`} target="_blank" rel="noopener noreferrer">YouTube’da aç <ExternalLink size={12}/></a></div>
      </div>}
      <fieldset className="media-format-field"><legend>Dosya biçimi</legend><div className="media-format-options">
        {(['mp4','mp3'] as const).map(format => <button type="button" key={format} aria-pressed={props.format === format}
          className="media-format-option" disabled={busy} onClick={() => props.onFormatChange(format)}>
          <span className="media-format-title">{format === 'mp4' ? <Video size={19}/> : <Music size={19}/>}<strong>{format.toUpperCase()}</strong>
            {props.format === format && <Check size={15}/>}</span>
          <span>{format === 'mp4' ? 'Video ve ses' : 'Yalnızca ses'}</span>
          <small>{format === 'mp4' ? 'Kalite kaynak videoya bağlıdır' : '320 kbps MP3 kodlama'}</small>
        </button>)}
      </div></fieldset>
      {props.error && <div className="workspace-ai-notice is-error" role="alert"><AlertCircle size={16}/><span>{props.error}</span></div>}
      <button type="button" className="workspace-button workspace-primary media-download-button" disabled={busy || !props.url.trim()} onClick={props.onDownload}>
        {props.downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
        {props.downloading ? 'İndirme hazırlanıyor…' : `${props.format.toUpperCase()} indir`}
      </button>
      {props.result && <div className="media-download-result" role="status">
        <strong>İndirme bağlantısı hazır</strong><p>Tarayıcı indirmeyi başlatmadıysa bağlantıyı kullanabilirsin.</p>
        <a className="workspace-button" href={props.result.downloadUrl} download><Download size={14}/>İndirme bağlantısını aç</a>
      </div>}
      {props.history.length > 0 && <section className="media-history"><div className="media-history-heading"><h3>Son bağlantılar</h3>
        <button type="button" className="workspace-icon-button" onClick={props.onClearHistory} aria-label="İndirme geçmişini temizle"><Trash2 size={14}/></button></div>
        <div className="media-history-list">{props.history.map((item, index) => <a key={index} href={item.url} download className="media-history-item">
          <span className="media-history-format">{item.format}</span><span><strong>{item.title}</strong><small>{item.date}</small></span><Download size={14}/>
        </a>)}</div>
      </section>}
    </div>
  </div>;
}
