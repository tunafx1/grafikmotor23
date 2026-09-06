# YouTube yt-dlp Doğrudan İndirme Mikroservisi

Bu mikroservis, YouTube videolarını doğrudan **Full HD MP4** ve **320kbps MP3** formatında tarayıcıya dosya olarak (`Content-Disposition: attachment`) aktaran bağımsız bir servistir.

## 🚀 Ücretsiz 1-Tıkla Dağıtım (Railway / Render / VPS)

### Railway'e Dağıtım:
1. [Railway.app](https://railway.app)'a gidin.
2. **New Project** -> **Deploy from GitHub repo** seçin ve bu repo içerisindeki `downloader-service` klasörünü gösterin.
3. Otomatik olarak oluşturulan servis URL'sini (örn: `https://your-service.up.railway.app`) ana uygulamanızın `.env` veya Vercel Environment Variables kısmına `DOWNLOADER_SERVICE_URL` olarak ekleyin.

### Yerel Çalıştırma:
```bash
cd downloader-service
npm install
node server.js
```
Servis `http://localhost:4000` portunda çalışacaktır.
