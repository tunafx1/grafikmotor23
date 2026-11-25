import React, { useLayoutEffect, useRef } from 'react';
import { htmlToMarkdown, markdownToHtml, stripMarkerChars } from '../utils/richText';

/**
 * A multi-line text box that shows **bold** and *italic* as real formatting
 * while reading and writing the same marker text the canvas renderer uses.
 */
export function RichTextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
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

  useLayoutEffect(() => {
    if (props.autoFocus) ref.current?.focus();
  }, [props.autoFocus]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = htmlToMarkdown(el as unknown as Parameters<typeof htmlToMarkdown>[0]);
    emitted.current = next;
    props.onChange(next);
  };

  return (
    <div className="rich-text-field">
      <span id={`${props.id}-label`} className="rich-text-label">{props.label}</span>
      <div
        ref={ref}
        id={props.id}
        className="rich-text-input"
        role="textbox"
        aria-multiline="true"
        aria-labelledby={`${props.id}-label`}
        aria-disabled={props.disabled || undefined}
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
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
            event.preventDefault();
            document.execCommand('bold');
            emit();
          }
        }}
        onPaste={event => {
          // Pasted styles (colour, font, links) must never leak into the stored text.
          event.preventDefault();
          document.execCommand('insertText', false, stripMarkerChars(event.clipboardData.getData('text/plain')));
          emit();
        }}
      />
    </div>
  );
}
