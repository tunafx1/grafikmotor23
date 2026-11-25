import React, { useEffect, useRef, useState } from 'react';
import { slotFromPoint } from '../utils/photoReorder';

export type PhotoDragState = {
  id: string;
  /** Slot the dragged photo would land in; the grid renders it there as a gap. */
  index: number;
  /** Top-left of the floating card, in viewport pixels. */
  left: number;
  top: number;
  width: number;
  height: number;
  src: string;
};

type Pending = {
  id: string; pointerId: number; type: string; startX: number; startY: number;
  el: HTMLElement; timer: number | null; started: boolean; grabX: number; grabY: number;
};

const MOUSE_THRESHOLD = 4;
const TOUCH_SLOP = 8;
const LONG_PRESS_MS = 240;
const EDGE = 64;

const scrollParent = (el: HTMLElement | null): HTMLElement | null => {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
};

/**
 * Drag-and-drop ordering for the photo grid. The picked-up card floats under
 * the pointer (held at the point where it was grabbed) while the others slide
 * aside to open a gap where it will land; releasing drops it into that gap.
 * The landing slot comes from the grid's rows/columns, not from the moving
 * cards, so sliding cards never make the gap jump back and forth.
 * Mouse: press and move. Touch: hold briefly, then move (a quick swipe scrolls).
 */
export function usePhotoDrag(opts: {
  gridRef: React.RefObject<HTMLElement | null>;
  disabled: boolean;
  count: number;
  getSrc: (id: string) => string;
  indexOf: (id: string) => number;
  onDrop: (id: string, index: number) => void;
}) {
  const [drag, setDrag] = useState<PhotoDragState | null>(null);
  const pending = useRef<Pending | null>(null);
  const dragRef = useRef<PhotoDragState | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // While dragging on touch, keep the page from scrolling under the finger.
  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => { if (dragRef.current) event.preventDefault(); };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => window.removeEventListener('touchmove', onTouchMove);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-photo-dragging', !!drag);
    return () => document.body.classList.remove('is-photo-dragging');
  }, [!!drag]);

  const publish = (next: PhotoDragState | null) => { dragRef.current = next; setDrag(next); };

  const slotAt = (x: number, y: number, fallback: number) => {
    const grid = optsRef.current.gridRef.current;
    const cell = grid?.querySelector<HTMLElement>('[data-photo-id]');
    if (!grid || !cell) return fallback;
    const style = getComputedStyle(grid);
    const box = grid.getBoundingClientRect();
    return slotFromPoint({
      x: x - box.left, y: y - box.top,
      cols: Math.max(1, style.gridTemplateColumns.split(' ').filter(Boolean).length),
      cellWidth: cell.offsetWidth, cellHeight: cell.offsetHeight,
      gapX: parseFloat(style.columnGap) || 0, gapY: parseFloat(style.rowGap) || 0,
      count: optsRef.current.count,
    });
  };

  const autoScroll = (y: number) => {
    const scroller = scrollParent(optsRef.current.gridRef.current);
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
    const step = y < top + EDGE ? -12 : y > bottom - EDGE ? 12 : 0;
    if (!step) return;
    if (scroller) scroller.scrollTop += step; else window.scrollBy(0, step);
  };

  const start = (p: Pending, x: number, y: number) => {
    p.started = true;
    const rect = p.el.getBoundingClientRect();
    if (p.type === 'touch') navigator.vibrate?.(12);
    publish({
      id: p.id, index: optsRef.current.indexOf(p.id),
      left: x - p.grabX, top: y - p.grabY, width: rect.width, height: rect.height,
      src: optsRef.current.getSrc(p.id),
    });
  };

  const clear = () => {
    detach.current();
    if (pending.current?.timer) window.clearTimeout(pending.current.timer);
    pending.current = null;
    publish(null);
  };

  // Moves and release are read on the window: the dragged card changes place in the
  // DOM while the others slide, so element-level listeners would lose the pointer.
  const onMove = (event: PointerEvent) => {
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
    if (!current) return;
    publish({
      ...current,
      left: event.clientX - p.grabX, top: event.clientY - p.grabY,
      index: slotAt(event.clientX, event.clientY, current.index),
    });
  };
  const onUp = (event: PointerEvent) => {
    const p = pending.current;
    if (!p || p.pointerId !== event.pointerId) return;
    const current = dragRef.current;
    if (p.started && current) optsRef.current.onDrop(current.id, current.index);
    clear();
  };
  const onCancel = () => clear();
  const detach = useRef<() => void>(() => {});
  useEffect(() => () => detach.current(), []);

  const handlers = (id: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (optsRef.current.disabled || pending.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if ((event.target as HTMLElement).closest('button, input, label')) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const p: Pending = {
        id, pointerId: event.pointerId, type: event.pointerType, startX: event.clientX, startY: event.clientY,
        el: event.currentTarget, timer: null, started: false,
        grabX: event.clientX - rect.left, grabY: event.clientY - rect.top,
      };
      if (p.type !== 'mouse') {
        p.timer = window.setTimeout(() => { if (pending.current === p) start(p, p.startX, p.startY); }, LONG_PRESS_MS);
      }
      pending.current = p;
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      detach.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
      };
    },
    onContextMenu: (event: React.MouseEvent) => { if (pending.current) event.preventDefault(); },
  });

  return { drag, handlers };
}
