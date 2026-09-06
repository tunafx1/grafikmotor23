import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Download, Check, Layers, LayoutGrid, Home, FolderKanban, Image as ImageIcon, ChevronRight, CheckCircle2
} from 'lucide-react';

const TOTAL_DURATION = 20.0; // 20.0 seconds exact continuous loop

// ─── Fashion Imagery Assets for Monalisa Giyim ───
const FASHION_PHOTOS = [
  { id: 1, title: 'Look 01', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80', desc: 'Summer Edit' },
  { id: 2, title: 'Look 02', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80', desc: 'Minimalist Trench' },
  { id: 3, title: 'Look 03', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80', desc: 'Runway Blazer' },
  { id: 4, title: 'Look 04', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', desc: 'Aksesuar Detay' },
  { id: 5, title: 'Look 05', url: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&auto=format&fit=crop&q=80', desc: 'İpek Doku' },
];

// ─── Brand Workspace Cards in Scene 1 ───
const BRAND_WORKSPACES = [
  {
    id: 'sumer',
    name: 'Sümer Restoran',
    category: 'Restoran & Gastronomi',
    badgeColor: '#991B1B',
    badgeBg: '#FEF2F2',
    count: '12 Şablon',
    previews: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'latte',
    name: 'Latte Kafe',
    category: 'Kafe & Fırın',
    badgeColor: '#92400E',
    badgeBg: '#FFFBEB',
    count: '8 Şablon',
    previews: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'monalisa',
    name: 'Monalisa Giyim',
    category: 'Moda & Tekstil',
    badgeColor: '#FF6B00',
    badgeBg: '#FFF3EB',
    count: '24 Şablon • Aktif',
    previews: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'bahar',
    name: 'Bahar Okulları',
    category: 'Eğitim & Kampüs',
    badgeColor: '#1E40AF',
    badgeBg: '#EFF6FF',
    count: '6 Şablon',
    previews: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&auto=format&fit=crop&q=80',
    ],
  },
];

const PROMPT_TARGET_TEXT = 'Yaz kampanyası için enerjik ve renkli bir tasarım';

// Cubic ease-in-out easing
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Keyframe Waypoints for continuous smooth mouse trajectory without teleportation
interface Waypoint {
  t: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  clicking?: boolean;
}

const WAYPOINTS: Waypoint[] = [
  { t: 0.0, x: 14, y: 18 },
  { t: 0.6, x: 34, y: 38 }, // Hover Sümer Restoran
  { t: 1.1, x: 34, y: 38 },
  { t: 1.7, x: 74, y: 38 }, // Hover Latte Kafe
  { t: 2.1, x: 74, y: 38 },
  { t: 2.5, x: 74, y: 72 }, // Brief stop Bahar Okulları
  { t: 2.9, x: 34, y: 72 }, // Glides to Monalisa Giyim
  { t: 3.3, x: 34, y: 79, clicking: true }, // Clicks Monalisa Giyim
  { t: 3.6, x: 34, y: 79 },
  { t: 4.3, x: 48, y: 15 }, // Glides to format 4:5
  { t: 4.8, x: 55, y: 15 }, // Glides to 9:16
  { t: 5.1, x: 55, y: 15, clicking: true }, // Clicks 9:16
  { t: 5.4, x: 55, y: 15 },
  { t: 6.4, x: 22, y: 88 }, // Down to Media Tray Photo 1
  { t: 7.1, x: 22, y: 88, clicking: true }, // Clicks Photo 1
  { t: 7.3, x: 22, y: 88 },
  { t: 7.6, x: 36, y: 88, clicking: true }, // Clicks Photo 2
  { t: 7.8, x: 36, y: 88 },
  { t: 8.1, x: 50, y: 88, clicking: true }, // Clicks Photo 3
  { t: 8.3, x: 50, y: 88 },
  { t: 8.6, x: 64, y: 88, clicking: true }, // Clicks Photo 4
  { t: 8.8, x: 64, y: 88 },
  { t: 9.1, x: 78, y: 88, clicking: true }, // Clicks Photo 5
  { t: 9.3, x: 78, y: 88 },
  { t: 9.8, x: 50, y: 88 }, // Centering on photos
  { t: 10.0, x: 50, y: 88, clicking: true }, // Holds to drag
  { t: 11.2, x: 50, y: 48, clicking: true }, // Drags onto canvas
  { t: 11.4, x: 50, y: 48 }, // Releases drop
  { t: 12.2, x: 42, y: 78 }, // Glides to AI Prompt Bar
  { t: 13.8, x: 42, y: 78 }, // Resting during typing
  { t: 14.2, x: 68, y: 78, clicking: true }, // Clicks "Oluştur"
  { t: 14.5, x: 68, y: 78 },
  { t: 15.3, x: 28, y: 52 }, // Glides to Generated Card 1
  { t: 15.8, x: 28, y: 52, clicking: true }, // Clicks Card 1
  { t: 16.1, x: 28, y: 52 },
  { t: 16.5, x: 50, y: 52, clicking: true }, // Clicks Card 2
  { t: 16.8, x: 50, y: 52 },
  { t: 17.2, x: 72, y: 52, clicking: true }, // Clicks Card 3
  { t: 17.5, x: 72, y: 52 },
  { t: 18.4, x: 88, y: 15 }, // Glides to "İndir" button
  { t: 18.8, x: 88, y: 15, clicking: true }, // Clicks "İndir"
  { t: 19.2, x: 88, y: 15 },
  { t: 20.0, x: 14, y: 18 }, // Seamless loop to start
];

function getCursorPosition(t: number) {
  let prev = WAYPOINTS[0];
  let next = WAYPOINTS[WAYPOINTS.length - 1];

  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (t >= WAYPOINTS[i].t && t <= WAYPOINTS[i + 1].t) {
      prev = WAYPOINTS[i];
      next = WAYPOINTS[i + 1];
      break;
    }
  }

  const duration = next.t - prev.t;
  const progress = duration > 0 ? easeInOut(Math.min(1, Math.max(0, (t - prev.t) / duration))) : 1;
  const x = prev.x + (next.x - prev.x) * progress;
  const y = prev.y + (next.y - prev.y) * progress;
  const isClicking = Boolean((prev.clicking && progress < 0.8) || (next.clicking && progress > 0.85));

  return { x, y, isClicking };
}

interface Props {
  onEnterApp?: () => void;
}

export function SaaSMotionDemo({ onEnterApp }: Props) {
  const [time, setTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Continuous 60fps Animation Loop (0 to 20 seconds)
  useEffect(() => {
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTime((prev) => {
        const next = prev + delta;
        if (next >= TOTAL_DURATION) {
          return 0; // Seamless loop back to 0
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
  // Scene 1: Brand Workspaces Grid (0.0s - 3.8s)
  const isScene1 = time < 3.8;
  const hoverSumer = time >= 0.5 && time < 1.3;
  const hoverLatte = time >= 1.4 && time < 2.2;
  const hoverBahar = time >= 2.3 && time < 2.7;
  const hoverMonalisa = time >= 2.7 && time < 3.8;
  const isMonalisaSelected = time >= 3.3;

  // Scene 2: Editor & Format Choice (3.8s - 6.8s)
  const isEditorMode = time >= 3.8;
  const is916RatioSelected = time >= 5.1;
  const currentRatio = is916RatioSelected ? '9:16' : '4:5';

  // Scene 3: Photo selection in Media Tray (6.8s - 9.8s)
  const selectedPhotos = [
    time >= 7.1,
    time >= 7.6,
    time >= 8.1,
    time >= 8.6,
    time >= 9.1,
  ];

  // Scene 4: Drag & Drop (9.8s - 12.4s)
  const isDragging = time >= 10.0 && time < 11.3;
  const isDropped = time >= 11.3;

  // Scene 5: AI Prompt Bar (12.4s - 15.0s)
  const isPromptVisible = time >= 12.4 && time < 15.0;
  const promptProgress = Math.min(1, Math.max(0, (time - 12.7) / 1.3));
  const promptCharsCount = Math.floor(promptProgress * PROMPT_TARGET_TEXT.length);
  const typedPrompt = PROMPT_TARGET_TEXT.slice(0, promptCharsCount);
  const isAILoading = time >= 14.3 && time < 15.0;

  // Scene 6: Generated Results (15.0s - 18.0s)
  const isShowingResults = time >= 15.0;
  const showResultCard1 = time >= 15.0;
  const showResultCard2 = time >= 15.25;
  const showResultCard3 = time >= 15.5;

  // Scene 7: Selection & Download (18.0s - 20.0s)
  const isCard1Selected = time >= 15.8;
  const isCard2Selected = time >= 16.5;
  const isCard3Selected = time >= 17.2;
  const isDownloadClicked = time >= 18.8;

  // Soft loop white fade at the very end
  const whiteFade = time >= 19.5 ? (time - 19.5) / 0.5 : 0;

  // Calculated mouse position
  const cursor = getCursorPosition(time);

  return (
    <div className="smd-wrapper" onClick={onEnterApp} title="Grafik Motoru Studio'yu Başlat">
      <div className="smd-window">
        
        {/* ── Window Chrome Top Header ── */}
        <div className="smd-chrome">
          <div className="smd-chrome-left">
            <div className="smd-traffic-lights">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="smd-breadcrumb">
              <span className="smd-crumb-base">Grafik Motoru</span>
              <ChevronRight size={12} className="smd-crumb-sep" />
              <span className="smd-crumb-active">
                {isEditorMode ? 'Şablonlarım / Monalisa Giyim' : 'Şablonlarım'}
              </span>
            </div>
          </div>

          <div className="smd-chrome-center">
            {isEditorMode && !isShowingResults && (
              <div className="smd-format-pills">
                <button 
                  type="button" 
                  className={`smd-format-pill ${currentRatio === '4:5' ? 'active' : ''}`}
                >
                  4:5
                </button>
                <button 
                  type="button" 
                  className="smd-format-pill"
                >
                  1:1
                </button>
                <button 
                  type="button" 
                  className={`smd-format-pill ${currentRatio === '9:16' ? 'active' : ''}`}
                >
                  9:16
                </button>
              </div>
            )}
          </div>

          <div className="smd-chrome-right">
            {isShowingResults ? (
              <div className={`smd-btn-download ${isDownloadClicked ? 'completed' : ''}`}>
                {isDownloadClicked ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>3 Tasarım İndirildi</span>
                  </>
                ) : (
                  <>
                    <Download size={13} strokeWidth={2.2} />
                    <span>İndir</span>
                  </>
                )}
              </div>
            ) : (
              <div className="smd-workspace-badge">
                <span className="smd-active-dot" />
                <span>Monalisa Workspace</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Application Body ── */}
        <div className="smd-app-body">
          
          {/* Left Mini Navigation Rail */}
          <aside className="smd-sidebar">
            <div className="smd-sidebar-logo">
              <img src="/grafik_motoru_icon_512.png" alt="GM" />
            </div>
            <nav className="smd-nav-items">
              <div className="smd-nav-btn" title="Ana Sayfa">
                <Home size={16} />
              </div>
              <div className={`smd-nav-btn ${!isEditorMode ? 'active' : ''}`} title="Şablonlarım">
                <LayoutGrid size={16} />
              </div>
              <div className="smd-nav-btn" title="Medya">
                <ImageIcon size={16} />
              </div>
              <div className="smd-nav-btn" title="Projeler">
                <FolderKanban size={16} />
              </div>
            </nav>
            <div className="smd-sidebar-footer">
              <div className="smd-user-avatar">TG</div>
            </div>
          </aside>

          {/* Main Stage Canvas */}
          <div className="smd-main-stage">
            
            {/* ═══════════ SCENE 1: BRAND WORKSPACES GRID ═══════════ */}
            {isScene1 && (
              <motion.div 
                className="smd-scene-brands"
                initial={{ opacity: 1 }}
                animate={{ opacity: isMonalisaSelected ? 0.2 : 1 }}
                transition={{ duration: 0.35 }}
              >
                <div className="smd-brands-header">
                  <div>
                    <h3 className="smd-brands-title">Şablonlarım</h3>
                    <p className="smd-brands-desc">Markalarınız için oluşturduğunuz tasarım alanları</p>
                  </div>
                  <div className="smd-filter-pill">
                    <span>Tüm Markalar (4)</span>
                  </div>
                </div>

                <div className="smd-brands-grid">
                  {BRAND_WORKSPACES.map((brand) => {
                    const isHovered = 
                      (brand.id === 'sumer' && hoverSumer) ||
                      (brand.id === 'latte' && hoverLatte) ||
                      (brand.id === 'bahar' && hoverBahar) ||
                      (brand.id === 'monalisa' && hoverMonalisa);
                    const isPicked = brand.id === 'monalisa' && isMonalisaSelected;

                    return (
                      <div 
                        key={brand.id}
                        className={`smd-brand-card ${isHovered ? 'is-hover' : ''} ${isPicked ? 'is-picked' : ''}`}
                      >
                        <div className="smd-card-top">
                          <span 
                            className="smd-brand-badge" 
                            style={{ color: brand.badgeColor, background: brand.badgeBg }}
                          >
                            {brand.category}
                          </span>
                          <span className="smd-card-count">{brand.count}</span>
                        </div>

                        <h4 className="smd-card-name">{brand.name}</h4>

                        {/* 3 Preview Thumbnails */}
                        <div className="smd-card-previews">
                          {brand.previews.map((imgUrl, i) => (
                            <div key={i} className="smd-card-thumb">
                              <img src={imgUrl} alt={brand.name} />
                            </div>
                          ))}
                        </div>

                        <div className="smd-card-footer">
                          <span className={`smd-open-btn ${brand.id === 'monalisa' ? 'highlight' : ''}`}>
                            {brand.id === 'monalisa' ? 'Şablonları Gör →' : 'Görüntüle'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══════════ SCENE 2 - 5: MONALISA GIYIM EDITOR ═══════════ */}
            {isEditorMode && !isShowingResults && (
              <motion.div 
                className="smd-editor-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Central Canvas Stage */}
                <div className="smd-canvas-container">
                  <div 
                    className={`smd-artboard ${is916RatioSelected ? 'ratio-9-16' : 'ratio-4-5'} ${isDragging ? 'drop-target' : ''}`}
                  >
                    {/* Empty Canvas Placeholder (Scene 2 & 3) */}
                    {!isDropped ? (
                      <div className="smd-empty-artboard">
                        <div className="smd-artboard-ghost-icon">
                          <Layers size={22} />
                        </div>
                        <span className="smd-artboard-ratio-tag">{currentRatio} Tuval</span>
                        <p className="smd-artboard-hint">
                          {isDragging ? 'Fotoğrafları buraya bırakın' : 'Monalisa Giyim Tasarım Alanı'}
                        </p>
                      </div>
                    ) : (
                      /* Snapped Modern Fashion Collage (Scene 4 & 5) */
                      <motion.div 
                        className="smd-collage-layout"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Top Hero Fashion Photo */}
                        <div className="smd-collage-hero">
                          <img src={FASHION_PHOTOS[0].url} alt="Hero Look" />
                          <div className="smd-collage-tag">MONALISA • YENİ SEZON</div>
                        </div>

                        {/* 2-Column Split Duo Below */}
                        <div className="smd-collage-duo">
                          <div className="smd-duo-item">
                            <img src={FASHION_PHOTOS[1].url} alt="Trench Look" />
                          </div>
                          <div className="smd-duo-item">
                            <img src={FASHION_PHOTOS[2].url} alt="Blazer Look" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* AI Prompt Input Bar (Scene 5) */}
                    <AnimatePresence>
                      {isPromptVisible && (
                        <motion.div 
                          className="smd-prompt-bar"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 16 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="smd-prompt-sparkle">
                            <Sparkles size={14} />
                          </div>
                          <div className="smd-prompt-input">
                            <span className="smd-prompt-text">{typedPrompt}</span>
                            <span className="smd-typewriter-cursor" />
                          </div>
                          <button 
                            type="button" 
                            className={`smd-prompt-btn ${isAILoading ? 'loading' : ''}`}
                          >
                            {isAILoading ? (
                              <span className="smd-spinner" />
                            ) : (
                              <span>Oluştur</span>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bottom Media Tray (Scene 3 & 4) */}
                <div className="smd-media-tray">
                  <div className="smd-tray-meta">
                    <span className="smd-tray-label">Monalisa Giyim • Medya Havuzu</span>
                    <span className="smd-tray-count">5 Fotoğraf Seçildi</span>
                  </div>

                  <div className="smd-tray-grid">
                    {FASHION_PHOTOS.map((photo, idx) => {
                      const isSelected = selectedPhotos[idx];
                      return (
                        <div 
                          key={photo.id}
                          className={`smd-tray-thumb ${isSelected ? 'selected' : ''} ${isDragging ? 'is-ghost' : ''}`}
                        >
                          <img src={photo.url} alt={photo.title} />
                          {isSelected && (
                            <div className="smd-check-badge">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════ SCENE 6 & 7: AI DESIGN RESULTS ═══════════ */}
            {isShowingResults && (
              <motion.div 
                className="smd-results-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="smd-results-header">
                  <span className="smd-results-badge">✦ Gemini Motoruyla 3 Şablon Üretildi</span>
                </div>

                <div className="smd-results-grid">
                  
                  {/* Card 1: Fashion Campaign Cover */}
                  {showResultCard1 && (
                    <motion.div 
                      className={`smd-result-card ${isCard1Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="smd-res-img-wrap">
                        <img src={FASHION_PHOTOS[0].url} alt="Cover" />
                        <div className="smd-res-overlay">
                          <span className="smd-res-tag">MONALISA</span>
                          <h5 className="smd-res-hero-title">YENİ SEZON</h5>
                          <p className="smd-res-sub">Summer Edit 2026</p>
                        </div>
                      </div>
                      {isCard1Selected && (
                        <div className="smd-res-check">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Card 2: 2-Split Lookbook Collage */}
                  {showResultCard2 && (
                    <motion.div 
                      className={`smd-result-card ${isCard2Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="smd-res-duo-split">
                        <div className="smd-duo-half">
                          <img src={FASHION_PHOTOS[1].url} alt="Look A" />
                        </div>
                        <div className="smd-duo-half">
                          <img src={FASHION_PHOTOS[2].url} alt="Look B" />
                        </div>
                      </div>
                      <div className="smd-res-card-info">
                        <span className="smd-res-badge-pill">Yaza Özel</span>
                        <strong>Şehir Koleksiyonu</strong>
                        <p>2 Parçalı Görsel Yerleşim</p>
                      </div>
                      {isCard2Selected && (
                        <div className="smd-res-check">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Card 3: Model + Product Detail */}
                  {showResultCard3 && (
                    <motion.div 
                      className={`smd-result-card ${isCard3Selected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="smd-res-duo-split">
                        <div className="smd-duo-half">
                          <img src={FASHION_PHOTOS[3].url} alt="Detail" />
                        </div>
                        <div className="smd-duo-half">
                          <img src={FASHION_PHOTOS[4].url} alt="Fabric" />
                        </div>
                      </div>
                      <div className="smd-res-card-info">
                        <span className="smd-res-badge-pill">Yeni Koleksiyon</span>
                        <strong>Lansman İndirimi</strong>
                        <p>%30 Özel Erken Erişim</p>
                      </div>
                      {isCard3Selected && (
                        <div className="smd-res-check">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </motion.div>
                  )}

                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* ── Dragged Multi-Photo Stack (Anchored to Cursor) ── */}
        {isDragging && (
          <div 
            className="smd-drag-cluster"
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          >
            <div className="smd-cluster-item item-1">
              <img src={FASHION_PHOTOS[0].url} alt="P1" />
            </div>
            <div className="smd-cluster-item item-2">
              <img src={FASHION_PHOTOS[1].url} alt="P2" />
            </div>
            <div className="smd-cluster-item item-3">
              <img src={FASHION_PHOTOS[2].url} alt="P3" />
            </div>
            <div className="smd-cluster-badge">
              <span>5 Fotoğraf</span>
            </div>
          </div>
        )}

        {/* ── Virtual Vector Cursor & Click Ripple ── */}
        <div 
          className={`smd-cursor ${cursor.isClicking ? 'is-clicking' : ''}`}
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path 
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" 
              fill="#FFFFFF" 
              stroke="#161616" 
              strokeWidth="1.6" 
              strokeLinejoin="round" 
            />
          </svg>
          
          {cursor.isClicking && <span className="smd-click-wave" />}
        </div>

        {/* ── Seamless Loop White Fade ── */}
        {whiteFade > 0 && (
          <div 
            className="smd-white-fade" 
            style={{ opacity: whiteFade }} 
          />
        )}

      </div>
    </div>
  );
}
