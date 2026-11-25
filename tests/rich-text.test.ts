import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml, htmlToMarkdown, stripMarkerChars, type RichNode } from '../src/utils/richText';
import { parseMarkdownText } from '../src/canvasRenderer';

// Minimal DOM-like tree builders so the converter is tested without a browser.
const t = (text: string): RichNode => ({ nodeType: 3, nodeName: '#text', textContent: text, childNodes: [] });
const el = (name: string, children: RichNode[] = [], style?: RichNode['style']): RichNode => ({
  nodeType: 1, nodeName: name, textContent: children.map(c => c.textContent ?? '').join(''), childNodes: children, style,
});

/** Parse markdownToHtml's own output (strong/em/br + escaped text) back into a RichNode tree. */
function parseOwnHtml(html: string): RichNode {
  const root = el('DIV');
  const stack: RichNode[] = [root];
  const unescape = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const push = (n: RichNode) => (stack[stack.length - 1].childNodes as RichNode[]).push(n);
  for (const part of html.split(/(<\/?(?:strong|em)>|<br>)/)) {
    if (!part) continue;
    if (part === '<br>') push(el('BR'));
    else if (part === '<strong>' || part === '<em>') { const n = el(part === '<strong>' ? 'STRONG' : 'EM'); push(n); stack.push(n); }
    else if (part === '</strong>' || part === '</em>') stack.pop();
    else push(t(unescape(part)));
  }
  return root;
}
const roundTrip = (text: string) => htmlToMarkdown(parseOwnHtml(markdownToHtml(text)));

test('markdownToHtml renders bold, italic and line breaks without markers', () => {
  assert.equal(markdownToHtml('Yeni Özel **Şablon** Başlığı'), 'Yeni Özel <strong>Şablon</strong> Başlığı');
  assert.equal(markdownToHtml('*it* ve **kal**\nalt'), '<em>it</em> ve <strong>kal</strong><br>alt');
});

test('markdownToHtml escapes HTML characters', () => {
  assert.equal(markdownToHtml('<x> & "y"'), '&lt;x&gt; &amp; &quot;y&quot;');
});

test('text survives a markdown -> html -> markdown round trip', () => {
  for (const text of ['Yeni Özel **Şablon** Başlığı', 'a\nb', '*it* ve **kal**', '<x> & y', 'düz metin']) {
    assert.equal(roundTrip(text), text);
  }
});

test('unclosed bold marker does not crash and keeps the visible text', () => {
  assert.equal(roundTrip('Başlık **açık kaldı'), 'Başlık **açık kaldı**');
});

test('browser div/br lines become newlines without a trailing newline', () => {
  const root = el('DIV', [t('bir'), el('DIV', [t('iki')]), el('DIV', [el('BR')])]);
  assert.equal(htmlToMarkdown(root), 'bir\niki');
  assert.equal(htmlToMarkdown(el('DIV', [t('a'), el('BR'), t('b'), el('BR')])), 'a\nb');
});

test('adjacent bold pieces merge and empty bold pieces are dropped', () => {
  assert.equal(htmlToMarkdown(el('DIV', [el('B', [t('a')]), el('STRONG', [t('b')]), t(' c')])), '**ab** c');
  assert.equal(htmlToMarkdown(el('DIV', [t('x'), el('B', []), t('y')])), 'xy');
});

test('spans with heavy font-weight count as bold', () => {
  assert.equal(htmlToMarkdown(el('DIV', [t('a '), el('SPAN', [t('kalın')], { fontWeight: '700' })])), 'a **kalın**');
  assert.equal(htmlToMarkdown(el('DIV', [el('SPAN', [t('ince')], { fontWeight: '400' })])), 'ince');
});

// Re-parse the stored text with the renderer's own parser to compare formatting, not marker spelling.
const spansOf = (text: string) => parseMarkdownText(text).filter(s => s.text !== '\n').map(s => `${s.text}|${s.isBold ? 'B' : ''}${s.isItalic ? 'I' : ''}`);

test('bold inside italic keeps both formats when re-parsed by the renderer', () => {
  const cases: [RichNode, string[]][] = [
    [el('DIV', [el('EM', [t('a'), el('STRONG', [t('b')]), t('c')])]), ['a|I', 'b|BI', 'c|I']],
    [el('DIV', [el('EM', [t('a'), el('STRONG', [t('b')])])]), ['a|I', 'b|BI']],
    [el('DIV', [el('EM', [el('STRONG', [t('a')]), t('b')])]), ['a|BI', 'b|I']],
    [el('DIV', [el('B', [t('a')]), t(' '), el('I', [t('b')])]), ['a|B', ' |', 'b|I']],
  ];
  for (const [root, expected] of cases) assert.deepEqual(spansOf(htmlToMarkdown(root)), expected);
});

test('explicit normal weight or style inside bold/italic removes the format', () => {
  assert.equal(htmlToMarkdown(el('DIV', [el('STRONG', [t('a'), el('SPAN', [t('b')], { fontWeight: 'normal' }), t('c')])])), '**a**b**c**');
  assert.equal(htmlToMarkdown(el('DIV', [el('EM', [t('a'), el('SPAN', [t('b')], { fontStyle: 'normal' })])])), '*a*b');
});

test('stripMarkerChars removes asterisks the renderer would treat as formatting', () => {
  assert.equal(stripMarkerChars('5*3 = 15 **'), '53 = 15 ');
});
