import React, { useRef } from 'react';
import {
  AlignCenter, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  Bold, Image as ImageIcon, Minus, Move, Plus, Ratio, RotateCw, Type, Upload
} from 'lucide-react';
import type { DesignTemplate, Region } from '../types';

type WorkAlignment = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'center-both';
type WorkImageData = { url: string; scale: number; offsetX: number; offsetY: number; rotation: number };

export function WorkQuickEditor(props: {
  template: DesignTemplate;
  regions: Region[];
  activePageData: any;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onTextChange: (id: string, text: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onRegionChange: (id: string, updates: Partial<Region>) => void;
  onCenter: (id: string) => void;
  onAlign: (id: string, alignment: WorkAlignment) => void;
  imageData: Record<string, WorkImageData>;
  onUpdateImageProp: (id: string, prop: keyof WorkImageData, value: any) => void;
  onResizeWork: (width: number, height: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editable = props.regions.filter(region => region.type === 'text' || region.type === 'image');
  const selected = editable.find(region => region.id === props.selectedNodeId) || editable[0];
  const textValue = selected?.type === 'text'
    ? props.activePageData.dynamicTexts?.[selected.id] ?? selected.placeholderText ?? ''
    : '';
  const fontSize = selected?.textStyle?.fontSize ?? 24;
  const imgData: WorkImageData = (selected && props.imageData[selected.id]) || { url: '', scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };

  const applyFontSize = (next: number) => {
    if (!selected) return;
    const clamped = Math.max(8, Math.min(200, next));
    props.onRegionChange(selected.id, { textStyle: { ...selected.textStyle!, fontSize: clamped } });
  };

  const toggleBoldOnSelection = () => {
    const el = textareaRef.current;
    if (!selected || !el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return; // Nothing selected — nothing to make bold.
    const before = textValue.slice(0, start);
    const middle = textValue.slice(start, end);
    const after = textValue.slice(end);
    const isAlreadyBold = middle.startsWith('**') && middle.endsWith('**') && middle.length >= 4;
    const nextMiddle = isAlreadyBold ? middle.slice(2, -2) : `**${middle}**`;
    const nextText = before + nextMiddle + after;
    props.onTextChange(selected.id, nextText);
    // Keep the same words selected after the markers shift, so toggling back and forth feels natural.
    requestAnimationFrame(() => {
      const delta = nextMiddle.length - middle.length;
      el.focus();
      el.setSelectionRange(start, end + delta);
    });
  };

  return <aside className="work-quick-editor" aria-label="Mevcut tasarım ayarları">
    <header><div><strong>Mevcut tasarımı düzenle</strong><span>Değişiklikler yalnızca bu çalışmaya uygulanır.</span></div></header>
    <div className="work-quick-editor-body">
      <section>
        <label><Ratio size={14}/> Tasarım oranı</label>
        <div className="work-ratio-grid">
          {[
            ['Kare', 1080, 1080], ['Dikey', 1080, 1350], ['Hikâye', 1080, 1920], ['Yatay', 1080, 566],
          ].map(([name, width, height]) => <button key={String(name)} className={props.template.width === width && props.template.height === height ? 'active' : ''} onClick={() => props.onResizeWork(Number(width), Number(height))}>
            <strong>{name}</strong><span>{width}×{height}</span>
          </button>)}
        </div>
      </section>

      <section>
        <label>Sayfadaki içerikler</label>
        <div className="work-layer-list">{editable.map(region => <button key={region.id} className={selected?.id === region.id ? 'active' : ''} onClick={() => props.onSelectNode(region.id)}>
          {region.type === 'text' ? <Type size={13}/> : <ImageIcon size={13}/>}<span>{region.name}</span>
        </button>)}</div>
      </section>

      {selected && <section className="work-selected-control">
        <label>{selected.type === 'text' ? <><Type size={14}/> Metni düzenle</> : <><ImageIcon size={14}/> Görseli değiştir</>}</label>
        {selected.type === 'text' ? <>
          <div className="work-text-toolbar">
            <div className="work-font-size-control">
              <button type="button" onClick={() => applyFontSize(fontSize - 2)} aria-label="Yazıyı küçült"><Minus size={13}/></button>
              <input type="number" min={8} max={200} value={fontSize} onChange={event => applyFontSize(Number(event.target.value))}/>
              <button type="button" onClick={() => applyFontSize(fontSize + 2)} aria-label="Yazıyı büyüt"><Plus size={13}/></button>
            </div>
            <button type="button" className="work-bold-selection-btn" onClick={toggleBoldOnSelection} title="Metinde seçtiğin kısmı kalın yap">
              <Bold size={13}/> Seçili kısmı kalınlaştır
            </button>
          </div>
          <textarea ref={textareaRef} rows={5} value={textValue} onChange={event => props.onTextChange(selected.id, event.target.value)} placeholder="Başlık veya açıklama metni"/>
          <p className="work-text-hint">Kalınlaştırmak istediğin kelimeleri metin kutusunda seç, sonra yukarıdaki butona bas.</p>
        </> : <>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => { const file = event.target.files?.[0]; if (file) props.onImageUpload(selected.id, file); event.target.value = ''; }}/>
          <button className="work-upload-button" onClick={() => fileInput.current?.click()}><Upload size={14}/> Yeni görsel seç</button>
          <div className="work-image-transform">
            <div className="work-image-scale">
              <span>Yakınlaştırma</span>
              <input type="range" min={0.5} max={3} step={0.05} value={imgData.scale ?? 1} onChange={event => props.onUpdateImageProp(selected.id, 'scale', parseFloat(event.target.value))}/>
              <span>{Math.round((imgData.scale ?? 1) * 100)}%</span>
            </div>
            <button type="button" className="work-rotate-btn" onClick={() => props.onUpdateImageProp(selected.id, 'rotation', ((imgData.rotation ?? 0) + 90) % 360)}>
              <RotateCw size={13}/> Döndür ({imgData.rotation ?? 0}°)
            </button>
          </div>
        </>}
        <div className="work-position-heading"><span><Move size={13}/> Konum ve boyut</span></div>
        <div className="work-align-grid">
          <button type="button" onClick={() => props.onAlign(selected.id, 'left')} title="Sola yasla"><AlignHorizontalJustifyStart size={14}/></button>
          <button type="button" onClick={() => props.onAlign(selected.id, 'center-x')} title="Yatayda ortala"><AlignHorizontalJustifyCenter size={14}/></button>
          <button type="button" onClick={() => props.onAlign(selected.id, 'right')} title="Sağa yasla"><AlignHorizontalJustifyEnd size={14}/></button>
          <button type="button" onClick={() => props.onAlign(selected.id, 'top')} title="Üste yasla"><AlignVerticalJustifyStart size={14}/></button>
          <button type="button" onClick={() => props.onAlign(selected.id, 'center-y')} title="Dikeyde ortala"><AlignVerticalJustifyCenter size={14}/></button>
          <button type="button" onClick={() => props.onAlign(selected.id, 'bottom')} title="Alta yasla"><AlignVerticalJustifyEnd size={14}/></button>
        </div>
        <button type="button" className="work-center-both-btn" onClick={() => props.onCenter(selected.id)}><AlignCenter size={13}/> Şablonun tam ortasına al</button>
        <div className="work-position-grid">
          {([['X', 'x'], ['Y', 'y'], ['En', 'width'], ['Boy', 'height']] as const).map(([label, key]) => <label key={key}>{label}
            <input type="number" min={key === 'width' || key === 'height' ? 10 : undefined} value={Math.round(selected[key])} onChange={event => props.onRegionChange(selected.id, { [key]: Math.max(key === 'width' || key === 'height' ? 10 : 0, Number(event.target.value)) })}/>
          </label>)}
        </div>
        <p>Öğeyi tuval üzerinde sürükleyerek de konumlandırabilirsin.</p>
      </section>}
    </div>
  </aside>;
}
