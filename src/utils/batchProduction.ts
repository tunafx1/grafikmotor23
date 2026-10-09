import type { DesignTemplate, Region, SequenceMediaItem, TemplatePage } from '../types';
import { getAiTextFields, requestAiText } from './aiText';

/** Uploaded PNG layers stay part of the design; cloud sync turns their data URL into a Cloudinary URL. */
export const isStaticImageLayer = (r: Region) => r.type === 'image' && !!r.placeholderImage &&
  (r.placeholderImage.startsWith('data:') || r.placeholderImage.startsWith('https://res.cloudinary.com/'));

const frames = (page: TemplatePage) => page.regions.filter(r => r.type === 'image' && r.isDynamic !== false && !r.hidden && !isStaticImageLayer(r));

/**
 * A template can contain several distinct full-page designs, each with one
 * replaceable image. Those pages are a sequence, not interchangeable
 * single-image layout options: photo 1 belongs to page 1, photo 2 to page 2,
 * then the sequence repeats only when there are more uploads than designs.
 */
const isSequentialSingleImageTemplate = (layouts: TemplatePage[]) =>
  layouts.length > 1 && layouts.every(layout => frames(layout).length === 1);

/** Consume every selected photo exactly once, respecting actual frame capacity. */
export function buildBatchPages(template: DesignTemplate, media: SequenceMediaItem[]) {
  if (!media.length) throw new Error('Önce fotoğraflarınızı ekleyin.');
  const layouts = (template.pages?.length ? template.pages : [{ id: '1', name: 'Kapak', regions: template.regions, fixedElements: template.fixedElements, pageRole: 'cover' as const }]).filter(p => frames(p).length);
  if (!layouts.length) throw new Error('Bu şablonda fotoğraf yerleştirilecek alan yok. Başka bir şablon seçin.');
  const pages: any[] = [];
  let cursor = 0;

  const addPage = (layout: TemplatePage) => {
    const slots = frames(layout);
    const images: Record<string, any> = {};
    const hidden: string[] = [];
    for (const slot of slots) {
      const item = media[cursor];
      if (!item) { hidden.push(slot.id); continue; }
      images[slot.id] = {
        url: (item.type === 'image' ? (item.url || item.thumbnailUrl) : (item.thumbnailUrl || item.url)),
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        mediaId: item.mediaId,
        ...(item.type === 'video' ? { isVideo: true, videoUrl: item.url, duration: item.duration } : {})
      };
      cursor++;
    }
    // The filmstrip already shows the page number. Keeping it out of the page
    // name prevents labels such as "Sayfa 1 / 1. 2 Fotoğraflı Kolaj".
    pages.push({ id: `batch-page-${pages.length}`, name: layout.name || 'Tasarım', templatePageId: layout.id,
      regions: structuredClone(layout.regions), fixedElements: structuredClone(layout.fixedElements || []),
      backgroundImageUrl: layout.backgroundImageUrl || template.backgroundImageUrl,
      dynamicImages: images, dynamicTexts: Object.fromEntries(layout.regions.filter(r => r.type === 'text').map(r => [r.id, r.placeholderText || ''])), hiddenElements: hidden });
  };

  // Do not send every upload through the first design when the template is a
  // series of one-photo designs. This is what lets a two-page template show
  // photo 1 on page 1 and photo 2 on page 2.
  if (isSequentialSingleImageTemplate(layouts)) {
    while (cursor < media.length) {
      for (const layout of layouts) {
        if (cursor >= media.length) break;
        addPage(layout);
      }
    }
    return pages;
  }

  while (cursor < media.length) {
    const remaining = media.length - cursor;
    const cover = layouts.find(p => p.pageRole === 'cover');
    const candidates = layouts.filter(p => p !== cover);
    const options = candidates.length ? candidates : layouts;
    const layout = cursor === 0 ? cover || layouts[0] :
      [...options].filter(p => frames(p).length <= remaining).sort((a, b) => frames(b).length - frames(a).length)[0] ||
      [...options].sort((a, b) => frames(a).length - frames(b).length)[0];
    addPage(layout);
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
      }, AbortSignal.any([options.signal, AbortSignal.timeout(90000)])) : {};
      output.push({ ...page, dynamicTexts: { ...page.dynamicTexts, ...texts }, productionError: undefined });
    } catch (error) {
      if (options.signal.aborted) throw error;
      const rawMessage = error instanceof Error ? error.message : 'Metin oluşturulamadı.';
      const friendlyMessage = /timed?\s*out|aborted/i.test(rawMessage)
        ? 'Yapay zeka yanıt süresi aşıldı (zaman aşımı). Lütfen yeniden deneyin.'
        : rawMessage;
      output.push({ ...page, productionError: friendlyMessage });
    }
    options.onProgress(index + 1, pages.length);
  }
  return output;
}
