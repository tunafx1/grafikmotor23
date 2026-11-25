import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldCharLimit, visibleLength, fieldPlaceholder } from '../src/utils/textLimits';

test('limits come from the text role', () => {
  assert.equal(fieldCharLimit({ role: 'title', name: 'X' }), 40);
  assert.equal(fieldCharLimit({ role: 'description', name: 'X' }), 160);
});

test('fields without a role fall back to their name', () => {
  assert.equal(fieldCharLimit({ role: 'normal', name: 'Ana Başlık Alanı' }), 40);
  assert.equal(fieldCharLimit({ role: 'normal', name: 'Açıklama yazısı' }), 160);
  assert.equal(fieldCharLimit({ role: 'normal', name: 'Etiket' }), undefined);
});

test('visible length ignores bold/italic markers and counts Turkish letters once', () => {
  assert.equal(visibleLength('Yaz **okulu** başlıyor'), 'Yaz okulu başlıyor'.length);
  assert.equal(visibleLength(''), 0);
});

test('placeholders show the template example when there is one', () => {
  assert.equal(fieldPlaceholder({ role: 'title', name: 'Başlık' }, 'Yeni **Özel** Başlık'), 'Örn. Yeni Özel Başlık');
  assert.equal(fieldPlaceholder({ role: 'title', name: 'Başlık' }, ''), 'Örn. Yaz okulu başlıyor');
});
