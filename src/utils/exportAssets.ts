import { DesignTemplate, GraphicData, Region, FixedElement } from '../types';
import { renderTemplateToCanvas } from '../canvasRenderer';
import { compositeTemplateVideo } from './videoCompositor';
import { getVideoUrl, videoFileExtension } from '../lib/mediaStore';

export type ExportPage = Partial<GraphicData> & {
  name?: string; templatePageId?: string; backgroundImageUrl?: string;
  regions?: Region[]; fixedElements?: FixedElement[];
};
export function resolveExportTemplate(template: DesignTemplate, page: ExportPage): DesignTemplate {
  const layout = template.pages?.find(p => p.id === page.templatePageId);
  return {...template,
    regions: page.regions ?? layout?.regions ?? template.regions,
    fixedElements: page.fixedElements ?? layout?.fixedElements ?? template.fixedElements,
    backgroundImageUrl: page.backgroundImageUrl ?? layout?.backgroundImageUrl ?? template.backgroundImageUrl,
  };
}
export function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim().replace(/\s+/g, '_').slice(0, 100) || 'tasarim';
}
export async function createExportAsset(template: DesignTemplate, page: ExportPage, options: {
  format: 'png' | 'jpeg' | 'webp'; scale: number; highlightColor: string;
  paletteOverrides?: GraphicData['paletteOverrides']; onProgress?: (percent: number) => void;
}) {
  const layout = resolveExportTemplate(template, page);
  const images = {...page.dynamicImages};
  for (const [id, image] of Object.entries(images)) {
    if (image.isVideo && image.mediaId) {
      const url = await getVideoUrl(image.mediaId);
      if (!url) throw new Error('Bu videonun dosyası bu tarayıcıda bulunamadı. Videoyu yeniden yükleyin.');
      images[id] = {...image, videoUrl:url};
    }
  }
  const hidden = page.hiddenElements || [];
  const hasVideo = layout.regions.some(r => r.type === 'image' && !r.hidden && !hidden.includes(r.id) && images[r.id]?.isVideo);
  if (hasVideo) {
    const blob = await compositeTemplateVideo(layout, {...page, dynamicTexts:page.dynamicTexts || {}, dynamicImages:images, hiddenElements:hidden}, {...options, hiddenElements:hidden}, options.onProgress);
    return {blob, extension:videoFileExtension(blob)};
  }
  const canvas = document.createElement('canvas');
  await renderTemplateToCanvas(canvas, layout, page.dynamicTexts || {}, images, {...options, isExport:true, hiddenElements:hidden, showGrid:false, showSafeMargins:false});
  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : options.format === 'webp' ? 'image/webp' : 'image/png';
  const quality = options.format === 'png' ? undefined : 0.95;
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Görsel dosyası oluşturulamadı.')), mimeType, quality));
  const extension = options.format === 'jpeg' ? 'jpg' : options.format === 'webp' ? 'webp' : 'png';
  return {blob, extension};
}
