import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeTemplate } from '../src/utils/templateResize';
import type { DesignTemplate } from '../src/types';

const template = {
  id: 'resize-test', name: 'Boyut testi', width: 1000, height: 1000,
  backgroundColor: '#fff', palette: { primary: '#000', accent: '#000', text: '#000', bg: '#fff' },
  regions: [{
    id: 'title', name: 'Başlık', type: 'text', x: 100, y: 200, width: 800, height: 100,
    backgroundColor: 'transparent', opacity: 1, borderColor: '#000', borderWidth: 2, borderRadius: 10,
    isDynamic: true, textStyle: { fontFamily: 'Inter', fontSize: 40, color: '#000', fontWeight: 'bold', lineHeight: 1.2, align: 'left' },
  }],
  fixedElements: [],
  pages: [{ id: 'page-1', name: 'Sayfa 1', regions: [{
    id: 'image', name: 'Görsel', type: 'image', x: 100, y: 100, width: 400, height: 400,
    backgroundColor: '#eee', opacity: 1, borderColor: '#000', borderWidth: 2, borderRadius: 20, isDynamic: true,
  }], fixedElements: [] }],
} as DesignTemplate;

test('template resize scales every page and preserves the source template', () => {
  const resized = resizeTemplate(template, 1080, 1350);
  assert.equal(resized.width, 1080);
  assert.equal(resized.height, 1350);
  assert.deepEqual([resized.regions[0].x, resized.regions[0].y], [108, 270]);
  assert.equal(resized.regions[0].textStyle?.fontSize, 43.2);
  assert.deepEqual([resized.pages![0].regions[0].width, resized.pages![0].regions[0].height], [432, 540]);
  assert.equal(template.width, 1000);
  assert.equal(template.pages![0].regions[0].width, 400);
});

test('template resize rejects invalid dimensions', () => {
  assert.throws(() => resizeTemplate(template, 0, 1080), /pozitif/);
});
