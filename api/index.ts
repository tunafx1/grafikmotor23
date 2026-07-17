import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

// Safe lazy initializer for Gemini API client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    let key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      key = 'AQ.Ab8RN6KUtbi3xOIHoeOZx24mlGtE_FckCpN5xD6MD0ingMCpog';
    }
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

async function generateContentWithRetry(client: GoogleGenAI, params: any, attempt = 1): Promise<any> {
  const currentModel = params.model || 'gemini-3.5-flash';
  try {
    return await client.models.generateContent(params);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimitOrUnavailable = errMsg.includes('503') || 
                                     errMsg.includes('UNAVAILABLE') || 
                                     errMsg.includes('Resource has been exhausted') || 
                                     errMsg.includes('429') || 
                                     errMsg.includes('high demand') ||
                                     err?.status === 503 ||
                                     err?.status === 429;
    
    console.log(`[API Notice] Attempt ${attempt} model ${currentModel} returned: ${isRateLimitOrUnavailable ? 'TEMPORARILY_BUSY' : 'UNEXPECTED_STATUS'}`);

    if (isRateLimitOrUnavailable && attempt < 4) {
      const delay = attempt * 500;
      console.log(`Retrying after brief wait...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (currentModel === 'gemini-3.5-flash') {
        console.log(`Switching model to gemini-3.1-flash-lite for fallback attempt...`);
        params.model = 'gemini-3.1-flash-lite';
      } else if (currentModel === 'gemini-3.1-flash-lite') {
        console.log(`Switching model to gemini-flash-latest for fallback attempt...`);
        params.model = 'gemini-flash-latest';
      }

      return generateContentWithRetry(client, params, attempt + 1);
    }
    throw err;
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Robust routing middleware to resolve Vercel serverless function path rewrites
app.use((req, res, next) => {
  const originalUrlLower = (req.originalUrl || req.url || '').toLowerCase();
  const pathLower = req.path.toLowerCase();
  
  console.log(`[Vercel Route Debug] Method: ${req.method}, Path: ${req.path}, URL: ${req.url}, OriginalURL: ${req.originalUrl}`);

  // Route rewriting based on original URL or path patterns
  if (originalUrlLower.includes('generate-content') || pathLower.includes('generate-content')) {
    console.log('[Routing Middleware] Forwarding to /api/generate-content');
    req.url = '/api/generate-content';
  } else if (originalUrlLower.includes('analyze-collage') || pathLower.includes('analyze-collage')) {
    console.log('[Routing Middleware] Forwarding to /api/analyze-collage');
    req.url = '/api/analyze-collage';
  } else if (req.method === 'POST') {
    // If route doesn't match but it is a POST request to a generic index/api endpoint, detect by request body payload
    const hasNiche = req.body && (req.body.niche !== undefined || req.body.styleType !== undefined);
    const hasImages = req.body && (req.body.images !== undefined || req.body.userPrompt !== undefined);

    if (hasNiche) {
      console.log('[Routing Middleware Payload Fallback] Detected generate-content body, rewriting to /api/generate-content');
      req.url = '/api/generate-content';
    } else if (hasImages) {
      console.log('[Routing Middleware Payload Fallback] Detected analyze-collage body, rewriting to /api/analyze-collage');
      req.url = '/api/analyze-collage';
    }
  }
  next();
});

  // API Route: AI Powered content & palette generator
  app.post(['/api/generate-content', '/generate-content'], async (req, res) => {
    const { niche, styleType } = req.body;
    
    const nicheText = niche || 'Genel Girişim';
    const styleDescription = styleType || 'modern ve minimalist';

    // Premium fallbacks in case API Key is missing or service fails
    const fallbackResponses: Record<string, any> = {
      fashion: {
        title: "**Yeni Sezon** Zamansız Dokunuşlar",
        description: "En özel pamuk iplikleriyle işlenen, *şık ve sürdürülebilir* parçalar şimdi mağazada yerini aldı.",
        primaryColor: "#7C2D12", // Warm Terracotta
        accentColor: "#D97706",  // Sand Gold
        textColor: "#292524",    // Stone 900
        bgColor: "#FAF8F5"       // Soft Cream
      },
      tech: {
        title: "**Yapay Zeka** ile Sınırları Aşın",
        description: "Geleceğin algoritma mimarileri ve *büyük dil modelleri* ile iş akışlarınızı otomatikleştirin.",
        primaryColor: "#0891B2", // Neon Cyan
        accentColor: "#2563EB",  // Electric Blue
        textColor: "#F3F4F6",    // Light Gray
        bgColor: "#090D16"       // Deep Dark Space
      },
      food: {
        title: "Tazelikten Gelen **Gurme** Lezzet",
        description: "Organik bahçelerden toplanan malzemelerle, *şeflerimizin elinden* çıkan unutulmaz bir deneyim.",
        primaryColor: "#15803D", // Forest Green
        accentColor: "#EA580C",  // Fresh Orange
        textColor: "#1C1917",    // Stone 950
        bgColor: "#FDFDFB"       // Warm white
      },
      education: {
        title: "Geleceğinizi **Kodlayarak** Şekillendirin",
        description: "Birebir mentorluk ve *pratik projelerle* sıfırdan ileri seviyeye yazılım mühendisliği eğitimi.",
        primaryColor: "#4F46E5", // Indigo
        accentColor: "#10B981",  // Emerald
        textColor: "#0F172A",    // Slate 900
        bgColor: "#F8FAFC"       // Slate 50
      },
      minimalist: {
        title: "Az Çoktur: **Yalın** Estetik",
        description: "Gürültüden arınmış, *sadeliğin ve dengenin* ön planda olduğu tasarım yolculuğu.",
        primaryColor: "#111827", // Obsidian Black
        accentColor: "#6B7280",  // Muted Gray
        textColor: "#1F2937",    // Deep Charcoal
        bgColor: "#FFFFFF"       // Clean White
      }
    };

    const client = getGeminiClient();
    if (!client) {
      console.log('Gemini API key is not configured or placeholder detected. Returning high-quality predefined fallback.');
      
      // Match key or default to minimalist
      const selectedFallback = fallbackResponses[styleType] || fallbackResponses.minimalist;
      return res.json({ 
        success: true, 
        isFallback: true,
        ...selectedFallback
      });
    }

    try {
      const prompt = `Sen profesyonel bir pazarlama yazarı ve grafik tasarım uzmanısın.
Kullanıcı için yüksek dönüşüm sağlayan bir başlık (title), açıklama (description) ve tasarım renk paleti (primaryColor, accentColor, textColor, bgColor hex renk kodları) üret.

Kullanıcının sektörü/nişi: "${nicheText}"
Şablon Tarzı: "${styleDescription}"

Tasarım kuralları:
1. Başlıkta (title) EN ÖNEMLİ 1-2 kelimeyi vurgulamak için **kalın** formatta (**kelime**) yaz.
2. Açıklamada (description) bazı can alıcı kelimeleri *eğik* formatta (*kelime*) yaz. Başlığa kıyasla daha açıklayıcı olsun, maksimum 2 cümle olsun.
3. Renk paleti hex formatında (#FFF000 gibi) olmalı. Seçilen tarza uygun renkler olmalı (örn: "karanlık tema" ise bgColor koyu, textColor açık olmalı; "doğal" ise toprak tonları olmalı vb.).

Yanıtı kesinlikle şu JSON şemasında ver:
{
  "title": "string (başlık, kalın etiketleri içerir)",
  "description": "string (açıklama, eğik etiketleri içerir)",
  "primaryColor": "string (Hex rengi, örn: #4F46E5)",
  "accentColor": "string (Hex rengi, örn: #F59E0B)",
  "textColor": "string (Hex rengi, örn: #0F172A)",
  "bgColor": "string (Hex rengi, örn: #F8FAFC)"
}`;

      const response = await generateContentWithRetry(client, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              textColor: { type: Type.STRING },
              bgColor: { type: Type.STRING }
            },
            required: ['title', 'description', 'primaryColor', 'accentColor', 'textColor', 'bgColor']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        isFallback: false,
        ...data
      });

    } catch (err) {
      console.error('Error contacting Gemini API:', err);
      // Fail gracefully with preset fallback
      const selectedFallback = fallbackResponses[styleType] || fallbackResponses.minimalist;
      return res.json({
        success: true,
        isFallback: true,
        error: (err as Error).message,
        ...selectedFallback
      });
    }
  });

  // API Route: AI Powered Image Analysis & Collage Auto-Generator
  app.post(['/api/analyze-collage', '/analyze-collage'], async (req, res) => {
    const { images, systemPrompt, userPrompt } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: 'En az bir görsel gönderilmelidir.' });
    }

    const client = getGeminiClient();
    if (!client) {
      console.log('Gemini API key is not configured. Returning predefined fallback.');
      return res.json({
        success: true,
        isFallback: true,
        title: "**Harika Keşifler** Sizi Bekliyor",
        subtitle: "*Profesyonel Tasarım* Otomasyonu",
        description: "Görseliniz otomatik olarak analiz edildi. *Kurumsal dilinize* uygun en estetik tasarımlar hazırlandı.",
        primaryColor: "#4F46E5",
        accentColor: "#F59E0B",
        textColor: "#0F172A",
        bgColor: "#F8FAFC"
      });
    }

    try {
      // Process the first image for visual understanding
      const mainImageDataUrl = images[0];
      const match = mainImageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      
      let imagePart: any = null;
      if (match) {
        imagePart = {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }

      const systemInstruction = `Sen profesyonel bir sosyal medya yöneticisi, marka stratejisti ve tasarımcısın.
Gönderilen görseli görsel zeka ile analiz et. Görselin konusunu, renklerini, hissettirdiği duyguyu ve tarzı algıla.
Bu analize dayanarak, hem Kapak Sayfası (Cover Page) için yüksek etkileşimli bir başlık (title) ve alt başlık (subtitle) hem de Kolaj Sayfası (Collage Page) için detaylı ve açıklayıcı bir metin (description) oluştur.

KURUMSAL DİL / BRAND PROMPT KURALLARI:
${systemPrompt || 'Profesyonel, samimi ve ikna edici bir ton kullan.'}

KULLANICININ BU GÖRSEL İÇİN ÖZEL NOTLARI / KISACA BAHSET:
${userPrompt || 'Görsel içeriğini doğrudan yansıtacak yaratıcı bir yaklaşım benimse.'}

Metin kuralları:
1. Başlıkta (title) en can alıcı 1-2 kelimeyi vurgulamak için **kalın** formatta (**kelime**) yaz. Maksimum 6-8 kelime olsun.
2. Alt başlıkta (subtitle) bazı kelimeleri *eğik* formatta (*kelime*) yaz. Kısa ve çarpıcı, maksimum 4-5 kelime olsun.
3. Açıklamada (description) bazı kelimeleri *eğik* formatta (*kelime*) yaz. Başlıktan daha detaylı olsun, maksimum 2 cümle olsun.
4. Görsele ve kurumsal renklere en çok uyum sağlayacak 4 renkli estetik bir palet (primaryColor, accentColor, textColor, bgColor) öner.`;

      const contents: any[] = [];
      if (imagePart) {
        contents.push(imagePart);
      }
      contents.push({
        text: `Görseli analiz et ve kurumsal dil ile özel istekleri dikkate alarak bana şu JSON formatında yanıt dön:
{
  "title": "string (Kapak başlığı, en önemli kelimeler **kalın** olmalı)",
  "subtitle": "string (Kapak alt başlığı, çarpıcı, bazı kelimeler *eğik* olmalı)",
  "description": "string (Kolaj açıklaması, detaylı, bazı kelimeler *eğik* olmalı)",
  "primaryColor": "string (Hex renk kodu)",
  "accentColor": "string (Hex renk kodu)",
  "textColor": "string (Hex renk kodu)",
  "bgColor": "string (Hex renk kodu)"
}`
      });

      const response = await generateContentWithRetry(client, {
        model: 'gemini-3.5-flash',
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

      const data = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        isFallback: false,
        ...data
      });

    } catch (err) {
      console.error('Error analyzing image with Gemini:', err);
      return res.json({
        success: true,
        isFallback: true,
        error: (err as Error).message,
        title: "**Estetik Tasarım** Detayları",
        subtitle: "*Otomatik Analiz* Modu",
        description: "Görsel analizi sırasında bir bağlantı hatası oluştu, ancak *markanızın profesyonel çizgisi* korunarak taslak oluşturuldu.",
        primaryColor: "#4F46E5",
        accentColor: "#F59E0B",
        textColor: "#0F172A",
        bgColor: "#F8FAFC"
      });
    }
  });

  // Serve static files in production or hook up Vite dev server in development
  async function setupViteOrStatic() {
    if (process.env.VERCEL) {
      // On Vercel, static files are served by Vercel CDN, and routes are handled serverlessly.
      // Do not bind static files or listen on ports here to avoid environment-specific filesystem crashes.
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Graphic Automation Engine Server listening at http://0.0.0.0:${PORT}`);
    });
  }

  setupViteOrStatic().catch(err => {
    console.error('Error during server startup setup:', err);
  });

  export default app;
