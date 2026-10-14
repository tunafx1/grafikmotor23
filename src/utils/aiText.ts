import type { Region } from '../types';
import { auth } from '../lib/firebase';

export function getAiTextFields(regions: Pick<Region, 'id' | 'name' | 'type' | 'textRole' | 'aiPrompt' | 'placeholderText' | 'isDynamic' | 'hidden'>[], texts: Record<string, string>) {
  return regions.filter(r => r.type === 'text' && r.isDynamic !== false && !r.hidden).map(r => ({
    id:r.id,
    name:r.name || r.id,
    role:r.textRole || 'normal',
    prompt:r.aiPrompt?.trim() || '',
    text:texts[r.id] ?? r.placeholderText ?? '',
  }));
}

export async function requestAiText(payload: {fields:{id:string}[]; [key:string]:unknown}, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<Record<string,string>> {
  let token: string | undefined;
  try {
    if (typeof auth !== 'undefined' && auth?.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
  } catch { /* ignore in non-browser or test environments */ }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetcher('/api/generate-text', {
      method:'POST', headers, body:JSON.stringify(payload), signal,
    });
  } catch (err: any) {
    if (signal?.aborted || /timed?\s*out|aborted/i.test(err?.message || '')) {
      throw new Error('Yapay zeka yanıt süresi aşıldı (zaman aşımı). Lütfen yeniden deneyin.');
    }
    throw err;
  }
  let data: any;
  try { data = await response.json(); }
  catch {
    if (!response.ok) {
      throw new Error(`AI sunucusu yanıt vermedi (HTTP ${response.status}). Vercel ortam değişkenlerini ve sunucu loglarını kontrol edin.`);
    }
    throw new Error('AI sunucusu geçerli bir yanıt vermedi. Sunucuyu yeniden başlatıp tekrar deneyin.');
  }
  if (!response.ok || !data.success || data.isFallback) {
    if (response.status === 401 || data?.reason === 'auth_required' || data?.reason === 'invalid_auth_token') {
      throw new Error(data?.error || 'Yapay zeka özelliklerini kullanmak için lütfen oturum açın.');
    }
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
