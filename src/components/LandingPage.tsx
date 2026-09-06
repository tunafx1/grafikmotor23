import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

/* ─── AI Neural Network & Sparkle Background Canvas ─── */
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

    // Mouse coordinates with Lerp (smooth dampening - eliminates erratic speed)
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

    // Official Brand Kit Colors: Motor Orange (#FF6B1A), Soft Amber (#FFA26B), and Soft Glow (#FFF1E8)
    const nodeColors = [
      'rgba(255, 107, 26, 0.85)',   // Motor Orange
      'rgba(255, 162, 107, 0.75)',  // Soft Amber Glow
      'rgba(255, 241, 232, 0.65)',  // Soft Orange White
      'rgba(233, 87, 15, 0.75)',    // Hover Orange
    ];

    let nodes: NeuralNode[] = [];
    let sparkles: Sparkle[] = [];

    const initNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? 26 : 54;
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.32, // Very calm, slow floating
          vy: (Math.random() - 0.5) * 0.32,
          radius: Math.random() * 1.5 + 1.2,
          baseRadius: Math.random() * 1.5 + 1.2,
          phase: Math.random() * Math.PI * 2,
          color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
        });
      }

      // ✦ AI Sparkle Star Glyphs
      const sparkleCount = isMobile ? 6 : 14;
      sparkles = [];
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 6 + 6,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.005, // Slow graceful spin
          baseAlpha: Math.random() * 0.35 + 0.2,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
        });
      }
    };

    initNodes();

    // Helper: Draw 4-point AI sparkle star
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
      c.fillStyle = `rgba(255, 162, 107, ${alpha})`;
      c.shadowColor = 'rgba(255, 107, 26, 0.6)';
      c.shadowBlur = 8;

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

    let time = 0;
    const maxLinkDist = 135;

    const render = () => {
      time += 0.016;

      // 1. Smooth Lerp of mouse coordinates (guarantees silky motion even during fast flicks)
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.045;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.045;

      ctx.clearRect(0, 0, width, height);

      // 2. Draw Synaptic Connections (Neural Lines between nodes)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const lineAlpha = (1 - dist / maxLinkDist) * 0.18;

            // Check if near smoothed mouse position
            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5;
            const mdx = midX - currentMouse.x;
            const mdy = midY - currentMouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            let boostAlpha = 0;
            if (mdist < 140) {
              boostAlpha = (1 - mdist / 140) * 0.32;
            }

            ctx.strokeStyle = `rgba(255, 107, 26, ${lineAlpha + boostAlpha})`;
            ctx.lineWidth = boostAlpha > 0 ? 1.15 : 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 3. Draw & Update Neural Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Organic slow breathing pulse
        node.phase += 0.02;
        const pulse = Math.sin(node.phase) * 0.35 + 0.85;
        const currentRadius = node.baseRadius * pulse;

        // Mouse gentle deflection (cushioned spring, no wild bouncing)
        const mdx = node.x - currentMouse.x;
        const mdy = node.y - currentMouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const mouseRadius = 150;

        if (mdist < mouseRadius && mdist > 0) {
          const pushFactor = (1 - mdist / mouseRadius) * 0.55;
          node.x += (mdx / mdist) * pushFactor;
          node.y += (mdy / mdist) * pushFactor;
        }

        // Natural gentle drift
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around bounds softly
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        // Render node circle with warm glow
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.shadowColor = 'rgba(255, 107, 26, 0.7)';
        ctx.shadowBlur = mdist < mouseRadius ? 12 : 6;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw & Update AI Sparkles (✦)
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.rotation += s.rotSpeed;
        s.phase += 0.015;
        const alpha = s.baseAlpha + Math.sin(s.phase) * 0.2;

        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        drawSparkle(ctx, s.x, s.y, s.size, s.rotation, Math.max(0.05, alpha));
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

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
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

  // Smooth mouse spring coordinates for the ambient cursor aura
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const smoothX = useSpring(mouseX, { damping: 32, stiffness: 120 });
  const smoothY = useSpring(mouseY, { damping: 32, stiffness: 120 });

  // Parallax transforms for scroll
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const mockupRotate = useTransform(scrollYProgress, [0, 0.2], [0, 8]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const bgGradientPos = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasMoved) setHasMoved(true);
    mouseX.set(e.clientX - 220);
    mouseY.set(e.clientY - 220);
  };

  const featureCards = [
    {
      icon: '🎨',
      title: 'Şablon Oluşturucu',
      desc: 'Şablonunuzu bir kez oluşturun, her paylaşımda metinleri teker teker değiştirmeye son verin. Tek bir tasarım, sınırsız kullanım.',
      gradient: 'linear-gradient(135deg, #FF6B1A 0%, #FF8533 100%)',
      tag: 'Zaman Tasarrufu',
    },
    {
      icon: '🤖',
      title: 'AI İçerik Asistanı',
      desc: 'Sadece kısa bir metin girin, yapay zekâ başlıkları, açıklamaları ve tüm metinleri sizin yerinize oluştursun. Siz sadece fotoğraf yükleyin.',
      gradient: 'linear-gradient(135deg, #E9570F 0%, #FF6B1A 100%)',
      tag: 'Yapay Zekâ',
    },
    {
      icon: '📦',
      title: 'Toplu İçerik Üretimi',
      desc: 'Fotoğraflarınızı toplu yükleyin, AI hepsini şablona otomatik yerleştirsin. Onlarca paylaşımı dakikalar içinde hazırlayın.',
      gradient: 'linear-gradient(135deg, #FF8533 0%, #FFA26B 100%)',
      tag: 'Toplu İşlem',
    },
    {
      icon: '🎵',
      title: 'MP3 & MP4 İndirici',
      desc: 'Reklamsız, hızlı medya indirme. Sosyal medya içerikleriniz için ihtiyacınız olan ses ve videoları doğrudan indirin.',
      gradient: 'linear-gradient(135deg, #FF6B1A 0%, #FF9F43 100%)',
      tag: 'Reklamsız',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Şablonu Bir Kez Oluşturun',
      desc: 'Markanıza uygun bir tasarım şablonu oluşturun. Bu şablonu tekrar tekrar kullanacaksınız — her paylaşım için yeniden tasarım yapmaya gerek yok.',
      icon: '🎯',
      color: '#FF6B1A',
    },
    {
      step: '02',
      title: 'Fotoğraf Yükleyin, AI Yerleştirsin',
      desc: 'Fotoğraflarınızı toplu olarak yükleyin, kısa bir metin girin. AI metinleri oluşturup görselleri otomatik yerleştirir.',
      icon: '⚡',
      color: '#FF8533',
    },
    {
      step: '03',
      title: 'İndirin, Paylaşın',
      desc: 'Hazır tasarımlarınızı yüksek çözünürlükte indirin. Tek tek veya toplu — hepsi tek tıkla.',
      icon: '🚀',
      color: '#E9570F',
    },
  ];

  const stats = [
    { value: '10x', label: 'Daha Hızlı' },
    { value: 'AI', label: 'Metin Üretimi' },
    { value: '4K', label: 'Çıktı Kalitesi' },
    { value: '∞', label: 'Toplu Dışa Aktarma' },
  ];

  return (
    <div
      ref={containerRef}
      className="lp-root"
      onMouseMove={handleMouseMove}
    >
      {/* Animated brand gradient background */}
      <motion.div
        className="lp-bg-gradient"
        style={{ backgroundPositionY: bgGradientPos }}
      />

      {/* Silky cushioned mouse aura */}
      <motion.div
        className="lp-cursor-glow"
        style={{
          x: smoothX,
          y: smoothY,
          opacity: hasMoved ? 1 : 0,
        }}
      />

      {/* AI Neural Network & Sparkle Interactive Canvas */}
      <AINeuralCanvas />

      {/* Warm brand ambient blobs */}
      <div className="lp-mesh-container">
        <div className="lp-mesh lp-mesh-1" />
        <div className="lp-mesh lp-mesh-2" />
        <div className="lp-mesh lp-mesh-3" />
        <div className="lp-mesh lp-mesh-4" />
      </div>

      {/* Noise overlay */}
      <div className="ds-noise" />

      {/* Grid lines overlay */}
      <div className="lp-grid-overlay" />

      {/* ═══════════ HEADER ═══════════ */}
      <motion.header
        className="lp-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-header-brand">
          <motion.div
            className="lp-logo"
            whileHover={{ scale: 1.08, rotate: 2 }}
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
          <button className="lp-nav-link" onClick={onLogin}>Giriş Yap</button>
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
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="lp-pill-dot" />
            ✦ Yapay Zekâ Destekli Sosyal Medya Motoru
          </motion.div>

          <motion.h1
            className="lp-hero-h1"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Sosyal medyanı <span className="lp-shimmer-text">hızlandır.</span>
          </motion.h1>

          <motion.div
            className="lp-hero-subhead"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            Şablonu bir kez oluştur, gerisini AI halletsin.
          </motion.div>

          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Her paylaşımda metinleri teker teker elle değiştirmeye son verin.
            Şablonunuzu bir kez hazırlayın, fotoğraflarınızı toplu yükleyin,
            kısa bir açıklama girin — yapay zekâ gerisini halleder. Reklamsız medya
            indirmeden toplu çıktıya, sosyal medya yöneticisinin ihtiyacı
            olan her şey tek bir platformda.
          </motion.p>

          <motion.div
            className="lp-hero-btns"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
          >
            <motion.button
              className="lp-btn-accent lp-btn-xl"
              onClick={onEnter}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(255, 107, 26, 0.5)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span>✦</span> Hemen Başla — Ücretsiz
            </motion.button>
            <motion.a
              href="#nasil-calisir"
              className="lp-btn-glass lp-btn-xl"
              whileHover={{ scale: 1.03 }}
            >
              Nasıl Çalışır? ↓
            </motion.a>
          </motion.div>

          {/* Social proof mini */}
          <motion.div
            className="lp-social-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            <div className="lp-avatars">
              <div className="lp-avatar" style={{ background: '#FF6B1A' }}>G</div>
              <div className="lp-avatar" style={{ background: '#FF8533' }}>M</div>
              <div className="lp-avatar" style={{ background: '#E9570F' }}>T</div>
            </div>
            <span>Sosyal medya yöneticileri ve içerik üreticileri için tasarlandı</span>
          </motion.div>
        </div>

        {/* Hero Mockup */}
        <motion.div
          className="lp-hero-visual"
          style={{ rotateY: mockupRotate, scale: mockupScale }}
        >
          <div className="lp-orbit-ring" />
          <div className="lp-float-emoji lp-float-1">✨</div>
          <div className="lp-float-emoji lp-float-2">📸</div>
          <div className="lp-float-emoji lp-float-3">⚡</div>

          <motion.div
            className="lp-mockup"
            whileHover={{ rotateX: 4, rotateY: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="lp-mockup-shimmer" />
            <div className="lp-mockup-dots-grid" />
            <div className="lp-mockup-content">
              <div className="lp-mockup-toolbar">
                <div className="lp-mockup-badge">
                  <span>✦</span> AI Şablon Motoru
                </div>
                <div className="lp-mockup-dots">
                  <span /><span /><span />
                </div>
              </div>
              <div className="lp-mockup-canvas">
                <div className="lp-mockup-scan" />
                <div className="lp-mockup-img-placeholder">
                  <div className="lp-mockup-icon-wrap">
                    <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru Monogram" />
                  </div>
                  <span className="lp-mockup-caption">Otomatik Tasarım & Yerleşim</span>
                </div>
              </div>
              <div className="lp-mockup-bar lp-bar-1" />
              <div className="lp-mockup-bar lp-bar-2" />
              <div className="lp-mockup-bar lp-bar-3" />
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══════════ MARQUEE STRIP ═══════════ */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="lp-marquee-set">
              {[
                'Sosyal Medyanı Hızlandır',
                'AI Metin Üretimi',
                'Şablon Motoru',
                'Toplu Fotoğraf İşleme',
                'Reklamsız MP3 / MP4',
                'Yüksek Çözünürlük',
                'Zaman Tasarrufu',
                'Grafik Motoru',
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
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-stat-val">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="lp-stat-lbl">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="lp-features">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="lp-sec-label">Özellikler</span>
          <h2 className="lp-sec-title">
            Sosyal medya yöneticinizin{' '}
            <span className="lp-shimmer-text">tüm ihtiyaçları</span> tek yerde.
          </h2>
          <p className="lp-sec-desc">
            Şablon oluşturmadan AI metin üretimine, toplu çıktıdan medya
            indirmeye — hepsini tek platformda yapın.
          </p>
        </motion.div>

        <div className="lp-features-grid">
          {featureCards.map((card, i) => (
            <motion.article
              key={i}
              className="lp-fcard"
              initial={{ opacity: 0, y: 50, rotateX: 6 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="lp-fcard-tag">{card.tag}</div>
              <div className="lp-fcard-icon" style={{ background: card.gradient }}>
                {card.icon}
              </div>
              <h3 className="lp-fcard-title">{card.title}</h3>
              <p className="lp-fcard-desc">{card.desc}</p>
              <div className="lp-fcard-shine" />
            </motion.article>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="lp-how" id="nasil-calisir">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="lp-sec-label">Nasıl Çalışır?</span>
          <h2 className="lp-sec-title">
            Üç adımda{' '}
            <span className="lp-shimmer-text">işinizi kolaylaştırın.</span>
          </h2>
          <p className="lp-sec-desc">
            Manuel düzenleme devri bitti. Şablonu hazırla, fotoğrafları yükle,
            çıktını al.
          </p>
        </motion.div>

        <div className="lp-how-timeline">
          <div className="lp-how-line" />
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              className="lp-how-step"
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="lp-how-num" style={{ background: item.color }}>{item.step}</div>
              <div className="lp-how-body">
                <div className="lp-how-emoji">{item.icon}</div>
                <h3 className="lp-how-h3">{item.title}</h3>
                <p className="lp-how-p">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <motion.section
        className="lp-cta"
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-cta-glow-1" />
        <div className="lp-cta-glow-2" />
        <motion.h2
          className="lp-cta-h2"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Sosyal medyanı hızlandırmaya hazır mısın?
        </motion.h2>
        <motion.p
          className="lp-cta-p"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Manuel düzenleme devri bitti. Şablonunuzu bir kez oluşturun,
          fotoğraflarınızı toplu yükleyin, AI gerisini halletsin.
          Ücretsiz başlayın.
        </motion.p>
        <motion.button
          className="lp-btn-accent lp-btn-xl lp-cta-btn"
          onClick={onEnter}
          whileHover={{ scale: 1.06, boxShadow: '0 16px 48px rgba(255, 107, 26, 0.55)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.45 }}
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
        <p className="lp-footer-by">
          by <strong>Tunafx</strong>
        </p>
      </footer>
    </div>
  );
}
