import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

/* ─── AI Synaptic Neural Canvas (Clean Warm Amber & Orange on Light) ─── */
interface Sparkle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  baseAlpha: number;
  phase: number;
  vx: number;
  vy: number;
}

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  phase: number;
  color: string;
}

interface SynapticPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

function AINeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const targetMouse = { x: -2000, y: -2000 };
    const currentMouse = { x: -2000, y: -2000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const nodeColors = [
      'rgba(255, 107, 26, 0.85)',
      'rgba(255, 162, 107, 0.75)',
      'rgba(233, 87, 15, 0.75)',
      'rgba(255, 133, 51, 0.8)',
    ];

    let nodes: NeuralNode[] = [];
    let sparkles: Sparkle[] = [];
    let pulses: SynapticPulse[] = [];

    const initNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? 32 : 60;
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.8 + 1.2,
          baseRadius: Math.random() * 1.8 + 1.2,
          phase: Math.random() * Math.PI * 2,
          color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
        });
      }

      const sparkleCount = isMobile ? 6 : 14;
      sparkles = [];
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 6 + 5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.006,
          baseAlpha: Math.random() * 0.4 + 0.2,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    initNodes();

    const drawSparkle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      alpha: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.fillStyle = `rgba(255, 107, 26, ${alpha})`;
      c.shadowColor = 'rgba(255, 107, 26, 0.4)';
      c.shadowBlur = 6;

      c.beginPath();
      const inner = size * 0.22;
      for (let i = 0; i < 4; i++) {
        const outerAngle = (i * Math.PI) / 2;
        const innerAngle = outerAngle + Math.PI / 4;
        if (i === 0) {
          c.moveTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
        } else {
          c.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
        }
        c.lineTo(Math.cos(innerAngle) * inner, Math.sin(innerAngle) * inner);
      }
      c.closePath();
      c.fill();
      c.restore();
    };

    const maxLinkDist = 135;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      if (frameCount % 45 === 0 && nodes.length > 2 && pulses.length < 12) {
        const from = Math.floor(Math.random() * nodes.length);
        for (let j = 0; j < nodes.length; j++) {
          if (from === j) continue;
          const dx = nodes[from].x - nodes[j].x;
          const dy = nodes[from].y - nodes[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < maxLinkDist) {
            pulses.push({
              fromNode: from,
              toNode: j,
              progress: 0,
              speed: 0.02 + Math.random() * 0.02,
            });
            break;
          }
        }
      }

      // Synaptic lines
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const lineAlpha = (1 - dist / maxLinkDist) * 0.16;
            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5;
            const mdx = midX - currentMouse.x;
            const mdy = midY - currentMouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            let boostAlpha = 0;
            if (mdist < 150) {
              boostAlpha = (1 - mdist / 150) * 0.35;
            }

            ctx.strokeStyle = `rgba(255, 107, 26, ${lineAlpha + boostAlpha})`;
            ctx.lineWidth = boostAlpha > 0 ? 1.2 : 0.65;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Synaptic pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const a = nodes[pulse.fromNode];
        const b = nodes[pulse.toNode];
        if (!a || !b) continue;

        const px = a.x + (b.x - a.x) * pulse.progress;
        const py = a.y + (b.y - a.y) * pulse.progress;

        ctx.save();
        ctx.fillStyle = '#FF6B1A';
        ctx.shadowColor = 'rgba(255, 107, 26, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Neural nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.phase += 0.025;
        const pulse = Math.sin(node.phase) * 0.35 + 0.9;
        const currentRadius = node.baseRadius * pulse;

        const mdx = node.x - currentMouse.x;
        const mdy = node.y - currentMouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const mouseRadius = 150;

        if (mdist < mouseRadius && mdist > 0) {
          const pushFactor = (1 - mdist / mouseRadius) * 0.55;
          node.x += (mdx / mdist) * pushFactor;
          node.y += (mdy / mdist) * pushFactor;
        }

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        ctx.save();
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // AI Sparkles
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.rotation += s.rotSpeed;
        s.phase += 0.02;
        const alpha = s.baseAlpha + Math.sin(s.phase) * 0.2;
        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        drawSparkle(ctx, s.x, s.y, s.size, s.rotation, Math.max(0.08, alpha));
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-ai-canvas" />;
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
      {/* Ambient orbit ring & floating badges */}
      <div className="lp-orbit-ring" />
      <div className="lp-float-emoji lp-float-1">✦</div>
      <div className="lp-float-emoji lp-float-2">📸</div>
      <div className="lp-float-emoji lp-float-3">⚡</div>

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
                <div className="lp-motion-empty-icon">📁</div>
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

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const smoothX = useSpring(mouseX, { damping: 32, stiffness: 120 });
  const smoothY = useSpring(mouseY, { damping: 32, stiffness: 120 });

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.2]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasMoved) setHasMoved(true);
    mouseX.set(e.clientX - 220);
    mouseY.set(e.clientY - 220);
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

      {/* Silky cushioned mouse aura */}
      <motion.div
        className="lp-cursor-glow"
        style={{
          x: smoothX,
          y: smoothY,
          opacity: hasMoved ? 1 : 0,
        }}
      />

      {/* AI Synaptic Canvas */}
      <AINeuralCanvas />

      {/* Soft warm drifting blobs */}
      <div className="lp-mesh-container">
        <div className="lp-mesh lp-mesh-1" />
        <div className="lp-mesh lp-mesh-2" />
        <div className="lp-mesh lp-mesh-3" />
        <div className="lp-mesh lp-mesh-4" />
      </div>

      {/* Subtle grid pattern */}
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
          <motion.div
            className="lp-pill"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="lp-pill-dot" />
            ✦ Yapay Zekâ Destekli Sosyal Medya Motoru
          </motion.div>

          <motion.h1
            className="lp-hero-h1"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Sosyal medyanı <span className="lp-shimmer-text">hızlandır.</span>
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

        {/* Dynamic Hero Motion Graphic */}
        <HeroMotionGraphic onEnter={onEnter} />
      </motion.section>

      {/* ═══════════ MARQUEE STRIP ═══════════ */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="lp-marquee-set">
              {[
                'Sosyal Medyanı Hızlandır',
                'AI Metin & Başlık Sentezi',
                'Otomatik Şablon Düzeni',
                'Toplu Fotoğraf İşleme',
                'Reklamsız Medya İndirici',
                '4K Ultra-HD Çıktı',
                '%87 Zaman Tasarrufu',
                'Grafik Motoru v2.4',
              ].map((text, i) => (
                <span key={i} className="lp-marquee-item">
                  <span className="lp-marquee-dot" />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

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
          {/* Feature 1 */}
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
                <div className="lp-bento-icon">🤖</div>
              </div>
              <h3 className="lp-bento-title">Akıllı Metin & Başlık Sentezi</h3>
              <p className="lp-bento-desc">
                Tek bir cümlelik taslak girin; AI modelimiz kurumsal tonunuza en uygun
                başlık ve etiketleri anında üretsin.
              </p>
            </div>
            <div className="lp-bento-visual">
              <span style={{ fontSize: '0.75rem', color: '#E9570F', fontWeight: 700 }}>
                ✦ Otomatik Başlık: "Geleceğin Grafik Motoru"
              </span>
            </div>
          </motion.div>

          {/* Feature 2 */}
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
                <div className="lp-bento-icon">💎</div>
              </div>
              <h3 className="lp-bento-title">Sıfır Kayıplı 4K Render</h3>
              <p className="lp-bento-desc">
                Bulanıklığa yer yok. Kristal netliğinde tipografi ve yüksek dinamik aralıklı renklerle
                baskı ve ekran kalitesi.
              </p>
            </div>
            <div className="lp-bento-visual">
              <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 700 }}>
                1080 × 1080 (1:1) ve 1080 × 1920 (9:16) Çıktı
              </span>
            </div>
          </motion.div>

          {/* Feature 3 */}
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
                <div className="lp-bento-icon">📦</div>
              </div>
              <h3 className="lp-bento-title">Toplu Üretim & Reklamsız Medya</h3>
              <p className="lp-bento-desc">
                Tüm galeriyi tek seferde şablona giydirin, arka plan müziklerini güvenli ve
                reklamsız indirin.
              </p>
            </div>
            <div className="lp-bento-visual">
              <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 700 }}>
                Dakikada 50+ Gönderi · Reklamsız MP3/MP4
              </span>
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
