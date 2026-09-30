import test from 'node:test';
import assert from 'node:assert/strict';
import { findTopmostUnlockedElement } from '../src/utils/canvasHitTest';
import type { Region, FixedElement } from '../src/types';

const region = (overrides: Partial<Region> = {}): Region => ({
  id: 'region-1', name: 'Başlık', type: 'text', x: 0, y: 0, width: 100, height: 100,
  backgroundColor: 'transparent', opacity: 1, borderColor: '#000', borderWidth: 0, borderRadius: 0,
  isDynamic: true, textStyle: { fontFamily: 'Inter', fontSize: 20, color: '#000', fontWeight: 'normal', lineHeight: 1.2, align: 'left' },
  ...overrides,
} as Region);

const fixed = (overrides: Partial<FixedElement> = {}): FixedElement => ({
  id: 'fixed-1', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 100, height: 100,
  backgroundColor: '#000', opacity: 1, zIndex: 0,
  ...overrides,
} as FixedElement);

test('returns null when nothing is at the given coordinates', () => {
  const result = findTopmostUnlockedElement({ regions: [region()], fixedElements: [] }, 500, 500);
  assert.equal(result, null);
});

test('picks the topmost element by zIndex when elements overlap', () => {
  const bottom = region({ id: 'bottom', zIndex: 0 } as Partial<Region>);
  const top = region({ id: 'top', zIndex: 5 } as Partial<Region>);
  const result = findTopmostUnlockedElement({ regions: [bottom, top], fixedElements: [] }, 50, 50);
  assert.equal(result?.id, 'top');
});

test('skips locked elements and falls through to the unlocked element underneath', () => {
  const lockedTop = region({ id: 'locked-top', zIndex: 5, locked: true } as Partial<Region>);
  const unlockedBottom = region({ id: 'unlocked-bottom', zIndex: 0 } as Partial<Region>);
  const result = findTopmostUnlockedElement({ regions: [unlockedBottom, lockedTop], fixedElements: [] }, 50, 50);
  assert.equal(result?.id, 'unlocked-bottom');
});

test('skips hidden elements listed in hiddenElements', () => {
  const hiddenEl = region({ id: 'hidden-el', zIndex: 5 } as Partial<Region>);
  const visibleEl = region({ id: 'visible-el', zIndex: 0 } as Partial<Region>);
  const result = findTopmostUnlockedElement({ regions: [visibleEl, hiddenEl], fixedElements: [] }, 50, 50, ['hidden-el']);
  assert.equal(result?.id, 'visible-el');
});

test('hit-tests a circle shape by radius, not its bounding box', () => {
  const circle = fixed({ id: 'circle-1', shapeType: 'circle', x: 100, y: 100, width: 100, height: 100 });
  // Center (100,100), radius 50: corner of bounding box (60,60) is outside the circle.
  const outsideCorner = findTopmostUnlockedElement({ regions: [], fixedElements: [circle] }, 60, 60);
  assert.equal(outsideCorner, null);
  const insideCircle = findTopmostUnlockedElement({ regions: [], fixedElements: [circle] }, 100, 100);
  assert.equal(insideCircle?.id, 'circle-1');
});

test('fixed elements render beneath regions at the same zIndex', () => {
  const fixedEl = fixed({ id: 'fixed-el', zIndex: 0 });
  const regionEl = region({ id: 'region-el', zIndex: 0 } as Partial<Region>);
  const result = findTopmostUnlockedElement({ regions: [regionEl], fixedElements: [fixedEl] }, 50, 50);
  assert.equal(result?.id, 'region-el');
});
