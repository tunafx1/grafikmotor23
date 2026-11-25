/** Card geometry in one coordinate space (e.g. relative to the grid). */
export type CardRect = { id: string; left: number; top: number; width: number; height: number };

/**
 * Where the dragged cards would land, as an index into the list WITHOUT them.
 * The card under (or nearest to) the pointer decides: its left half means
 * "before it", its right half "after it".
 */
export function computeInsertIndex(rects: CardRect[], x: number, y: number, movingIds: Set<string>): number {
  const rest = rects.filter(rect => !movingIds.has(rect.id));
  if (!rest.length) return 0;
  const inside = rest.findIndex(r => x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height);
  let index = inside;
  if (index === -1) {
    let best = Infinity;
    rest.forEach((r, i) => {
      const distance = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (distance < best) { best = distance; index = i; }
    });
  }
  const target = rest[index];
  return x < target.left + target.width / 2 ? index : index + 1;
}

/** Moves the selected items, keeping their own order, to insertIndex of the remaining list. */
export function moveToIndex<T>(list: T[], getId: (item: T) => string, movingIds: Set<string>, insertIndex: number): T[] {
  const moving = list.filter(item => movingIds.has(getId(item)));
  if (!moving.length) return list;
  const rest = list.filter(item => !movingIds.has(getId(item)));
  const at = Math.max(0, Math.min(rest.length, insertIndex));
  return [...rest.slice(0, at), ...moving, ...rest.slice(at)];
}

/**
 * Grid slot under the pointer (x/y relative to the grid's top-left), clamped to
 * 0..count-1. Uses the grid's own geometry rather than card positions, so cards
 * sliding aside to open a gap can never change the answer mid-animation.
 */
export function slotFromPoint(g: { x: number; y: number; cols: number; cellWidth: number; cellHeight: number; gapX: number; gapY: number; count: number }): number {
  if (g.count <= 0) return 0;
  const col = Math.min(g.cols - 1, Math.max(0, Math.floor(g.x / (g.cellWidth + g.gapX))));
  const row = Math.max(0, Math.floor(g.y / (g.cellHeight + g.gapY)));
  return Math.min(g.count - 1, row * g.cols + col);
}
