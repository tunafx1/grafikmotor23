import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Download, Link2, Loader2, Share2, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import type { DesignTemplate } from '../types';
import type { SharedTemplateInfo } from '../lib/templatesDb';
import { buildShareLink, formatShareCode, normalizeShareCode, compressTemplateJson } from '../lib/templatesDb';
import { TemplateThumbnail } from './TemplateThumbnail';
import './TemplateShare.css';

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API can be blocked (permissions/iframe); fall back to a hidden textarea.
      const area = document.createElement('textarea');
      area.value = value;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(key);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };
  return { copied, copy };
}

function DialogShell({ labelledBy, onClose, children }: { labelledBy: string; onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return (
    <motion.div
      className="tpl-share-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="tpl-share-panel"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="tpl-share-close" onClick={onClose} aria-label="Kapat"><X size={16} /></button>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Share ───────────────────────── */

type ShareState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'ready'; code: string; link?: string }
  | { status: 'revoked' }
  | { status: 'error'; message: string; code?: string };

export function ShareTemplateDialog({ template, onShare, onRevoke, onClose }: {
  template: DesignTemplate;
  onShare: () => Promise<string>;
  onRevoke: (code: string) => Promise<void>;
  onClose: () => void;
}) {
  const [state, setState] = useState<ShareState>({ status: 'idle' });
  const [revoking, setRevoking] = useState(false);
  const { copied, copy } = useCopy();

  const create = async () => {
    setState({ status: 'working' });
    try {
      const code = await onShare();
      let compressed = '';
      try {
        const { sourceTemplateId: _s, productionBrief: _p, createdAt: _c, ...shareable } = template as any;
        compressed = await compressTemplateJson(JSON.stringify(shareable));
      } catch { /* noop */ }
      const link = buildShareLink(code, compressed);
      setState({ status: 'ready', code, link });
    } catch (error) {
      setState({ status: 'error', message: (error as Error).message || 'Şablon paylaşılamadı.' });
    }
  };

  const revoke = async (code: string) => {
    setRevoking(true);
    try {
      await onRevoke(code);
      setState({ status: 'revoked' });
    } catch (error) {
      setState({ status: 'error', message: (error as Error).message || 'Paylaşım durdurulamadı.', code });
    } finally {
      setRevoking(false);
    }
  };

  const link = state.status === 'ready' ? (state.link || buildShareLink(state.code)) : '';
  const pageCount = template.pages?.length || 1;

  return (
    <DialogShell labelledBy="tpl-share-title" onClose={onClose}>
      <div className="tpl-share-head">
        <span className="tpl-share-icon"><Share2 size={18} /></span>
        <div>
          <span className="tpl-share-eyebrow">ŞABLON PAYLAŞ</span>
          <h2 id="tpl-share-title">Başka bir hesapla paylaş</h2>
        </div>
      </div>

      <div className="tpl-share-preview">
        <TemplateThumbnail template={template} />
        <div>
          <strong>{template.name}</strong>
          <span>{template.width} × {template.height} px · {pageCount} düzen</span>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {(state.status === 'idle' || state.status === 'working') && (
          <motion.div key="idle" className="tpl-share-body" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <ul className="tpl-share-points">
              <li><ShieldCheck size={15} /> Şablonun <b>şu anki hâlinin bir kopyası</b> paylaşılır.</li>
              <li><UserRound size={15} /> Kodu alan kişi kopyayı kendi hesabına ekler; senin şablonun değişmez.</li>
              <li><Link2 size={15} /> Paylaşımı istediğin an durdurabilirsin.</li>
            </ul>
            <button type="button" className="tpl-share-primary" disabled={state.status === 'working'} onClick={() => void create()}>
              {state.status === 'working' ? <><Loader2 size={16} className="tpl-spin" /> Paylaşım hazırlanıyor…</> : <><Share2 size={16} /> Paylaşım kodu oluştur</>}
            </button>
          </motion.div>
        )}

        {state.status === 'ready' && (
          <motion.div key="ready" className="tpl-share-body" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <label className="tpl-share-label">Paylaşım kodu</label>
            <div className="tpl-share-code">
              {formatShareCode(state.code).split('').map((char, index) => (
                <motion.span
                  key={index}
                  className={char === '-' ? 'is-sep' : ''}
                  initial={{ opacity: 0, y: 10, rotateX: -60 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >{char}</motion.span>
              ))}
              <button type="button" onClick={() => void copy('code', formatShareCode(state.code))} aria-label="Kodu kopyala">
                {copied === 'code' ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <label className="tpl-share-label">Veya bağlantıyı gönder</label>
            <div className="tpl-share-link">
              <input readOnly value={link} onFocus={event => event.currentTarget.select()} aria-label="Paylaşım bağlantısı" />
              <button type="button" onClick={() => void copy('link', link)}>
                {copied === 'link' ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Kopyala</>}
              </button>
            </div>
            <p className="tpl-share-hint">Alıcı, “Şablonlarım → Kod ile ekle” bölümüne kodu girerek veya bağlantıyı açarak şablonu kendi hesabına ekleyebilir.</p>
            <div className="tpl-share-actions">
              <button type="button" className="tpl-share-ghost danger" disabled={revoking} onClick={() => void revoke(state.code)}>
                {revoking ? <Loader2 size={14} className="tpl-spin" /> : <Trash2 size={14} />} Paylaşımı durdur
              </button>
              <button type="button" className="tpl-share-primary compact" onClick={onClose}>Tamam</button>
            </div>
          </motion.div>
        )}

        {state.status === 'revoked' && (
          <motion.div key="revoked" className="tpl-share-body tpl-share-centered" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span className="tpl-share-badge"><Check size={18} /></span>
            <p>Paylaşım durduruldu. Bu kod artık kullanılamaz; daha önce ekleyenlerin kopyaları kendilerinde kalır.</p>
            <button type="button" className="tpl-share-primary compact" onClick={onClose}>Kapat</button>
          </motion.div>
        )}

        {state.status === 'error' && (
          <motion.div key="error" className="tpl-share-body" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="tpl-share-error" role="alert">{state.message}</p>
            {/güvenlik kuralları|izin/i.test(state.message) && (
              <p className="text-[11px] text-white/60 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                💡 <b>Çözüm:</b> Firebase Console &rarr; Firestore Database &rarr; <b>Rules (Kurallar)</b> sekmesinden projedeki güncel <code>firestore.rules</code> kurallarını yayınlamanız (Publish) gerekmektedir.
              </p>
            )}
            <div className="tpl-share-actions">
              <button type="button" className="tpl-share-ghost" onClick={onClose}>Vazgeç</button>
              <button type="button" className="tpl-share-primary compact" onClick={() => state.code ? setState({ status: 'ready', code: state.code }) : void create()}>Tekrar dene</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogShell>
  );
}

/* ───────────────────────── Import ───────────────────────── */

type ImportState =
  | { status: 'idle'; error?: string }
  | { status: 'loading' }
  | { status: 'preview'; info: SharedTemplateInfo }
  | { status: 'adding'; info: SharedTemplateInfo }
  | { status: 'done'; name: string };

export function ImportTemplateDialog({ initialCode, onFetch, onImport, onUseTemplate, onClose }: {
  initialCode?: string;
  onFetch: (code: string) => Promise<SharedTemplateInfo>;
  onImport: (info: SharedTemplateInfo) => string;
  onUseTemplate: (id: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialCode ? formatShareCode(initialCode) : '');
  const [state, setState] = useState<ImportState>({ status: 'idle' });
  const [importedId, setImportedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoFetched = useRef(false);

  const lookup = async (raw: string) => {
    const code = normalizeShareCode(raw);
    if (!code) { setState({ status: 'idle', error: 'Kod 8 karakterden oluşmalı (ör. ABCD-EFGH) veya geçerli bir paylaşım bağlantısı olmalı.' }); return; }
    setState({ status: 'loading' });
    try {
      setState({ status: 'preview', info: await onFetch(code) });
    } catch (error) {
      setState({ status: 'idle', error: (error as Error).message || 'Şablon bulunamadı.' });
    }
  };

  useEffect(() => {
    if (initialCode && !autoFetched.current) { autoFetched.current = true; void lookup(initialCode); }
    else inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (info: SharedTemplateInfo) => {
    setState({ status: 'adding', info });
    // Let the button state paint before the (synchronous, possibly heavy) template clone.
    window.setTimeout(() => {
      try {
        setImportedId(onImport(info));
        setState({ status: 'done', name: info.name });
      } catch (error) {
        setState({ status: 'idle', error: (error as Error).message || 'Şablon eklenemedi.' });
      }
    }, 30);
  };

  const formatInput = (raw: string) => {
    if (/^https?:/i.test(raw.trim())) return raw;
    const clean = raw.toLocaleUpperCase('en-US').replace(/[^A-Z0-9]/g, '').slice(0, 8);
    return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
  };

  return (
    <DialogShell labelledBy="tpl-import-title" onClose={onClose}>
      <div className="tpl-share-head">
        <span className="tpl-share-icon"><Download size={18} /></span>
        <div>
          <span className="tpl-share-eyebrow">PAYLAŞILAN ŞABLON</span>
          <h2 id="tpl-import-title">Kod ile şablon ekle</h2>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {(state.status === 'idle' || state.status === 'loading') && (
          <motion.form
            key="form"
            className="tpl-share-body"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onSubmit={event => { event.preventDefault(); void lookup(value); }}
          >
            <label className="tpl-share-label" htmlFor="tpl-import-code">Paylaşım kodu veya bağlantısı</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="tpl-import-code"
                ref={inputRef}
                className="tpl-share-input"
                style={{ paddingRight: value ? '36px' : '14px' }}
                value={value}
                onChange={event => {
                  setValue(formatInput(event.target.value));
                  if (state.status === 'idle' && state.error) setState({ status: 'idle' });
                }}
                placeholder="ABCD-EFGH"
                autoComplete="off"
                spellCheck={false}
                disabled={state.status === 'loading'}
              />
              {value && state.status !== 'loading' && (
                <button
                  type="button"
                  onClick={() => { setValue(''); setState({ status: 'idle' }); inputRef.current?.focus(); }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Temizle"
                  aria-label="Kodu temizle"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {state.status === 'idle' && state.error && (
              <p className="tpl-share-error" role="alert">{state.error}</p>
            )}
            <div className="tpl-share-actions" style={{ marginTop: '12px' }}>
              <button type="button" className="tpl-share-ghost" onClick={onClose}>Vazgeç</button>
              <button type="submit" className="tpl-share-primary compact" disabled={state.status === 'loading' || !value.trim()}>
                {state.status === 'loading' ? <><Loader2 size={16} className="tpl-spin" /> Şablon aranıyor…</> : 'Şablonu bul'}
              </button>
            </div>
          </motion.form>
        )}

        {(state.status === 'preview' || state.status === 'adding') && (
          <motion.div key="preview" className="tpl-share-body" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <div className="tpl-share-preview large">
              <TemplateThumbnail template={state.info.template} />
              <div>
                <strong>{state.info.name}</strong>
                <span>{state.info.template.width} × {state.info.template.height} px · {state.info.template.pages?.length || 1} düzen</span>
                <span className="tpl-share-owner"><UserRound size={13} /> {state.info.ownerName} paylaştı{state.info.createdAt ? ` · ${state.info.createdAt.toLocaleDateString('tr-TR')}` : ''}</span>
              </div>
            </div>
            <p className="tpl-share-hint">Şablonun bağımsız bir kopyası hesabına eklenir. Üzerinde yaptığın değişiklikler paylaşan kişiyi etkilemez.</p>
            <div className="tpl-share-actions">
              <button type="button" className="tpl-share-ghost" disabled={state.status === 'adding'} onClick={() => setState({ status: 'idle' })}>Başka kod gir</button>
              <button type="button" className="tpl-share-primary compact" disabled={state.status === 'adding'} onClick={() => add(state.info)}>
                {state.status === 'adding' ? <><Loader2 size={15} className="tpl-spin" /> Ekleniyor…</> : <><Download size={15} /> Şablonlarıma ekle</>}
              </button>
            </div>
          </motion.div>
        )}

        {state.status === 'done' && (
          <motion.div key="done" className="tpl-share-body tpl-share-centered" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.span className="tpl-share-badge" initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
              <Check size={20} />
            </motion.span>
            <p><b>{state.name}</b> şablonlarına eklendi.</p>
            <div className="tpl-share-actions">
              <button type="button" className="tpl-share-ghost" onClick={onClose}>Kapat</button>
              {importedId && <button type="button" className="tpl-share-primary compact" onClick={() => { onUseTemplate(importedId); onClose(); }}>Bu şablonla oluştur</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogShell>
  );
}
