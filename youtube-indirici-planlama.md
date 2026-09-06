# YouTube Video & Ses İndirici Modülü Planlaması

Bu doküman, Grafik Motoru projesi içerisine entegre edilecek bağımsız bir "Araçlar (Tools)" eklentisi olan YouTube indirici modülünün tasarımsal, sistemsel ve teknik detaylarını içerir.

## 🎯 1. Genel Bakış ve Amaç
Kullanıcıların proje düzenlerken veya harici ihtiyaçları için başka sitelere (reklamlı, güvensiz) gitmeden, direkt bizim uygulamamız üzerinden YouTube videolarını MP3 veya MP4 formatında indirebilmelerini sağlamak.
Bu özellik, uygulamada geçirilen süreyi (retention) artıracak ve kredi sistemini destekleyen premium bir özellik olacaktır.

## 💎 2. Kredi Sistemi Entegrasyonu
Bu araç, uygulamanın ekonomisini canlı tutmak için kredi sistemiyle entegre çalışacaktır. İndirme kalitesine ve türüne göre farklı ücretlendirmeler yapılabilir:

*   **MP3 (Ses) İndirme:** 1 Kredi
*   **MP4 Standart Kalite (720p):** 2 Kredi
*   **MP4 Yüksek Kalite (1080p+):** 5 Kredi

> **Not:** Kredi bakiyesi yetersiz olduğunda kullanıcıya "Kredi Satın Al" veya "Reklam İzleyerek Kredi Kazan" (eğer eklenecekse) yönlendirmesi yapılacaktır.

## 🎨 3. UI / UX (Arayüz Deneyimi)
Modül, kullanıcıyı yormayan çok sade bir arayüze sahip olmalıdır.

*   **Konumlandırma:** Uygulama içerisinde bir Modal (açılır pencere) veya sol menüde "Araçlar" sekmesi altında ayrı bir sayfa.
*   **Girdi (Input):** Büyük ve şık bir link yapıştırma alanı.
*   **Önizleme (Preview):** Kullanıcı linki yapıştırdığı anda YouTube'dan videonun **Küçük Resmi (Thumbnail)** ve **Başlığı** çekilip ekranda gösterilir. Bu işlem kullanıcıya güven verir.
*   **Seçim Alanı:** Format (MP3 / MP4) ve Kalite (720p, 1080p vb.) seçimi için şık butonlar (Toggle/Dropdown).
*   **Animasyonlar:** İndirme işlemi arka planda sürerken ilerleme çubuğu (progress bar) veya Skeleton loading animasyonları.

## ⚙️ 4. Teknik Altyapı ve Mimari
CORS (Cross-Origin Resource Sharing) kısıtlamaları ve YouTube'un katı politikaları nedeniyle bu işlem doğrudan Frontend (React) üzerinden yapılamaz.

**Önerilen Yöntem: Hazır API Kullanımı (API-as-a-Service)**
Kendi sunucumuzda indirme altyapısı kurmak (yt-dlp vb.) yerine, bu işi yapan hazır bir API (örn: RapidAPI üzerindeki YouTube Downloader API'leri) kullanılacaktır.

**Akış Şeması:**
1.  **Frontend:** Kullanıcı linki yapıştırır ve "İndir"e tıklar.
2.  **Frontend:** Uygulama, Firebase/Firestore üzerinden kullanıcının kredisini kontrol eder.
3.  **Frontend -> API:** Kredi yeterliyse, YouTube linki güvenli bir şekilde 3. parti API'ye istek olarak atılır.
4.  **API -> Frontend:** API, doğrudan indirilebilir MP4/MP3 dosyasının sunucu linkini (URL) geri döndürür.
5.  **Frontend:** Gelen link tarayıcıda otomatik olarak indirilmeye başlar.
6.  **Veritabanı:** Kullanıcının kredisinden ilgili miktar düşülür ve log (geçmiş) kayıtlarına eklenir.

## 🚀 5. Geliştirme Adımları (Tamamlandı)
- [x] UI Tasarımının yapılması (Header & Mobil Menüye "Araçlar" butonu, MP3/MP4 format seçimi, Video önizleme kartı).
- [x] Backend tarafına `/api/yt-info` (oEmbed video bilgisi) ve `/api/yt-download` (Full HD MP4 & 320kbps MP3 indirme) servislerinin eklenmesi.
- [x] Frontend `App.tsx` tarafına "Araçlar & Medya İndirici" modalının entegre edilmesi.
- [x] İndirme geçmişi (localStorage) ve doğrudan/alternatif indirme bağlantısı oluşturma mantığının yazılması.
- [x] TypeScript tip kontrollerinin (`npm run lint`) başarıyla doğrulanması.
