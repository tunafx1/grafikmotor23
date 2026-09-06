# Grafik Motoru — Kod İncelemesi ve Düzeltme Listesi

Bu doküman, `Grafik-motoru-main` projesinin tüm katmanları (backend `api/index.ts`, frontend `src/App.tsx`, Firebase/Firestore, YouTube indirme servisi, build/deploy config) taranarak hazırlanmış ve belirtilen düzeltmeler projeye uygulanmıştır.

---

## 🔴 KRİTİK — Yapay zekanın çalışmamasının asıl sebebi

### 1. `api/index.ts` içinde geçersiz, sahte bir "fallback" API anahtarı hardcode edilmiş
**Dosya:** `api/index.ts`, satır 9-27 (`getGeminiClient` fonksiyonu)

```ts
let key = process.env.GEMINI_API_KEY;
if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
  key = '[REDACTED_EXPIRED_TOKEN]';
}
```

- Bu string bir Gemini API anahtarı **formatında bile değil** (gerçek Gemini anahtarları `AIzaSy...` ile başlar; bu ise bir AI Studio oturum/OAuth token'ına benziyor — muhtemelen eski bir Antigravity/AI Studio oturumundan sızmış).
- Sonuç: `GEMINI_API_KEY` ortam değişkeni tanımlı değilse (ki Vercel'e deploy ederken büyük ihtimalle tanımlı değil), kod bu geçersiz anahtarla Gemini'yi çağırmaya çalışır, her istek 401/403 ile patlar, `catch` bloğuna düşer ve **sessizce** önceden yazılmış "fallback" (sabit) başlık/renk paletini döner.
- Kullanıcı arayüzde "AI çalışıyor" gibi bir mesaj görse de (`isFallback` bayrağı) aslında hiçbir zaman gerçek Gemini çıktısı almıyor.

**Yapılacaklar:**
- [x] Hardcoded anahtarı tamamen kaldır. `key` boşsa/placeholder ise `aiClient`'ı `null` bırak (tamamlandı).
- [ ] Bu sızmış olabilecek eski token'ı **iptal et / rotate et** (Google Cloud / AI Studio hesabınızdan kontrol ediniz).
- [x] Gerçek bir Gemini API anahtarı için `.env.local` şablonu ve `.env.example` hazırlandı (https://aistudio.google.com/app/apikey adresinden alıp ekleyiniz).
- [ ] Vercel'e deploy ediliyorsa: Project Settings → Environment Variables içine `GEMINI_API_KEY` eklenmeli.

---

### 2. Model adı `gemini-flash-latest` doğrulanmalı
**Dosya:** `api/index.ts`

Retry mantığı sırasıyla `gemini-flash-latest` → `gemini-2.0-flash` → `gemini-2.5-flash` modellerine geçiyordu. Güncel SDK için model adı modernize edildi.

**Yapılacaklar:**
- [x] Model adı sabit ve güncel `gemini-2.5-flash` olarak ayarlandı, kota/yoğunluk durumunda `gemini-2.0-flash` retry mekanizması entegre edildi.

---

### 3. Hata durumları kullanıcıdan tamamen gizleniyor — "çalışmıyor" fark edilemiyor
**Dosya:** `api/index.ts` ve `src/App.tsx`

Backend, Gemini çağrısı patladığında bile `success: true, isFallback: true` döner (gerçek hata yerine). Frontend de `data.success` her zaman `true` olduğu için kullanıcıya hiçbir hata göstermiyor, sadece sabit şablon metinlerini dolduruyordu.

**Yapılacaklar:**
- [x] Backend'de gerçek hata ile fallback ayrıştırıldı: `isFallback: true` dönerken `reason: 'missing_api_key' | 'quota_exceeded' | 'invalid_api_key' | 'invalid_json' | 'gemini_error'` ve `error` alanları eklendi.
- [x] Frontend'de konsola net uyarı basıldı (`[AI Engine Notice] ...`).
- [x] Kullanıcı arayüzünde AI şablonunun neden fallback'e düştüğü (örn: "⚠️ Gemini API anahtarı eksik olduğu için hazır tasarım şablonu uygulandı (.env.local içine ekleyin)") şeffaf bildirim mesajı ile gösterildi.

---

## 🔴 KRİTİK — Güvenlik açıkları

### 4. Firestore güvenlik kuralları misafir (guest) kullanıcı verilerini herkese açık bırakıyor
**Dosya:** `firestore.rules`, `isAuthorizedOwner` fonksiyonu

```
function isAuthorizedOwner(userId) {
  return (request.auth != null && userId == request.auth.uid) ||
         (request.auth == null && userId is string && userId.startsWith('guest_'));
}
```

- Giriş yapmamış (anonim) her istemci, `userId` alanı `guest_` ile başlayan **herhangi bir** dokümana erişebiliyordu.

**Yapılacaklar:**
- [x] `firestore.rules` güncellendi: `request.auth == null && userId.startsWith('guest_')` koşulu tamamen kaldırıldı; okuma ve yazma yalnızca doğrulanmış istemciye (`request.auth.uid`) bağlandı.
- [x] `src/lib/firebase.ts` içindeki sahte `guest_` ID üretimi kaldırıldı; Firebase Anonymous Auth veya Google Sign-In başarısız olduğunda sistem ağ çağrılarını kapatarak güvenli yerel çevrimdışı moda (localStorage) geçecek şekilde yapılandırıldı.

---

### 5. Firebase Web API Key'in public olması
**Dosya:** `firebase-applet-config.json`

Firebase web API anahtarları istemcide bulunabilir ancak güvenlik veritabanı kuralları ile korunmalıdır.

**Yapılacaklar:**
- [x] Madde 4 ile Firestore kuralları kapatılarak veri sızıntısı riski ortadan kaldırıldı.

---

## 🟠 YÜKSEK ÖNCELİK — Mimari / Deploy sorunları

### 6. YouTube indirme (`yt-dlp`) özelliği Vercel serverless ortamında çalışmaz
**Dosya:** `api/index.ts` (`/api/yt-stream`, `/api/yt-download`)

- Vercel serverless fonksiyonlarında Python/yt-dlp ikili dosyası bulunmaz.
- Harici `downloader-service` deploy edilmediğinde kodun çökmesi engellendi.

**Yapılacaklar:**
- [x] `api/index.ts` içinde Vercel ortamı tespiti (`process.env.VERCEL`) eklendi; `DOWNLOADER_SERVICE_URL` tanımlı değilse çökme yerine net ve açıklayıcı HTTP 503 uyarısı dönüldü.
- [ ] Vercel deploylarında YouTube indirmeyi kullanmak için `downloader-service/` Docker servisini harici bir platformda (Railway, Render, Fly.io vb.) deploy edip URL'sini Vercel ortam değişkenlerine ekleyiniz.

---

### 7. `src/App.tsx` bileşen boyutu ve durum yönetimi
**Dosya:** `src/App.tsx`

Büyük dosya boyutu nedeniyle kod düzenlemeleri dikkatle ve güvenli adımlarla gerçekleştirilmiştir.

**Yapılacaklar:**
- [x] Hata yakalama, AI fallback bildirimi ve konsol geri bildirim mekanizmaları güvenle entegre edildi.

---

### 8. Ortam değişkenleri / `.env` dosyası eksik
**Dosya:** `.env.example` ve `.env.local`

**Yapılacaklar:**
- [x] `server.ts` ve `api/index.ts` dosyalarına `dotenv` entegrasyonu sağlandı (`.env.local` ve `.env` otomatik yüklenir).
- [x] `.env.example` detaylı açıklamalar ve örnek parametrelerle güncellendi.
- [x] Yerel geliştirme için `.env.local` dosyası oluşturuldu.

---

## 🟡 ORTA ÖNCELİK — Sağlamlık / Kod kalitesi

### 9. Route belirleme mantığı kırılganlığı
**Dosya:** `api/index.ts`

**Yapılacaklar:**
- [x] İstek gövdesine (body) bakarak rota tahmin etme mantığı sadece belirsiz kök isteklerle (`/` ve `/api`) sınırlandırıldı; doğrudan gelen endpoint rotaları Express yönlendiricisine bırakıldı.

---

### 10. Aşırı `console.log` kullanımı
**Dosya:** `api/index.ts`

**Yapılacaklar:**
- [x] Her istekte basılan ayrıntılı rota ve deneme debug logları `DEBUG=true` veya geliştirici moduna bağlandı.

---

### 11. AI yanıtları JSON şema ve veri doğrulaması
**Dosya:** `api/index.ts`

**Yapılacaklar:**
- [x] Model çıktısı parse edildikten sonra `title`, `description` alanları ve renk kodları (`isValidHexOrRgbaColor`) denetlenerek hatalı format durumunda güvenli renk fallback'leri atandı.

---

### 12. `src/presets.ts` boş şablon listesi
**Dosya:** `src/presets.ts`

**Yapılacaklar:**
- [x] Boş olan `TEMPLATE_PRESETS` listesine 3 adet modern, yüksek görsel estetiğe sahip hazır tasarım şablonu (Minimalist Lansman, Teknoloji & Yapay Zeka Vitrini, Moda Koleksiyonu) eklendi. Kullanıcılar ilk açılışta veya çevrimdışı durumda zengin şablonlarla başlayabilir.

---

## ✅ Tamamlanan Öncelik Sırası

1. ✅ **Madde 1** — Hardcoded sahte API anahtarı kaldırıldı, `.env.local` desteği eklendi.
2. ✅ **Madde 4 & 5** — Firestore kuralları sıkılaştırıldı, anonim auth yetkilendirmesi güvenceye alındı.
3. ✅ **Madde 3** — Backend ve frontend hata/fallback ayrımı görünür kılındı.
4. ✅ **Madde 6** — YouTube indirme özelliği Vercel ortamında korumalı hale getirildi.
5. ✅ **Madde 2, 9, 10, 11** — Gemini 2.5-flash modeli, rota temizliği, sessiz loglama ve JSON veri doğrulama uygulandı.
6. ✅ **Madde 8** — Dotenv otomatik yükleme ve `.env.example` / `.env.local` oluşturuldu.
7. ✅ **Madde 12** — Hazır şablonlar `src/presets.ts` içine eklendi.
