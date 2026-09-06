import type { Request, Response } from 'express';

export type TextField = {id: string; name: string; role: string; text: string};
export type TextRequest = {systemPrompt: string; templateName: string; brief: string; fields: TextField[]; context: TextField[]; image?: string};

export function parseTextRequest(body: unknown): TextRequest {
  const value = body as TextRequest;
  const validString = (v: unknown, limit: number) => typeof v === 'string' && v.length <= limit;
  const validFields = (v: unknown) => Array.isArray(v) && v.length <= 50 && v.every(f =>
    f && validString(f.id, 128) && f.id.trim() && validString(f.name, 256) && validString(f.role, 128) && validString(f.text, 12000));
  if (!value || !validString(value.systemPrompt, 20000) || !validString(value.templateName, 256) ||
      !validString(value.brief, 12000) || !validFields(value.fields) || !value.fields.length ||
      !validFields(value.context) || new Set(value.fields.map(f => f.id)).size !== value.fields.length ||
      (value.image !== undefined && (!validString(value.image, 2000000) || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value.image)))) {
    throw new Error('Metin isteği geçersiz. Alanları ve şablon promptunu kontrol edin.');
  }
  return value;
}

export function buildTextPrompt(input: TextRequest): string {
  return `Sosyal medya metin editörüsün. Yalnızca istenen alanlar için yeni metin üret.
Şablona ait aşağıdaki prompt; dil, konu, üslup, uzunluk ve biçim tercihlerinde önceliklidir.
ŞABLON PROMPTU:\n${input.systemPrompt.trim() || 'Türkçe, anlaşılır ve kısa metinler üret.'}
ŞABLON ADI: ${JSON.stringify(input.templateName)}
KULLANICI NOTU: ${JSON.stringify(input.brief)}
MEVCUT SAYFA BAĞLAMI (yeniden yazılacak alanlar dışındaki metinleri sadece bağlam olarak kullan):
${JSON.stringify(input.context)}
ÜRETİLECEK ALANLAR:
${JSON.stringify(input.fields)}
Her alanın adını ve rolünü dikkate al. Şablonda başka uzunluk belirtilmediyse başlık kısa, açıklama en fazla iki cümle olsun.
Şablon istemedikçe Markdown ekleme. Görsel varsa konuyu anlamak için kullan; doğrulanmamış fiyat, tarih, iletişim bilgisi veya iddia uydurma.
Sadece verilen alan kimlikleri için texts dizisi döndür: {"texts":[{"id":"alan kimliği","text":"üretilen metin"}]}.
Renk, yerleşim, başka alan veya açıklayıcı yorum döndürme.`;
}

export function validateTextResult(raw: unknown, fields: TextField[]): Record<string, string> {
  const texts = (raw as any)?.texts;
  if (!Array.isArray(texts) || texts.length !== fields.length) throw new Error('AI yanıtındaki metin alanları eksik. Tekrar deneyin.');
  const result: Record<string, string> = Object.create(null);
  for (const field of fields) {
    const matches = texts.filter(t => t?.id === field.id);
    if (matches.length !== 1 || typeof matches[0].text !== 'string' || !matches[0].text.trim() || matches[0].text.length > 12000) {
      throw new Error('AI geçerli bir metin üretmedi. Mevcut içerik korundu.');
    }
    result[field.id] = matches[0].text.trim();
  }
  return result;
}

export function createTextGenerationHandler(options: {hasKey: () => boolean; generate: (input: TextRequest) => Promise<unknown>}) {
  return async (req: Request, res: Response) => {
    let input: TextRequest;
    try { input = parseTextRequest(req.body); }
    catch (error) { return res.status(400).json({success:false, error:(error as Error).message}); }
    if (!options.hasKey()) return res.status(503).json({success:false, reason:'missing_api_key',
      error:'AI bağlantısı kurulmamış. Sunucudaki .env.local dosyasına GEMINI_API_KEY ekleyip sunucuyu yeniden başlatın. Metinleriniz değiştirilmedi.'});
    try {
      const texts = validateTextResult(await options.generate(input), input.fields);
      return res.json({success:true, texts});
    } catch (error: any) {
      const message = String(error?.message || error);
      const quota = /429|quota|Resource has been exhausted/i.test(message);
      const auth = /401|403|API.key|API_KEY_INVALID/i.test(message);
      return res.status(quota ? 429 : 502).json({success:false,
        reason:quota ? 'quota_exceeded' : auth ? 'invalid_api_key' : 'generation_failed',
        error:quota ? 'Gemini kullanım kotası dolu. Daha sonra tekrar deneyin; metinleriniz korundu.' :
          auth ? 'Gemini anahtarı geçersiz veya bu modele erişim izni yok. Sunucu ayarlarını kontrol edin.' :
          'AI metni oluşturamadı. Bağlantıyı ve model ayarını kontrol edip tekrar deneyin; mevcut metin korundu.'});
    }
  };
}
