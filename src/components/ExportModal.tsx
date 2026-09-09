import React, { useState } from 'react';
import { X, Download, FolderArchive, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { DesignTemplate } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DesignTemplate;
  pageCount: number;
  activePageIndex: number;
  onExportCurrent: (format: 'png' | 'jpeg' | 'webp', scale: number) => Promise<void>;
  onExportAll: (format: 'png' | 'jpeg' | 'webp', scale: number) => Promise<void>;
  onExportZip: (format: 'png' | 'jpeg' | 'webp', scale: number) => Promise<void>;
  isExporting: boolean;
  isExportingZip: boolean;
  exportStatusText: string;
}

export function ExportModal({
  isOpen,
  onClose,
  template,
  pageCount,
  activePageIndex,
  onExportCurrent,
  onExportAll,
  onExportZip,
  isExporting,
  isExportingZip,
  exportStatusText
}: ExportModalProps) {
  const [scope, setScope] = useState<'current' | 'all'>(pageCount > 1 ? 'all' : 'current');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [scale, setScale] = useState<number>(1.5);

  if (!isOpen) return null;

  const currentWidth = Math.round(template.width * scale);
  const currentHeight = Math.round(template.height * scale);

  const handleDownloadClick = () => {
    if (scope === 'current') {
      onExportCurrent(format, scale);
    } else {
      onExportAll(format, scale);
    }
  };

  const isBusy = isExporting || isExportingZip;

  return (
    <div className="workspace-export-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className="workspace-export-dialog w-full max-w-md bg-[#252528] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download size={18} className="text-[#FF6B1A]" />
            <h2 id="export-modal-title" className="text-base font-semibold text-white">
              Tasarımı İndir
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* 1. Scope selector (Bu Sayfa vs Tüm Sayfalar) */}
          {pageCount > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
                Sayfa Kapsamı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('current')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    scope === 'current'
                      ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white shadow'
                      : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] hover:text-white'
                  }`}
                >
                  Yalnızca Bu Sayfa ({activePageIndex + 1}. Sayfa)
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white shadow'
                      : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] hover:text-white'
                  }`}
                >
                  Tüm Sayfalar ({pageCount} Sayfa)
                </button>
              </div>
            </div>
          )}

          {/* 2. Format selector (PNG, JPEG, WebP) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider block">
              Dosya Formatı
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'png', label: 'PNG', desc: 'Yüksek kalite' },
                { id: 'jpeg', label: 'JPEG', desc: 'Küçük dosya' },
                { id: 'webp', label: 'WebP', desc: 'Hafif web' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-left transition cursor-pointer ${
                    format === f.id
                      ? 'bg-[#2E2E32] border-[#FF6B1A] ring-1 ring-[#FF6B1A]'
                      : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] hover:bg-[#252528]'
                  }`}
                >
                  <span className={`text-xs font-bold block ${format === f.id ? 'text-[#FF6B1A]' : 'text-white'}`}>
                    {f.label}
                  </span>
                  <span className="text-[10px] text-[rgba(255,255,255,0.5)] block">
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Resolution scale multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">
                Çözünürlük & Boyut
              </label>
              <span className="text-xs font-mono text-[#FF6B1A] font-bold">
                {currentWidth} × {currentHeight} px
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 1.0, label: '1x', name: 'Standart' },
                { val: 1.5, label: '1.5x', name: 'HD' },
                { val: 2.0, label: '2x', name: 'Büyük' },
                { val: 4.0, label: '4x', name: 'Çok büyük' }
              ].map(s => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setScale(s.val)}
                  className={`py-1.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                    scale === s.val
                      ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white font-bold'
                      : 'bg-[#1D1D1F] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{s.label}</span>
                  <span className="text-[9px] opacity-70 block">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress Toast Area */}
          {isBusy && (
            <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#FF6B1A]/40 flex items-center space-x-3 animate-pulse">
              <Loader2 size={16} className="text-[#FF6B1A] animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {isExportingZip ? 'ZIP Arşivi Hazırlanıyor...' : 'Görseller İndiriliyor...'}
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.7)] block truncate">
                  {exportStatusText || 'Lütfen bekleyiniz...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.08)] bg-[#1D1D1F]/60 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={isBusy}
            className="w-full py-3 rounded-xl bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-[#FF6B1A]/20 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>{scope === 'all' && pageCount > 1 ? 'Tüm Sayfaları İndir' : 'Görseli İndir'}</span>
              </>
            )}
          </button>

          {scope === 'all' && pageCount > 1 && (
            <button
              type="button"
              onClick={() => onExportZip(format, scale)}
              disabled={isBusy}
              className="w-full py-2.5 rounded-xl bg-[#252528] hover:bg-[#2C2C2E] border border-[rgba(255,255,255,0.1)] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {isExportingZip ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Arşivleniyor...</span>
                </>
              ) : (
                <>
                  <FolderArchive size={15} className="text-[rgba(255,255,255,0.7)]" />
                  <span>Tümünü ZIP Olarak İndir</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
