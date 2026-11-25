import { parseMarkdownText } from '../canvasRenderer';

/**
 * Texts are stored as `**bold**`, `*italic*` and `\n` because canvasRenderer
 * draws from that format. The rich text field edits HTML, so these two
 * converters keep the stored text and the visible formatting in sync.
 */

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function markdownToHtml(text: string): string {
  return parseMarkdownText(text).map(span => {
    if (span.text === '\n') return '<br>';
    let html = escapeHtml(span.text);
    if (span.isItalic) html = `<em>${html}</em>`;
    if (span.isBold) html = `<strong>${html}</strong>`;
    return html;
  }).join('');
}

/** `*` is the renderer's formatting marker, so typed asterisks cannot be stored as text. */
export const stripMarkerChars = (text: string) => text.replace(/\*/g, '');

/** The few DOM properties the converter reads; a real DOM Node satisfies it. */
export type RichNode = {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: ArrayLike<RichNode>;
  style?: { fontWeight?: string; fontStyle?: string };
};

type Segment = { text: string; bold: boolean; italic: boolean };

const BLOCKS = new Set(['DIV', 'P']);
const isHeavy = (weight?: string) => weight === 'bold' || weight === 'bolder' || (!!weight && Number(weight) >= 600);
const isLight = (weight?: string) => weight === 'normal' || weight === 'lighter' || (!!weight && Number(weight) < 600);

export function htmlToMarkdown(root: RichNode): string {
  const segments: Segment[] = [];
  const newline = () => segments.push({ text: '\n', bold: false, italic: false });

  const walk = (node: RichNode, bold: boolean, italic: boolean, isRoot: boolean) => {
    if (node.nodeType === 3) {
      const text = stripMarkerChars(node.textContent || '');
      if (text) segments.push({ text, bold, italic });
      return;
    }
    if (node.nodeType !== 1) return;
    const name = node.nodeName.toUpperCase();
    // An explicit normal weight/style (browsers emit it when un-bolding inside a bold run) removes the format.
    const weight = node.style?.fontWeight;
    const fontStyle = node.style?.fontStyle;
    const nextBold = name === 'B' || name === 'STRONG' || isHeavy(weight) ? true : isLight(weight) ? false : bold;
    const nextItalic = name === 'I' || name === 'EM' || fontStyle === 'italic' ? true : fontStyle === 'normal' ? false : italic;
    // Browsers put each new line in its own block; every block after content starts a line.
    if (!isRoot && BLOCKS.has(name) && segments.length) newline();
    const children = Array.from(node.childNodes);
    children.forEach((child, index) => {
      if (child.nodeType === 1 && child.nodeName.toUpperCase() === 'BR') {
        // A trailing <br> in a block is the browser's placeholder, not a typed line break.
        if (index !== children.length - 1) newline();
        return;
      }
      walk(child, nextBold, nextItalic, false);
    });
  };
  walk(root, false, false, true);

  // Merge neighbours with the same formatting so <b>a</b><b>b</b> becomes **ab**.
  const merged: Segment[] = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.text !== '\n' && segment.text !== '\n' && last.bold === segment.bold && last.italic === segment.italic) last.text += segment.text;
    else merged.push({ ...segment });
  }

  // canvasRenderer toggles formatting on every marker, so emit only the changes between
  // neighbouring segments; wrapping each segment separately would create `****` runs.
  let markdown = '';
  let open = { bold: false, italic: false };
  const toggleTo = (bold: boolean, italic: boolean) => {
    if (open.bold !== bold) markdown += '**';
    if (open.italic !== italic) markdown += '*';
    open = { bold, italic };
  };
  for (const segment of merged) {
    if (segment.text === '\n') { toggleTo(false, false); markdown += '\n'; continue; }
    toggleTo(segment.bold, segment.italic);
    markdown += segment.text;
  }
  toggleTo(false, false);
  return markdown.replace(/\n+$/, '');
}
