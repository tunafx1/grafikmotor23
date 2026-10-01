import React from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

/** Page numbers are already shown in the chip metadata. Strip legacy prefixes
 * so imported names such as "2. 2. Sayfa" do not render twice. */
function pageDisplayTitle(name: unknown, index: number) {
  const cleaned = typeof name === 'string'
    ? name.trim().replace(/^(?:(?:sayfa\s*)?\d+\s*[.:/-]\s*)+/iu, '').trim()
    : '';
  if (!cleaned || /^sayfa$/iu.test(cleaned)) return index === 0 ? 'Kapak' : 'Tasarım';
  return cleaned;
}

interface PageFilmstripProps {
  pages: any[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage?: (index: number) => void;
  onDeletePage?: (index: number) => void;
  onReorderPages?: (startIndex: number, endIndex: number) => void;
  aspectRatio?: string;
}

export function PageFilmstrip({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onReorderPages,
  aspectRatio = '1 / 1'
}: PageFilmstripProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Pointer-Events-based reorder: works for mouse, touch and pen from one code path
  // (native HTML5 drag&drop, which this replaces, has no touch equivalent).
  // Mouse starts reordering as soon as the pointer moves a few px (classic drag feel).
  // Touch requires a short hold with no movement first — the filmstrip already scrolls
  // horizontally via native touch panning, so a plain swipe must keep working; only a
  // deliberate long-press hands the gesture over to JS-driven reordering.
  const dragInfoRef = React.useRef<{
    idx: number;
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    dragging: boolean;
    longPressTimer: number | null;
  } | null>(null);
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const getChipEl = (idx: number) =>
    scrollContainerRef.current?.querySelector<HTMLElement>(`[data-page-idx="${idx}"]`) || null;

  const beginDragging = (idx: number, pointerId: number) => {
    setDraggingIndex(idx);
    setDragOverIndex(idx);
    getChipEl(idx)?.setPointerCapture(pointerId);
  };

  const handleChipPointerDown = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onReorderPages) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const info = {
      idx,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      longPressTimer: null as number | null
    };
    if (e.pointerType === 'touch') {
      info.longPressTimer = window.setTimeout(() => {
        const current = dragInfoRef.current;
        if (current && current === info) {
          current.dragging = true;
          beginDragging(idx, info.pointerId);
        }
      }, 350);
    }
    dragInfoRef.current = info;
  };

  const handleChipPointerMove = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info || info.idx !== idx) return;

    if (!info.dragging) {
      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;
      const moved = Math.hypot(dx, dy) > 6;
      if (!moved) return;
      if (info.pointerType === 'touch') {
        // Real movement before the long-press fired: this is a scroll gesture, not a
        // reorder — bail out and let the browser's native touch panning handle it.
        if (info.longPressTimer) window.clearTimeout(info.longPressTimer);
        dragInfoRef.current = null;
        return;
      }
      info.dragging = true;
      beginDragging(idx, info.pointerId);
    }

    e.preventDefault();
    const track = scrollContainerRef.current;
    if (!track) return;
    const chips = Array.from(track.querySelectorAll<HTMLElement>('[data-page-idx]'));
    let hoverIdx = idx;
    for (const chip of chips) {
      const r = chip.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right) {
        hoverIdx = Number(chip.dataset.pageIdx);
        break;
      }
    }
    setDragOverIndex(hoverIdx);
  };

  const endDrag = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info || info.idx !== idx) return;
    if (info.longPressTimer) window.clearTimeout(info.longPressTimer);
    if (info.dragging && dragOverIndex !== null && dragOverIndex !== idx) {
      onReorderPages?.(idx, dragOverIndex);
    }
    dragInfoRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="workspace-filmstrip h-[76px] bg-[#1D1D1F] border-t border-[rgba(255,255,255,0.08)] flex items-center px-4 shrink-0 z-30 select-none relative overflow-hidden">
      {/* Scroll Left Button */}
      {pages.length > 5 && (
        <button
          type="button"
          onClick={scrollLeft}
          className="w-7 h-7 rounded-full bg-[#252528] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#323236] transition mr-2 shrink-0 cursor-pointer shadow"
          title="Sola kaydır"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Pages Carousel */}
      <div
        ref={scrollContainerRef}
        className="workspace-filmstrip-track flex items-center space-x-3 overflow-x-auto overflow-y-hidden py-2 scrollbar-none flex-1 min-w-0 h-full"
        style={{ scrollbarWidth: 'none' }}
      >
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const pageTitle = pageDisplayTitle(page.name, idx);

          return (
            <div
              key={page.id || idx}
              data-page-idx={idx}
              onPointerDown={handleChipPointerDown(idx)}
              onPointerMove={handleChipPointerMove(idx)}
              onPointerUp={endDrag(idx)}
              onPointerCancel={endDrag(idx)}
              onClick={() => { if (draggingIndex === null) onSelectPage(idx); }}
              style={{ touchAction: onReorderPages ? 'pan-x' : undefined }}
              className={`workspace-page-chip group relative flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border ${
                draggingIndex === idx ? 'opacity-50' : ''
              } ${
                dragOverIndex === idx && draggingIndex !== null && draggingIndex !== idx ? 'ring-2 ring-[#FF6B1A]/70' : ''
              } ${
                isActive
                  ? 'bg-[#2A2A2E] border-[#FF6B1A] ring-2 ring-[#FF6B1A]/40 shadow-lg shadow-[#FF6B1A]/10'
                  : 'bg-[#252528]/80 border-[rgba(255,255,255,0.08)] hover:bg-[#2A2A2E] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              {/* Miniature page representation */}
              <div
                className={`w-9 h-9 rounded-md border flex items-center justify-center overflow-hidden transition-all ${
                  isActive
                    ? 'border-[#FF6B1A] bg-[#1D1D1F]'
                    : 'border-[rgba(255,255,255,0.12)] bg-[#1A1A1C]'
                }`}
                style={{ aspectRatio }}
              >
                <span className={`text-[11px] font-bold ${isActive ? 'text-[#FF6B1A]' : 'text-[rgba(255,255,255,0.5)]'}`}>
                  {idx + 1}
                </span>
              </div>

              {/* Page Meta */}
              <div className="flex flex-col text-left min-w-[70px] max-w-[120px]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
                  Sayfa {idx + 1}
                </span>
                <span className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : 'text-[rgba(255,255,255,0.8)]'}`}>
                  {pageTitle}
                </span>
              </div>

              {/* Hover Quick Actions */}
              <div className="workspace-page-actions flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDuplicatePage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(idx);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-[rgba(255,255,255,0.6)] hover:text-white transition"
                    title="Sayfayı Çoğalt"
                  >
                    <Copy size={11} />
                  </button>
                )}
                {onDeletePage && pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(idx);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-[rgba(255,255,255,0.6)] hover:text-red-400 transition"
                    title="Sayfayı Sil"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Page Button */}
        <button
          type="button"
          onClick={onAddPage}
          className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-dashed border-[rgba(255,255,255,0.15)] hover:border-[#FF6B1A] hover:bg-[#FF6B1A]/10 text-[rgba(255,255,255,0.6)] hover:text-[#FF6B1A] text-xs font-medium transition shrink-0 cursor-pointer"
          title="Yeni Sayfa Ekle"
        >
          <Plus size={14} />
          <span>Sayfa Ekle</span>
        </button>
      </div>

      {/* Scroll Right Button */}
      {pages.length > 5 && (
        <button
          type="button"
          onClick={scrollRight}
          className="w-7 h-7 rounded-full bg-[#252528] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#323236] transition ml-2 shrink-0 cursor-pointer shadow"
          title="Sağa kaydır"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
