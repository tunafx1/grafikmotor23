# Medya indirme servisi

YouTube bağlantılarını yt-dlp ile okur, ffmpeg ile MP3 veya MP4 çıktısına dönüştürür. MP3 için 320 kbps kodlama kullanılır; kaynak sesin kalitesi yükseltilmez. MP4 çözünürlüğü kaynak akışa bağlıdır.

## Yerel kullanım

Node.js, Python ortamında `yt_dlp` ve `ffmpeg` gereklidir. `YT_DLP_PATH` ve `FFMPEG_PATH` ile özel çalıştırılabilir dosya yolları belirtilebilir.

```sh
npm install
node server.js
```

Varsayılan port 4000; `PORT` ile değiştirilebilir. `GET /health` servis durumunu döndürür. `GET /download?url=YOUTUBE_URL&format=mp3` veya `format=mp4` dosya akışı döndürür. `url` URL kodlamasından geçirilmelidir.

Dockerfile bağımlılıkları kurar. Ana uygulamada `DOWNLOADER_SERVICE_URL` değerine servisin kök adresini yazın.

Bu servis kimlik doğrulama ve hız sınırlaması içermiyor. Herkese açık bir adrese yayımlamadan önce erişim kontrolü ve kaynak sınırları eklenmelidir. Bu çalışma sırasında servis yayımlanmadı; gerçek YouTube indirmesi yapılmadı.
