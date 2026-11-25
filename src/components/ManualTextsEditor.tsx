import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Check } from 'lucide-react';
import { RichTextField } from './RichTextField';
import type { ManualTextGroup, ManualTexts } from '../utils/batchProduction';
import './ManualTextsEditor.css';

/** Full-screen editor for the texts typed while AI is off. Changes apply as you type. */
export function ManualTextsEditor(props: {
  open: boolean;
  groups: ManualTextGroup[];
  texts: ManualTexts;
  onChange: (pageId: string, fieldId: string, value: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const { open, onClose } = props;
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);

  if (!open) return null;
  let first = true;
  return createPortal(
    <div className="manual-editor" role="dialog" aria-modal="true" aria-labelledby="manual-editor-title">
      <header className="manual-editor-bar">
        <h2 id="manual-editor-title">Metinler</h2>
        <button
          type="button"
          className="manual-editor-bold"
          // Keep the text selection: a normal click would move focus off the field first.
          onMouseDown={event => event.preventDefault()}
          onPointerDown={event => event.preventDefault()}
          onClick={() => {
            document.execCommand('bold');
            (document.activeElement as HTMLElement | null)?.dispatchEvent(new Event('input', { bubbles: true }));
          }}
          title="Seçili metni kalın yap (Ctrl+B)"
        >
          <Bold size={16} /> <span>Kalın</span>
        </button>
        <button type="button" className="manual-editor-done" onClick={onClose}>
          <Check size={16} /> <span>Tamam</span>
        </button>
      </header>
      <div className="manual-editor-body">
        <p className="manual-editor-hint">Kalın yapmak istediğin kısmı seç, sonra <strong>Kalın</strong>'a bas. Metinler aynı sayfa düzeninden üretilen tüm sayfalara uygulanır.</p>
        {props.groups.length ? props.groups.map(group => (
          <section key={group.pageId} className="manual-editor-group">
            <h3>{group.pageName}</h3>
            {group.fields.map(field => {
              const autoFocus = first; first = false;
              return (
                <RichTextField
                  key={field.id}
                  id={`manual-editor-${group.pageId}-${field.id}`}
                  label={field.name}
                  value={props.texts[group.pageId]?.[field.id] ?? ''}
                  onChange={value => props.onChange(group.pageId, field.id, value)}
                  autoFocus={autoFocus}
                  disabled={props.disabled}
                />
              );
            })}
          </section>
        )) : <p className="manual-editor-hint">Bu şablonda metin alanı yok.</p>}
      </div>
    </div>,
    document.body,
  );
}
