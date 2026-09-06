import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Download, Check, Play, Pause, RotateCcw, 
  Maximize2, Minimize2, MousePointer
} from 'lucide-react';

const DEMO_PHOTOS = [
  { id: 1, title: 'Look 01', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { id: 2, title: 'Look 02', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80' },
  { id: 3, title: 'Look 03', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80' },
  { id: 4, title: 'Look 04', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 5, title: 'Look 05', url: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&auto=format&fit=crop&q=80' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Post' },
  { id: '4:5', label: '4:5', desc: 'Dikey' },
  { id: '9:16', label: '9:16', desc: 'Story/Reels' },
  { id: '16:9', label: '16:9', desc: 'Yatay' },
];

const SCENES = [
  { id: 1, name: 'Boyut', time: 0 },
  { id: 2, name: 'Fotoğraf', time: 3 },
  { id: 3, name: 'Sürükle', time: 7 },
  { id: 4, name: 'AI Prompt', time: 10 },
  { id: 5, name: '3 Tasarım', time: 13 },
  { id: 6, name: 'İndir', time: 17 },
];

const TOTAL_DURATION = 20.0; // 20.0 seconds exact loop
const PROMPT_FULL_TEXT = 'Yaz kampanyası için enerjik ve renkli bir tasarım';

interface Props {
  onEnterApp?: () => void;
}

export function SaaSMotionDemo({ onEnterApp }: Props) {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTheater, setIsTheater] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Animation Loop: 0 to 20 seconds loop
  useEffect(() => {
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (isPlaying) {
        setTime((prev) => {
          const next = prev + delta;
          if (next >= TOTAL_DURATION) {
            return 0; // Smooth loop back to 0
          }
          return next;
        });
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Derived Scene Timeline States
  // Scene 1: 0 - 3s (Aspect Ratio)
  // Scene 2: 3 - 7s (Photo Selection)
  // Scene 3: 7 - 10s (Drag & Snap)
  // Scene 4: 10 - 13s (AI Prompt)
  // Scene 5: 13 - 17s (3 Designs Result)
  // Scene 6: 17 - 20s (Selection & Download)
  const currentScene = 
    time < 3 ? 1 :
    time < 7 ? 2 :
    time < 10 ? 3 :
    time < 13 ? 4 :
    time < 17 ? 5 : 6;

  // Scene 1: Aspect Ratio Selection (picks 9:16 at 1.8s)
  const isRatioSelected = time >= 1.8;
  const currentRatio = isRatioSelected ? '9:16' : '1:1';

  // Scene 2: 5 Photos Selection (staggered clicks between 3.2s and 6.5s)
  const selectedPhotos = [
    time >= 3.4,
    time >= 4.1,
    time >= 4.8,
    time >= 5.5,
    time >= 6.2,
  ];

  // Scene 3: Drag & Snap (drag starts 7.0s, snaps into grid at 8.6s)
  const isDraggingPhotos = time >= 7.0 && time < 8.6;
  const isPhotosSnapped = time >= 8.6;

  // Scene 4: AI Prompt (slides up at 10.0s, typewriter types 10.3s to 12.0s, button clicked at 12.3s)
  const isPromptOpen = time >= 10.0 && time < 13.0;
  const promptProgress = Math.min(1, Math.max(0, (time - 10.3) / 1.7));
  const promptCharsCount = Math.floor(promptProgress * PROMPT_FULL_TEXT.length);
  const promptTypedText = PROMPT_FULL_TEXT.slice(0, promptCharsCount);
  const isGeneratingAI = time >= 12.3 && time < 13.0;

  // Scene 5 & 6: 3 Designs (revealed staggered 13.0s - 14.5s)
  const isShowingDesigns = time >= 13.0;
  const showCard1 = time >= 13.2;
  const showCard2 = time >= 13.7;
  const showCard3 = time >= 14.2;

  // Scene 6: Selecting 3 cards (clicked at 17.3s, 17.9s, 18.5s)
  const isCard1Selected = time >= 17.3;
  const isCard2Selected = time >= 17.9;
  const isCard3Selected = time >= 18.5;
  const isDownloadClicked = time >= 19.1;

  // Virtual Cursor Choreography (x, y coordinates in percentage [0..100])
  const getCursorState = () => {
    // 0.0 - 1.8s: Cursor moves to 9:16 aspect ratio button & clicks
    if (time < 1.8) {
      const p = time / 1.8;
      return { x: 30 + p * 25, y: 35 - p * 23, clicking: time > 1.6 && time <= 1.8, visible: true };
    }
    // 1.8 - 3.2s: Cursor rests, then moves down toward photo tray
    if (time < 3.2) {
      const p = (time - 1.8) / 1.4;
      return { x: 55 + p * (-25), y: 12 + p * 70, clicking: false, visible: true };
    }
    // 3.2 - 6.5s: Cursor sweeps and clicks each of the 5 photos
    if (time < 4.0) return { x: 22, y: 84, clicking: time > 3.3 && time < 3.6, visible: true };
    if (time < 4.7) return { x: 36, y: 84, clicking: time > 4.0 && time < 4.3, visible: true };
    if (time < 5.4) return { x: 50, y: 84, clicking: time > 4.7 && time < 5.0, visible: true };
    if (time < 6.1) return { x: 64, y: 84, clicking: time > 5.4 && time < 5.7, visible: true };
    if (time < 7.0) return { x: 78, y: 84, clicking: time > 6.1 && time < 6.4, visible: true };

    // 7.0 - 8.6s: Cursor drags photos to center template canvas
    if (time < 8.6) {
      const p = (time - 7.0) / 1.6;
      return { x: 78 - p * 28, y: 84 - p * 42, clicking: true, visible: true };
    }
    // 8.6 - 10.0s: Cursor hovers back as photos snap
    if (time < 10.0) {
      const p = (time - 8.6) / 1.4;
      return { x: 50 + p * 8, y: 42 + p * 25, clicking: false, visible: true };
    }
    // 10.0 - 12.3s: Prompt opens, cursor moves to "✦ Oluştur" button
    if (time < 12.3) {
      const p = (time - 10.0) / 2.3;
      return { x: 58 + p * 20, y: 67 + p * 15, clicking: false, visible: true };
    }
    // 12.3 - 13.0s: Cursor clicks "✦ Oluştur"
    if (time < 13.0) {
      return { x: 78, y: 82, clicking: true, visible: true };
    }
    // 13.0 - 17.0s: 3 designs generate, cursor rests admiring
    if (time < 17.0) {
      const p = (time - 13.0) / 4.0;
      return { x: 78 - p * 48, y: 82 - p * 40, clicking: false, visible: true };
    }
    // 17.0 - 18.7s: Cursor selects card 1, 2, 3
    if (time < 17.6) return { x: 26, y: 46, clicking: time > 17.2 && time < 17.5, visible: true };
    if (time < 18.2) return { x: 50, y: 46, clicking: time > 17.8 && time < 18.1, visible: true };
    if (time < 18.8) return { x: 74, y: 46, clicking: time > 18.4 && time < 18.7, visible: true };

    // 18.8 - 20.0s: Cursor moves to top-right "İndir" button & clicks
    if (time < 19.5) {
      const p = (time - 18.8) / 0.7;
      return { x: 74 + p * 14, y: 46 - p * 34, clicking: time > 19.1 && time < 19.4, visible: true };
    }
    return { x: 88, y: 12, clicking: false, visible: true };
  };

  const cursor = getCursorState();

  const handleJumpToScene = (targetTime: number) => {
    setTime(targetTime);
  };

  return (
    <div className={`saas-demo-wrapper ${isTheater ? 'theater-mode' : ''}`}>
      {/* SaaS App Window Container */}
      <div className="saas-window">
        {/* Window Chrome Header */}
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

          {/* Top Right Action (Transforms into "İndir" in Scene 6) */}
          <div className="saas-chrome-actions">
            <button 
              className={`saas-top-download-btn ${isDownloadClicked ? 'success' : ''} ${currentScene === 6 ? 'highlight' : ''}`}
            >
              {isDownloadClicked ? (
                <>
                  <Check size={13} className="text-white animate-bounce" />
                  <span>İndirildi!</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>{currentScene === 6 ? 'İndir (3)' : 'Dışa Aktar'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Studio Stage */}
        <div className="saas-stage">
          {/* ═══════════ TOP: Aspect Ratio Selector Bar ═══════════ */}
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
                    {isActive && <motion.div layoutId="demo-active-ratio" className="saas-pill-glow" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════ CENTER: Template Canvas Stage ═══════════ */}
          <div className="saas-canvas-viewport">
            <AnimatePresence mode="wait">
              {/* Scenes 1, 2, 3, 4: Single Morphing Canvas */}
              {!isShowingDesigns && (
                <motion.div
                  key="single-template"
                  className="saas-main-canvas"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    width: currentRatio === '9:16' ? 220 : 250,
                    height: currentRatio === '9:16' ? 320 : 250,
                  }}
                  transition={{ type: 'spring', damping: 26, stiffness: 180 }}
                >
                  {/* Canvas Selection Handles */}
                  <div className="saas-canvas-corner tl" />
                  <div className="saas-canvas-corner tr" />
                  <div className="saas-canvas-corner bl" />
                  <div className="saas-canvas-corner br" />
                  <div className="saas-canvas-tag">
                    {currentRatio === '9:16' ? '1080 × 1920 (9:16)' : '1080 × 1080 (1:1)'}
                  </div>

                  {/* Empty Drop Zone (Before Snap) */}
                  {!isPhotosSnapped && (
                    <div className={`saas-empty-drop-box ${isDraggingPhotos ? 'drag-over' : ''}`}>
                      <div className="saas-empty-icon-wrap">
                        <Sparkles size={22} className="text-[#FF6B1A]" />
                      </div>
                      <p className="saas-empty-text">
                        {isDraggingPhotos ? 'Görselleri Bırakın' : 'Şablon Alanı'}
                      </p>
                      <span className="saas-empty-sub">
                        {isDraggingPhotos ? 'Otomatik Grid Kolajı' : 'Fotoğrafları sürükleyin'}
                      </span>
                    </div>
                  )}

                  {/* Snapped Photos Grid (Scene 3 & 4) */}
                  {isPhotosSnapped && (
                    <motion.div
                      className="saas-snapped-grid"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                    >
                      <div className="saas-grid-main-img">
                        <img src={DEMO_PHOTOS[0].url} alt="Main" />
                        <div className="saas-img-tag">Ana Görsel</div>
                      </div>
                      <div className="saas-grid-side-imgs">
                        <div className="saas-grid-sub-img">
                          <img src={DEMO_PHOTOS[1].url} alt="Sub 1" />
                        </div>
                        <div className="saas-grid-sub-img">
                          <img src={DEMO_PHOTOS[2].url} alt="Sub 2" />
                        </div>
                      </div>

                      {/* Laser scanning during Scene 4 prompt/AI generation */}
                      {isGeneratingAI && (
                        <motion.div
                          className="saas-scan-laser"
                          initial={{ top: '0%' }}
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Scenes 5 & 6: 3 Staggered Generated Designs */}
              {isShowingDesigns && (
                <motion.div
                  key="three-designs-gallery"
                  className="saas-designs-gallery"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Card 1: Cover Design */}
                  {showCard1 && (
                    <motion.div
                      className={`saas-design-card card-1 ${isCard1Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    >
                      <div className="card-badge">01 · Kapak</div>
                      {isCard1Selected && <div className="card-check"><Check size={12} /></div>}
                      <div className="card-cover-photo">
                        <img src={DEMO_PHOTOS[0].url} alt="Cover" />
                        <div className="card-cover-overlay">
                          <span className="card-campaign-chip">YAZ KAMPANYASI</span>
                          <h4 className="card-title">YENİ SEZON</h4>
                          <p className="card-desc">Net %50 İndirim</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Card 2: Duo Collage 1 */}
                  {showCard2 && (
                    <motion.div
                      className={`saas-design-card card-2 ${isCard2Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    >
                      <div className="card-badge">02 · 2'li Kolaj</div>
                      {isCard2Selected && <div className="card-check"><Check size={12} /></div>}
                      <div className="card-duo-photos">
                        <div className="duo-half"><img src={DEMO_PHOTOS[1].url} alt="Duo 1" /></div>
                        <div className="duo-half"><img src={DEMO_PHOTOS[2].url} alt="Duo 2" /></div>
                      </div>
                      <div className="card-bottom-info">
                        <strong>KOLEKSİYON 2026</strong>
                        <span>Tüm Mağazalarda</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Card 3: Duo Collage 2 */}
                  {showCard3 && (
                    <motion.div
                      className={`saas-design-card card-3 ${isCard3Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                    >
                      <div className="card-badge">03 · Lookbook</div>
                      {isCard3Selected && <div className="card-check"><Check size={12} /></div>}
                      <div className="card-duo-photos">
                        <div className="duo-half"><img src={DEMO_PHOTOS[3].url} alt="Duo 3" /></div>
                        <div className="duo-half"><img src={DEMO_PHOTOS[4].url} alt="Duo 4" /></div>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <span className="saas-tray-label">Galeri (5 Fotoğraf)</span>
                <div className="saas-thumb-list">
                  {DEMO_PHOTOS.map((photo, i) => {
                    const isSelected = selectedPhotos[i];
                    return (
                      <div
                        key={photo.id}
                        className={`saas-photo-thumb ${isSelected ? 'selected' : ''}`}
                      >
                        <img src={photo.url} alt={photo.title} />
                        {isSelected && (
                          <div className="saas-thumb-check">
                            <Check size={10} />
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
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
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
                    <span className="text-[#0F172A] font-medium">{promptTypedText}</span>
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
                        <Sparkles size={13} />
                        <span>Oluştur</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ VIRTUAL CURSOR ═══════════ */}
          {cursor.visible && (
            <motion.div
              className={`saas-virtual-cursor ${cursor.clicking ? 'clicking' : ''}`}
              animate={{
                left: `${cursor.x}%`,
                top: `${cursor.y}%`,
                scale: cursor.clicking ? 0.82 : 1,
              }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 140,
                mass: 0.6,
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
            </motion.div>
          )}

          {/* Download Success Confetti/Toast in Scene 6 */}
          <AnimatePresence>
            {isDownloadClicked && (
              <motion.div
                className="saas-success-toast"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Check size={16} className="text-[#10B981]" />
                <div>
                  <strong>3 Tasarım İndirildi</strong>
                  <span>4K Ultra-HD · Kayıpsız ZIP</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════ BOTTOM TIMELINE CONTROLS ═══════════ */}
        <div className="saas-timeline-bar">
          <div className="saas-controls-left">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="saas-ctrl-btn"
              title={isPlaying ? 'Duraklat' : 'Oynat'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => setTime(0)}
              className="saas-ctrl-btn"
              title="Baştan Oynat"
            >
              <RotateCcw size={13} />
            </button>
            <span className="saas-time-display">
              {Math.floor(time)}s / {TOTAL_DURATION}s
            </span>
          </div>

          {/* Scene Selectors */}
          <div className="saas-scene-chips">
            {SCENES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleJumpToScene(s.time)}
                className={`saas-scene-chip ${currentScene === s.id ? 'active' : ''}`}
              >
                <span>0{s.id}</span>
                <span className="chip-name">{s.name}</span>
              </button>
            ))}
          </div>

          <div className="saas-controls-right">
            <button
              onClick={() => setIsTheater(!isTheater)}
              className="saas-ctrl-btn"
              title={isTheater ? 'Küçült' : 'Genişlet'}
            >
              {isTheater ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            {onEnterApp && (
              <button onClick={onEnterApp} className="saas-try-live-btn">
                <span>Stüdyoyu Aç</span>
                <MousePointer size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="saas-timeline-progress-track">
          <div 
            className="saas-timeline-progress-fill" 
            style={{ width: `${(time / TOTAL_DURATION) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
