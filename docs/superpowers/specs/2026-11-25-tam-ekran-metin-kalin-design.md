# Elle metinler için tam ekran düzenleyici ve kalın yazı — Tasarım

Tarih: 2026-11-25 · Boyut: küçük değişiklik
Önceki: `2026-11-25-ai-anahtari-elle-metin-design.md`

## Amaç ve neden

AI kapalıyken metin kutuları, toplu oluşturma ekranının sağındaki dar sütunda
(yaklaşık 330 px) duruyor. Başlık ve açıklama uzun olduğunda çok kaydırmak
gerekiyor. Kullanıcı ayrıca metnin bir kısmını seçip kalın yapabilmek ve
kalın kısmı kutunun içinde de kalın görmek istiyor.

## Hedefler

- AI kapalıyken 3. kart, alanların kısa bir özetini ve **"Metinleri düzenle ⤢"**
  düğmesini gösterir. Özet, her alan için tek satırlık ve sonu kesik önizlemedir.
- Düğme, tüm ekranı kaplayan bir düzenleyici açar:
  - Üst çubukta başlık ("Metinler"), **B Kalın** düğmesi ve **Tamam** düğmesi.
  - Gövdede sayfa sayfa gruplar (Kapak Sayfası…) ve geniş, kendiliğinden
    uzayan yazı kutuları. Uzun içerikte kaydırma yalnızca düzenleyicinin
    içinde olur.
  - Esc tuşu ve Tamam düzenleyiciyi kapatır. Yazılanlar anında kaydedilir;
    ayrı bir "kaydet" adımı yoktur.
- Kalın yazı:
  - Metin seçilip **B Kalın**'a ya da Ctrl/Cmd+B'ye basılınca seçim kalın olur.
    Seçim zaten kalınsa kalınlık kalkar.
  - Kalın kısım kutunun içinde kalın görünür. `**` işaretleri görünmez.
  - Metin arka planda yine `**kalın**` biçiminde saklanır. Böylece
    `canvasRenderer` ve mevcut şablonlar değişmeden çalışır.
  - Mevcut `*italik*` işaretleri kaybolmaz; kutuda italik görünür.
- Mobil (≤ 768 px): Düzenleyici tam ekran açılır. Üst çubuk yapışkandır
  (sticky), düğmeler dokunmaya uygun boyuttadır (≥ 40 px). Klavye açıkken
  kutular erişilebilir kalır.

## Kapsam dışı

- Çalışma düzenleyicisindeki (WorkQuickEditor) metin kutusu. Aynı bileşen
  sonra oraya da konabilir.
- Renk, yazı boyutu, italik düğmesi.
- AI açıkken komut kutusu.

## Kaçınılacaklar

- Yapıştırılan metinle gelen biçimin (renk, font, bağlantı) kutuya ya da
  metne sızması. Yapıştırma her zaman düz metin olarak eklenir.
- Kalın/normal geçişinde metnin ya da satır sonlarının kaybolması.

## Yaklaşımlar

1. **Kendi küçük zengin metin kutusu (seçilen):** `contentEditable` bir alan.
   `**`/`*` metni ile HTML (`<strong>`, `<em>`, `<br>`) arasında iki saf,
   testli dönüştürücü kullanılır. Yeni bağımlılık eklenmez ve yalnızca
   gereken kadar özellik içerir.
2. Hazır editör kütüphanesi (Tiptap/Lexical). Reddedildi: Tek bir kalın
   düğmesi için ağır bir bağımlılık getirir.
3. Düz textarea, üstüne görsel katman. Reddedildi: Kalın harfler daha geniş
   olduğu için imleç ile görünen metin kayar.

## Kararlar (geliştiricinin)

- Dönüştürücüler `src/utils/richText.ts` içine yazılır:
  - `markdownToHtml(text)`: Metindeki HTML karakterleri kaçışlanır.
  - `htmlToMarkdown(root)`: DOM düğümlerini dolaşır. `<b>`, `<strong>` ve
    `font-weight ≥ 600` kalın sayılır; `<i>`, `<em>` italik sayılır;
    `<br>` ve blok öğeleri `\n` olur.
  - Gidiş-dönüş testi yazılır: metin → HTML → metin aynı kalmalı.
- Kalınlık için `document.execCommand('bold')` kullanılır. Eskimiş sayılsa da
  tüm güncel tarayıcılarda çalışır. Çıktı her zaman `htmlToMarkdown` ile
  normalize edilir.
- Bileşenler: `RichTextField.tsx` (tek kutu) ve `ManualTextsEditor.tsx`
  (tam ekran pencere). Pencere `BatchWorkspace` içinden açılır.
- AI hatası yüzünden elle moda geçildiğinde düzenleyici kendiliğinden
  açılmaz; kart, özeti ve hata mesajını gösterir.
