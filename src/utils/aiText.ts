import type { Region } from '../types';

export function getAiTextFields(regions: Pick<Region, 'id' | 'name' | 'type' | 'textRole' | 'placeholderText' | 'isDynamic' | 'hidden'>[], texts: Record<string, string>) {
  return regions.filter(r => r.type === 'text' && r.isDynamic !== false && !r.hidden).map(r => ({
    id:r.id, name:r.name || r.id, role:r.textRole || 'text', text:texts[r.id] ?? r.placeholderText ?? '',
  }));
}

export async function requestAiText(payload: {fields:{id:string}[]; [key:string]:unknown}, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<Record<string,string>> {
  const response = await fetcher('/api/generate-text', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal,
  });
  let data: any;
  try { data = await response.json(); }
  catch {
    if (!response.ok) {
      throw new Error(`AI sunucusu yanıt vermedi (HTTP ${response.status}). Vercel ortam değişkenlerini ve sunucu loglarını kontrol edin.`);
    }
    throw new Error('AI sunucusu geçerli bir yanıt vermedi. Sunucuyu yeniden başlatıp tekrar deneyin.');
  }
  if (!response.ok || !data.success || data.isFallback) {
    throw new Error(data.error || 'AI metni üretemedi. Mevcut içerik korundu.');
  }
  const result: Record<string,string> = {};
  for (const field of payload.fields) {
    if (typeof data.texts?.[field.id] !== 'string' || !data.texts[field.id].trim()) {
      throw new Error('AI yanıtında istenen alan eksik. Mevcut içerik korundu.');
    }
    // Only requested IDs can reach editor state, even if the service returns extras.
    Object.defineProperty(result, field.id, {value:data.texts[field.id].trim(), enumerable:true});
  }
  return result;
}
