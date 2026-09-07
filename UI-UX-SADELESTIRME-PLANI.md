# Grafik Motoru — Kullanım kolaylığı ve sadeleştirme planı

Tarih: 7 Eylül 2026  
Durum: İnceleme ve uygulama planı. Bu çalışma kapsamında uygulama kodu değiştirilmedi.

## 1. Hedef ve kapsam

Kullanıcı tasarım üzerindeki başlığa tıkladığında başlığı, açıklamaya tıkladığında açıklamayı, fotoğrafa tıkladığında fotoğrafı düzenleyebilmeli. Doğru ayarı bulmak için İçerik/Tasarım ayrımını veya katman sistemini öğrenmesi gerekmemeli.

Başlangıç, tanıtım, giriş ve kayıt ekranları aynen korunacak. Değişiklikler giriş sonrası çalışma alanı, şablon yönetimi, içerik düzenleme, sayfalar, medya ve indirme akışıyla sınırlı olacak. Kimlik doğrulama akışı bu planın konusu değil.

Öncelik yeni özellik eklemek değil; mevcut özellikleri doğru yerde, gerektiği anda göstermek. Temel kullanıcı yolu: **Çalışmayı aç → öğeye tıkla → düzenle → indir.**

## 2. Uygulama içinde yapılan inceleme

Canlı uygulama: https://grafik-motoru-studio.vercel.app/  
Ortam: Chrome, masaüstü; yaklaşık 1470 × 780 görünür alan.  
İncelenen çalışma: Atabey Şablon; içerik tarafında dört üretilmiş sayfa, şablon tasarımında üç sayfa düzeni.

Mevcut oturumda profil penceresi kapatıldı; Şablonlar, İçerik, Tasarım, medya araçları ve indirme paneli gezildi. Tuvalde başlık, açıklama ve görsel seçimi denendi. Şablon ad/boyut düzenleme formu açılıp iptal edildi. Yapay zekâ ve ince ayarlar açılıp incelendi.

İçerik, renk, konum veya boyut değerleri değiştirilmedi; silme, kaydetme, dosya yükleme, AI üretimi ve gerçek indirme yapılmadı. Bu, etkileşim ve bulunabilirlik incelemesidir; performans testi veya bağımsız kullanıcı araştırması değildir. Mobil kullanım, klavyeyle tüm akış ve ekran okuyucu davranışı henüz test edilmedi.

### Gözlem kayıtları

| No | Denenen işlem | Gözlenen sonuç | Kullanıcıya etkisi |
|---|---|---|---|
| G1 | İçerik ekranını açmak | Solda içerik ve sayfa listesi, ortada tuval, sağda sayfalar ve çıktı ayarları aynı anda görünüyor. | Başlamak için fazla seçenek; düzenleme alanı daralıyor. |
| G2 | Soldan ikinci sayfayı seçmek | Sol ve sağ seçili sayfa değişti; görünen tuval kapakta kaldı. | Seçilen ve görünen sayfa ayrışıyor. Bu oturumdaki gözlem, farklı şablonlarda da yeniden doğrulanmalı. |
| G3 | İçerik modunda kapaktaki başlığa tıklamak | Kapak yeniden aktif oldu. İkinci tıklamada görünür bir başlık ayar paneli açılmadı. | “Tıkla ve düzenle” yönlendirmesi beklenen geri bildirimi vermiyor. |
| G4 | Tasarım sekmesine geçmek | Gerçek başlık ve medya yerine örnek başlık ve dizüstü bilgisayar görseli gösterildi; solda üç şablon sayfası, sağda dört çıktı sayfası kaldı. | Kullanıcı çalışmasının değiştiğini veya kaybolduğunu düşünebilir. Şablon ile çıktı ayrımı anlaşılmıyor. |
| G5 | Tasarım modunda açıklamayı seçmek | Seçim çerçevesi ve katman ayarları açıklamaya geçti; ayarlar uzun sol panelin aşağısında, görünür alanın dışında kaldı. | Seçime bağlı ayarlar mevcut ama keşfedilmiyor. |
| G6 | Tasarım modunda fotoğrafı seçmek | Katman adı ve ayar türü görsele geçti, yazı ayarları kalktı. | Mevcut seçime bağlı altyapı korunabilir; panelin konumu ve hiyerarşisi değişmeli. |
| G7 | Şablon kartındaki “Düzenle”ye basmak | Yalnızca ad, genişlik ve yükseklik formu açıldı. Görsel düzenleme ayrı “Tasarla” eyleminde. | Birbirine yakın iki fiil farklı işler yapıyor. |
| G8 | Medya araçlarını açmak | Üstteki araç simgesi YouTube bağlantısından MP3/MP4 indirme penceresi açıyor. | Tasarıma fotoğraf ekleme beklentisiyle karışabilir. |
| G9 | Dışa aktar panelini kapatmak | Sağdaki sayfa listesi de çıktı ayarlarıyla birlikte kapandı. | Sayfa gezinmesi indirme işlevine bağımlı. |
| G10 | AI bölümünü ve İnce Ayarlar ve Hizalama'yı açmak | AI'da sayfanın tüm metinlerini üretme; ince ayarlarda maske, ölçek, yatay/dikey kaydırma ve açı var. | Sık kullanılan kırpma işlemi genel bir başlığın altında gizli. |
| G11 | Üstte “Çalışmalarım”a tıklamak | Ekran değişmedi; erişilebilirlik ağacında düğme/bağlantı değil metin olarak göründü. | Geri dönüş yolu gibi görünen alan işlevini açıklamıyor. |
| G12 | Kaydetme işaretlerini incelemek | Üstte “Yerel çalışma” ve “Kaydet”, Tasarım içinde ayrıca “Buluta Kaydet” var. | İçeriğin mi şablonun mu kaydedildiği ve bulut durumu belirsiz. Veri kaybı testi yapılmadı. |

## 3. Önerilen menü ve çalışma alanı

### Giriş sonrası ana menü

Ana gezinme yalnızca **Çalışmalarım**, **Şablonlarım** ve **Medya** olsun. Hesap ve tercihler profil menüsünde bulunsun. MP3/MP4 aracı Medya içindeki “Bağlantıdan indir” eylemine taşınsın.

Çalışmalarım ekranında son çalışmalar, küçük önizleme, çalışma adı, son düzenlenme zamanı ve tek ana eylem “Yeni çalışma” gösterilsin. Teknik alan sayısı ve katman bilgileri kartın ana içeriği olmasın. Çalışma yoksa tek bir başlangıç eylemi ve kısa açıklama yeterli olsun.

“Yeni çalışma” önce şablon seçtirsin; seçilen şablondan bağımsız bir çalışma açılsın. Şablon hazırlayan kullanıcı için “Yeni şablon” Şablonlarım altında bulunsun. Bunlar girişten sonraki ekranlardır; mevcut tanıtım ve kayıt ekranları değişmez.

### Günlük editör

| Bölge | Görünecek içerik |
|---|---|
| Üst şerit | Çalışmalarıma dön, çalışma adı, kaydetme durumu, geri al/ileri al, İndir, profil |
| Sol dar araç alanı | Ekle, Medya, Katmanlar; tıklanınca ilgili çekmece |
| Orta | Aktif sayfanın büyük önizlemesi; yakınlaştırma ve sığdırma |
| Sağ | Yalnızca seçili öğenin ayarları; seçim yoksa kısa yönlendirme |
| Alt | Tek sayfa şeridi: küçük önizlemeler, sıra numarası, aktif sayfa, sayfa ekleme |

“İçerik” ve “Tasarım” günlük düzenlemede iki ayrı mod olmaktan çıkmalı. Metin içeriği ve biçimi aynı panelde düzenlenmeli. Şablonun yapısını değiştirmek ayrı ve açık adlandırılmış “Şablonu düzenle” işlemi olmalı.

İndirme ayarları varsayılan olarak kapalı olmalı. Sayfa listesi indirmenin içine konmamalı. Sağ ayar paneli ile indirme penceresi aynı alanı kaplamak için yarışmamalı.

## 4. Tıklama ve ayar davranışları

Tek tık öğeyi seçer ve ilgili paneli görünür konumda açar. Kullanıcı uzun bir panelde doğru bölümü aramaz. Seçili öğe tuvalde çerçeveyle, panelde adıyla belirtilir. Çerçeve, tutamaçlar ve ad birlikte kullanılır; durum yalnızca renkle anlatılmaz.

| Seçim | İlk görünen ayarlar | İkinci aşamada açılacaklar |
|---|---|---|
| Başlık | “Başlık” adı, metin kutusu, yazı tipi, boyut, kalın/italik, renk, hizalama; “Bu başlığı üret” | Satır/harf aralığı, metin zemini, kenarlık, gölge, konum |
| Açıklama | “Açıklama” adı, metin kutusu, boyut, renk, hizalama; “Bu açıklamayı üret” | Yazı tipi, satır aralığı, gölge, konum |
| Diğer metin | Anlamlı öğe adı, içerik ve temel yazı ayarları | Metin rolü, ölçüler, diğer gelişmiş ayarlar |
| Fotoğraf | Önizleme, Değiştir, Kırp, Sığdır/Doldur, döndürme | Maske, kenarlık, köşe, sayısal konum |
| Video | Oynat/Duraklat, Değiştir, Kırp; uygulamanın desteklediği mevcut video seçenekleri | Gelişmiş yerleşim; yeni video özellikleri ayrı kapsam |
| Arka plan | Renk veya görsel değiştir | Görsel yerleşimi, varsa gelişmiş seçenekler |
| Logo/dekor | Boyut ve konum; kilitli ise neden kilitli olduğu | Kilidi açma veya şablon düzenlemeye geçiş |
| Tuval dışındaki boşluk | Seçimi kaldır; “Düzenlemek için bir öğeye tıkla” | “Sayfa ayarları” üzerinden boyut/arka plan |

Metne çift tık doğrudan yazı düzenlemeyi açmalı; sağdaki metin kutusu her zaman alternatif olmalı. Kalın ve italik için düğmeler kullanılmalı; kullanıcıdan Markdown öğrenmesi beklenmemeli. Mevcut **kalın** ve *eğik* içerikler geçişte biçimlerini korumalı.

Fotoğrafa çift tık kırpmayı açmalı. Kırpma ekranında “Uygula” ve “Vazgeç” görünmeli; Escape değişikliği uygulamadan kapatmalı. Görselin kendisini seçmek ile içindeki kadrajı taşımak ayrılmalı.

Metin alanına odaklanınca yazma başlayabilir; yalnızca öğe seçildiğinde klavye odağı zorla metin kutusuna taşınmamalı. Sekmeler veya öğeler arası geçişte yazılmış değişiklikler kaybolmamalı. Metin düzenlerken Delete tuval öğesini silmemeli.

Kilitli süsler başlık veya fotoğrafı seçmeyi engellememeli. Üst üste binen öğeler Katmanlar listesinden de seçilebilmeli. Katman adı ile metin rolü farklı kavramlardır: yalnızca adında “Başlık” geçtiği için rol sessizce değiştirilmemeli; mevcut şablonlar geçişte kontrol edilmeli.

## 5. Sayfa ve şablon ayrımı

Üç şablon düzeninden dört çıktı üretilmesi geçerli bir davranış olabilir. Sorun bunların aynı isimle, aynı ekranda gösterilmesi. Günlük editörde yalnızca üretilen çalışma sayfaları; şablon düzenleyicide yalnızca tekrar kullanılan sayfa düzenleri gösterilsin.

Sayfa şeridindeki bir sayfaya tıklamak o sayfayı tuvalde göstermeli, seçili öğeyi yeni sayfaya göre temizlemeli ve sayfa numarasını güncellemeli. Başka sayfadaki eski öğenin ayarları açık kalmamalı.

Varsayılan tek sayfa görünümü öneriliyor. İsteğe bağlı “Tüm sayfaları gör” görünümü korunabilir; bu görünümde de sayfa seçimi otomatik olarak doğru sayfaya kaydırmalı.

Şablon kartının ana eylemi “Bu şablonla çalış”. Diğer işlemler üç nokta menüsünde: “Şablonu düzenle”, “Adını değiştir”, “Boyutu değiştir”, “Kopyala”, “Sil”. Silme normal düzenleme eylemlerinin hemen yanında tek tık hedefi olmamalı.

Günlük çalışma düzenlemesi ana şablonu değiştirmemeli. Şablon editörüne geçerken başlıkta “Şablon düzenleniyor” ve yapılan değişikliğin kapsamı gösterilmeli. Mevcut çalışma içerikleri örneklerle sessizce değiştirilmemeli; örnek veri önizlemesi gerekiyorsa açıkça etiketlenmiş bir seçenek olmalı.

## 6. Medya, AI ve indirme

### Medya

“Yüklenen fotoğraflar” ve “Diğer görseller” yerine tek medya kütüphanesi kullanılsın. Fotoğraf, video ve şablona ait sabit varlıklar burada anlaşılır biçimde ayrılabilsin. Teknik “Varlık 1” yerine dosya adı veya “Fotoğraf 1” kullanılsın.

Fotoğraf seçiliyken Değiştir, aynı kütüphaneyi açıp hedef alanı belirgin göstersin. Kütüphaneden dosya kaldırma ile sayfadaki fotoğrafı kaldırma farklı işlemler olsun. Bir dosya birden fazla sayfada kullanılıyorsa silme etkisi açıklansın.

Toplu yükleme sırasında işlem sonucu önceden anlaşılmalı: hangi görsellerden kaç sayfa hazırlanacağı gösterilmeli. Düzeni yeniden üretme, elle yapılmış düzenlemeleri koruma veya değiştirme seçeneklerini açıkça ayırmalı.

### Yapay zekâ

Seçili başlık için “Bu başlığı üret”, açıklama için “Bu açıklamayı üret”; sayfa düzeyinde ayrı “Sayfanın metinlerini oluştur” eylemi olsun. Hangi alanların değişeceği işlemden önce belli olsun.

Üretilen metin önce öneri olarak gösterilsin; “Kullan”, “Yeniden üret”, “Vazgeç” seçenekleri sunulsun. Mevcut metin hata durumunda korunmalı. Marka dili günlük formu uzatmasın; şablon/marka ayarlarında bulunsun, editörde kısa bir durum bilgisi yeterli olsun.

### İndirme

Üstteki “İndir” tek giriş noktası olsun. Açılan pencerede sayfa kapsamı (Bu sayfa / Tüm sayfalar / Seçtiklerim), biçim ve boyut gösterilsin. Temel seçenekler anlaşılır olsun: PNG — yüksek kalite, JPEG — küçük dosya, WebP — web için. “Retina” gibi adlar yerine gerçek piksel ölçüsü de gösterilsin.

Birden fazla sayfada ZIP seçeneği aynı akış içinde yer alsın. Fotoğraf/video karışık çalışmalar için desteklenen çıktı türü açıkça belirtilecek; video dışa aktarma yeteneği bu incelemede doğrulanmadı. İşlem sürerken ilerleme, tamamlandığında sonuç ve hata halinde tekrar deneme sunulsun.

## 7. Kaydetme ve dil

Tek kaydetme durumu kullanılsın: Kaydediliyor / Buluta kaydedildi / Bu cihazda kayıtlı / Kaydetme başarısız. “Yerel çalışma” tek başına başarı veya sorun anlamına gelmemeli. Bulut sorunu varsa yerel kopyanın durumu ve tekrar deneme yolu açık olmalı.

Otomatik kaydetme ancak mevcut kayıt davranışı ve çakışma yönetimi doğrulandıktan sonra devreye alınmalı. İlk aşamada tutarlı bir Kaydet düğmesi korunabilir; olmayan otomatik kayıt için başarı mesajı gösterilmemeli.

| Şimdiki ifade | Öneri |
|---|---|
| Tasarla / Düzenle | Şablonu düzenle / Adını ve boyutunu değiştir |
| Bölgeler & Katmanlar | Katmanlar |
| Metin Bölgesi | Metin ekle |
| Boş Resim | Görsel alanı ekle |
| İnce Ayarlar ve Hizalama | Kırp ve konumlandır |
| İkincil Accent | Vurgu rengi |
| Modül Modu | Günlük ekrandan kaldır; gerekiyorsa Şablon düzenleme |
| Dışa aktar | İndir |

Küçük ve soluk yardım metinleri azaltılsın. Yardım, kullanıcının karar vermesi gereken yerde kısa bir cümle veya bilgi düğmesiyle sunulsun. Sık kullanılan kontroller simgeyle birlikte ad taşısın.

## 8. Mobil ve erişilebilirlik — uygulanacak, henüz test edilmedi

Dar ekranda üç sütun sıkıştırılmasın: tuval ana ekranı kaplasın; öğeye dokununca alttan ayar paneli açılsın. Sayfalar ayrı açılabilen bir şerit, İndir üstte erişilebilir eylem olsun. Dokunma hedefleri en az 44 × 44 CSS piksel hedeflensin.

Tuval öğeleri Katmanlar listesinden klavyeyle seçilebilmeli. Menü ve sekmeler doğru erişilebilir rolleri taşımalı; mevcut çalışma modu kontrollerinin checkbox olarak görünmesi yeniden değerlendirilmeli. Odak göstergesi, etiketler, hata duyuruları ve metin kontrastı ölçülmeli. AI ve indirme penceresi kapandığında odak açan düğmeye dönmeli.

## 9. Uygulama sırası

| Aşama | İş | Tamamlanma koşulu |
|---|---|---|
| 1 — Etkileşim taslağı | Başlık, açıklama, görsel, boş seçim ve indirme için ekran taslakları; tek çalışma akışı | Kullanıcı sekme aramadan doğru kontrolün nerede açılacağını anlayabiliyor. |
| 2 — İlk kullanılabilir iyileştirme | Görünür seçili öğe paneli; doğru sayfaya geçiş; tek sayfa şeridi; indirme paneli varsayılan kapalı | G2, G3, G5 ve G9 senaryoları kabul testlerini geçiyor. |
| 3 — Menü ve şablonlar | Çalışmalarım dönüşü; açık eylem adları; çalışma/şablon ayrımı; günlük İçerik/Tasarım ayrımının kaldırılması | Bir çalışmayı düzenlemek ana şablonu etkilemiyor; sayfa sayıları bağlamına göre tutarlı. |
| 4 — İçerik üretimi | Tek medya kütüphanesi, kırpma akışı, metin biçimlendirme ve AI öneri kabulü | İşlemler hedef öğeye uygulanıyor; iptal ve geri al çalışıyor. |
| 5 — Güven ve uyumluluk | Kayıt durumları, indirme geri bildirimi, mobil ve erişilebilirlik | Gerçek cihaz ve farklı şablonlarla aşağıdaki senaryolar tamamlanıyor. |

İlk teslimatta yeni tema, animasyon, gelişmiş video editörü veya ek AI özelliği yapılmamalı. Önce mevcut özelliklere erişim kolaylaştırılmalı. Aşamalar ayrı ayrı kullanıcıya gösterilmeli; tüm arayüz bir defada değiştirilmemeli.

## 10. Kabul ve kullanıcı testi

Aşağıdakiler hedef ölçütlerdir; mevcut uygulamanın ölçülmüş performansı değildir.

| Görev | Başarı ölçütü |
|---|---|
| Başlığı düzenle | Tek tıkla Başlık paneli görünür; içerik ve yazı boyutu için mod değiştirmek gerekmez. |
| Açıklamayı düzenle | Başlıktan açıklamaya tıklayınca panel adı ve değerler doğru değişir; başlığın metni değişmez. |
| Fotoğrafı kırp | Çift tık veya Kırp ile açılır; Vazgeç önceki kadrajı korur. |
| İkinci sayfaya geç | Tek tıkla ikinci sayfa görünür ve aktif olur; eski sayfanın ayarları kalmaz. |
| Şablondan çalışma aç | Çalışma değişiklikleri ana şablona ve diğer çalışmalara yansımaz. |
| Tek metni AI ile üret | Yalnızca hedef alana öneri gelir; Kullan seçilmeden eski metin değişmez. |
| Tüm sayfaları indir | Editörden en fazla üç temel eylemle başlatılır; kapsam ve dosya türü anlaşılır. |
| Çalışmalarıma dön | Üstteki bağlantı gerçekten listeyi açar; kayıt durumu belirsizse kullanıcıya gösterilir. |
| Ağ kesildiğinde devam et | Bulut kaydı yapılmış gibi gösterilmez; varsa yerel kayıt açıkça belirtilir. |
| Klavye ve mobil | Fare olmadan öğe seçimi/ayar erişimi, dar ekranda metin ve görsel düzenleme tamamlanabilir. |

İlk taslaktan sonra uygulamayı daha önce kullanmamış 3–5 kişiyle başlık değiştirme, fotoğraf değiştirme, ikinci sayfaya geçme ve indirme görevleri denenmeli. Yardım isteme sayısı, yanlış panel açma, tamamlanma süresi ve vazgeçme kaydedilmeli. Mevcut ekran ve yeni taslak aynı görevlerle karşılaştırılmalı.

## 11. Uygulama öncesi doğrulanacak noktalar

- Çalışma verisi ile şablon verisinin kayıt kapsamı; mevcut düzenlemelerin hangi anda kalıcılaştığı.
- Eski şablonlardaki metin rolleri, kilitli katmanlar ve Markdown biçimlerinin kayıpsız taşınması.
- Sayfa seçiminin farklı şablonlarda kaydırma ve odak davranışı.
- Video içeren sayfaların gerçek çıktı yetenekleri; indirme türleri buna göre adlandırılmalı.
- Mobil, klavye, ekran okuyucu ve düşük bağlantı testleri.

Bu plan mevcut ekranlarda gözlenen kullanım sorunlarına dayanır. Görsel seçim, ayar paneli ve sayfa gezinmesi düzeldikten sonra yeni kullanıcı testiyle ikinci tur sadeleştirme yapılmalıdır.
