# Toplu oluşturmada AI anahtarı ve elle metin girişi — Tasarım

Tarih: 2026-11-25 · Boyut: küçük değişiklik

## Amaç ve neden

Toplu oluşturma ekranında şablondaki metin alanlarını şu an her zaman yapay
zekâ dolduruyor. AI servisi hata verdiğinde (anahtar, kota, zaman aşımı) iş
duruyor. Kullanıcı AI'yi kapatıp metinleri kendisi girebilmeli. AI hata
verdiğinde de ekran kendiliğinden elle giriş moduna geçmeli. Böylece AI
olmadan da tasarım üretilebilir.

## Hedefler

- 3. adımda ("İçerik komutu") küçük bir `✨ AI` açma/kapama anahtarı.
- **AI açık:** Bugünkü davranış aynen sürer: komut yazılır, AI doldurur.
- **AI kapalı:** Seçili şablondaki metin alanları için birer kutu gösterilir.
  - Kutular şablon sayfasına göre gruplanır (Kapak, İç sayfa…).
  - Etiket, alanın adıdır (`region.name`, örn. "Başlık", "Açıklama").
  - Kutuların başlangıç değeri, alanın örnek metnidir (`placeholderText`).
  - Komut zorunlu değildir; AI hiç çağrılmaz.
- Üretimde her sayfa, kendi şablon sayfasının (`templatePageId`) kutularındaki
  metni alır. Aynı düzenden üretilen sayfalar aynı metni alır.
- **AI açıkken hata:** Üretimde herhangi bir sayfanın metni üretilemezse:
  - Yarım sonuç çalışma olarak kaydedilmez.
  - Fotoğraflar ve komut korunur.
  - Ekran 3. adımda kalır, AI anahtarı kapanır ve elle giriş formu açılır.
  - Form, AI'nin başarıyla ürettiği metinlerle önceden doldurulur (her şablon
    sayfası için o düzenden ilk başarılı sayfanın metinleri). Kalan alanlar
    örnek metinle dolar.
  - Formun üstünde şu mesaj görünür: hata nedeni + "Metinleri kontrol edip
    'Tasarımları oluştur'a basın."

## Kapsam dışı

- Tek sayfa düzenleyicideki "AI ile yaz" akışı. O akış zaten isteğe bağlı ve
  metinler orada elle düzenlenebiliyor.
- Her üretilen sayfa için ayrı form. Sayfa bazlı farklar üretimden sonra
  düzenleyicide yapılır.
- Sunucu tarafı (`api/`) değişiklikleri.

## Kaçınılacaklar

- AI hata verdiğinde kullanıcının fotoğraflarını veya yazdığı metni
  kaybetmesi.
- AI kapalıyken herhangi bir AI isteği gönderilmesi.

## Kısıtlar

- Formda yalnızca `getAiTextFields` ile aynı kurala uyan alanlar çıkar: metin
  tipi, `isDynamic !== false`, gizli değil.
- Sadece fotoğraf alanı olan şablon sayfaları üretimde kullanılır. Form da
  yalnızca bu sayfaları gösterir (`buildBatchPages` ile aynı süzgeç).
- Metin alanı olmayan şablonda kapalı mod "Bu şablonda metin alanı yok"
  der ve üretime izin verir.

## Yaklaşımlar

1. **Anahtar ve form 3. adım kartının içinde (seçilen).** Hata anında
   kullanıcı zaten bu ekrandadır; geçiş görünür ve tek adımdır.
2. Anahtar genel ayarlarda. Reddedildi: AI bozukken kullanıcıyı bir de
   ayar aramaya iter.
3. Hata olunca sonuç ekranına gidip başarısız sayfaları elle düzeltmek
   (bugünkü "yeniden dene" akışı). Reddedildi: Kullanıcı, hatada doğrudan
   elle giriş formuna dönülmesini istedi.

## Kararlar (geliştiricinin)

- Anahtarın son elle seçilen değeri tarayıcıda (`localStorage`, try/catch
  ile) hatırlanır. Hata yüzünden otomatik kapanma kaydedilmez; sonraki
  açılışta kullanıcının kendi seçimi geçerlidir.
- Şablon değiştirilince form o şablonun alanlarıyla yeniden kurulur.
- Mantık `src/utils/batchProduction.ts` içinde saf fonksiyonlarla yazılır
  (form alanlarını çıkarma, elle metinleri sayfalara uygulama). Böylece
  `tests/` altında test edilebilir. Arayüz `BatchWorkspace.tsx` içinde,
  hata geçişi `App.tsx` içindeki `runBatch` içinde kalır.
- Mevcut "Yalnızca başarısız metinleri yeniden dene" düğmesi, eski
  çalışmalar için yerinde kalır.
