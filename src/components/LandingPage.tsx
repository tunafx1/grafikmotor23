import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { ImagePlus, Sparkles, Layers, Zap } from 'lucide-react';
import { SaaSMotionDemo } from './SaaSMotionDemo';

interface LandingPageProps {
  onEnter: () => void;
  onLogin?: () => void;
}

/* ─── Hero Animated Motion Graphic: Step-by-Step Simulated Design Studio ─── */
const samplePhoto = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

function HeroMotionGraphic({ onEnter }: { onEnter: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPhotoDropped, setIsPhotoDropped] = useState(false);
  const [showAiText, setShowAiText] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Automated 3-step loop: 1. Drag&Drop -> 2. AI Synthesis -> 3. Swoop & Download
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 1) {
      setIsPhotoDropped(false);
      setShowAiText(false);
      // Photo snaps into place 1.2s into step 1
      const dropTimer = setTimeout(() => {
        setIsPhotoDropped(true);
      }, 1200);

      timer = setTimeout(() => {
        setStep(2);
      }, 2800);

      return () => {
        clearTimeout(dropTimer);
        clearTimeout(timer);
      };
    } else if (step === 2) {
      setIsPhotoDropped(true);
      setShowAiText(false); // Clean photo first, no text!

      // Laser scan runs first; text only appears after AI magic finishes
      const textTimer = setTimeout(() => {
        setShowAiText(true);
      }, 1300);

      timer = setTimeout(() => {
        setStep(3);
      }, 3400);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(timer);
      };
    } else if (step === 3) {
      setIsPhotoDropped(true);
      setShowAiText(true);
      setDownloadProgress(0);

      // Animate download progress from 0% to 100%
      const progInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progInterval);
            return 100;
          }
          return prev + 25;
        });
      }, 140);

      timer = setTimeout(() => {
        setStep(1);
      }, 3800);

      return () => {
        clearInterval(progInterval);
        clearTimeout(timer);
      };
    }
  }, [step]);

  return (
    <div className="lp-hero-visual">
      <motion.div
        className="lp-motion-card"
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Interactive Step Navigator Pills */}
        <div className="lp-motion-stepper">
          <button
            className={`lp-motion-step-pill ${step === 1 ? 'active' : 'inactive'}`}
            onClick={() => {
              setStep(1);
              setIsPhotoDropped(false);
              setShowAiText(false);
            }}
          >
            <span>1.</span> Görseli Bırak
          </button>
          <button
            className={`lp-motion-step-pill ${step === 2 ? 'active' : 'inactive'}`}
            onClick={() => {
              setStep(2);
              setIsPhotoDropped(true);
              setShowAiText(false);
            }}
          >
            <span>2.</span> AI Sihri
          </button>
          <button
            className={`lp-motion-step-pill ${step === 3 ? 'active' : 'inactive'}`}
            onClick={() => {
              setStep(3);
              setIsPhotoDropped(true);
              setShowAiText(true);
            }}
          >
            <span>3.</span> İndir
          </button>
        </div>

        {/* Motion Studio Stage */}
        <div className="lp-motion-stage">
          {/* Active Status Badge in Step 3 */}
          <AnimatePresence>
            {step === 3 && (
              <motion.div
                className="lp-motion-status-banner"
                initial={{ opacity: 0, scale: 0.8, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <span>✓</span> Tasarım Yayına Hazır
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Media 1:1 Post Frame (Swoops in Step 3) */}
          <div className={`lp-motion-template ${step === 3 ? 'swoop' : ''}`}>
            {/* Step 1: Empty Drop Zone Placeholder */}
            {!isPhotoDropped && (
              <div className="lp-motion-empty-zone">
                <div className="lp-motion-empty-icon">
                  <ImagePlus size={26} className="text-[#FF6B1A]" />
                </div>
                <div>
                  <p className="lp-motion-empty-text">Görseli Buraya Bırakın</p>
                  <p className="lp-motion-empty-sub">Otomatik Boyutlandırma & Ortalama</p>
                </div>
              </div>
            )}

            {/* Photo Layer (Shown when dropped or in steps 2 & 3) */}
            {isPhotoDropped && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <img src={samplePhoto} alt="Örnek Tasarım Görseli" className="lp-motion-image-layer" />
                <div className="lp-motion-image-overlay" />
              </motion.div>
            )}

            {/* Step 2: AI Scanning Laser Line */}
            {step === 2 && !showAiText && (
              <motion.div
                className="lp-motion-laser"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Step 2 & 3: AI Generated Post Typography & Layout */}
            {isPhotoDropped && (
              <div className="lp-motion-post-content">
                <div className="lp-motion-top-tag">
                  <span>✦</span>
                  <span>{step === 2 && !showAiText ? 'AI Metin Yazıyor...' : 'Yaz Kampanyası 2026'}</span>
                </div>

                <AnimatePresence>
                  {showAiText && (
                    <motion.div
                      className="lp-motion-bottom-box"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h4 className="lp-motion-post-title">
                        Yeni Sezon Koleksiyonu
                      </h4>
                      <p className="lp-motion-post-sub">
                        Seçili parçalarda sepette net %50 indirim fırsatını kaçırmayın.
                      </p>
                      <div className="lp-motion-post-cta">
                        Hemen Keşfet →
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Step 1: Animated Mouse Cursor Carrying Photo Thumbnail */}
          <AnimatePresence>
            {step === 1 && !isPhotoDropped && (
              <motion.div
                className="lp-motion-cursor-holder"
                initial={{ x: 140, y: 110, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}
                >
                  <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 0 0-.35.35Z"
                    fill="#0F172A"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                  />
                </svg>
                <img src={samplePhoto} alt="Sürüklenen Görsel" className="lp-motion-drag-thumb" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Download Button & Interactive Progress Bar */}
          <AnimatePresence>
            {step === 3 && (
              <motion.div
                style={{ width: '100%', maxWidth: 310 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35 }}
              >
                <button className="lp-motion-download-btn" onClick={onEnter}>
                  <span>✦ İndir</span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                    {downloadProgress >= 100 ? '✓ Tamamlandı' : `%${downloadProgress}`}
                  </span>
                </button>
                <div className="lp-motion-progress-track">
                  <div
                    className="lp-motion-progress-fill"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export function LandingPage({ onEnter, onLogin }: LandingPageProps) {
  const [hasMoved, setHasMoved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const [bentoHeadlineIdx, setBentoHeadlineIdx] = useState(0);
  const bentoHeadlines = [
    'Geleceğin Grafik Motoru',
    'Sosyal Medyanı 10 Kat Hızlandır',
    'AI Destekli Satış Kampanyası',
    'Dikkat Çeken Instagram Kancaları',
    'Haftalık İçerik Planı Tek Tıkla',
  ];
  const [bentoFormat, setBentoFormat] = useState<'1:1' | '9:16'>('1:1');

  const mouseNormX = useMotionValue(0);
  const mouseNormY = useMotionValue(0);

  // Parallax for ambient aurora lights
  const parallaxX1 = useSpring(useTransform(mouseNormX, [-0.5, 0.5], [-45, 45]), { damping: 35, stiffness: 60 });
  const parallaxY1 = useSpring(useTransform(mouseNormY, [-0.5, 0.5], [-45, 45]), { damping: 35, stiffness: 60 });
  const parallaxX2 = useSpring(useTransform(mouseNormX, [-0.5, 0.5], [35, -35]), { damping: 40, stiffness: 55 });
  const parallaxY2 = useSpring(useTransform(mouseNormY, [-0.5, 0.5], [35, -35]), { damping: 40, stiffness: 55 });

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.2]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    mouseNormX.set((e.clientX / innerWidth) - 0.5);
    mouseNormY.set((e.clientY / innerHeight) - 0.5);
  };

  const howItWorks = [
    {
      step: '01',
      title: 'Görseli Bırak',
      desc: 'Fotoğraflarınızı tek tek veya toplu olarak sürükleyin. Otomatik hizalama ve şablon konumlandırma anında çalışır.',
    },
    {
      step: '02',
      title: 'AI Sihrini İzle',
      desc: 'Konunuza özel etkileyici başlık, açıklama ve etiketler yapay zekâ tarafından milisaniyeler içinde üretilir.',
    },
    {
      step: '03',
      title: '4K Çıktını Al',
      desc: 'Kristal netliğinde 4K Ultra-HD çözünürlükte tek tıkla indirin, doğrudan sosyal medyanızda paylaşın.',
    },
  ];

  const stats = [
    { value: '10x', label: 'Daha Hızlı Üretim' },
    { value: '< 0.4s', label: 'AI Yanıt Hızı' },
    { value: '4K', label: 'Kayıpsız Ultra-HD' },
    { value: '∞', label: 'Sınırsız Toplu İşlem' },
  ];

  return (
    <div
      ref={containerRef}
      className="lp-root"
      onMouseMove={handleMouseMove}
    >
      {/* Animated brand ambient background */}
      <div className="lp-bg-gradient" />

      {/* Spatial Parallax Ambient Mesh (Warm luminous glowing atmosphere) */}
      <div className="lp-mesh-container">
        <motion.div
          className="lp-mesh lp-mesh-1"
          style={{ x: parallaxX1, y: parallaxY1 }}
        />
        <motion.div
          className="lp-mesh lp-mesh-2"
          style={{ x: parallaxX2, y: parallaxY2 }}
        />
        <motion.div
          className="lp-mesh lp-mesh-3"
          style={{ x: parallaxX1, y: parallaxY2 }}
        />
      </div>

      {/* Architectural subtle grid pattern */}
      <div className="lp-grid-overlay" />

      {/* ═══════════ HEADER ═══════════ */}
      <motion.header
        className="lp-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-header-brand">
          <motion.div
            className="lp-logo"
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru Monogram" />
          </motion.div>
          <div>
            <h2 className="lp-brand-name">Grafik Motoru</h2>
            <p className="lp-brand-tagline">Sosyal medyanı hızlandır.</p>
          </div>
        </div>
        <div className="lp-header-nav">
          <motion.button
            className="lp-btn-accent"
            onClick={onEnter}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Portala Git →
          </motion.button>
        </div>
      </motion.header>

      {/* ═══════════ HERO ═══════════ */}
      <motion.section className="lp-hero" style={{ y: heroY, opacity: heroOpacity }}>
        <div className="lp-hero-text">
          <motion.h1
            className="lp-hero-h1"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Sosyal medyanı<br />
            <span className="lp-hero-accent">hızlandır.</span>
          </motion.h1>

          <motion.div
            className="lp-hero-subhead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Şablonu bir kez oluştur, gerisini AI halletsin.
          </motion.div>

          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Her gönderide metinleri tek tek elle değiştirmeye son verin.
            Fotoğraflarınızı yükleyin, kısa bir açıklama girin; yapay zekâ
            tasarımı ve içeriği saniyeler içinde tamamlasın.
          </motion.p>

          <motion.div
            className="lp-hero-btns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.button
              className="lp-btn-accent lp-btn-xl"
              onClick={onEnter}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              ✦ Hemen Başla — Ücretsiz
            </motion.button>
            <motion.a
              href="#nasil-calisir"
              className="lp-btn-glass lp-btn-xl"
              whileHover={{ scale: 1.02 }}
            >
              Nasıl Çalışır? ↓
            </motion.a>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            className="lp-social-proof-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="lp-avatars">
              <div className="lp-avatar" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA26B)' }}>T</div>
              <div className="lp-avatar" style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>M</div>
              <div className="lp-avatar" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>K</div>
              <div className="lp-avatar" style={{ background: 'linear-gradient(135deg, #8B5CF6, #C084FC)' }}>A</div>
            </div>
            <div className="lp-proof-info">
              <div className="lp-proof-stars">
                {'★★★★★'.split('').map((s, idx) => (
                  <span key={idx}>{s}</span>
                ))}
                <strong>4.9 / 5</strong>
              </div>
              <span className="lp-proof-caption">10.000+ tasarımcı ve ajans tarafından tercih ediliyor</span>
            </div>
          </motion.div>
        </div>

        {/* 15-20s SaaS Product Demo Motion Graphic */}
        <SaaSMotionDemo onEnterApp={onEnter} />
      </motion.section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="lp-stats">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="lp-stat"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="lp-stat-val">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="lp-stat-lbl">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* ═══════════ HOW IT WORKS (3 Clean Steps) ═══════════ */}
      <section className="lp-how" id="nasil-calisir">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="lp-sec-label">Nasıl Çalışır?</span>
          <h2 className="lp-sec-title">
            Üç basit adımda <span className="lp-shimmer-text">tasarımı tamamlayın.</span>
          </h2>
          <p className="lp-sec-desc">
            Karmaşık grafik programlarıyla saatler harcamak yerine işinizi kolaylaştırın.
          </p>
        </motion.div>

        <div className="lp-how-grid">
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              className="lp-how-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <div className="lp-how-num-badge">{item.step}</div>
              <h3 className="lp-how-h3">{item.title}</h3>
              <p className="lp-how-p">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ BENTO GRID (3 High-Impact Cards) ═══════════ */}
      <section className="lp-features">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="lp-sec-label">Özellikler</span>
          <h2 className="lp-sec-title">
            İhtiyacınız olan her şey <span className="lp-shimmer-text">tek stüdyoda.</span>
          </h2>
          <p className="lp-sec-desc">
            Kurumsal kimliğinizi korurken üretkenliğinizi katlayın.
          </p>
        </motion.div>

        <div className="lp-bento-grid">
          {/* Feature 1: Interactive AI Sentezi */}
          <motion.div
            className="lp-bento-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">✦ AI Sentezi</span>
                <div className="lp-bento-icon">
                  <Sparkles size={20} className="text-[#FF6B1A]" />
                </div>
              </div>
              <h3 className="lp-bento-title">Akıllı Metin & Başlık Sentezi</h3>
              <p className="lp-bento-desc">
                Tek bir cümlelik taslak girin; AI modelimiz kurumsal tonunuza en uygun
                başlık ve etiketleri anında üretsin.
              </p>
            </div>
            <div className="lp-bento-visual lp-bento-visual-interactive">
              <div className="lp-bento-ai-chip">
                <span className="lp-bento-ai-dot" />
                <span>Gemini 3.6 Flash</span>
              </div>
              <div className="lp-bento-quote-box">
                <div className="lp-bento-quote-label">Canlı Üretilen Başlık</div>
                <motion.div
                  key={bentoHeadlineIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="lp-bento-headline-text"
                >
                  "{bentoHeadlines[bentoHeadlineIdx]}"
                </motion.div>
              </div>
              <button
                type="button"
                onClick={() => setBentoHeadlineIdx((prev) => (prev + 1) % bentoHeadlines.length)}
                className="lp-bento-cycle-btn"
                title="Yeni bir yapay zekâ başlığı türet"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Yeni Başlık Türet</span>
              </button>
            </div>
          </motion.div>

          {/* Feature 2: Interactive Format & Ultra-HD */}
          <motion.div
            className="lp-bento-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div>
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Ultra-HD</span>
                <div className="lp-bento-icon">
                  <Layers size={20} className="text-[#FF6B1A]" />
                </div>
              </div>
              <h3 className="lp-bento-title">Sıfır Kayıplı 4K Render</h3>
              <p className="lp-bento-desc">
                Bulanıklığa yer yok. Kristal netliğinde tipografi ve yüksek dinamik aralıklı renklerle
                baskı ve ekran kalitesi.
              </p>
            </div>
            <div className="lp-bento-visual lp-bento-visual-interactive">
              <div className="lp-bento-format-toggle-bar">
                <button
                  type="button"
                  className={`lp-bento-format-btn ${bentoFormat === '1:1' ? 'active' : ''}`}
                  onClick={() => setBentoFormat('1:1')}
                >
                  1:1 Post
                </button>
                <button
                  type="button"
                  className={`lp-bento-format-btn ${bentoFormat === '9:16' ? 'active' : ''}`}
                  onClick={() => setBentoFormat('9:16')}
                >
                  9:16 Story / Reels
                </button>
              </div>
              <div className="lp-bento-canvas-preview-wrap">
                <div
                  className="lp-bento-aspect-canvas"
                  style={{
                    width: bentoFormat === '1:1' ? '58px' : '40px',
                    height: '58px',
                    borderRadius: '7px',
                    transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                >
                  <span className="lp-bento-canvas-dim">
                    {bentoFormat === '1:1' ? '1:1' : '9:16'}
                  </span>
                </div>
                <div className="lp-bento-format-meta">
                  <div className="lp-bento-format-tag">
                    <span className="lp-bento-format-dot" />
                    <span>{bentoFormat === '1:1' ? '1080 × 1080 px' : '1080 × 1920 px'}</span>
                  </div>
                  <div className="lp-bento-format-spec">300 DPI · Kayıpsız PNG & WebP</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Interactive Batch Queue */}
          <motion.div
            className="lp-bento-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Otomasyon</span>
                <div className="lp-bento-icon">
                  <Zap size={20} className="text-[#FF6B1A]" />
                </div>
              </div>
              <h3 className="lp-bento-title">Toplu Üretim & Reklamsız Medya</h3>
              <p className="lp-bento-desc">
                Tüm galeriyi tek seferde şablona giydirin, arka plan müziklerini güvenli ve
                reklamsız indirin.
              </p>
            </div>
            <div className="lp-bento-visual lp-bento-visual-interactive">
              <div className="lp-bento-batch-header">
                <span className="lp-bento-batch-title">Toplu Kuyruk (3 Dosya)</span>
                <span className="lp-bento-batch-pct">%84</span>
              </div>
              <div className="lp-bento-batch-bar-track">
                <div className="lp-bento-batch-bar-fill" style={{ width: '84%' }} />
              </div>
              <div className="lp-bento-batch-items">
                <div className="lp-bento-batch-item completed">
                  <span className="lp-bento-batch-check">✓</span>
                  <span className="lp-bento-batch-name">kampanya_post_01.png</span>
                  <span className="lp-bento-batch-badge">Hazır</span>
                </div>
                <div className="lp-bento-batch-item processing">
                  <span className="lp-bento-batch-spinner" />
                  <span className="lp-bento-batch-name">reels_kapak_02.png</span>
                  <span className="lp-bento-batch-badge live">Render...</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ BEFORE VS AFTER COMPARISON ═══════ */}
      <section className="lp-comparison">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="lp-sec-label">Karşılaştırma</span>
          <h2 className="lp-sec-title">
            Eski yöntemlerin zaman kaybını <span className="lp-shimmer-text">geride bırakın.</span>
          </h2>
          <p className="lp-sec-desc">
            Saatler süren kopyala-yapıştır rutinleri yerine akıllı otomasyona geçin.
          </p>
        </motion.div>

        <div className="lp-comp-grid">
          {/* Old Way */}
          <motion.div
            className="lp-comp-card lp-comp-old"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="lp-comp-badge lp-comp-badge-old">✕ Geleneksel Yol</span>
            <h3 className="lp-comp-title">Yavaş ve Yorucu</h3>
            <ul className="lp-comp-list">
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Her paylaşım için Photoshop açıp katmanları tek tek aramak</span>
              </li>
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Metinleri farklı pencerelerden kopyalayıp elle hizalamak</span>
              </li>
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Reklam dolu sitelerde arka plan müziği veya video aramak</span>
              </li>
            </ul>
          </motion.div>

          {/* New Way - Grafik Motoru */}
          <motion.div
            className="lp-comp-card lp-comp-new"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="lp-comp-badge lp-comp-badge-new">✦ Grafik Motoru ile</span>
            <h3 className="lp-comp-title">10 Kat Daha Hızlı</h3>
            <ul className="lp-comp-list">
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Şablonu bir kez kurgulayın; sınırsız gönderi için kullanın</span>
              </li>
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Yapay zekâ başlık ve açıklamaları anında doldursun</span>
              </li>
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Dahili MP3 & MP4 indiriciyle tek tıkla güvenli medya alımı</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <motion.section
        className="lp-cta"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="lp-cta-glow-1" />
        <div className="lp-cta-glow-2" />
        <h2 className="lp-cta-h2">Sosyal medyanı hızlandırmaya hazır mısın?</h2>
        <p className="lp-cta-p">
          Şablonunuzu bir kez oluşturun, fotoğraflarınızı yükleyin,
          AI gerisini halletsin. Hemen ücretsiz deneyin.
        </p>
        <motion.button
          className="lp-btn-accent lp-btn-xl lp-cta-btn"
          onClick={onEnter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          ✦ Hemen Başla — Ücretsiz
        </motion.button>
      </motion.section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <div className="lp-logo lp-logo-sm">
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" />
          </div>
          <span className="lp-footer-name">Grafik Motoru — Sosyal medyanı hızlandır.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Tüm Sistemler Aktif · v2.4
          </span>
          <p className="lp-footer-by">
            by <strong>Tunafx</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
