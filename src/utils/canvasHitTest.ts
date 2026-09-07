import type { Region, FixedElement } from '../types';

export interface HitTestResult {
  id: string;
  type: 'region' | 'fixed';
  item: Region | FixedElement;
}

/**
 * Finds the topmost UNLOCKED, visible element at canvas coordinates (x, y).
 * If a layer at that coordinate is locked, it passes through to whatever layer is underneath.
 */
export function findTopmostUnlockedElement(
  template: { regions?: Region[]; fixedElements?: FixedElement[] },
  x: number,
  y: number,
  hiddenElements: string[] = []
): HitTestResult | null {
  const renderList = [
    ...(template.fixedElements || []).map((el, idx) => ({ item: el, isRegion: false, order: 0, index: idx, zIndex: el.zIndex ?? 0 })),
    ...(template.regions || []).map((reg, idx) => ({ item: reg, isRegion: true, order: 1, index: idx, zIndex: reg.zIndex ?? 0 }))
  ];

  // Sort by zIndex, then order, then index (matches canvasRenderer.ts)
  renderList.sort((a, b) => {
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.index - b.index;
  });

  // Check hit targets in REVERSE rendering order (topmost visual element first)
  for (let i = renderList.length - 1; i >= 0; i--) {
    const node = renderList[i];
    const el = node.item;

    // Skip if hidden
    if (hiddenElements.includes(el.id) || el.hidden) {
      continue;
    }

    // Skip if locked (Requirement: locked elements pass-through to topmost unlocked element in that click area)
    if (el.locked) {
      continue;
    }

    if (node.isRegion) {
      const reg = el as Region;
      if (x >= reg.x && x <= reg.x + reg.width && y >= reg.y && y <= reg.y + reg.height) {
        return { id: reg.id, type: 'region', item: reg };
      }
    } else {
      const fixed = el as FixedElement;
      if (fixed.type === 'shape' && fixed.shapeType === 'circle') {
        const dist = Math.sqrt((x - fixed.x) ** 2 + (y - fixed.y) ** 2);
        if (dist <= fixed.width / 2) {
          return { id: fixed.id, type: 'fixed', item: fixed };
        }
      } else {
        if (x >= fixed.x && x <= fixed.x + fixed.width && y >= fixed.y && y <= fixed.y + fixed.height) {
          return { id: fixed.id, type: 'fixed', item: fixed };
        }
      }
    }
  }

  return null;
}
