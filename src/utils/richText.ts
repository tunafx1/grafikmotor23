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

export function htmlToMarkdown(root: RichNode): string {
  const segments: Segment[] = [];
  const newline = () => segments.push({ text: '\n', bold: false, italic: false });

  const walk = (node: RichNode, bold: boolean, italic: boolean, isRoot: boolean) => {
    if (node.nodeType === 3) {
      if (node.textContent) segments.push({ text: node.textContent, bold, italic });
      return;
    }
    if (node.nodeType !== 1) return;
    const name = node.nodeName.toUpperCase();
    const nextBold = bold || name === 'B' || name === 'STRONG' || isHeavy(node.style?.fontWeight);
    const nextItalic = italic || name === 'I' || name === 'EM' || node.style?.fontStyle === 'italic';
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

  const markdown = merged.map(({ text, bold, italic }) => {
    if (text === '\n') return '\n';
    const marker = (bold ? '**' : '') + (italic ? '*' : '');
    return marker ? `${marker}${text}${[...marker].reverse().join('')}` : text;
  }).join('');
  return markdown.replace(/\n+$/, '');
}
