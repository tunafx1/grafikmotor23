import express from 'express';
import path from 'path';
import { extractVideoId as extractYouTubeVideoId, streamMedia } from '../downloader-service/media-stream.js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
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
Her alanın adını ve rolünü dikkate al. Bir alanın prompt değeri doluysa, yalnızca o alanı üretirken bu özel talimatı genel şablon promptundan daha öncelikli uygula.
Şablonda veya alan promptunda başka uzunluk belirtilmediyse başlık kısa, alt başlık tek satır, açıklama en fazla iki cümle olsun. callToAction kısa ve eylem odaklı; label, date ve price kendi veri türlerine uygun olmalıdır.
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

function collectValidTextResult(raw: unknown, fields: TextField[]): Record<string, string> {
  const texts = (raw as any)?.texts;
  const result: Record<string, string> = Object.create(null);
  if (!Array.isArray(texts)) return result;
  for (const field of fields) {
    const matches = texts.filter(item => item?.id === field.id);
    if (matches.length === 1 && typeof matches[0].text === 'string' && matches[0].text.trim() && matches[0].text.length <= 12000) {
      result[field.id] = matches[0].text.trim();
    }
  }
  return result;
}

export function createTextGenerationHandler(options: {hasKey: () => boolean; generate: (input: TextRequest) => Promise<unknown>}) {
  return async (req: express.Request, res: express.Response) => {
    let input: TextRequest;
    try { input = parseTextRequest(req.body); }
    catch (error) { return res.status(400).json({success:false, error:(error as Error).message}); }
    if (!options.hasKey()) return res.status(503).json({success:false, reason:'missing_api_key',
      error:'AI bağlantısı kurulmamış. Sunucudaki .env.local dosyasına GEMINI_API_KEY ekleyip sunucuyu yeniden başlatın. Metinleriniz değiştirilmedi.'});
    try {
      const texts: Record<string, string> = Object.create(null);
      let pendingFields = input.fields;
      for (let attempt = 0; attempt < 3 && pendingFields.length; attempt++) {
        const raw = await options.generate({...input, fields: pendingFields});
        Object.assign(texts, collectValidTextResult(raw, pendingFields));
        pendingFields = pendingFields.filter(field => !texts[field.id]);
      }
      if (pendingFields.length) throw new Error(`AI yanıtında ${pendingFields.length} metin alanı eksik kaldı.`);
      return res.json({success:true, texts});
    } catch (error: any) {
      const message = String(error?.message || error);
      const quota = /429|quota|Resource has been exhausted/i.test(message);
      const auth = /401|403|API.key|API_KEY_INVALID/i.test(message);
      const incomplete = /metin alanı eksik|metin alanları eksik|geçerli bir metin/i.test(message);
      return res.status(quota ? 429 : 502).json({success:false,
        reason:quota ? 'quota_exceeded' : auth ? 'invalid_api_key' : 'generation_failed',
        error:quota ? 'Gemini kullanım kotası dolu. Daha sonra tekrar deneyin; metinleriniz korundu.' :
          auth ? 'Gemini anahtarı geçersiz veya bu modele erişim izni yok. Sunucu ayarlarını kontrol edin.' :
          incomplete ? 'AI bazı metin kutularını boş bıraktı. Eksik alanlar otomatik olarak üç kez denendi; mevcut metinler korundu.' :
          'AI metni oluşturamadı. Bağlantıyı ve model ayarını kontrol edip tekrar deneyin; mevcut metin korundu.'});
    }
  };
}


// Automatically load .env.local first, then .env in local/node environment
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config();
}

// Models and credentials are supplied by the host environment.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_MODEL;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  if (!aiClient) aiClient = new GoogleGenAI({apiKey: key});
  return aiClient;
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

async function generateContentWithRetry(client: GoogleGenAI, params: any, attempt = 1): Promise<any> {
  const currentModel = params.model || DEFAULT_MODEL;
  params.model = currentModel;

  try {
    return await client.models.generateContent(params);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimitOrUnavailable = errMsg.includes('503') || 
                                     errMsg.includes('UNAVAILABLE') || 
                                     errMsg.includes('Resource has been exhausted') || 
                                     errMsg.includes('429') || 
                                     errMsg.includes('high demand') ||
                                     errMsg.includes('404') ||
                                     err?.status === 503 ||
                                     err?.status === 429 ||
                                     err?.status === 404;
    
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`[API Notice] Attempt ${attempt} model ${currentModel} returned: ${isRateLimitOrUnavailable ? 'RETRYABLE_STATUS' : 'UNEXPECTED_STATUS'}`);
    }

    if (isRateLimitOrUnavailable && attempt < 3) {
      const delay = attempt * 600;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (currentModel !== FALLBACK_MODEL) {
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
          console.log(`Switching model to ${FALLBACK_MODEL} for retry attempt...`);
        }
        params.model = FALLBACK_MODEL;
      }

      return generateContentWithRetry(client, params, attempt + 1);
    }
    throw err;
  }
}

const app = express();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Normalize endpoint prefixes while preserving query parameters (video streams need them).
app.use((req, _res, next) => {
  const endpoint = req.path.match(/(?:^|\/)(generate-text|generate-content|analyze-collage|yt-info|yt-download|yt-stream)\/?$/i)?.[1];
  if (endpoint) {
    const queryIndex = req.url.indexOf('?');
    req.url = `/api/${endpoint.toLowerCase()}${queryIndex >= 0 ? req.url.slice(queryIndex) : ''}`;
  }
  next();
});

app.post(['/api/generate-text', '/generate-text'], createTextGenerationHandler({
  hasKey: () => Boolean(getGeminiClient()),
  generate: async input => {
    const contents: any[] = [{text: buildTextPrompt(input)}];
    if (input.image) {
      const [header, data] = input.image.split(',');
      contents.unshift({inlineData:{mimeType:header.slice(5, header.indexOf(';')), data}});
    }
    const response = await generateContentWithRetry(getGeminiClient()!, {
      model:DEFAULT_MODEL, contents,
      config:{httpOptions:{timeout:45000}, responseMimeType:'application/json', responseSchema:{
        type:Type.OBJECT, properties:{texts:{type:Type.ARRAY, items:{type:Type.OBJECT,
          properties:{id:{type:Type.STRING},text:{type:Type.STRING}},required:['id','text']}}}, required:['texts'],
      }},
    });
    return JSON.parse(response.text || '{}');
  },
}));

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
  const { niche, styleType, systemPrompt, templateName, targetBrief, image } = req.body;
  
  const nicheText = niche || 'Genel Girişim';
  const styleDescription = styleType || 'modern ve minimalist';
  const selectedFallback = fallbackResponses[styleType] || fallbackResponses.minimalist;

  const client = getGeminiClient();
  if (!client) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.warn('[AI Notice] GEMINI_API_KEY is not configured. Returning predefined fallback with reason.');
    }
    return res.json({ 
      success: true, 
      isFallback: true,
      reason: 'missing_api_key',
      message: 'GEMINI_API_KEY ortam değişkeni tanımlanmamış. Varsayılan şablon yüklendi.',
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

    const response = await generateContentWithRetry(client, {
      model: DEFAULT_MODEL,
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            description: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            textColor: { type: Type.STRING },
            bgColor: { type: Type.STRING }
          },
          required: ['title', 'subtitle', 'description', 'primaryColor', 'accentColor', 'textColor', 'bgColor']
        }
      }
    });

    let rawData: any = {};
    try {
      rawData = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Gemini response was not valid JSON:', response.text);
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
    console.error('Error contacting Gemini API:', err?.message || err);
    const errMsg = err?.message || String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Resource has been exhausted');
    const isAuth = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID');
    const reason = isQuota ? 'quota_exceeded' : (isAuth ? 'invalid_api_key' : 'gemini_error');

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

  const client = getGeminiClient();
  if (!client) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.warn('[AI Notice] GEMINI_API_KEY is not configured. Returning collage fallback.');
    }
    return res.json({
      success: true,
      isFallback: true,
      reason: 'missing_api_key',
      message: 'GEMINI_API_KEY ortam değişkeni tanımlanmamış. Varsayılan kolaj şablonu yüklendi.',
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

    const contents: any[] = [...imageParts];
    contents.push({
      text: `${hasImage ? 'Görsel(ler)i analiz et, ' : ''}kurumsal dil kurallarına ve kullanıcı notlarına tam olarak uyarak şu JSON formatında yanıt dön:
{
  "title": "string (Kapak başlığı, en önemli kelimeler **kalın** olmalı)",
  "subtitle": "string (Kapak alt başlığı / rozet, bazı kelimeler *eğik* olmalı)",
  "description": "string (Açıklama metni, detaylı, bazı kelimeler *eğik* olmalı)",
  "primaryColor": "string (Hex renk kodu)",
  "accentColor": "string (Hex renk kodu)",
  "textColor": "string (Hex renk kodu)",
  "bgColor": "string (Hex renk kodu)"
}`
    });

    const response = await generateContentWithRetry(client, {
      model: DEFAULT_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            description: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            textColor: { type: Type.STRING },
            bgColor: { type: Type.STRING }
          },
          required: ['title', 'subtitle', 'description', 'primaryColor', 'accentColor', 'textColor', 'bgColor']
        }
      }
    });

    let rawData: any = {};
    try {
      rawData = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Collage Gemini response was not valid JSON:', response.text);
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
    console.error('Error analyzing image with Gemini:', err?.message || err);
    const errMsg = err?.message || String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Resource has been exhausted');
    const isAuth = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID');
    const reason = isQuota ? 'quota_exceeded' : (isAuth ? 'invalid_api_key' : 'gemini_error');

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

export default app;
