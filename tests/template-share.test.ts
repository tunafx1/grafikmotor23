import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShareCode,
  normalizeShareCode,
  SHARE_QUERY_PARAM
} from '../src/lib/templatesDb';

test('formatShareCode splits 8-character codes into 4-4 blocks', () => {
  assert.equal(formatShareCode('ABCD2345'), 'ABCD-2345');
  assert.equal(formatShareCode('short'), 'short');
});

test('normalizeShareCode parses raw codes, hyphenated codes, and full URLs', () => {
  // Raw code
  assert.equal(normalizeShareCode('ABCD2345'), 'ABCD2345');
  // Hyphenated
  assert.equal(normalizeShareCode('abcd-2345'), 'ABCD2345');
  // With whitespace
  assert.equal(normalizeShareCode('  ABCD 2345  '), 'ABCD2345');
  // Full share link
  assert.equal(normalizeShareCode(`https://grafik-motoru.app/?${SHARE_QUERY_PARAM}=ABCD2345`), 'ABCD2345');
  assert.equal(normalizeShareCode(`http://localhost:5173/?${SHARE_QUERY_PARAM}=ABCD-2345`), 'ABCD2345');

  // Invalid inputs (wrong length, invalid chars like 0/O/1/I)
  assert.equal(normalizeShareCode(''), null);
  assert.equal(normalizeShareCode('TOO-SHORT'), null);
  assert.equal(normalizeShareCode('ABC01234'), null); // Contains 0 and 1 which are excluded from alphabet
  assert.equal(normalizeShareCode('INVALID-LONG-CODE'), null);
});
