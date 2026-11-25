# Toplu Oluşturmada AI Anahtarı ve Elle Metin Girişi — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toplu oluşturmanın 3. adımına bir AI anahtarı eklemek. Anahtar kapalıyken şablon sayfalarındaki metin alanları elle doldurulur. AI açıkken hata olursa ekran kendiliğinden elle giriş moduna geçer.

**Architecture:** Saf yardımcı fonksiyonlar `src/utils/batchProduction.ts` içine eklenir ve testlenir. Bunlar form gruplarını çıkarır, elle metinleri sayfalara uygular ve AI hatasını özetler. `App.tsx` içindeki `runBatch` elle metin alır ya da AI hatasında sonucu kaydetmeden bir geri dönüş nesnesi döndürür. `BatchWorkspace.tsx` anahtarı ve formu çizer.

**Tech Stack:** React 19, TypeScript, Vite; testler `node --test` + tsx (`npm test`), tip kontrolü `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-11-25-ai-anahtari-elle-metin-design.md`

## Global Constraints

- Arayüz metinleri Türkçe.
- Anahtar etiketi: `AI` (Sparkles ikonu ile). Varsayılan: açık.
- Tercih anahtarı: `batch_ai_enabled` (`'1'` / `'0'`), `src/lib/storage` üzerinden. Okuma/yazma hatası açık (AI) varsayılanına düşer.
- Hata yüzünden otomatik kapanma kaydedilmez. Yalnızca kullanıcının anahtara tıklaması kaydedilir.
- AI kapalıyken `requestAiText` / `generateBatchTexts` çağrılmaz.
- Hata mesajı biçimi: `<neden> Metinleri kontrol edip 'Tasarımları oluştur'a basın.`
- Formdaki alan kuralı `getAiTextFields` ile aynıdır: `type === 'text' && isDynamic !== false && !hidden`.
- `api/` altında değişiklik yok.

## Review Focus

1. Metin alanı olmayan şablon, kapalı modda: "Bu şablonda metin alanı yok." yazar ve üretime izin verir (Task 1 testi: boş grup listesi; Task 3: arayüz).
2. Üretim sırasında iptal: elle moda geçilmez, mevcut "Üretim iptal edildi" mesajı kalır (Task 2: iptal, geri dönüşten önce kontrol edilir).
3. Geri dönüşten sonra şablon değiştirme: form yeni şablonun varsayılanlarıyla kurulur, eski AI metinleri taşınmaz (Task 3).
4. Boş bırakılan kutu: sayfada boş metin olarak kalır, örnek metne geri dönmez (Task 1 testi).
5. Aynı düzenden birden fazla sayfa: hepsi aynı elle metni alır; formda olmayan alanlar sayfanın kendi değerini korur (Task 1 testi).

---

### Task 1: Saf yardımcılar (form grupları, elle metin uygulama, hata özeti)

**Files:**
- Modify: `src/utils/batchProduction.ts`
- Test: `tests/batch-production.test.ts`

**Interfaces:**
- Produces:
  - `export type ManualTexts = Record<string, Record<string, string>>` — `templatePageId -> regionId -> metin`
  - `export type ManualTextGroup = { pageId: string; pageName: string; fields: { id: string; name: string; defaultText: string }[] }`
  - `export function getManualTextGroups(template: DesignTemplate): ManualTextGroup[]` — `buildBatchPages` ile aynı düzen listesi (fotoğraf alanı olan sayfalar, sayfa yoksa tek "Kapak" düzeni). Alanı olmayan gruplar çıkarılır. `name` = `region.name || region.id`, `defaultText` = `placeholderText ?? ''`.
  - `export function defaultManualTexts(groups: ManualTextGroup[]): ManualTexts`
  - `export function applyManualTexts(pages: any[], texts: ManualTexts): any[]` — yeni dizi döner; her sayfanın `dynamicTexts` değeri `{...page.dynamicTexts, ...texts[page.templatePageId]}` olur, `productionError` silinir. Girdi değiştirilmez.
  - `export function summarizeBatchFailure(pages: any[]): { reason: string; texts: ManualTexts } | null` — hatalı sayfa yoksa `null`. `reason` = ilk hatalı sayfanın `productionError`'ı. `texts`: her `templatePageId` için o düzenden ilk **hatasız** sayfanın `dynamicTexts`'i.
- Refactor: Düzen listesini çıkaran kod `buildBatchPages` içinden özel bir `batchLayouts(template)` yardımcısına alınır, iki fonksiyon da onu kullanır.

- [ ] **Step 1: Failing testleri yaz** (`tests/batch-production.test.ts` sonuna; dosyadaki `layout`, `template`, `photos` yardımcılarını kullan)

```ts
test('manual text groups list text fields per photo layout with placeholders', () => {
  const groups = getManualTextGroups(template);
  assert.deepEqual(groups.map(g => g.pageId), ['cover', 'two', 'one']);
  assert.deepEqual(groups[0].fields, [{ id: 'title', name: 'Başlık', defaultText: 'Önceki başlık' }]);
  const noText = { ...template, pages: [{ ...layout('x', 1, 'cover'), regions: [{ id: 'image-0', type: 'image', isDynamic: true }] }] } as any;
  assert.deepEqual(getManualTextGroups(noText), []);
});
test('manual texts apply per layout, keep empty strings and do not mutate input', () => {
  const pages = buildBatchPages(template, photos(12));
  const before = JSON.stringify(pages);
  const out = applyManualTexts(pages, { cover: { title: 'Kapak başlığı' }, two: { title: '' } });
  assert.equal(out[0].dynamicTexts.title, 'Kapak başlığı');
  assert.ok(out.filter(p => p.templatePageId === 'two').every(p => p.dynamicTexts.title === ''));
  assert.ok(out.filter(p => p.templatePageId === 'one').every(p => p.dynamicTexts.title === 'Önceki başlık'));
  assert.equal(JSON.stringify(pages), before);
});
test('batch failure summary keeps successful AI texts per layout', () => {
  const pages = buildBatchPages(template, photos(12));
  pages[0].dynamicTexts.title = 'AI kapak';
  pages[1].productionError = 'Kota doldu.';
  pages[2].dynamicTexts.title = 'AI iki';
  const summary = summarizeBatchFailure(pages)!;
  assert.equal(summary.reason, 'Kota doldu.');
  assert.equal(summary.texts.cover.title, 'AI kapak');
  assert.equal(summary.texts.two.title, 'AI iki');
  assert.equal(summarizeBatchFailure(applyManualTexts(pages, {})), null);
});
```

(`pages[1]` ve `pages[2]` 12 fotoğrafta `two` düzenindedir; değilse indeksleri `templatePageId`'ye göre seçerek düzelt, iddiaları koru.)

- [ ] **Step 2:** `npm test` çalıştır → yeni 3 test "is not a function / not exported" ile FAIL.
- [ ] **Step 3:** Interfaces bloğundaki dört fonksiyonu ve `batchLayouts` refactor'ünü uygula; import satırına ekle.
- [ ] **Step 4:** `npm test` → tümü PASS; `npm run lint` → hata yok.
- [ ] **Step 5: Commit** — `feat(batch): add manual text helpers for AI-off production`

### Task 2: `runBatch` elle metin ve AI hatası geri dönüşü

**Files:**
- Modify: `src/App.tsx` (`runBatch`, ~satır 5184; import satırı 3)
- Modify: `src/components/BatchWorkspace.tsx` (yalnızca `onGenerate` prop tipi)

**Interfaces:**
- Consumes: `ManualTexts`, `applyManualTexts`, `summarizeBatchFailure` (Task 1)
- Produces: `export type BatchGenerateResult = void | { aiFailed: true; templateId: string; texts: ManualTexts }` (`batchProduction.ts` içinde) ve
  `onGenerate: (template: DesignTemplate, media: SequenceMediaItem[], brief: string, manualTexts?: ManualTexts) => Promise<BatchGenerateResult>`

- [ ] **Step 1:** `runBatch(source, media, brief, manualTexts?)`:
  - `manualTexts` verildiyse `pages = applyManualTexts(draft, manualTexts)` olur, AI çağrılmaz, ilerleme metni `'Sayfalar hazırlanıyor…'` kalır.
  - Aksi halde bugünkü `generateBatchTexts` çağrısı yapılır. Ardından `controller.signal.aborted` ise bugünkü gibi çıkılır.
  - Sonra `summarizeBatchFailure(pages)` çağrılır. Sonuç `null` değilse çalışma **kaydedilmez**: `setBatchError(\`${f.reason} Metinleri kontrol edip 'Tasarımları oluştur'a basın.\`)` yapılır ve `{ aiFailed: true, templateId: source.id, texts: f.texts }` döndürülür.
  - Başarı yolu bugünkü gibi kalır.
- [ ] **Step 2:** `npm run lint` → hata yok; `npm test` → PASS.
- [ ] **Step 3: Commit** — `feat(batch): skip AI with manual texts and return fallback on AI failure`

### Task 3: Anahtar ve elle giriş formu (BatchWorkspace)

**Files:**
- Modify: `src/components/BatchWorkspace.tsx` (state ~satır 185, 3. adım kartı ~satır 478, gönder alanı ~satır 483-489)
- Modify: `src/components/BatchCreate.css` (`.production-brief-card` stillerinin yanına)

**Interfaces:**
- Consumes: `getManualTextGroups`, `defaultManualTexts`, `ManualTexts`, `BatchGenerateResult` (Task 1-2), `storage` (`../lib/storage`)

- [ ] **Step 1: State.**
  - `aiEnabled` başlangıç değeri `storage.getItem('batch_ai_enabled') !== '0'` olur (try/catch → `true`).
  - `setAiPreference(v)` hem state'i hem storage'ı yazar; otomatik geçiş yalnızca state'i değiştirir.
  - `groups = useMemo(() => source ? getManualTextGroups(source) : [], [source])` ile gruplar hesaplanır.
  - `manualTexts` state'i `source?.id` değişince `defaultManualTexts(groups)` ile sıfırlanır.
- [ ] **Step 2: Anahtar.**
  - `<h2><span>3</span> İçerik komutu</h2>` satırının sağına bir `button.production-ai-toggle` eklenir:
    - `role="switch"`, `aria-checked={aiEnabled}`
    - İçerik: Sparkles ikonu + `AI`
    - `title`: açıkken "AI metinleri otomatik doldurur — kapatmak için tıkla", kapalıyken "Metinleri elle giriyorsun — AI'yi açmak için tıkla"
    - `disabled={disabled}`
- [ ] **Step 3: Kapalı mod gövdesi.** Textarea ve hint yerine:
  - Her grup için `<fieldset className="production-manual-group"><legend>{pageName}</legend>` çizilir. İçinde her alan için `<label>` + `<textarea rows={2} maxLength={1000}>` olur; `id` olarak `manual-${pageId}-${fieldId}` kullanılır.
  - Grup yoksa şu hint gösterilir: `Bu şablonda metin alanı yok.`
  - Alt hint: `Metinler, aynı sayfa düzeninden üretilen tüm sayfalara uygulanır. Sonradan her sayfayı ayrı düzenleyebilirsin.`
- [ ] **Step 4: Gönder.**
  - Düğme: `disabled={disabled || !planned || (aiEnabled && !brief.trim())}` olur.
  - "Devam etmek için içerik komutunu yaz." uyarısı yalnızca `aiEnabled` iken gösterilir.
  - Tıklayınca `const r = await p.onGenerate(source, photos, brief, aiEnabled ? undefined : manualTexts)` çağrılır. `r?.aiFailed && r.templateId === source.id` ise:
    - `setAiEnabled(false)` (kaydetmeden)
    - `setManualTexts({...defaultManualTexts(groups), ...merge(r.texts)})`. Burada `merge`, yalnızca formdaki alan id'lerini alır.
- [ ] **Step 5: CSS.** Anahtar, kompakt bir hap şeklindedir; açıkken vurgu rengi, kapalıyken soluktur. Form alanları dikey sıralanır, dar ekranda taşma olmaz.
- [ ] **Step 6: Doğrulama.**
  - `npm run lint` + `npm test` → PASS.
  - `npm run dev` ile tarayıcıda şunlar denenir:
    - (a) AI kapalıyken Atabey şablonunda Başlık/Açıklama kutuları görünür; üretilen sayfalarda bu metinler yer alır.
    - (b) Anahtar tercihi sayfa yenilenince korunur.
    - (c) AI hata verdiğinde mesaj çıkar, anahtar kapanır ve form dolu gelir. Örneğin `/api/generate-text` isteği DevTools ile engellenerek denenebilir.
- [ ] **Step 7: Commit** — `feat(batch): AI toggle with manual text form and automatic fallback`
