import React from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PageFilmstripProps {
  pages: any[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage?: (index: number) => void;
  onDeletePage?: (index: number) => void;
  aspectRatio?: string;
}

export function PageFilmstrip({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  aspectRatio = '1 / 1'
}: PageFilmstripProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
    <div className="h-[76px] bg-[#1D1D1F] border-t border-[rgba(255,255,255,0.08)] flex items-center px-4 shrink-0 z-30 select-none relative">
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
        className="flex items-center space-x-3 overflow-x-auto py-2 scrollbar-none flex-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const pageTitle = page.name || (idx === 0 ? 'Kapak' : `${idx + 1}. Sayfa`);

          return (
            <div
              key={page.id || idx}
              onClick={() => onSelectPage(idx)}
              className={`group relative flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border ${
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
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
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
