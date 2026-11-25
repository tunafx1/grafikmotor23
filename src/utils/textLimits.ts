/** Suggested maximum lengths so texts fit their area on the design. */
const ROLE_LIMITS: Record<string, number> = {
  title: 40, subtitle: 60, description: 160, callToAction: 30, label: 30, date: 30, price: 20,
};

type FieldLike = { role: string; name: string };

const isTitle = (f: FieldLike) => f.role === 'title' || (f.role === 'normal' && /başlık/i.test(f.name));
const isDescription = (f: FieldLike) => f.role === 'description' || (f.role === 'normal' && /açıklama|metin|detay/i.test(f.name));

export function fieldCharLimit(field: FieldLike): number | undefined {
  if (ROLE_LIMITS[field.role]) return ROLE_LIMITS[field.role];
  if (isTitle(field)) return ROLE_LIMITS.title;
  if (isDescription(field)) return ROLE_LIMITS.description;
  return undefined;
}

/** Characters the reader sees: formatting markers are not counted. */
export const visibleLength = (text: string) => Array.from(text.replace(/\*/g, '')).length;

export function fieldPlaceholder(field: FieldLike, example: string): string {
  const cleaned = example.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned) return `Örn. ${cleaned}`;
  if (isTitle(field)) return 'Örn. Yaz okulu başlıyor';
  if (isDescription(field)) return 'Örn. Kayıtlar 1 Haziran’a kadar açık. Detaylar profildeki bağlantıda.';
  return 'Metni buraya yaz';
}

/** Single-line fields: titles and short labels. */
export const isSingleLineField = (field: FieldLike) => (fieldCharLimit(field) ?? 999) <= 60;
