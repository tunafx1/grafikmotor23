import React, { useLayoutEffect, useRef } from 'react';
import { htmlToMarkdown, markdownToHtml, stripMarkerChars } from '../utils/richText';
import './RichTextField.css';

/**
 * A text box that shows **bold** and *italic* as real formatting while reading
 * and writing the same marker text the canvas renderer uses. The label is
 * rendered by the caller (pass its element id as labelledBy).
 */
export function RichTextField(props: {
  id: string;
  labelledBy: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  singleLine?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The last value this field emitted; an equal incoming value must not reset the caret.
  const emitted = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || props.value === emitted.current) return;
    el.innerHTML = markdownToHtml(props.value);
    emitted.current = props.value;
  }, [props.value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = htmlToMarkdown(el as unknown as Parameters<typeof htmlToMarkdown>[0]);
    // Browsers leave a stray <br> behind; clear it so the placeholder shows again.
    if (!next && el.innerHTML) el.innerHTML = '';
    emitted.current = next;
    props.onChange(next);
  };

  return (
    <div
      ref={ref}
      id={props.id}
      className={`rich-text-input${props.singleLine ? ' is-single' : ''}${props.invalid ? ' is-invalid' : ''}`}
      role="textbox"
      aria-multiline={!props.singleLine}
      aria-labelledby={props.labelledBy}
      aria-invalid={props.invalid || undefined}
      aria-disabled={props.disabled || undefined}
      data-placeholder={props.placeholder}
      contentEditable={!props.disabled}
      suppressContentEditableWarning
      spellCheck
      onInput={emit}
      onBeforeInput={event => {
        // `*` is a formatting marker for the renderer; typing it would silently change formatting.
        const data = (event.nativeEvent as InputEvent).data;
        if (!data || !data.includes('*')) return;
        event.preventDefault();
        const clean = stripMarkerChars(data);
        if (clean) { document.execCommand('insertText', false, clean); emit(); }
      }}
      onKeyDown={event => {
        if (props.singleLine && event.key === 'Enter') { event.preventDefault(); return; }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
          event.preventDefault();
          document.execCommand('bold');
          emit();
        }
      }}
      onPaste={event => {
        // Pasted styles (colour, font, links) must never leak into the stored text.
        event.preventDefault();
        let text = stripMarkerChars(event.clipboardData.getData('text/plain'));
        if (props.singleLine) text = text.replace(/\s*\n\s*/g, ' ');
        document.execCommand('insertText', false, text);
        emit();
      }}
    />
  );
}
