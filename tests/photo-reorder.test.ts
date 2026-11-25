import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInsertIndex, moveToIndex, slotFromPoint, type CardRect } from '../src/utils/photoReorder';

// Two rows of three 100x100 cards with 10px gaps: a b c / d e f
const rects: CardRect[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => ({ id, left: (i % 3) * 110, top: Math.floor(i / 3) * 110, width: 100, height: 100 }));
const ids = (list: string[]) => list.join('');

test('pointer on the left half of a card inserts before it, right half after it', () => {
  assert.equal(computeInsertIndex(rects, 120, 50, new Set(['a'])), 0); // left half of b -> before b (rest: b c d e f)
  assert.equal(computeInsertIndex(rects, 190, 50, new Set(['a'])), 1); // right half of b -> after b
  assert.equal(computeInsertIndex(rects, 300, 160, new Set(['a'])), 5); // right half of f -> end
});

test('pointer in a gap or outside snaps to the nearest card', () => {
  assert.equal(computeInsertIndex(rects, 104, 50, new Set(['f'])), 1); // gap between a and b -> after a
  assert.equal(computeInsertIndex(rects, 900, 900, new Set(['a'])), 5); // far bottom-right -> end
  assert.equal(computeInsertIndex([], 10, 10, new Set()), 0);
});

test('moveToIndex moves one item and keeps the rest in order', () => {
  const list = ['a', 'b', 'c', 'd'];
  assert.equal(ids(moveToIndex(list, x => x, new Set(['a']), 2)), 'bcad');
  assert.equal(ids(moveToIndex(list, x => x, new Set(['d']), 0)), 'dabc');
  assert.equal(ids(moveToIndex(list, x => x, new Set(['b']), 1)), 'abcd');
});

test('moveToIndex moves a multi-selection together in its original order', () => {
  // rest = b c e; insert index 3 = after e
  assert.equal(ids(moveToIndex(['a', 'b', 'c', 'd', 'e'], x => x, new Set(['d', 'a']), 3)), 'bcead');
  assert.equal(ids(moveToIndex(['a', 'b', 'c', 'd', 'e'], x => x, new Set(['a', 'd']), 1)), 'badce');
});

test('moveToIndex clamps out-of-range indexes and does not mutate the input', () => {
  const list = ['a', 'b', 'c'];
  assert.equal(ids(moveToIndex(list, x => x, new Set(['a']), 99)), 'bca');
  assert.equal(ids(moveToIndex(list, x => x, new Set(['c']), -4)), 'cab');
  assert.equal(ids(list), 'abc');
});

// Grid: 3 columns of 100x140 cells with 12px gaps.
const grid = { cols: 3, cellWidth: 100, cellHeight: 140, gapX: 12, gapY: 12 };

test('slotFromPoint maps the pointer to the grid cell under it', () => {
  assert.equal(slotFromPoint({ ...grid, x: 50, y: 70, count: 6 }), 0);
  assert.equal(slotFromPoint({ ...grid, x: 160, y: 70, count: 6 }), 1);
  assert.equal(slotFromPoint({ ...grid, x: 260, y: 200, count: 6 }), 5);
});

test('slotFromPoint clamps to the existing slots and handles points outside the grid', () => {
  assert.equal(slotFromPoint({ ...grid, x: 260, y: 900, count: 6 }), 5);
  assert.equal(slotFromPoint({ ...grid, x: -40, y: -40, count: 6 }), 0);
  assert.equal(slotFromPoint({ ...grid, x: 999, y: 70, count: 6 }), 2);
  assert.equal(slotFromPoint({ ...grid, x: 50, y: 70, count: 0 }), 0);
});

test('a point in the gap belongs to the cell before it', () => {
  assert.equal(slotFromPoint({ ...grid, x: 105, y: 70, count: 6 }), 0);
});
