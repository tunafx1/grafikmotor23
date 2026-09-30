# Grafik Motoru — İnceleme ve uygulanan düzeltmeler

6 Eylül 2026. Bu rapor önceki, kodla uyuşmayan tamamlandı listesinin yerine geçer. Uygulama şablon, metin, görsel ve videolardan sosyal medya çıktıları üreten bir düzenleyicidir. Aşağıdaki değişiklikler yerel kaynak dosyalarına uygulanmıştır; canlıya dağıtım yapılmamıştır.

## Arayüz ve kullanım

- Zorunlu giriş ekranı kaldırıldı; yerel düzenleyici doğrudan açılıyor. Google hesabı bulut işlemleri için kullanılabiliyor.
- Üst çubuk, Şablonlar / İçerik / Tasarım geçişi, solda araçlar, ortada tuval ve sağda sayfa/çıktı alanı düzenlendi. Dar ekranda alt gezinme ve ayrı panel görünümü var.
- Şablonlar gerçek önizlemelerle gösteriliyor. Aktif şablon seçimi, metin alanları, medya yükleme ve çıktı işlemleri daha belirgin.
- Açık/koyu tema renkleri, metin kontrastı, klavye odakları ve boşluklar düzeltildi. İlk açılışta boş alan yerine kapak gösteriliyor.
- Yakınlaştırmanın ilk tıklamada küçültmesi ve küçük ekranlarda taşma giderildi. Çıktı boyutu gerçek piksel ölçüsüyle gösteriliyor.

## Hata düzeltmeleri

| Sorun | Uygulanan çözüm |
| --- | --- |
| Geri al yalnızca şablonun bir kısmını kapsıyordu | Şablon, metin/görsel verileri ve sayfaları kapsayan geçmiş; sürüklemenin tek adımda geri alınması |
| Sayfa ve seçili katman şablonlar arasında karışabiliyordu | Şablon başına sayfalar ve şablon geçişinde seçimlerin sıfırlanması |
| Yenileme seçilen şablonu kaybediyordu | Doğrulanan aktif şablon kimliği kalıcı saklanıyor |
| Geç tamamlanan görsel yüklemesi yeni tuvali ezebiliyordu | Sürüm kontrollü ara tuval ve yazı tiplerinin beklenmesi |
| Koşullu hook kullanımı sayfa geçişinde hata üretebiliyordu | Hook sırası sabitlendi |
| Depolama hatası veya hata ekranındaki sıfırlama veri kaybettirebiliyordu | Depolama hatasını bildiren ortak katman; eski kayıtları silmeyen yeniden yükleme |
| Sayfaya özel katmanlar ve arka plan çıktıda kaybolabiliyordu | Ortak çıktı üreticisi, sayfa öncelikli veriler ve boş katman listelerine saygı |
| Çıktı dosya adı/uzantısı ve başarısız video çıktıları tutarsızdı | Gerçek Blob, uygun uzantı, güvenli dosya adı, hata bildirimi ve tekrar indirilebilir hazır dosya bağlantıları |
| Geçici video URL'si yenilemeden sonra bozuluyordu | Yeni videolar IndexedDB içinde saklanıyor ve medya kimliğiyle yeniden açılıyor |
| Video süresi temizlikten sonra sıfırlanıyordu | Süre temizlikten önce tutuluyor; kaynaklar ve zamanlayıcılar kapatılıyor |
| Bulut okuması devam eden yerel değişiklikleri ezebiliyordu | Okuma sırasında değişiklik denetimi; tam proje kaydı, arka planda otomatik silmenin kaldırılması |
| Kaynak kodda sabit yedek Gemini kimlik bilgisi vardı | Sabit değer kaldırıldı; yalnızca ortam değişkeni kullanılıyor, eksik anahtar açıkça bildiriliyor |
| API rota normalleştirmesi indirme sorgusunu düşürüyordu | Sorgu dizesini koruyan yönlendirme |
| MP3 seçimi gerçek dönüşüm yapmıyordu | Ortak yt-dlp/ffmpeg akışı; doğru kodlayıcılar ve bağlantı kapanışında kaynak temizliği |
| Üretim başlatma geliştirme sunucusunu açıyordu | Derlenmiş sunucu için NODE_ENV=production |

Kullanılmayan dört bağımlılık kaldırıldı. Uyumlu paket güncellemeleri ve qs 6.16 alt bağımlılık sabitlemesi sonrasında npm güvenlik taraması 0 açık bildirdi (301 paket). Bu sonuç npm danışma veritabanının bu taramadaki kapsamıyla sınırlıdır. Eksik React TypeScript tanımları eklendi. Önceki rapordaki sabit kimlik bilgisi örneği de kaldırıldı.

## Doğrulama

- TypeScript kontrolü ve üretim derlemesi başarılı.
- Derlenmiş üretim sunucusunda ana sayfa, geçersiz YouTube adreslerinin reddedilmesi ve indirme bağlantısındaki sorgu parametrelerinin korunması HTTP testiyle doğrulandı (`node tests/api-smoke.mjs`).
- 7 regresyon testi başarılı: medya türü, depolama kotası, tuval yarış koşulu/ölçeği, video süresi, medya kimliğiyle yenileme, sayfa çıktısı ve YouTube URL/kodlayıcı seçimi.
- Tarayıcıda 1440 × 960 ve 390 × 844 görünümleri, tema geçişi, şablon seçimi, metin düzenleme, geri al/ileri al, yakınlaştırma ve yeniden yükleme kontrol edildi.
- Yapay SVG dosyası yüklendi; üretilen sayfanın yenileme ve şablon değişimi sonrasında korunması kontrol edildi.
- PNG ve JPEG çıktıları tarayıcıda gerçek görsel olarak açıldı; 1620 ve 1080 piksel genişlikleri doğrulandı. ZIP hazır dosya bağlantısı üretildi. İşletim sistemi indirme tamamlanması, uygulama içi tarayıcı indirme olayı yakalanamadığı için doğrulanmadı.

## Kalan sınırlar

- Gerçek Gemini anahtarı olmadığı için canlı model yanıtı denenmedi. Anahtarsız yanıtın hazır içerik olduğunu belirtmesi kontrol edildi.
- Google girişinden gerçek Firestore kayıt/geri yükleme turu ve yayımlanmış güvenlik kuralları doğrulanmadı. Görsel verilerini tek Firestore belgesinde tutan mevcut yaklaşım büyük projelerde belge boyutu sınırına takılabilir; dosya depolamasına ayrılması gerekir.
- Gerçek video dosyasıyla uçtan uca oynatma/çıktı ve yt-dlp/ffmpeg dönüşümü yapılmadı. Testler ilgili hata düzeltmelerinin veri ve argüman davranışlarını kapsıyor.
- Videolar aynı tarayıcıda saklanır; bulut kaydı video dosyasını taşımaz. Eski oturumlardan kalan, yalnızca geçici blob URL'si bulunan videoların yeniden yüklenmesi gerekir.
- Ana bileşen hâlâ büyük. Derlemede yaklaşık 1,4 MB ana JavaScript paketi için boyut uyarısı var; sonraki mimari çalışma ekranları ve ağır araçları ayrı yüklenen modüllere bölmek olmalı.
- Tam uygulamanın bütün olası hata durumlarının giderildiği iddia edilmiyor. Yukarıdaki doğrulamalar test edilen akışlarla sınırlı.


## Takip düzeltmesi — AI sihirbazı ve medya penceresi

Önceki sürümde AI durum metni state içinde tutuluyor ancak ekranda çizilmiyordu. Eski akış bağlantı hatalarında hazır metinleri mevcut içeriğin üzerine uygulamaya devam ediyordu. Editör artık `/api/generate-text` kullanıyor: şablon promptu, alan adı/rolü, mevcut sayfa metinleri, ek not ve varsa görsel bağlamı gönderiliyor. Sunucu yalnızca istenen alan kimlikleri için çıktı kabul ediyor. Anahtar/kota/bozuk yanıt hatasında metinler değiştirilmiyor ve düğmenin bulunduğu bölümde hata gösteriliyor.

Başlık ve açıklama alanlarına ayrı küçük sihirbaz düğmeleri eklendi. Genel düğme yalnızca aktif sayfanın metinlerini üretir; renkleri ve diğer sayfaları değiştirmez. Şablon veya sayfa değiştirilirse devam eden istek iptal edilir. Gerçek Gemini anahtarı hâlâ mevcut değil; canlı model kalitesi doğrulanmadı. Başarılı ve hatalı model yanıtları kontrollü test çiftleriyle doğrulandı.

Medya indirme penceresi ortak tema değişkenleriyle yeniden yazıldı: açık/koyu görünüm, mor seçim vurgusu, tutarlı düğmeler, mobil yerleşim, Escape ile kapanma ve klavye odak çevrimi. Yanıltıcı ücretsiz/sınırsız ve garantili Full HD etiketleri kaldırıldı. Her tuş girişinde video sorgusu yapılması yerine İncele eylemi kullanılıyor.

6 yeni AI regresyon testiyle toplam 13 test başarılı. Tarayıcıda alan sihirbazının anahtar eksikliğini görünür bildirmesi ve mevcut başlık/açıklamanın korunması doğrulandı.


## Canlı AI bağlantı doğrulaması

Kullanıcının yerel olarak eklenen anahtarıyla Google model listesi ve gerçek yapılandırılmış metin üretimi başarıyla çağrıldı. Google, `gemini-2.5-flash` modelinin yeni kullanıcılar için kullanılamadığını bildirdi. Servisin önerdiği ve gerçek JSON üretim testini geçen `gemini-3.6-flash` varsayılan model yapıldı; `.env.example` güncellendi. Anahtar yalnızca Git tarafından yok sayılan `.env.local` içinde tutuluyor. Önceki anahtar eksikliği notları bu canlı kontrol öncesindeki durumu anlatır.
