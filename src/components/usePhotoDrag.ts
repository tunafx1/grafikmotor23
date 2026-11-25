import React, { useEffect, useRef, useState } from 'react';
import { computeInsertIndex, type CardRect } from '../utils/photoReorder';

export type PhotoDragState = {
  ids: Set<string>;
  /** Pointer position in the viewport, for the floating preview. */
  x: number;
  y: number;
  insertIndex: number;
  /** Drop indicator position relative to the grid. */
  bar: { left: number; top: number; height: number } | null;
};

type Pending = {
  id: string; pointerId: number; type: string; startX: number; startY: number;
  el: HTMLElement; timer: number | null; started: boolean;
};

const MOUSE_THRESHOLD = 5;
const TOUCH_SLOP = 8;
const LONG_PRESS_MS = 280;
const EDGE = 56;

/**
 * Drag-and-drop reordering for the photo grid. Nothing moves while dragging:
 * a floating preview follows the pointer and a bar shows the drop position;
 * the order changes once, on release. Mouse starts after a small move, touch
 * after a short hold (so a normal swipe still scrolls). A click/tap without a
 * drag toggles the photo's selection; selected photos move together.
 */
export function usePhotoDrag(opts: {
  gridRef: React.RefObject<HTMLElement | null>;
  disabled: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onDrop: (ids: Set<string>, insertIndex: number) => void;
}) {
  const [drag, setDrag] = useState<PhotoDragState | null>(null);
  const pending = useRef<Pending | null>(null);
  const dragRef = useRef<PhotoDragState | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // While dragging on touch, stop the page from scrolling under the finger.
  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => { if (dragRef.current) event.preventDefault(); };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => window.removeEventListener('touchmove', onTouchMove);
  }, []);

  const publish = (next: PhotoDragState | null) => { dragRef.current = next; setDrag(next); };

  const measure = (ids: Set<string>, x: number, y: number): PhotoDragState | null => {
    const grid = optsRef.current.gridRef.current;
    if (!grid) return null;
    const box = grid.getBoundingClientRect();
    const rects: CardRect[] = Array.from(grid.querySelectorAll<HTMLElement>('[data-photo-id]')).map(el => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.photoId!, left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height };
    });
    const px = x - box.left, py = y - box.top;
    const insertIndex = computeInsertIndex(rects, px, py, ids);
    const rest = rects.filter(r => !ids.has(r.id));
    let bar: PhotoDragState['bar'] = null;
    if (rest.length) {
      const before = rest[insertIndex];
      const after = rest[insertIndex - 1];
      bar = before
        ? { left: before.left - 5, top: before.top, height: before.height }
        : { left: after.left + after.width + 3, top: after.top, height: after.height };
    }
    return { ids, x, y, insertIndex, bar };
  };

  const autoScroll = (y: number) => {
    const grid = optsRef.current.gridRef.current;
    const scroller = grid?.closest<HTMLElement>('[data-photo-scroll]');
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      const r = scroller.getBoundingClientRect();
      if (y < r.top + EDGE) scroller.scrollTop -= 14;
      else if (y > r.bottom - EDGE) scroller.scrollTop += 14;
    } else if (y < EDGE) window.scrollBy(0, -14);
    else if (y > window.innerHeight - EDGE) window.scrollBy(0, 14);
  };

  const start = (p: Pending, x: number, y: number) => {
    p.started = true;
    const { selected } = optsRef.current;
    const ids = selected.has(p.id) && selected.size > 1 ? new Set(selected) : new Set([p.id]);
    try { p.el.setPointerCapture(p.pointerId); } catch { /* pointer already released */ }
    if (p.type === 'touch') navigator.vibrate?.(12);
    publish(measure(ids, x, y));
  };

  const clear = () => {
    if (pending.current?.timer) window.clearTimeout(pending.current.timer);
    pending.current = null;
    publish(null);
  };

  const handlers = (id: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (optsRef.current.disabled) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if ((event.target as HTMLElement).closest('button, input, label')) return;
      const p: Pending = {
        id, pointerId: event.pointerId, type: event.pointerType, startX: event.clientX, startY: event.clientY,
        el: event.currentTarget, timer: null, started: false,
      };
      if (p.type !== 'mouse') {
        p.timer = window.setTimeout(() => { if (pending.current === p) start(p, p.startX, p.startY); }, LONG_PRESS_MS);
      }
      pending.current = p;
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const p = pending.current;
      if (!p || p.pointerId !== event.pointerId) return;
      if (!p.started) {
        const moved = Math.hypot(event.clientX - p.startX, event.clientY - p.startY);
        if (p.type === 'mouse') { if (moved > MOUSE_THRESHOLD) start(p, event.clientX, event.clientY); }
        else if (moved > TOUCH_SLOP) clear(); // a swipe before the hold finished: let the page scroll
        return;
      }
      event.preventDefault();
      autoScroll(event.clientY);
      const current = dragRef.current;
      if (current) publish(measure(current.ids, event.clientX, event.clientY));
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      const p = pending.current;
      if (!p || p.pointerId !== event.pointerId) return;
      const current = dragRef.current;
      if (p.started && current) optsRef.current.onDrop(current.ids, current.insertIndex);
      else if (!p.started) optsRef.current.onToggleSelect(id);
      clear();
    },
    onPointerCancel: () => clear(),
    onContextMenu: (event: React.MouseEvent) => { if (pending.current) event.preventDefault(); },
  });

  return { drag, handlers };
}
