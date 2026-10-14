import express from 'express';
import path from 'path';
import { readFileSync } from 'fs';
import { extractVideoId as extractYouTubeVideoId, streamMedia } from '../downloader-service/media-stream.js';
import dotenv from 'dotenv';
import { createSignedMediaUpload, readCloudinaryConfig } from './cloudinary-upload.js';

let firebaseAppletConfig: any = {};
try {
  firebaseAppletConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
} catch {
  // Graceful fallback when running in serverless bundle without root JSON file
}
// Text generation types and helper functions (inlined for self-contained Vercel serverless execution)
export type TextField = {id: string; name: string; role: string; prompt?: string; text: string};
export type TextRequest = {systemPrompt: string; templateName: string; brief: string; fields: TextField[]; context: TextField[]; image?: string};

export function parseTextRequest(body: unknown): TextRequest {
  const value = body as TextRequest;
  const validString = (v: unknown, limit: number) => typeof v === 'string' && v.length <= limit;
  const validFields = (v: unknown) => Array.isArray(v) && v.length <= 50 && v.every(f =>
    f && validString(f.id, 128) && f.id.trim() && validString(f.name, 256) && validString(f.role, 128) &&
    (f.prompt === undefined || validString(f.prompt, 12000)) && validString(f.text, 12000));
  if (!value || !validString(value.systemPrompt, 20000) || !validString(value.templateName, 256) ||
      !validString(value.brief, 12000) || !validFields(value.fields) || !value.fields.length ||
      !validFields(value.context) || new Set(value.fields.map(f => f.id)).size !== value.fields.length ||
      (value.image !== undefined && (!validString(value.image, 2500000) || !/^data:image\/(jpeg|png|webp|gif);base64,/i.test(value.image.trim())))) {
    throw new Error('Metin isteği geçersiz. Alanları ve şablon promptunu kontrol edin.');
  }
  return value;
}

export function buildTextPrompt(input: TextRequest): string {
  const fieldsTemplate = input.fields.map(f => `{"id": ${JSON.stringify(f.id)}, "text": "..."}`).join(', ');
  return `Sosyal medya metin editörüsün. Yalnızca istenen alanlar için yeni metin üret.
Şablona ait aşağıdaki prompt; dil, konu, üslup, uzunluk ve biçim tercihlerinde önceliklidir.
ŞABLON PROMPTU:\n${input.systemPrompt.trim() || 'Türkçe, anlaşılır ve kısa metinler üret.'}
ŞABLON ADI: ${JSON.stringify(input.templateName)}
KULLANICI NOTU: ${JSON.stringify(input.brief)}
MEVCUT SAYFA BAĞLAMI (yeniden yazılacak alanlar dışındaki metinleri sadece bağlam olarak kullan):
${JSON.stringify(input.context)}
ÜRETİLECEK ALANLAR:
${JSON.stringify(input.fields)}
Her alanın adını ve rolünü dikkate al. Bir alanın prompt değeri doluysa, yalnızca o alanı üretirken bu özel talimatı genel şablon promptundan daha öncelikli uygula.
Şablonda veya alan promptunda başka uzunluk belirtilmediyse başlık kısa, alt başlık tek satır, açıklama en fazla iki cümle olsun. callToAction kısa ve eylem odaklı; label, date ve price kendi veri türlerine uygun olmalıdır.
Şablon istemedikçe Markdown ekleme. Görsel varsa konuyu anlamak için kullan; doğrulanmamış fiyat, tarih, iletişim bilgisi veya iddia uydurma.
Sadece verilen alan kimlikleri için texts dizisi döndür: {"texts":[${fieldsTemplate}]}.
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

export function collectValidTextResult(raw: unknown, fields: TextField[]): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  if (!raw || typeof raw !== 'object' || !fields.length) return result;

  const rawObj = raw as Record<string, any>;
  let itemsArray: any[] | null = null;
  let dictionary: Record<string, any> | null = null;

  if (Array.isArray(raw)) {
    itemsArray = raw;
  } else if (Array.isArray(rawObj.texts)) {
    itemsArray = rawObj.texts;
  } else if (Array.isArray(rawObj.items)) {
    itemsArray = rawObj.items;
  } else if (rawObj.texts && typeof rawObj.texts === 'object') {
    dictionary = rawObj.texts;
  } else {
    dictionary = rawObj;
  }

  // 1. Match from array of items
  if (itemsArray && itemsArray.length) {
    for (const field of fields) {
      const fieldIdNorm = field.id.trim().toLowerCase();
      const fieldNameNorm = (field.name || '').trim().toLowerCase();
      const fieldRoleNorm = (field.role || '').trim().toLowerCase();

      // Find match by exact id
      const exactMatches = itemsArray.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemId = String(item.id || item.fieldId || '').trim().toLowerCase();
        return itemId === fieldIdNorm;
      });

      if (exactMatches.length === 1 && typeof exactMatches[0].text === 'string' && exactMatches[0].text.trim() && exactMatches[0].text.length <= 12000) {
        result[field.id] = exactMatches[0].text.trim();
        continue;
      }

      // Fallback by name or role if unique
      const nameMatches = itemsArray.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemId = String(item.id || item.name || item.role || '').trim().toLowerCase();
        return (fieldNameNorm && itemId === fieldNameNorm) || (fieldRoleNorm && itemId === fieldRoleNorm);
      });
      if (nameMatches.length === 1 && typeof nameMatches[0].text === 'string' && nameMatches[0].text.trim() && nameMatches[0].text.length <= 12000) {
        result[field.id] = nameMatches[0].text.trim();
      }
    }

    // Positional fallback when count matches and fields > 1
    if (fields.length > 1 && itemsArray.length === fields.length && itemsArray.every(item => typeof (item?.text ?? item?.value ?? item) === 'string' && String(item?.text ?? item?.value ?? item).trim())) {
      fields.forEach((field, index) => {
        if (!result[field.id]) {
          const item = itemsArray![index];
          const val = typeof item === 'string' ? item : String(item?.text ?? item?.value ?? item);
          if (val && val.trim() && val.length <= 12000) {
            result[field.id] = val.trim();
          }
        }
      });
    }
  }

  // 2. Match from dictionary keys
  if (dictionary && !itemsArray) {
    for (const field of fields) {
      if (result[field.id]) continue;

      const fieldIdNorm = field.id.trim().toLowerCase();
      const fieldNameNorm = (field.name || '').trim().toLowerCase();
      const fieldRoleNorm = (field.role || '').trim().toLowerCase();

      for (const [key, val] of Object.entries(dictionary)) {
        const keyNorm = key.trim().toLowerCase();
        if (keyNorm === fieldIdNorm || (fieldNameNorm && keyNorm === fieldNameNorm) || (fieldRoleNorm && keyNorm === fieldRoleNorm)) {
          const str = typeof val === 'string' ? val : (typeof (val as any)?.text === 'string' ? (val as any).text : null);
          if (typeof str === 'string' && str.trim() && str.length <= 12000) {
            result[field.id] = str.trim();
            break;
          }
        }
      }
    }
  }

  return result;
}

function parseAiJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(trimmed); }
  catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try { return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)); } catch { /* try brackets */ }
    }
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      try { return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1)); } catch { /* ignore */ }
    }
    throw new Error('AI yanıtı geçerli JSON biçiminde değil.');
  }
}

export function createTextGenerationHandler(options: {
  hasKey: () => boolean;
  generate: (input: TextRequest) => Promise<unknown>;
  authenticate?: (req: express.Request) => Promise<string | null>;
}) {
  return async (req: express.Request, res: express.Response) => {
    let input: TextRequest;
    try { input = parseTextRequest(req.body); }
    catch (error) { return res.status(400).json({success:false, error:(error as Error).message}); }
    if (!options.hasKey()) return res.status(503).json({success:false, reason:'missing_api_key',
      error:'AI bağlantısı kurulmamış. Sunucudaki EVREN_API_KEY ayarını kontrol edip sunucuyu yeniden başlatın. Metinleriniz değiştirilmedi.'});
    if (options.authenticate) {
      const userId = await options.authenticate(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          reason: 'auth_required',
          error: 'Yapay zeka özelliklerini kullanmak için lütfen oturum açın.'
        });
      }
    }
    try {
      const texts: Record<string, string> = Object.create(null);
      let pendingFields = input.fields;
      for (let attempt = 0; attempt < 5 && pendingFields.length; attempt++) {
        const raw = await options.generate({...input, fields: pendingFields});
        Object.assign(texts, collectValidTextResult(raw, pendingFields));
        pendingFields = pendingFields.filter(field => !texts[field.id]);
      }
      if (pendingFields.length) throw new Error(`AI yanıtında ${pendingFields.length} metin alanı eksik kaldı.`);
      return res.json({success:true, texts});
    } catch (error: any) {
      const message = String(error?.message || error);
      console.error('generate-text failed:', error?.status, message.slice(0, 500));
      const quota = /429|quota|Resource has been exhausted/i.test(message);
      const auth = /401|403|API.key|API_KEY_INVALID/i.test(message);
      const model = error?.status === 404 || /404|NOT_FOUND|is not found|model/i.test(message);
      const incomplete = /metin alanı eksik|metin alanları eksik|geçerli bir metin/i.test(message);
      return res.status(quota ? 429 : 502).json({success:false,
        reason:quota ? 'quota_exceeded' : auth ? 'invalid_api_key' : model ? 'model_not_found' : 'generation_failed',
        error:quota ? 'Evren kullanım kotası dolu. Daha sonra tekrar deneyin; metinleriniz korundu.' :
          auth ? 'Evren API anahtarı geçersiz veya bu modele erişim izni yok. Sunucu ayarlarını kontrol edin.' :
          model ? 'Sunucudaki Evren model adı bulunamadı. EVREN_MODEL ayarını kontrol edin; mevcut metin korundu.' :
          incomplete ? 'AI bazı metin kutularını boş bıraktı. Eksik alanlar otomatik olarak denendi; mevcut metinler korundu.' :
          'AI metni oluşturamadı. Bağlantıyı ve model ayarını kontrol edip tekrar deneyin; mevcut metin korundu.'});
    }
  };
}


// Automatically load .env.local first, then .env in local/node environment
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config();
}

// Evren exposes an OpenAI-compatible chat-completions API. Keep the provider
// configuration server-side so its key is never sent to the browser.
const EVREN_API_URL = process.env.EVREN_API_URL?.trim() || process.env.EVREN_LLM_BASE_URL?.trim() || 'https://evren-llmapi.ssyz.org.tr/v1/chat/completions';
const EVREN_MODELS = [
  process.env.EVREN_MODEL?.trim() || process.env.EVREN_LLM_MODEL?.trim() || 'deepseek-v4-flash',
  'gemma-4-31b',
  'qwen3.8-flash-next',
];

function getEvrenKey(): string | null {
  const key = (process.env.EVREN_API_KEY || process.env.EVREN_LLM_API_KEY)?.trim();
  return key && key !== 'MY_EVREN_API_KEY' ? key : null;
}

function getGeminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key !== 'MY_GEMINI_API_KEY' ? key : null;
}

function hasAiProvider(): boolean {
  return Boolean(getEvrenKey() || getGeminiKey());
}

async function generateGeminiContent(
  key: string,
  prompt: string,
  imageInput?: { mimeType: string; data: string } | Array<{ mimeType: string; data: string }>
): Promise<{ text: string }> {
  const parts: any[] = [];
  if (Array.isArray(imageInput)) {
    for (const img of imageInput) {
      if (img?.mimeType && img?.data) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          }
        });
      }
    }
  } else if (imageInput?.mimeType && imageInput?.data) {
    parts.push({
      inlineData: {
        mimeType: imageInput.mimeType,
        data: imageInput.data,
      }
    });
  }
  parts.push({ text: prompt });

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Gemini isteği ${res.status} durumuyla başarısız oldu: ${errorText.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content === 'string' && content.trim()) {
    return { text: content.trim() };
  }
  throw new Error('Gemini geçerli bir metin yanıtı döndürmedi.');
}

class EvrenApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

function extractEvrenText(payload: any): string {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) return content.trim();
  throw new EvrenApiError('Evren geçerli bir metin yanıtı döndürmedi.');
}

async function generateContentWithRetry(_key: string, params: any, attempt = 1, modelIndex = 0): Promise<{text: string}> {
  const model = EVREN_MODELS[modelIndex] || EVREN_MODELS[0];
  const messages: Array<{role: 'system' | 'user'; content: string}> = [];
  if (params.config?.systemInstruction) messages.push({role:'system', content:String(params.config.systemInstruction)});
  const contents = Array.isArray(params.contents) ? params.contents : [];
  const text = contents.map((part: any) => part?.text).filter((part: unknown): part is string => typeof part === 'string').join('\n');
  if (contents.some((part: any) => part?.inlineData)) {
    messages.push({role:'system', content:'Görsel içerik bağlamı dikkate alınarak metin üretilmelidir.'});
  }
  messages.push({role:'user', content:`${text}\n\nYanıtı yalnızca geçerli JSON olarak döndür; Markdown kod bloğu ve açıklama ekleme.`});

  try {
    const response = await fetch(EVREN_API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'X-API-Key': _key},
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(35_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload?.error?.message === 'string' ? payload.error.message : `Evren isteği ${response.status} durumuyla başarısız oldu.`;
      throw new EvrenApiError(message, response.status);
    }
    return {text: extractEvrenText(payload)};
  } catch (error: any) {
    console.warn(`Evren model ${model} attempt ${attempt} failed:`, error?.message || error);
    // If fallback model available in list, try next model
    if (modelIndex + 1 < EVREN_MODELS.length) {
      return generateContentWithRetry(_key, params, 1, modelIndex + 1);
    }
    const retryable = error?.status === 429 || error?.status === 503 || error?.name === 'TimeoutError' || error?.name === 'AbortError';
    if (retryable && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateContentWithRetry(_key, params, attempt + 1, 0);
    }
    throw error;
  }
}

// Color and Text validation helpers
function isValidHexOrRgbaColor(color: any): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim();
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed) ||
         /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/.test(trimmed);
}

function sanitizeAiText(text: any): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim();
}

const app = express();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Normalize endpoint prefixes while preserving query parameters (video streams need them).
app.use((req, _res, next) => {
  const endpoint = req.path.match(/(?:^|\/)(generate-text|generate-content|analyze-collage|media-upload-signature|yt-info|yt-download|yt-stream)\/?$/i)?.[1];
  if (endpoint) {
    const queryIndex = req.url.indexOf('?');
    req.url = `/api/${endpoint.toLowerCase()}${queryIndex >= 0 ? req.url.slice(queryIndex) : ''}`;
  }
  next();
});

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || firebaseAppletConfig.apiKey;

const authTokenCache = new Map<string, { userId: string; expiresAt: number }>();

async function getFirebaseUserId(authorization: string | undefined): Promise<string | null> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;

  const cached = authTokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.userId;
  }

  if (!FIREBASE_WEB_API_KEY) return null;

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({idToken:token}),
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const data = await response.json() as {users?: Array<{localId?: string}>};
    const userId = data.users?.[0]?.localId || null;
    if (userId) {
      authTokenCache.set(token, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });
      if (authTokenCache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of authTokenCache.entries()) {
          if (v.expiresAt <= now) authTokenCache.delete(k);
        }
      }
    }
    return userId;
  } catch (err) {
    console.warn('Firebase token verification failed:', err);
    return null;
  }
}

app.post(['/api/generate-text', '/generate-text'], createTextGenerationHandler({
  hasKey: () => hasAiProvider(),
  authenticate: req => getFirebaseUserId(req.get('authorization')),
  generate: async input => {
    const prompt = buildTextPrompt(input);
    let imagePart: { mimeType: string; data: string } | undefined;
    if (input.image) {
      const [header, data] = input.image.split(',');
      imagePart = { mimeType: header.slice(5, header.indexOf(';')), data };
    }

    const evrenKey = getEvrenKey();
    if (evrenKey) {
      try {
        const contents: any[] = [{ text: prompt }];
        if (imagePart) contents.unshift({ inlineData: imagePart });
        const response = await generateContentWithRetry(evrenKey, { contents });
        return parseAiJson(response.text || '{}');
      } catch (evrenErr: any) {
        console.warn('Evren provider failed, falling back to Gemini:', evrenErr?.message || evrenErr);
        if (!getGeminiKey()) throw evrenErr;
      }
    }

    const geminiKey = getGeminiKey();
    if (geminiKey) {
      const response = await generateGeminiContent(geminiKey, prompt, imagePart);
      return parseAiJson(response.text || '{}');
    }

    throw new Error('Hiçbir AI sağlayıcısı yapılandırılmamış.');
  },
}));

app.post(['/api/media-upload-signature', '/media-upload-signature'], async (req, res) => {
  const config = readCloudinaryConfig();
  if (!config) return res.status(503).json({success:false, reason:'media_not_configured', error:'Cloudinary medya yedeklemesi henüz yapılandırılmamış.'});
  const kind = req.body?.kind;
  const contentHash = req.body?.contentHash;
  if ((kind !== 'image' && kind !== 'video') || typeof contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(contentHash)) {
    return res.status(400).json({success:false, reason:'invalid_media_request', error:'Medya yükleme isteği geçersiz.'});
  }
  try {
    const userId = await getFirebaseUserId(req.get('authorization'));
    if (!userId) return res.status(401).json({success:false, reason:'media_auth_required', error:'Medya yedeklemesi için geçerli bir kullanıcı oturumu gerekiyor.'});
    return res.json({success:true, ...createSignedMediaUpload(config, {userId, kind, contentHash})});
  } catch (error) {
    console.error('Media signature failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({success:false, reason:'media_signature_failed', error:'Medya yükleme bağlantısı hazırlanamadı.'});
  }
});

// Legacy endpoints retained for existing clients. The editor uses generate-text.
const fallbackResponses: Record<string, any> = {
  fashion: {
    title: "**Yeni Sezon** Zamansız Dokunuşlar",
    subtitle: "PREMIUM KOLEKSİYON",
    description: "En özel pamuk iplikleriyle işlenen, *şık ve sürdürülebilir* parçalar şimdi mağazada yerini aldı.",
    primaryColor: "#FF453A", // Warm Terracotta
    accentColor: "#FF9F0A",  // Sand Gold
    textColor: "rgba(255,255,255,0.95)",    // Stone 900
    bgColor: "#1D1D1F"       // Soft Cream
  },
  tech: {
    title: "**Yapay Zeka** ile Sınırları Aşın",
    subtitle: "YENİ NESİL OTOMASYON",
    description: "Geleceğin algoritma mimarileri ve *büyük dil modelleri* ile iş akışlarınızı otomatikleştirin.",
    primaryColor: "#FF6B1A", // Motor Orange
    accentColor: "#FFA26B",  // Soft Amber Glow
    textColor: "rgba(255,255,255,0.95)",    // Light Gray
    bgColor: "#1D1D1F"       // Deep Dark Space
  },
  food: {
    title: "Tazelikten Gelen **Gurme** Lezzet",
    subtitle: "ORGANİK & DOĞAL",
    description: "Organik bahçelerden toplanan malzemelerle, *şeflerimizin elinden* çıkan unutulmaz bir deneyim.",
    primaryColor: "#34C759", // Forest Green
    accentColor: "#FF453A",  // Fresh Orange
    textColor: "rgba(255,255,255,0.95)",    // Stone 950
    bgColor: "#1D1D1F"       // Warm white
  },
  education: {
    title: "Geleceğinizi **Kodlayarak** Şekillendirin",
    subtitle: "UZMAN EĞİTMENLER",
    description: "Birebir mentorluk ve *pratik projelerle* sıfırdan ileri seviyeye yazılım mühendisliği eğitimi.",
    primaryColor: "#FF6B1A", // Motor Orange
    accentColor: "#34C759",  // Emerald
    textColor: "rgba(255,255,255,0.95)",    // Slate 900
    bgColor: "#1D1D1F"       // Slate 50
  },
  minimalist: {
    title: "Az Çoktur: **Yalın** Estetik",
    subtitle: "ZAMANSIZ DİZAYN",
    description: "Gürültüden arınmış, *sadeliğin ve dengenin* ön planda olduğu tasarım yolculuğu.",
    primaryColor: "#1D1D1F", // Obsidian Black
    accentColor: "rgba(255,255,255,0.72)",  // Muted Gray
    textColor: "#252528",    // Deep Charcoal
    bgColor: "#1D1D1F"       // Clean White
  }
};

// API Route: AI Powered content & palette generator with Template AI Prompt integration
app.post(['/api/generate-content', '/generate-content'], async (req, res) => {
  const userId = await getFirebaseUserId(req.get('authorization'));
  if (!userId) {
    return res.status(401).json({
      success: false,
      reason: 'auth_required',
      error: 'Yapay zeka özelliklerini kullanmak için lütfen oturum açın.'
    });
  }

  const { niche, styleType, systemPrompt, templateName, targetBrief, image } = req.body;
  
  const nicheText = niche || 'Genel Girişim';
  const styleDescription = styleType || 'modern ve minimalist';
  const selectedFallback = fallbackResponses[styleType] || fallbackResponses.minimalist;

  if (!hasAiProvider()) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.warn('[AI Notice] AI API key is not configured. Returning predefined fallback with reason.');
    }
    return res.json({ 
      success: true, 
      isFallback: true,
      reason: 'missing_api_key',
      message: 'Yapay zeka anahtarı tanımlanmamış. Varsayılan şablon yüklendi.',
      ...selectedFallback
    });
  }

  try {
    let imagePart: any = null;
    if (image && typeof image === 'string' && image.trim() !== '') {
      const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        imagePart = {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }
    }

    const prompt = `Sen profesyonel bir pazarlama metin yazarı, marka stratejisti ve görsel grafik tasarım uzmanısın.
${imagePart ? 'Gönderilen görseli görsel zeka (multimodal vision) ile dikkatle analiz et. Görselin konusunu, nesnelerini, rengini ve uyandırdığı duyguyu algıla.' : 'Kullanıcının seçtiği şablon için yüksek dönüşüm sağlayan içerikler üret.'}
Kullanıcı için yüksek dönüşüm sağlayan bir başlık (title), alt başlık / rozet / slogan (subtitle), detaylı açıklama (description) ve tasarım renk paleti (primaryColor, accentColor, textColor, bgColor) üret.

KULLANICI VE ŞABLON BİLGİLERİ:
- Sektör / Niş: "${nicheText}"
- Şablon Tarzı: "${styleDescription}"
${templateName ? `- Şablon Adı: "${templateName}"` : ''}
${targetBrief && targetBrief.trim() !== '' ? `- Kullanıcının Özel Notu / Talebi: "${targetBrief.trim()}"` : ''}

${systemPrompt && systemPrompt.trim() !== '' ? `
================================================================================
KRİTİK — ŞABLONUN KURUMSAL DİL / AI PROMPT KURALLARI:
Aşağıdaki kurallara KESİNLİKLE VE ÖNCELİKLE UYULMALIDIR. Bu şablona özel kurallar genel kurallardan daha üstündür:
"""
${systemPrompt.trim()}
"""
================================================================================
` : ''}

METİN VE BİÇİMLENDİRME KURALLARI:
1. Başlık (title): ${imagePart ? 'Görselin temasını yansıtan, dikkat çekici ve vurucu olmalı.' : 'Dikkat çekici, vurucu olmalı.'} Başlıkta en can alıcı 1-2 kelimeyi vurgulamak için **kalın** formatta (**kelime**) yaz.
2. Alt Başlık / Rozet (subtitle): Şablonun etiket, kategori, rozet veya slogan alanına uygun, kısa ve çarpıcı bir ifade üret (3-5 kelime). İsteğe bağlı bazı kelimeleri *eğik* (*kelime*) yazabilirsin.
3. Açıklama (description): Başlığı ve görseli tamamlayan, ikna edici açıklama metni. Can alıcı yerleri *eğik* (*kelime*) formatta yaz. Maksimum 2 cümle olsun.
4. Renk Paleti: ${imagePart ? 'Görselin ana renklerine ve' : ''} seçilen tarza, sektöre ve kurumsal dile tam uyumlu 4 adet geçerli Hex renk kodu (#HEX) belirle.

Yanıtı kesinlikle şu JSON şemasında ver:
{
  "title": "string (başlık, en önemli kelimeler **kalın** olmalı)",
  "subtitle": "string (alt başlık, rozet veya kısa slogan)",
  "description": "string (açıklama metni, bazı kelimeler *eğik* olmalı)",
  "primaryColor": "string (Hex rengi, örn: #FF6B1A)",
  "accentColor": "string (Hex rengi, örn: #FFA26B)",
  "textColor": "string (Hex rengi, örn: rgba(255,255,255,0.95))",
  "bgColor": "string (Hex rengi, örn: #1D1D1F)"
}`;

    const contents: any[] = [];
    if (imagePart) {
      contents.push(imagePart);
    }
    contents.push({ text: prompt });

    let response: { text: string };
    const evrenKey = getEvrenKey();
    if (evrenKey) {
      try {
        response = await generateContentWithRetry(evrenKey, { contents });
      } catch (evrenErr) {
        console.warn('Evren failed in generate-content, falling back to Gemini:', evrenErr);
        if (!getGeminiKey()) throw evrenErr;
        response = await generateGeminiContent(getGeminiKey()!, prompt, imagePart?.inlineData);
      }
    } else {
      response = await generateGeminiContent(getGeminiKey()!, prompt, imagePart?.inlineData);
    }

    let rawData: any = {};
    try {
      rawData = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Evren response was not valid JSON:', response.text);
      return res.json({
        success: true,
        isFallback: true,
        reason: 'invalid_json',
        error: 'Model çıktısı JSON formatında çözümlenemedi.',
        ...selectedFallback
      });
    }

    // Validate fields and ensure valid color formats
    const validatedData = {
      title: sanitizeAiText(rawData.title) || selectedFallback.title,
      subtitle: sanitizeAiText(rawData.subtitle) || selectedFallback.subtitle || '',
      description: sanitizeAiText(rawData.description) || selectedFallback.description,
      primaryColor: isValidHexOrRgbaColor(rawData.primaryColor) ? rawData.primaryColor.trim() : selectedFallback.primaryColor,
      accentColor: isValidHexOrRgbaColor(rawData.accentColor) ? rawData.accentColor.trim() : selectedFallback.accentColor,
      textColor: isValidHexOrRgbaColor(rawData.textColor) ? rawData.textColor.trim() : selectedFallback.textColor,
      bgColor: isValidHexOrRgbaColor(rawData.bgColor) ? rawData.bgColor.trim() : selectedFallback.bgColor
    };

    return res.json({
      success: true,
      isFallback: false,
      ...validatedData
    });

  } catch (err: any) {
    console.error('Error contacting Evren API:', err?.message || err);
    const errMsg = err?.message || String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Resource has been exhausted');
    const isAuth = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID');
    const reason = isQuota ? 'quota_exceeded' : (isAuth ? 'invalid_api_key' : 'evren_error');

    return res.json({
      success: true,
      isFallback: true,
      reason,
      error: errMsg,
      ...selectedFallback
    });
  }
});

// API Route: AI Powered Image Analysis & Collage Auto-Generator
app.post(['/api/analyze-collage', '/analyze-collage'], async (req, res) => {
  const userId = await getFirebaseUserId(req.get('authorization'));
  if (!userId) {
    return res.status(401).json({
      success: false,
      reason: 'auth_required',
      error: 'Yapay zeka özelliklerini kullanmak için lütfen oturum açın.'
    });
  }

  const { images, systemPrompt, userPrompt, templateName } = req.body;

  const topic = userPrompt && userPrompt.trim() !== '' ? userPrompt.trim() : 'Özel Tasarım';
  const defaultCollageFallback = {
    title: `**${topic.toUpperCase()}** Koleksiyonu`,
    subtitle: `*${topic}* Özel Konsepti`,
    description: `${topic} ile ilgili *en yeni tasarımlar*, trendler ve sürpriz fırsatlar sizleri bekliyor.`,
    primaryColor: "#FF6B1A",
    accentColor: "#FFA26B",
    textColor: "rgba(255,255,255,0.95)",
    bgColor: "#1D1D1F"
  };

  if (!hasAiProvider()) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.warn('[AI Notice] No AI provider key (EVREN_API_KEY or GEMINI_API_KEY) is configured. Returning collage fallback.');
    }
    return res.json({
      success: true,
      isFallback: true,
      reason: 'missing_api_key',
      message: 'AI API anahtarı tanımlanmamış. Varsayılan kolaj şablonu yüklendi.',
      ...defaultCollageFallback
    });
  }

  try {
    // Process images for visual understanding if available (supports up to 3 images for multimodal context)
    const imageParts: any[] = [];
    if (images && Array.isArray(images)) {
      for (const imgItem of images.slice(0, 3)) {
        if (typeof imgItem === 'string' && imgItem.trim() !== '') {
          const match = imgItem.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            imageParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
      }
    }
    const hasImage = imageParts.length > 0;

    const systemInstruction = `Sen profesyonel bir sosyal medya yöneticisi, marka stratejisti ve grafik tasarımcısın.
${hasImage ? 'Gönderilen görsel(ler)i görsel zeka (multimodal vision) ile analiz et. Görsellerin konusunu, nesnelerini, renklerini, hissettirdiği duyguyu ve tarzı algıla.' : 'Kullanıcının briefi ve şablon kurumsal diline dayanarak en etkileyici sosyal medya içeriğini oluştur.'}
Bu doğrultuda, hem Kapak Sayfası (Cover Page) için yüksek etkileşimli bir başlık (title) ve alt başlık / rozet (subtitle) hem de detaylı ve açıklayıcı bir metin (description) oluştur.

================================================================================
KRİTİK — ŞABLONUN KURUMSAL DİL / BRAND PROMPT KURALLARI:
Aşağıdaki kurallara KESİNLİKLE VE ÖNCELİKLE UYULMALIDIR. Bu kurallar genel yönergelerden daha üstündür:
"""
${systemPrompt || 'Profesyonel, samimi ve ikna edici bir ton kullan.'}
"""
================================================================================

KULLANICININ BU TASARIM İÇİN ÖZEL NOTLARI / KISACA BAHSET:
${userPrompt || 'İçeriği doğrudan yansıtacak yaratıcı bir yaklaşım benimse.'}
${templateName ? `Şablon Adı: "${templateName}"` : ''}

Metin kuralları:
1. Başlıkta (title): ${hasImage ? 'Görsel(ler)in temasını doğrudan yansıtan,' : ''} en can alıcı 1-2 kelimeyi vurgulamak için **kalın** formatta (**kelime**) yaz. Maksimum 6-8 kelime olsun.
2. Alt başlıkta (subtitle) rozet veya slogan niteliğinde kısa ve çarpıcı bir ifade yaz (bazı kelimeleri *eğik* yazabilirsin, maksimum 4-5 kelime).
3. Açıklamada (description) bazı kelimeleri *eğik* formatta (*kelime*) yaz. Başlıktan daha detaylı olsun, maksimum 2 cümle olsun.
4. Görsele ve kurumsal renklere en çok uyum sağlayacak 4 renkli estetik bir palet (primaryColor, accentColor, textColor, bgColor) öner.`;

    const collagePrompt = `${systemInstruction}\n\n${hasImage ? 'Görsel(ler)i analiz et, ' : ''}kurumsal dil kurallarına ve kullanıcı notlarına tam olarak uyarak şu JSON formatında yanıt dön:
{
  "title": "string (Kapak başlığı, en önemli kelimeler **kalın** olmalı)",
  "subtitle": "string (Kapak alt başlığı / rozet, bazı kelimeler *eğik* olmalı)",
  "description": "string (Açıklama metni, detaylı, bazı kelimeler *eğik* olmalı)",
  "primaryColor": "string (Hex renk kodu)",
  "accentColor": "string (Hex renk kodu)",
  "textColor": "string (Hex renk kodu)",
  "bgColor": "string (Hex renk kodu)"
}`;

    const contents: any[] = [...imageParts];
    contents.push({ text: collagePrompt });

    let response: { text: string };
    const evrenKey = getEvrenKey();
    if (evrenKey) {
      try {
        response = await generateContentWithRetry(evrenKey, { contents, config: { systemInstruction } });
      } catch (evrenErr) {
        console.warn('Evren failed in analyze-collage, falling back to Gemini:', evrenErr);
        if (!getGeminiKey()) throw evrenErr;
        const geminiImages = imageParts.map(p => ({
          mimeType: p.inlineData.mimeType,
          data: p.inlineData.data
        }));
        response = await generateGeminiContent(getGeminiKey()!, collagePrompt, geminiImages);
      }
    } else {
      const geminiImages = imageParts.map(p => ({
        mimeType: p.inlineData.mimeType,
        data: p.inlineData.data
      }));
      response = await generateGeminiContent(getGeminiKey()!, collagePrompt, geminiImages);
    }

    let rawData: any = {};
    try {
      rawData = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Collage Evren response was not valid JSON:', response.text);
      return res.json({
        success: true,
        isFallback: true,
        reason: 'invalid_json',
        error: 'Model çıktısı JSON formatında çözümlenemedi.',
        ...defaultCollageFallback
      });
    }

    const validatedData = {
      title: sanitizeAiText(rawData.title) || defaultCollageFallback.title,
      subtitle: sanitizeAiText(rawData.subtitle) || defaultCollageFallback.subtitle,
      description: sanitizeAiText(rawData.description) || defaultCollageFallback.description,
      primaryColor: isValidHexOrRgbaColor(rawData.primaryColor) ? rawData.primaryColor.trim() : defaultCollageFallback.primaryColor,
      accentColor: isValidHexOrRgbaColor(rawData.accentColor) ? rawData.accentColor.trim() : defaultCollageFallback.accentColor,
      textColor: isValidHexOrRgbaColor(rawData.textColor) ? rawData.textColor.trim() : defaultCollageFallback.textColor,
      bgColor: isValidHexOrRgbaColor(rawData.bgColor) ? rawData.bgColor.trim() : defaultCollageFallback.bgColor
    };

    return res.json({
      success: true,
      isFallback: false,
      ...validatedData
    });

  } catch (err: any) {
    console.error('Error analyzing image with Evren:', err?.message || err);
    const errMsg = err?.message || String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Resource has been exhausted');
    const isAuth = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID');
    const reason = isQuota ? 'quota_exceeded' : (isAuth ? 'invalid_api_key' : 'evren_error');

    return res.json({
      success: true,
      isFallback: true,
      reason,
      error: errMsg,
      title: `**${topic.toUpperCase()}** Fırsatları & Rotaları`,
      subtitle: `*${topic}* Özel Konsepti`,
      description: `${topic} ile ilgili *en popüler detaylar*, özel sürprizler ve güncel içerikler sizleri bekliyor.`,
      primaryColor: "#FF6B1A",
      accentColor: "#FFA26B",
      textColor: "rgba(255,255,255,0.95)",
      bgColor: "#1D1D1F"
    });
  }
});

// API Route: YouTube Video Info (oEmbed)
app.post(['/api/yt-info', '/yt-info'], async (req, res) => {
  try {
    const { url } = req.body;
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'Geçersiz YouTube URL adresi.' });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'Video bilgileri alınamadı. Video gizli veya mevcut değil.' });
    }

    const data = await response.json();
    return res.json({
      success: true,
      videoId,
      title: data.title,
      author: data.author_name,
      authorUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      maxThumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    });
  } catch (err: any) {
    console.error('Error in /api/yt-info:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası: ' + err.message });
  }
});

// API Route: YouTube Direct Media Stream (yt-dlp Native Streaming)
app.get(['/api/yt-stream', '/yt-stream'], async (req, res) => {
  try {
    const url = req.query.url as string;
    const format = (req.query.format === 'mp3' || req.query.format === 'audio') ? 'mp3' : 'mp4';
    const customTitle = (req.query.title as string) || 'youtube-media';
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      return res.status(400).send('Geçersiz YouTube video adresi.');
    }

    // Check if external dedicated microservice URL is configured
    const microserviceUrl = process.env.DOWNLOADER_SERVICE_URL;
    if (microserviceUrl) {
      const targetUrl = `${microserviceUrl.replace(/\/$/, '')}/download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=${format}&title=${encodeURIComponent(customTitle)}`;
      return res.redirect(targetUrl);
    }

    // Check if running on Vercel serverless environment without configured microservice
    if (process.env.VERCEL) {
      return res.status(503).json({
        success: false,
        error: 'Vercel serverless ortamında YouTube indirme işlemi için harici mikroservis (DOWNLOADER_SERVICE_URL) gereklidir. Lütfen downloader-service servisini deploy edip URL\'sini ekleyin.'
      });
    }

    streamMedia(res, videoId, format, customTitle);

  } catch (err: any) {
    console.error('Error in /api/yt-stream:', err);
    if (!res.headersSent) {
      res.status(500).send('İndirme hatası: ' + err.message);
    }
  }
});

// API Route: YouTube Downloader (Full HD MP4 & MP3 Native Download)
app.post(['/api/yt-download', '/yt-download'], async (req, res) => {
  try {
    const { url, format, title } = req.body;
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'Geçersiz YouTube URL adresi.' });
    }

    // Guard for Vercel environment without DOWNLOADER_SERVICE_URL
    if (process.env.VERCEL && !process.env.DOWNLOADER_SERVICE_URL) {
      return res.status(503).json({
        success: false,
        error: 'YouTube indirme servisi henüz yapılandırılmamış. Vercel ortamında doğrudan indirme için DOWNLOADER_SERVICE_URL ortam değişkeni gereklidir.'
      });
    }

    const targetFormat = format === 'mp3' ? 'mp3' : 'mp4';
    const streamUrl = `/api/yt-stream?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=${targetFormat}&title=${encodeURIComponent(title || 'youtube-media')}`;

    return res.json({
      success: true,
      videoId,
      format: targetFormat,
      downloadUrl: streamUrl,
      isDirect: true,
      quality: targetFormat === 'mp3' ? '320kbps Doğrudan Ses (MP3)' : 'MP4 video (kaynak kalitesine bağlı)'
    });
  } catch (err: any) {
    console.error('Error in /api/yt-download:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası: ' + err.message });
  }
});

/* ───────────────────────── Shared Templates API ───────────────────────── */

type SharedTemplateRecord = {
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  templateJson: string;
  version: number;
  createdAt: string;
};

const sharedTemplatesCache = new Map<string, SharedTemplateRecord>();

// Helper to interact with Firestore REST API
async function saveToFirestoreRest(record: SharedTemplateRecord, authToken?: string | null): Promise<boolean> {
  try {
    const dbId = (firebaseAppletConfig as any).firestoreDatabaseId || 'ai-studio-grafikotomasyonm-5229ff0f-8304-405c-af2a-76613e388830';
    const projectId = firebaseAppletConfig.projectId || 'grafik-motoru';
    const apiKey = firebaseAppletConfig.apiKey || FIREBASE_WEB_API_KEY;
    if (!apiKey) return false;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/shared_templates/${record.code}?key=${encodeURIComponent(apiKey)}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }

    const payload = {
      fields: {
        code: { stringValue: record.code },
        ownerId: { stringValue: record.ownerId },
        ownerName: { stringValue: record.ownerName },
        name: { stringValue: record.name },
        templateJson: { stringValue: record.templateJson },
        version: { integerValue: String(record.version || 1) },
        createdAt: { timestampValue: record.createdAt || new Date().toISOString() },
      }
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Firestore REST write warning:', err);
    return false;
  }
}

async function getFromFirestoreRest(code: string): Promise<SharedTemplateRecord | null> {
  try {
    const dbId = (firebaseAppletConfig as any).firestoreDatabaseId || 'ai-studio-grafikotomasyonm-5229ff0f-8304-405c-af2a-76613e388830';
    const projectId = firebaseAppletConfig.projectId || 'grafik-motoru';
    const apiKey = firebaseAppletConfig.apiKey || FIREBASE_WEB_API_KEY;
    if (!apiKey) return null;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/shared_templates/${code}?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as any;
    const f = data.fields;
    if (!f || !f.templateJson?.stringValue) return null;

    return {
      code: f.code?.stringValue || code,
      ownerId: f.ownerId?.stringValue || '',
      ownerName: f.ownerName?.stringValue || 'Grafik Motoru kullanıcısı',
      name: f.name?.stringValue || 'Paylaşılan şablon',
      templateJson: f.templateJson.stringValue,
      version: Number(f.version?.integerValue || 1),
      createdAt: f.createdAt?.timestampValue || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Firestore REST read warning:', err);
    return null;
  }
}

const KV_APP_KEY = '43n628a7';

// 1. Save template payload to persistent storage (dpaste primary, bytebin backup)
async function persistTemplatePayload(payloadStr: string): Promise<string | null> {
  // Primary: dpaste.org (365 days retention)
  try {
    const form = new URLSearchParams();
    form.append('content', payloadStr);
    form.append('expiry_days', '365');
    const res = await fetch('https://dpaste.org/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (res.ok) {
      const url = (await res.text()).trim().replace(/"/g, '');
      const slug = url.split('/').filter(Boolean).pop();
      if (slug && /^[a-zA-Z0-9]+$/.test(slug)) return slug;
    }
  } catch (err) {
    console.warn('dpaste save failed:', err);
  }

  // Secondary: bytebin.lucko.me
  try {
    const res = await fetch('https://bytebin.lucko.me/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadStr,
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (data?.key) return 'bb_' + data.key;
    }
  } catch (err) {
    console.warn('bytebin save failed:', err);
  }

  return null;
}

// 2. Fetch template payload by slug
async function fetchTemplatePayloadBySlug(slug: string): Promise<string | null> {
  try {
    if (slug.startsWith('bb_')) {
      const key = slug.slice(3);
      const res = await fetch(`https://bytebin.lucko.me/${key}`);
      if (res.ok) return await res.text();
    } else {
      const res = await fetch(`https://dpaste.org/${slug}/raw`);
      if (res.ok) return await res.text();
    }
  } catch (err) {
    console.warn('Payload fetch by slug failed:', err);
  }
  return null;
}

// 3. Save mapping code -> slug in permanent KV store
async function saveCodeMapping(code: string, slug: string): Promise<boolean> {
  try {
    const res = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${KV_APP_KEY}/${code}/${slug}`, {
      method: 'POST',
      headers: { 'Content-Length': '0' },
    });
    return res.ok;
  } catch (err) {
    console.warn('KV mapping save failed:', err);
    return false;
  }
}

// 4. Retrieve slug by code from permanent KV store
async function getSlugByCode(code: string): Promise<string | null> {
  try {
    const res = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${KV_APP_KEY}/${code}`);
    if (!res.ok) return null;
    const text = await res.text();
    const slug = text ? text.trim().replace(/^"|"$/g, '') : null;
    return slug && /^[a-zA-Z0-9_]+$/.test(slug) ? slug : null;
  } catch (err) {
    console.warn('KV mapping get failed:', err);
    return null;
  }
}

// POST: Share template
app.post(['/api/share-template', '/share-template'], async (req, res) => {
  try {
    const { code, ownerId, ownerName, name, templateJson, version } = req.body || {};
    if (!code || typeof code !== 'string' || !/^[A-Z0-9]{8}$/i.test(code.trim())) {
      return res.status(400).json({ success: false, error: 'Geçersiz paylaşım kodu.' });
    }
    if (!templateJson || typeof templateJson !== 'string' || templateJson.length > 2_500_000) {
      return res.status(400).json({ success: false, error: 'Geçersiz veya çok büyük şablon verisi.' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const record: SharedTemplateRecord = {
      code: normalizedCode,
      ownerId: String(ownerId || 'anon').slice(0, 128),
      ownerName: String(ownerName || 'Grafik Motoru kullanıcısı').slice(0, 120),
      name: String(name || 'Paylaşılan şablon').slice(0, 256),
      templateJson,
      version: Number(version) || 1,
      createdAt: new Date().toISOString(),
    };

    // 1. Store in-memory cache immediately
    sharedTemplatesCache.set(normalizedCode, record);

    // 2. Persist to cloud storage and register mapping in KV
    const payloadStr = JSON.stringify(record);
    const slug = await persistTemplatePayload(payloadStr);
    if (slug) {
      await saveCodeMapping(normalizedCode, slug);
    }

    // 3. Save asynchronously to Firestore REST if credentials available
    const authHeader = req.get('authorization');
    saveToFirestoreRest(record, authHeader).catch(err => {
      console.warn('Async Firestore REST write error:', err);
    });

    return res.json({ success: true, code: normalizedCode, slug });
  } catch (err: any) {
    console.error('Error in /api/share-template:', err);
    return res.status(500).json({ success: false, error: 'Şablon paylaşılamadı: ' + err.message });
  }
});
// GET: Fetch shared template
app.get(['/api/shared-template/:code', '/shared-template/:code'], async (req, res) => {
  try {
    const rawCode = req.params.code || '';
    const normalizedCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
      return res.status(400).json({ success: false, error: 'Geçersiz paylaşım kodu biçimi.' });
    }

    // 1. Check in-memory cache
    if (sharedTemplatesCache.has(normalizedCode)) {
      const record = sharedTemplatesCache.get(normalizedCode)!;
      return res.json({ success: true, ...record });
    }

    // 2. Lookup slug from permanent KV store
    const slug = await getSlugByCode(normalizedCode);
    if (slug) {
      const payloadStr = await fetchTemplatePayloadBySlug(slug);
      if (payloadStr) {
        try {
          const parsed = JSON.parse(payloadStr);
          if (parsed && typeof parsed === 'object' && parsed.templateJson) {
            const record: SharedTemplateRecord = {
              code: normalizedCode,
              name: parsed.name || 'Paylaşılan şablon',
              ownerId: parsed.ownerId || '',
              ownerName: parsed.ownerName || 'Grafik Motoru kullanıcısı',
              templateJson: parsed.templateJson,
              version: Number(parsed.version || 1),
              createdAt: parsed.createdAt || new Date().toISOString(),
            };
            sharedTemplatesCache.set(normalizedCode, record);
            return res.json({ success: true, ...record });
          }
        } catch { /* json parse error fallback */ }
      }
    }

    // 3. Fallback to Firestore REST API
    const remoteRecord = await getFromFirestoreRest(normalizedCode);
    if (remoteRecord) {
      sharedTemplatesCache.set(normalizedCode, remoteRecord);
      return res.json({ success: true, ...remoteRecord });
    }

    return res.status(404).json({ success: false, error: 'Bu koda ait bir şablon bulunamadı.' });
  } catch (err: any) {
    console.error('Error in /api/shared-template/:code:', err);
    return res.status(500).json({ success: false, error: 'Şablon yüklenirken hata oluştu: ' + err.message });
  }
});

// DELETE: Revoke shared template
app.delete(['/api/shared-template/:code', '/shared-template/:code'], async (req, res) => {
  try {
    const rawCode = req.params.code || '';
    const normalizedCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    sharedTemplatesCache.delete(normalizedCode);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
