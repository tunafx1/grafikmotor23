# Tam Ekran Metin Düzenleyici ve Kalın Yazı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI kapalıyken metinleri tam ekran bir düzenleyicide, kalın yazı desteğiyle girmek.

**Architecture:** `src/utils/richText.ts` içinde `**`/`*` metni ile HTML arasında saf dönüştürücüler bulunur. `htmlToMarkdown`, DOM'a bağlı kalmadan testlenebilmek için küçük bir düğüm arayüzü üzerinde çalışır. `RichTextField.tsx` bir `contentEditable` kutu, `ManualTextsEditor.tsx` ise tam ekran penceredir. `BatchWorkspace` içindeki form, bir özet ve açma düğmesiyle değiştirilir.

**Tech Stack:** React 19, TypeScript, lucide-react, `node --test` + tsx.

**Spec:** `docs/superpowers/specs/2026-11-25-tam-ekran-metin-kalin-design.md`

## Global Constraints

- Metin her zaman `**kalın**` / `*italik*` / `\n` biçiminde saklanır.
- Yapıştırma düz metindir (`text/plain`).
- Yeni bağımlılık eklenmez.
- Dokunma hedefleri ≥ 40 px; ≤ 768 px genişlikte pencere tam ekran açılır, üst çubuk yapışkandır.
- Türkçe metinler: düğme `Metinleri düzenle`, pencere başlığı `Metinler`, `Kalın`, `Tamam`.

## Review Focus

1. Metinde `<`, `&` gibi karakterler: HTML'e kaçışlanır, geri döndüğünde aynı kalır (Task 1 testi).
2. Kapanmamış `**`: dönüştürücü çökmez, gidiş-dönüşte metin korunur (Task 1 testi).
3. Tarayıcının `<div>` ve `<br>` ile oluşturduğu satırlar `\n` olur, sonda fazladan `\n` oluşmaz (Task 1 testi).
4. Bitişik kalın parçalar (`<b>a</b><b>b</b>`) birleşir: `**ab**` olur, `****` oluşmaz (Task 1 testi).
5. Kullanıcı yazarken dışarıdan gelen değer kutuyu yeniden çizmez, böylece imleç atlamaz (Task 2: yalnızca değer, son yayılan değerden farklıysa `innerHTML` güncellenir).

---

### Task 1: Dönüştürücüler

**Files:** Create `src/utils/richText.ts`; Test `tests/rich-text.test.ts`

**Interfaces — Produces:**
- `export function markdownToHtml(text: string): string`
  - Kalın parçalar `<strong>`, italik parçalar `<em>`, satır sonları `<br>` olur.
  - Diğer metin kaçışlanır. `canvasRenderer.parseMarkdownText` kullanılır.
- `export type RichNode = { nodeType: number; nodeName: string; textContent: string | null; childNodes: ArrayLike<RichNode>; style?: { fontWeight?: string; fontStyle?: string } }`
- `export function htmlToMarkdown(root: RichNode): string`
  - Kalın sayılanlar: `B`, `STRONG` ve `fontWeight` değeri `bold` ya da ≥ 600 olan öğeler.
  - İtalik sayılanlar: `I`, `EM` ve `fontStyle` değeri `italic` olan öğeler.
  - `BR` bir `\n` olur. `DIV` ve `P` öğeleri, kendilerinden önce içerik varsa `\n` ile ayrılır.
  - Aynı biçimdeki bitişik parçalar birleştirilir.
  - Boş kalın parçalar atılır. Sondaki tek `\n` atılır.

- [ ] Testler: gidiş-dönüş (`'Yeni Özel **Şablon** Başlığı'`, `'a\nb'`, `'*it* ve **kal**'`, `'<x> & y'`), Review Focus 1–4, `fontWeight:'700'` olan span kalın sayılır.
- [ ] RED → uygula → GREEN, `npm test` + `npm run lint`, commit `feat(text): markdown <-> html converters for bold editing`.

### Task 2: RichTextField + ManualTextsEditor

**Files:** Create `src/components/RichTextField.tsx`, `src/components/ManualTextsEditor.tsx`, `src/components/ManualTextsEditor.css`

**Interfaces:**
- `RichTextField(props: { id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean })`
  - Bir `div[contentEditable]` çizer: `role="textbox"`, `aria-multiline`, `aria-labelledby` bir label'a bağlıdır.
  - `onInput` olunca `htmlToMarkdown(el)` çalışır ve `onChange` çağrılır. Son yayılan değer bir ref'te tutulur.
  - Ctrl/Cmd+B ile `execCommand('bold')` çalışır.
  - `onPaste` olunca düz metin, `insertText` ile eklenir.
- `ManualTextsEditor(props: { open: boolean; groups: ManualTextGroup[]; texts: ManualTexts; onChange: (pageId: string, fieldId: string, v: string) => void; onClose: () => void })`
  - `role="dialog"` ve `aria-modal` taşır. Esc ile kapanır. Açılınca ilk kutuya odaklanır.
  - Kalın düğmesi `onMouseDown` olayında `preventDefault` çağırır, böylece seçim kaybolmaz; ardından `execCommand('bold')` çalışır.
  - `document.body` portalı olarak açılır.
- [ ] `npm run lint` temiz, commit `feat(batch): full-screen manual text editor with bold`.

### Task 3: Karttaki özet ve bağlantı

**Files:** Modify `src/components/BatchWorkspace.tsx`, `src/components/BatchCreate.css`

- [ ] AI kapalıyken formun yerine şunlar gelir:
  - Grup ve alan başına tek satırlık bir özet. Bu satırda `**` işaretleri temizlenir ve satır CSS ile kesilir.
  - `Metinleri düzenle` düğmesi: Maximize2 ikonlu ve tam genişliktir.
  - Mevcut ipucu metni.
- [ ] `editorOpen` state'i eklenir. Pencere `effectiveManualTexts` ve `setManualText` ile bağlanır.
- [ ] `npm test`, `npm run lint`; tarayıcıda masaüstü ve 375 px'te açma, kalın, Esc ve üretimdeki kalın sonucu kontrol edilir; commit `feat(batch): manual text summary opens full-screen editor`.
