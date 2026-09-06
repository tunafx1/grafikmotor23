import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Download, Check, ArrowRight, Layers, FileArchive
} from 'lucide-react';

const DEMO_PHOTOS = [
  { id: 1, title: 'Look 01', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { id: 2, title: 'Look 02', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80' },
  { id: 3, title: 'Look 03', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80' },
  { id: 4, title: 'Look 04', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 5, title: 'Look 05', url: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&auto=format&fit=crop&q=80' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Kare Post' },
  { id: '4:5', label: '4:5', desc: 'Portre' },
  { id: '9:16', label: '9:16', desc: 'Story & Reels' },
  { id: '16:9', label: '16:9', desc: 'Yatay' },
];

const TOTAL_DURATION = 20.0; // 20.0 seconds exact continuous loop
const PROMPT_FULL_TEXT = 'Yaz kampanyası için enerjik ve renkli bir tasarım';

// Smooth cubic ease-in-out interpolation
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Linearly interpolate between two points with easeInOut
function lerpPos(
  t: number,
  tStart: number,
  tEnd: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  if (t <= tStart) return { x: x1, y: y1 };
  if (t >= tEnd) return { x: x2, y: y2 };
  const progress = easeInOut((t - tStart) / (tEnd - tStart));
  return {
    x: x1 + (x2 - x1) * progress,
    y: y1 + (y2 - y1) * progress,
  };
}

interface Props {
  onEnterApp?: () => void;
}

export function SaaSMotionDemo({ onEnterApp }: Props) {
  const [time, setTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Continuous 60fps Animation Loop: 0 to 20 seconds
  useEffect(() => {
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTime((prev) => {
        const next = prev + delta;
        if (next >= TOTAL_DURATION) {
          return 0; // Seamless continuous loop back to 0
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // ── Derived Timeline States ──
  // 1. Ratio selection: 9:16 selected at 1.25s
  const isRatioSelected = time >= 1.25;
  const currentRatio = isRatioSelected ? '9:16' : '1:1';

  // 2. Photo selection in tray:
  const selectedPhotos = [
    time >= 2.65,
    time >= 3.75,
    time >= 4.85,
    time >= 5.95,
    time >= 6.95,
  ];

  // 3. Dragging photos clustered around cursor:
  // Starts lifting at 7.2s, drops at 9.0s
  const isDragging = time >= 7.2 && time < 9.0;
  // Snapped into canvas from 9.0s until designs open at 13.5s
  const isDropped = time >= 9.0;

  // 4. AI Prompt Modal:
  // Emerges upon drop at 9.4s, closes at 13.2s
  const isPromptOpen = time >= 9.4 && time < 13.2;
  // Typewriter effect from 9.8s to 11.6s
  const promptProgress = Math.min(1, Math.max(0, (time - 9.8) / 1.8));
  const promptCharsCount = Math.floor(promptProgress * PROMPT_FULL_TEXT.length);
  const promptTypedText = PROMPT_FULL_TEXT.slice(0, promptCharsCount);
  // Button loading state from 12.1s to 13.2s
  const isGeneratingAI = time >= 12.1 && time < 13.2;

  // 5. Designs generation:
  // 3 designs open at 13.5s
  const isShowingDesigns = time >= 13.5;
  const showCard1 = time >= 13.6;
  const showCard2 = time >= 14.0;
  const showCard3 = time >= 14.4;

  // 6. Selection of generated designs:
  const isCard1Selected = time >= 15.2;
  const isCard2Selected = time >= 16.2;
  const isCard3Selected = time >= 17.2;
  const allCardsSelected = isCard1Selected && isCard2Selected && isCard3Selected;

  // 7. High-Fidelity Export Flow:
  // Header export button clicked at 18.5s -> Export Graphic modal opens from 18.7s to 20.0s
  const isExportClicked = time >= 18.5;
  const isExportModalOpen = time >= 18.7 && time < 20.0;
  const exportProgress = Math.min(100, Math.floor(Math.max(0, (time - 18.7) / 0.8) * 100));

  // ── Mathematical Parametric Cursor Path ──
  // Calculates smooth (x, y) coordinates with ZERO jumping and perfect alignment
  const getCursor = () => {
    // 0.0s - 1.0s: Glide into view to 9:16 button (57, 11)
    if (time < 1.0) {
      return { ...lerpPos(time, 0.0, 1.0, 75, 65, 57, 11), clicking: false };
    }
    // 1.0s - 1.5s: Hover & Click 9:16 button (57, 11)
    if (time < 1.5) {
      return { x: 57, y: 11, clicking: time >= 1.15 && time <= 1.35 };
    }
    // 1.5s - 2.4s: Glide down to Photo 1 (18, 83)
    if (time < 2.4) {
      return { ...lerpPos(time, 1.5, 2.4, 57, 11, 18, 83), clicking: false };
    }
    // 2.4s - 2.9s: Hover & Click Photo 1 (18, 83)
    if (time < 2.9) {
      return { x: 18, y: 83, clicking: time >= 2.55 && time <= 2.75 };
    }
    // 2.9s - 3.5s: Glide to Photo 2 (34, 83)
    if (time < 3.5) {
      return { ...lerpPos(time, 2.9, 3.5, 18, 83, 34, 83), clicking: false };
    }
    // 3.5s - 4.0s: Hover & Click Photo 2 (34, 83)
    if (time < 4.0) {
      return { x: 34, y: 83, clicking: time >= 3.65 && time <= 3.85 };
    }
    // 4.0s - 4.6s: Glide to Photo 3 (50, 83)
    if (time < 4.6) {
      return { ...lerpPos(time, 4.0, 4.6, 34, 83, 50, 83), clicking: false };
    }
    // 4.6s - 5.1s: Hover & Click Photo 3 (50, 83)
    if (time < 5.1) {
      return { x: 50, y: 83, clicking: time >= 4.75 && time <= 4.95 };
    }
    // 5.1s - 5.7s: Glide to Photo 4 (66, 83)
    if (time < 5.7) {
      return { ...lerpPos(time, 5.1, 5.7, 50, 83, 66, 83), clicking: false };
    }
    // 5.7s - 6.2s: Hover & Click Photo 4 (66, 83)
    if (time < 6.2) {
      return { x: 66, y: 83, clicking: time >= 5.85 && time <= 6.05 };
    }
    // 6.2s - 6.7s: Glide to Photo 5 (82, 83)
    if (time < 6.7) {
      return { ...lerpPos(time, 6.2, 6.7, 66, 83, 82, 83), clicking: false };
    }
    // 6.7s - 7.2s: Hover & Click Photo 5 (82, 83)
    if (time < 7.2) {
      return { x: 82, y: 83, clicking: time >= 6.85 && time <= 7.05 };
    }
    // 7.2s - 7.5s: Grasp & start cluster drag at (82, 83)
    if (time < 7.5) {
      return { x: 82, y: 83, clicking: true };
    }
    // 7.5s - 9.0s: Drag photo cluster into canvas center (50, 42)
    if (time < 9.0) {
      return { ...lerpPos(time, 7.5, 9.0, 82, 83, 50, 42), clicking: true };
    }
    // 9.0s - 9.8s: Release drop at canvas center, float back slightly
    if (time < 9.8) {
      return { ...lerpPos(time, 9.0, 9.8, 50, 42, 54, 54), clicking: false };
    }
    // 9.8s - 11.6s: Glide down to "✦ Oluştur" button in Prompt Modal (81, 79)
    if (time < 11.6) {
      return { ...lerpPos(time, 9.8, 11.6, 54, 54, 81, 79), clicking: false };
    }
    // 11.6s - 12.3s: Hover & Click "✦ Oluştur" (81, 79)
    if (time < 12.3) {
      return { x: 81, y: 79, clicking: time >= 11.95 && time <= 12.15 };
    }
    // 12.3s - 13.5s: AI generation scan; cursor floats smoothly to waiting point
    if (time < 13.5) {
      return { ...lerpPos(time, 12.3, 13.5, 81, 79, 65, 60), clicking: false };
    }
    // 13.5s - 14.7s: Designs emerge! Cursor moves to Card 1 (23, 52)
    if (time < 14.7) {
      return { ...lerpPos(time, 13.5, 14.7, 65, 60, 23, 52), clicking: false };
    }
    // 14.7s - 15.5s: Hover & Click Card 1 (23, 52)
    if (time < 15.5) {
      return { x: 23, y: 52, clicking: time >= 15.05 && time <= 15.25 };
    }
    // 15.5s - 16.0s: Glide to Card 2 (50, 52)
    if (time < 16.0) {
      return { ...lerpPos(time, 15.5, 16.0, 23, 52, 50, 52), clicking: false };
    }
    // 16.0s - 16.6s: Hover & Click Card 2 (50, 52)
    if (time < 16.6) {
      return { x: 50, y: 52, clicking: time >= 16.15 && time <= 16.35 };
    }
    // 16.6s - 17.1s: Glide to Card 3 (77, 52)
    if (time < 17.1) {
      return { ...lerpPos(time, 16.6, 17.1, 50, 52, 77, 52), clicking: false };
    }
    // 17.1s - 17.7s: Hover & Click Card 3 (77, 52)
    if (time < 17.7) {
      return { x: 77, y: 52, clicking: time >= 17.25 && time <= 17.45 };
    }
    // 17.7s - 18.4s: Glide up to header "Dışa Aktar (3)" button (87, 5.5)
    if (time < 18.4) {
      return { ...lerpPos(time, 17.7, 18.4, 77, 52, 87, 5.5), clicking: false };
    }
    // 18.4s - 19.0s: Hover & Click "Dışa Aktar" (87, 5.5)
    if (time < 19.0) {
      return { x: 87, y: 5.5, clicking: time >= 18.55 && time <= 18.75 };
    }
    // 19.0s - 20.0s: Admire export modal, then fade
    return { x: 87, y: 5.5, clicking: false };
  };

  const cursor = getCursor();

  return (
    <div className="saas-demo-wrapper">
      <div className="saas-window">
        {/* ═══════════ WINDOW CHROME HEADER ═══════════ */}
        <div className="saas-chrome-bar">
          <div className="saas-traffic-lights">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>

          <div className="saas-chrome-title">
            <span className="saas-logo-icon">G</span>
            <span>Grafik Motoru Studio</span>
            <span className="saas-version-badge">v2.4 Demo</span>
          </div>

          <div className="saas-chrome-actions">
            <div
              className={`saas-download-chip ${
                allCardsSelected ? 'active' : ''
              } ${isExportClicked ? 'success' : ''}`}
            >
              {isExportClicked ? (
                <>
                  <Check size={12} className="text-white" />
                  <span>Dışa Aktarıldı</span>
                </>
              ) : (
                <>
                  <Download size={12} />
                  <span>Dışa Aktar</span>
                  {allCardsSelected && <span className="saas-chip-counter">3</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ MAIN CANVAS STAGE ═══════════ */}
        <div className="saas-stage">
          {/* Top Aspect Ratio Pill Selector (Scene 1) */}
          <div className="saas-aspect-bar">
            <span className="saas-bar-label">Format:</span>
            <div className="saas-ratio-pills">
              {ASPECT_RATIOS.map((r) => {
                const isActive = currentRatio === r.id;
                return (
                  <div
                    key={r.id}
                    className={`saas-ratio-pill ${isActive ? 'active' : ''}`}
                  >
                    <span className="pill-id">{r.label}</span>
                    <span className="pill-sub">{r.desc}</span>
                    {isActive && <div className="saas-pill-glow" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Central Template Viewport (Scenes 1 - 4: Morphs and holds dropped photos) */}
          <div className="saas-canvas-viewport">
            <AnimatePresence mode="wait">
              {!isShowingDesigns ? (
                <motion.div
                  key="main-canvas"
                  className="saas-main-canvas"
                  initial={false}
                  animate={{
                    width: isRatioSelected ? 210 : 250,
                    height: isRatioSelected ? 300 : 250,
                    borderRadius: 18,
                  }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="saas-canvas-tag">{currentRatio}</div>
                  <div className="saas-canvas-corner tl" />
                  <div className="saas-canvas-corner tr" />
                  <div className="saas-canvas-corner bl" />
                  <div className="saas-canvas-corner br" />

                  {/* Empty state before photos are dropped */}
                  {!isDropped && (
                    <div className="saas-empty-canvas">
                      <div className="saas-empty-icon-wrap">
                        <Sparkles size={20} className="text-[#FF6B1A]" />
                      </div>
                      <p className="saas-empty-text">Şablon Alanı</p>
                      <span className="saas-empty-sub">
                        {isRatioSelected ? 'Story & Reels (9:16)' : 'Kare Post (1:1)'}
                      </span>
                    </div>
                  )}

                  {/* Snapped Photos Grid after drop (Scenes 3 & 4) */}
                  {isDropped && (
                    <motion.div
                      className="saas-snapped-grid"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                      <div className="saas-grid-main-img">
                        <img src={DEMO_PHOTOS[0].url} alt="Hero Look" />
                        <div className="saas-img-tag">Ana Görsel</div>
                      </div>
                      <div className="saas-grid-side-imgs">
                        <div className="saas-grid-sub-img">
                          <img src={DEMO_PHOTOS[1].url} alt="Look 2" />
                        </div>
                        <div className="saas-grid-sub-img">
                          <img src={DEMO_PHOTOS[2].url} alt="Look 3" />
                        </div>
                      </div>

                      {/* Laser scanner during AI generation */}
                      {isGeneratingAI && (
                        <motion.div
                          className="saas-scan-laser"
                          initial={{ top: '0%' }}
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ repeat: Infinity, duration: 1.0, ease: 'easeInOut' }}
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* ═══════════ SCENE 5 & 6: 3 Distinct Generated Design Cards ═══════════ */
                <motion.div
                  key="results-gallery"
                  className="saas-designs-gallery"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Card 1: Kapak Tasarımı */}
                  {showCard1 && (
                    <motion.div
                      className={`saas-result-card ${isCard1Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="card-badge">01 · Kapak</div>
                      {isCard1Selected && (
                        <div className="card-check">
                          <Check size={11} />
                        </div>
                      )}
                      <div className="card-cover-photo">
                        <img src={DEMO_PHOTOS[0].url} alt="Card 1" />
                        <div className="card-cover-overlay">
                          <span className="card-campaign-chip">YAZ KAMPANYASI</span>
                          <h4 className="card-title">YENİ SEZON</h4>
                          <p className="card-desc">Net %50 İndirim</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Card 2: 2'li Kolaj Tasarımı A */}
                  {showCard2 && (
                    <motion.div
                      className={`saas-result-card ${isCard2Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="card-badge">02 · 2'li Kolaj</div>
                      {isCard2Selected && (
                        <div className="card-check">
                          <Check size={11} />
                        </div>
                      )}
                      <div className="card-duo-photos">
                        <div className="duo-half">
                          <img src={DEMO_PHOTOS[1].url} alt="Duo 1" />
                        </div>
                        <div className="duo-half">
                          <img src={DEMO_PHOTOS[2].url} alt="Duo 2" />
                        </div>
                      </div>
                      <div className="card-bottom-info">
                        <strong>ÖZEL KOLEKSİYON</strong>
                        <span className="text-[#FF6B1A] font-bold">%30 İndirim</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Card 3: 2'li Kolaj Tasarımı B */}
                  {showCard3 && (
                    <motion.div
                      className={`saas-result-card ${isCard3Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="card-badge">03 · 2'li Kolaj</div>
                      {isCard3Selected && (
                        <div className="card-check">
                          <Check size={11} />
                        </div>
                      )}
                      <div className="card-duo-photos">
                        <div className="duo-half">
                          <img src={DEMO_PHOTOS[3].url} alt="Duo 3" />
                        </div>
                        <div className="duo-half">
                          <img src={DEMO_PHOTOS[4].url} alt="Duo 4" />
                        </div>
                      </div>
                      <div className="card-bottom-info">
                        <strong>SINIRLI STOK</strong>
                        <span className="text-[#FF6B1A] font-bold">Hemen Keşfet →</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════ BOTTOM: Photo Thumbnails Tray (Scenes 2 & 3) ═══════════ */}
          <AnimatePresence>
            {!isShowingDesigns && (
              <motion.div
                className="saas-photo-tray"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="saas-tray-header">
                  <span className="saas-tray-label">Görsel Seçici</span>
                  <span className="saas-tray-count">5 Fotoğraf</span>
                </div>
                <div className="saas-thumb-list">
                  {DEMO_PHOTOS.map((photo, i) => {
                    const isSelected = selectedPhotos[i];
                    return (
                      <div
                        key={photo.id}
                        className={`saas-photo-thumb ${isSelected ? 'selected' : ''} ${
                          isDragging ? 'drag-source' : ''
                        }`}
                      >
                        <img src={photo.url} alt={photo.title} />
                        {isSelected && (
                          <div className="saas-thumb-check">
                            <Check size={9} />
                          </div>
                        )}
                        <span className="saas-thumb-idx">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ AI Prompt Slide-up Modal (Scene 4) ═══════════ */}
          <AnimatePresence>
            {isPromptOpen && (
              <motion.div
                className="saas-prompt-box"
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.95 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              >
                <div className="saas-prompt-header">
                  <div className="flex items-center gap-1.5">
                    <span className="saas-prompt-dot" />
                    <span className="saas-prompt-title">Gemini AI Prompt Asistanı</span>
                  </div>
                  <span className="saas-prompt-badge">3.6 Flash</span>
                </div>

                <div className="saas-prompt-input-row">
                  <div className="saas-prompt-input-fake">
                    <span className="text-[#0F172A] font-medium text-xs">{promptTypedText}</span>
                    <span className="saas-typewriter-caret" />
                  </div>

                  <button
                    className={`saas-prompt-btn ${isGeneratingAI ? 'loading' : ''}`}
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="saas-btn-spinner" />
                        <span>Üretiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Oluştur</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ HIGH-FIDELITY EXPORT GRAPHIC MODAL ═══════════ */}
          <AnimatePresence>
            {isExportModalOpen && (
              <motion.div
                className="saas-export-modal"
                initial={{ opacity: 0, scale: 0.88, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 15 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              >
                <div className="saas-export-top">
                  <div className="saas-export-icon">
                    {exportProgress >= 100 ? (
                      <Check size={20} className="text-[#10B981]" />
                    ) : (
                      <FileArchive size={20} className="text-[#FF6B1A]" />
                    )}
                  </div>
                  <div>
                    <h4 className="saas-export-title">
                      {exportProgress >= 100 ? 'Paket Dışa Aktarıldı!' : 'Dışa Aktarılıyor...'}
                    </h4>
                    <p className="saas-export-sub">
                      {exportProgress >= 100 ? '3 Tasarım (18.4 MB ZIP)' : '4K Ultra-HD · 1080x1920 piksel'}
                    </p>
                  </div>
                </div>

                {/* Progress bar with percentage */}
                <div className="saas-export-bar-wrap">
                  <div className="saas-export-bar-track">
                    <div
                      className="saas-export-bar-fill"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span className="saas-export-bar-pct">%{exportProgress}</span>
                </div>

                {/* Badges */}
                <div className="saas-export-chips">
                  <span className="saas-export-chip">Kayıpsız ZIP</span>
                  <span className="saas-export-chip">9:16 Hikaye</span>
                  <span className="saas-export-chip">300 DPI Baskı</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ CLUSTERED PHOTOS ATTACHED TO CURSOR WHILE DRAGGING ═══════════ */}
          {isDragging && (
            <div
              className="saas-cursor-drag-cluster"
              style={{
                left: `${cursor.x}%`,
                top: `${cursor.y}%`,
              }}
            >
              {DEMO_PHOTOS.map((photo, i) => (
                <div
                  key={photo.id}
                  className="saas-cluster-photo-item"
                  style={{
                    transform: `translate(${(i - 2) * 10}px, ${(Math.abs(i - 2)) * 3}px) rotate(${(i - 2) * 6}deg)`,
                    zIndex: 10 + i,
                  }}
                >
                  <img src={photo.url} alt="Cluster look" />
                </div>
              ))}
              <div className="saas-cluster-count-badge">
                <Layers size={9} />
                <span>5 Fotoğraf</span>
              </div>
            </div>
          )}

          {/* ═══════════ SMOOTH VECTOR CURSOR WITH INSTANT CLICK RIPPLE ═══════════ */}
          <div
            className={`saas-virtual-cursor ${cursor.clicking ? 'clicking' : ''}`}
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: `translate(-2px, -2px) scale(${cursor.clicking ? 0.82 : 1})`,
              transition: 'transform 0.12s ease-out',
            }}
          >
            <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
              <path
                d="M1 1L9.5 24L13.5 14.5L23 11L1 1Z"
                fill="#FF6B1A"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className="saas-cursor-badge">Tuna</div>

            {/* Click Ripple Wave Ring */}
            {cursor.clicking && (
              <div className="saas-click-ripple" />
            )}
          </div>
        </div>

        {/* ═══════════ CLEAN EMBEDDED FOOTER (NO SCRUBBER OR TIMERS) ═══════════ */}
        <div className="saas-embedded-footer">
          <div className="saas-footer-status">
            <span className="saas-pulse-dot" />
            <span className="saas-status-text">Otomatik Önizleme</span>
            <span className="saas-status-sub">· Figma & Canva Uyumlu Motor</span>
          </div>

          {onEnterApp && (
            <button onClick={onEnterApp} className="saas-footer-action-btn">
              <span>Stüdyoyu Başlat</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
