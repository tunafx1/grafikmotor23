import type { DesignTemplate, SequenceMediaItem, TemplatePage } from '../types';
import { getAiTextFields, requestAiText } from './aiText';

const frames = (page: TemplatePage) => page.regions.filter(r => r.type === 'image' && r.isDynamic !== false && !r.hidden && !r.placeholderImage?.startsWith('data:'));

/** Consume every selected photo exactly once, respecting actual frame capacity. */
export function buildBatchPages(template: DesignTemplate, media: SequenceMediaItem[]) {
  if (!media.length) throw new Error('Önce fotoğraflarınızı ekleyin.');
  const layouts = (template.pages?.length ? template.pages : [{ id: '1', name: 'Kapak', regions: template.regions, fixedElements: template.fixedElements, pageRole: 'cover' as const }]).filter(p => frames(p).length);
  if (!layouts.length) throw new Error('Bu şablonda fotoğraf yerleştirilecek alan yok. Başka bir şablon seçin.');
  const pages: any[] = [];
  let cursor = 0;
  while (cursor < media.length) {
    const remaining = media.length - cursor;
    const cover = layouts.find(p => p.pageRole === 'cover');
    const candidates = layouts.filter(p => p !== cover);
    const options = candidates.length ? candidates : layouts;
    const layout = cursor === 0 ? cover || layouts[0] :
      [...options].filter(p => frames(p).length <= remaining).sort((a, b) => frames(b).length - frames(a).length)[0] ||
      [...options].sort((a, b) => frames(a).length - frames(b).length)[0];
    const slots = frames(layout);
    const images: Record<string, any> = {};
    const hidden: string[] = [];
    for (const slot of slots) {
      const item = media[cursor];
      if (!item) { hidden.push(slot.id); continue; }
      images[slot.id] = { url: item.thumbnailUrl || item.url, scale: 1, offsetX: 0, offsetY: 0, rotation: 0,
        ...(item.type === 'video' ? { isVideo: true, videoUrl: item.url, mediaId: item.mediaId, duration: item.duration } : {}) };
      cursor++;
    }
    pages.push({ id: `batch-page-${pages.length}`, name: `${pages.length + 1}. ${layout.name || 'Sayfa'}`, templatePageId: layout.id,
      regions: structuredClone(layout.regions), fixedElements: structuredClone(layout.fixedElements || []),
      backgroundImageUrl: layout.backgroundImageUrl || template.backgroundImageUrl,
      dynamicImages: images, dynamicTexts: Object.fromEntries(layout.regions.filter(r => r.type === 'text').map(r => [r.id, r.placeholderText || ''])), hiddenElements: hidden });
  }
  return pages;
}

/** Successful pages remain intact when retrying only the failures. */
export async function generateBatchTexts(template: DesignTemplate, pages: any[], brief: string, options: {
  signal: AbortSignal; onProgress: (completed: number, total: number) => void; retryOnly?: boolean;
  request?: typeof requestAiText;
  prepareImage?: (source: string) => Promise<string | undefined>;
}) {
  const output: any[] = [];
  for (const [index, page] of pages.entries()) {
    if (options.signal.aborted) throw new Error('Üretim iptal edildi.');
    if (options.retryOnly && !page.productionError) { output.push(page); continue; }
    const context = getAiTextFields(page.regions, page.dynamicTexts);
    try {
      let image: string | undefined;
      const visualSource = Object.values(page.dynamicImages || {}).flatMap((item: any) => [item?.thumbnailUrl, item?.url])
        .find((source): source is string => typeof source === 'string' && /^(data:image\/|blob:|https?:\/\/)/i.test(source));
      if (visualSource && options.prepareImage) {
        try { image = await options.prepareImage(visualSource); } catch { /* Text generation can continue if one image fails. */ }
      }
      const texts = context.length ? await (options.request || requestAiText)({
        systemPrompt: template.aiSystemPrompt || '', templateName: template.name,
        brief: `${brief}\nBu fotoğraf grubunun ${index + 1}/${pages.length} sayfası için yaz.`, fields: context, context,
        ...(image ? {image} : {}),
      }, AbortSignal.any([options.signal, AbortSignal.timeout(60000)])) : {};
      output.push({ ...page, dynamicTexts: { ...page.dynamicTexts, ...texts }, productionError: undefined });
    } catch (error) {
      if (options.signal.aborted) throw error;
      output.push({ ...page, productionError: error instanceof Error ? error.message : 'Metin oluşturulamadı.' });
    }
    options.onProgress(index + 1, pages.length);
  }
  return output;
}
