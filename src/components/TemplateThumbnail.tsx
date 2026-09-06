import { useEffect, useRef } from 'react';
import { DesignTemplate, GraphicData } from '../types';
import { renderTemplateToCanvas } from '../canvasRenderer';

export function TemplateThumbnail({template, data}: {template: DesignTemplate; data?: GraphicData}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let cancelled = false;
    const draft = document.createElement('canvas');
    renderTemplateToCanvas(draft, template, data?.dynamicTexts || {}, data?.dynamicImages || {}, {scale: 300 / template.width, paletteOverrides: data?.paletteOverrides, hiddenElements: data?.hiddenElements})
      .then(() => { if (!cancelled) { target.width = draft.width; target.height = draft.height; target.getContext('2d')?.drawImage(draft, 0, 0); } })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [template, data]);
  return <div className="template-thumbnail"><canvas ref={ref} aria-label={`${template.name} önizlemesi`}/></div>;
}
