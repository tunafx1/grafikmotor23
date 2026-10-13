import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MousePointer2, Sparkles } from 'lucide-react';
import type { DesignTemplate, Region, SequenceMediaItem } from '../types';
import { buildBatchPages, isStaticImageLayer } from '../utils/batchProduction';
import { resolveExportTemplate } from '../utils/exportAssets';
import { TemplateThumbnail } from './TemplateThumbnail';
import './ProductionLoading.css';

/*
 * Batch-production loading loop (~8s), built from the same story as the landing hero
 * but with the user's *real* material: their photos drop in → pour into the template's
 * actual image frame (editor-style selection box + cursor) → the AI "writes" into the
 * real text frame while a scan line sweeps → the generated pages fan out.
 */

type Phase = 'drop' | 'place' | 'write' | 'pages';
const TIMELINE: { phase: Phase; ms: number }[] = [
  { phase: 'drop', ms: 1700 },
  { phase: 'place', ms: 1500 },
  { phase: 'write', ms: 2500 },
  { phase: 'pages', ms: 2700 },
];
const EASE = [0.22, 1, 0.36, 1] as const;
const PILE = [
  { dx: -13, dy: 5, rotate: -11 },
  { dx: 11, dy: -3, rotate: 8 },
  { dx: -3, dy: -7, rotate: -3 },
  { dx: 5, dy: 7, rotate: 5 },
];

type Box = { left: number; top: number; width: number; height: number };

/** Template-space region → stage-percent box, given where the frame sits on the stage. */
function regionToStage(frame: Box, template: DesignTemplate, region?: Region): Box {
  if (!region) return frame;
  const sx = frame.width / template.width;
  const sy = frame.height / template.height;
  const left = Math.max(0, region.x) * sx;
  const top = Math.max(0, region.y) * sy;
  return {
    left: frame.left + left,
    top: frame.top + top,
    width: Math.min(frame.width - left, Math.max(6, region.width * sx)),
    height: Math.min(frame.height - top, Math.max(5, region.height * sy)),
  };
}

const pct = (box: Box) => ({ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` });

export function ProductionLoadingMotion({ template, photos, brief, progress, onCancel, cancelButtonRef }: {
  template: DesignTemplate;
  photos: SequenceMediaItem[];
  brief: string;
  progress: string;
  onCancel: () => void;
  cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  // Computed once: App re-renders on every progress tick with fresh template objects,
  // and re-deriving here would force every canvas preview to repaint each time.
  const [scene] = useState(() => {
    let pages: any[] = [];
    try { pages = buildBatchPages(template, photos); } catch { pages = []; }
    const previews = pages.slice(0, 3).map(page => ({ template: resolveExportTemplate(template, page), data: page }));
    const first = previews[0]?.template || template;
    const imageRegion = first.regions.find(region => region.type === 'image' && region.isDynamic !== false && !region.hidden && !isStaticImageLayer(region));
    const textRegion = [...first.regions]
      .filter(region => region.type === 'text' && !region.hidden)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

    const ratio = Math.min(1.6, Math.max(0.56, template.width / template.height));
    const width = ratio <= 56 / 62 ? 62 * ratio : 56;
    const height = width / ratio;
    const frame: Box = { left: (100 - width) / 2, top: (100 - height) / 2 - 3, width, height };
    return {
      pageCount: pages.length,
      previews,
      frame,
      imageBox: regionToStage(frame, template, imageRegion),
      textBox: textRegion ? regionToStage(frame, template, textRegion) : { left: frame.left + frame.width * 0.1, top: frame.top + frame.height * 0.68, width: frame.width * 0.8, height: frame.height * 0.18 },
      pile: photos.slice(0, 4).map(photo => photo.thumbnailUrl || photo.url).filter(Boolean) as string[],
      snippet: (brief.trim().replace(/\s+/g, ' ') || 'Tasarım metinleri').slice(0, 54),
    };
  });

  const [step, setStep] = useState(reduceMotion ? TIMELINE.length - 1 : 0);
  const [loop, setLoop] = useState(0);
  const [typed, setTyped] = useState(reduceMotion ? scene.snippet.length : 0);
  const phase = TIMELINE[step].phase;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => {
      if (step === TIMELINE.length - 1) setLoop(n => n + 1);
      setStep(s => (s + 1) % TIMELINE.length);
    }, TIMELINE[step].ms);
    return () => window.clearTimeout(timer);
  }, [step, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase === 'drop') setTyped(0);
    if (phase !== 'write') return;
    const perChar = Math.max(22, Math.min(55, 1800 / scene.snippet.length));
    const timer = window.setInterval(() => setTyped(n => {
      if (n >= scene.snippet.length) { window.clearInterval(timer); return n; }
      return n + 1;
    }), perChar);
    return () => window.clearInterval(timer);
  }, [phase, reduceMotion, scene.snippet.length]);

  const placed = phase !== 'drop';
  const fanned = phase === 'pages';
  const selection = phase === 'place' ? { box: scene.imageBox, label: 'Görsel alanı' }
    : phase === 'write' ? { box: scene.textBox, label: 'Metin alanı' } : null;

  const match = progress.match(/(\d+)\s*\/\s*(\d+)/);
  const ratio = match && Number(match[2]) > 0 ? Math.min(1, Number(match[1]) / Number(match[2])) : null;
  const labels: Record<Phase, string> = {
    drop: 'Fotoğrafların alınıyor',
    place: 'Görsel alanlarına yerleşiyor',
    write: 'Yapay zekâ metinleri yazıyor',
    pages: scene.pageCount > 1 ? `${scene.pageCount} sayfa hazırlanıyor` : 'Tasarımın hazırlanıyor',
  };
  const sidePreviews = scene.previews.slice(1, 3);
  const extraPages = Math.max(0, scene.pageCount - 3);

  return (
    <div className="plm">
      <div className="plm-stage" aria-hidden="true">
        <span className="plm-glow" />

        {/* Additional pages fan out from behind the main design */}
        {sidePreviews.map((preview, index) => {
          const side = index === 0 ? -1 : 1;
          return (
            <motion.div
              key={`side-${index}`}
              className="plm-page plm-page-side"
              style={pct(scene.frame)}
              initial={false}
              animate={fanned
                ? { opacity: 1, x: `${side * 52}%`, rotate: side * 9, scale: 0.78 }
                : { opacity: 0, x: '0%', rotate: 0, scale: 0.86 }}
              transition={{ duration: 0.75, ease: EASE, delay: fanned ? 0.08 + index * 0.1 : 0 }}
            >
              <TemplateThumbnail template={preview.template} data={preview.data} />
              <span className="plm-page-num">{index + 2}</span>
            </motion.div>
          );
        })}

        {/* Main template frame */}
        <motion.div
          className={`plm-frame ${placed ? 'is-filled' : ''}`}
          style={pct(scene.frame)}
          initial={false}
          animate={{ scale: fanned ? 0.9 : 1, y: fanned ? '-2%' : '0%' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {!placed && <span className="plm-drop-hint">Şablon</span>}
          <motion.div
            className="plm-render"
            initial={false}
            animate={{ opacity: placed ? 1 : 0, scale: placed ? 1 : 1.04 }}
            transition={{ duration: 0.6, ease: EASE, delay: placed && phase === 'place' ? 0.35 : 0 }}
          >
            {scene.previews[0]
              ? <TemplateThumbnail template={scene.previews[0].template} data={scene.previews[0].data} />
              : <TemplateThumbnail template={template} />}
          </motion.div>
          {phase === 'write' && typed < scene.snippet.length && <span className="plm-scan" />}
          {fanned && <span className="plm-page-num is-main">1</span>}
          {fanned && extraPages > 0 && <span className="plm-more">+{extraPages}</span>}
        </motion.div>

        {/* The user's photos: drop into a pile, then pour into the real image frame */}
        {scene.pile.map((src, index) => {
          const pile = PILE[index];
          const pileBox: Box = { left: 50 - 15 + pile.dx, top: 50 - 19 + pile.dy, width: 30, height: 38 };
          return (
            <motion.div
              key={`${loop}-${index}`}
              className="plm-photo"
              style={{ zIndex: 6 + scene.pile.length - index }}
              initial={reduceMotion ? false : { ...pct({ ...pileBox, top: -45 }), opacity: 0, rotate: pile.rotate * 2 }}
              animate={placed
                ? { ...pct(scene.imageBox), opacity: 0, rotate: 0 }
                : { ...pct(pileBox), opacity: 1, rotate: pile.rotate }}
              transition={placed
                ? { duration: 0.7, ease: EASE, delay: index * 0.06, opacity: { duration: 0.35, delay: 0.38 + index * 0.06 } }
                : { duration: 0.65, ease: EASE, delay: 0.12 + (scene.pile.length - 1 - index) * 0.2 }}
            >
              <img src={src} alt="" draggable={false} />
            </motion.div>
          );
        })}

        {/* Editor-style selection hopping between the template's real frames */}
        <AnimatePresence>
          {selection && (
            <motion.div
              key="selection"
              className="plm-selection"
              initial={{ opacity: 0, ...pct(selection.box) }}
              animate={{ opacity: 1, ...pct(selection.box) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE, opacity: { duration: 0.25 } }}
            >
              <i /><i /><i /><i />
              <AnimatePresence mode="wait">
                <motion.span key={selection.label} className="plm-selection-label" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  {selection.label}
                </motion.span>
              </AnimatePresence>
              <motion.span
                className="plm-cursor"
                initial={{ x: 26, y: 26, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              >
                <MousePointer2 size={18} fill="currentColor" />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI writes the brief into the text frame */}
        <AnimatePresence>
          {phase === 'write' && (
            <motion.div
              key="ai"
              className="plm-ai"
              initial={{ opacity: 0, y: 10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 6, x: '-50%' }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <span className="plm-ai-tag"><Sparkles size={11} /> AI</span>
              <span className="plm-ai-text">{scene.snippet.slice(0, typed)}<span className="plm-caret" /></span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="plm-caption" aria-hidden="true">
        <div className="plm-dots">
          {TIMELINE.map((item, index) => (
            <span key={item.phase} className={index === step ? 'is-active' : index < step ? 'is-done' : ''} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {labels[phase]}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="production-loading-eyebrow">GRAFİK MOTORU</span>
      <h2 id="production-loading-title">Tasarımların hazırlanıyor</h2>
      <p id="production-loading-progress" className="production-loading-progress" role="status" aria-live="polite">{progress || 'Sayfalar hazırlanıyor…'}</p>
      <div className={`production-loading-track ${ratio !== null ? 'is-determinate' : ''}`} aria-hidden="true">
        <span style={ratio !== null ? { width: `${Math.max(6, ratio * 100)}%` } : undefined} />
      </div>
      <p className="production-loading-note">Fotoğrafların ve komutun bu ekranda korunuyor.</p>
      <button ref={cancelButtonRef} type="button" className="production-loading-cancel" onClick={onCancel}>Üretimi iptal et</button>
    </div>
  );
}
