# Grafik Motoru

Şablonlardan sosyal medya görselleri ve çok sayfalı içerikler hazırlayan React/TypeScript uygulaması. Metin ve görsel katmanları düzenlenebilir; PNG, JPEG, ZIP ve desteklenen tarayıcılarda video çıktısı oluşturulabilir.

## Yerelde çalıştırma

Node.js ve npm gereklidir.

```sh
npm install
npm run dev
```

Uygulamayı http://localhost:3000 adresinde açın. Google hesabına giriş yapmadan yerel düzenleyiciyi kullanabilirsiniz. Çalışmalar tarayıcının yerel depolamasında tutulur; tarayıcı verilerini silmek yerel çalışmaları da siler.

Yapay zekâ özellikleri için `.env.example` dosyasını `.env.local` adıyla kopyalayıp kendi `GEMINI_API_KEY` değerinizi girin. Anahtar yoksa metin sihirbazı nedenini gösterir ve mevcut metni korur. Alanların yanındaki sihirbaz yalnızca o alanı; genel üretim düğmesi aktif sayfanın metinlerini, şablondaki AI promptuna göre üretir. Renkler değiştirilmez. Şablon promptunu Tasarım sekmesindeki Kurumsal Dil / AI Prompt alanından düzenleyebilirsiniz. Model adları `GEMINI_MODEL` ve isteğe bağlı `GEMINI_FALLBACK_MODEL` üzerinden ayarlanabilir.

Google girişi ve buluta kayıt için `firebase-applet-config.json` projenize ait olmalı; Firebase Authentication ve Firestore yapılandırılmalıdır. Depodaki `firestore.rules` dosyasının varlığı, bu kuralların canlı projeye yayımlandığı anlamına gelmez. Bulut kaydı hesap gerektirir. Videolar IndexedDB içinde yerel saklanır; video dosyaları buluta yüklenmez ve başka cihazlara taşınmaz.

## Doğrulama ve üretim

```sh
npm run lint
npm test
npm run build
npm start
```

Çalışan yerel sunucunun temel HTTP kontrolü için `node tests/api-smoke.mjs` komutunu kullanabilirsiniz. Bu kontrol dış medya veya AI isteği yapmaz.

`lint` TypeScript tür kontrolünü çalıştırır. `test` kritik veri, medya ve çıktı hataları için regresyon testlerini çalıştırır. `start` derlenmiş üretim uygulamasını açar. `PORT` ile port değiştirilebilir.

## Medya indirme aracı

Yerel medya indirme için Python ortamında `yt_dlp` ve sistemde `ffmpeg` gerekir. Alternatif olarak `YT_DLP_PATH` ve `FFMPEG_PATH` çalıştırılabilir dosya yolları verilebilir. MP3/MP4 çıktısı ffmpeg ile dönüştürülür; görüntü ve ses kalitesi kaynak içeriğe bağlıdır.

Vercel gibi bu araçların bulunmadığı ortamlarda ayrı `downloader-service` servisini çalıştırıp `DOWNLOADER_SERVICE_URL` ayarlayın. Ayrıntılar: [servis notları](downloader-service/README.md).

İnceleme, uygulanan düzeltmeler ve doğrulama sınırları: [düzeltme raporu](DUZELTME-LISTESI.md).
