import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

/* ─── AI Synaptic Neural Network & Particle Background Canvas ─── */
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

interface FloatingDataBit {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vx: number;
  vy: number;
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

    // Mouse coordinates with silky spring dampening
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

    // Official Brand Kit Colors: Motor Orange (#FF6B1A), Amber (#FFA26B), and Soft Glow
    const nodeColors = [
      'rgba(255, 107, 26, 0.95)',   // Motor Orange
      'rgba(255, 162, 107, 0.85)',  // Soft Amber
      'rgba(255, 241, 232, 0.75)',  // Soft Orange White
      'rgba(233, 87, 15, 0.85)',    // Vivid Deep Orange
    ];

    let nodes: NeuralNode[] = [];
    let sparkles: Sparkle[] = [];
    let pulses: SynapticPulse[] = [];
    let dataBits: FloatingDataBit[] = [];

    const initNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? 38 : 72;
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

      // ✦ AI 4-Point Sparkle Diamonds
      const sparkleCount = isMobile ? 8 : 18;
      sparkles = [];
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 7 + 6,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.006,
          baseAlpha: Math.random() * 0.45 + 0.25,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
        });
      }

      // Floating AI Data Bits
      const bitTexts = ['AI', '01', '4K', 'GPU', 'SYN', 'FX', '10X', '✦'];
      const bitCount = isMobile ? 6 : 14;
      dataBits = [];
      for (let i = 0; i < bitCount; i++) {
        dataBits.push({
          x: Math.random() * width,
          y: Math.random() * height,
          text: bitTexts[Math.floor(Math.random() * bitTexts.length)],
          alpha: Math.random() * 0.16 + 0.06,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
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
      c.shadowColor = 'rgba(255, 107, 26, 0.7)';
      c.shadowBlur = 10;

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

    const maxLinkDist = 145;
    let frameCount = 0;

    const render = () => {
      frameCount++;

      // Silky Lerp mouse tracking
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Periodically trigger synaptic energy pulses
      if (frameCount % 40 === 0 && nodes.length > 2 && pulses.length < 15) {
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
              speed: 0.02 + Math.random() * 0.025,
            });
            break;
          }
        }
      }

      // 1. Draw Synaptic Lines
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const lineAlpha = (1 - dist / maxLinkDist) * 0.22;

            // Mouse proximity boost
            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5;
            const mdx = midX - currentMouse.x;
            const mdy = midY - currentMouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            let boostAlpha = 0;
            if (mdist < 160) {
              boostAlpha = (1 - mdist / 160) * 0.45;
            }

            ctx.strokeStyle = `rgba(255, 107, 26, ${lineAlpha + boostAlpha})`;
            ctx.lineWidth = boostAlpha > 0 ? 1.35 : 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 2. Draw & Advance Synaptic Energy Pulses
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
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FF6B1A';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw & Update Neural Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Breathing pulse
        node.phase += 0.025;
        const pulse = Math.sin(node.phase) * 0.35 + 0.9;
        const currentRadius = node.baseRadius * pulse;

        // Mouse interaction: cushioned deflection
        const mdx = node.x - currentMouse.x;
        const mdy = node.y - currentMouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const mouseRadius = 170;

        if (mdist < mouseRadius && mdist > 0) {
          const pushFactor = (1 - mdist / mouseRadius) * 0.65;
          node.x += (mdx / mdist) * pushFactor;
          node.y += (mdy / mdist) * pushFactor;
        }

        // Slow organic drift
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around bounds softly
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        // Render node with warm glowing aura
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.shadowColor = 'rgba(255, 107, 26, 0.85)';
        ctx.shadowBlur = mdist < mouseRadius ? 14 : 7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw & Update AI Sparkles
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

      // 5. Draw Floating Data Bits
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < dataBits.length; i++) {
        const b = dataBits[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -20) b.x = width + 20;
        if (b.x > width + 20) b.x = -20;
        if (b.y < -20) b.y = height + 20;
        if (b.y > height + 20) b.y = -20;

        ctx.fillStyle = `rgba(255, 162, 107, ${b.alpha})`;
        ctx.fillText(b.text, b.x, b.y);
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
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

/* ─── Canlı İnteraktif AI Stüdyo Gösterimi ─── */
const demoPresets = [
  {
    id: 'lansman',
    tab: '⚡ AI Lansman Duyurusu',
    tag: 'Yeni Nesil Lansman',
    title: 'Geleceğin Yapay Zekâ Tasarım Stüdyosu',
    sub: 'Saniyeler içinde otomatik başlık, açıklama ve 4K sosyal medya şablonu.',
    btnText: '✦ Ön Sipariş Ver',
    confidence: '99.8%',
    renderTime: '0.34s',
    tokens: '312 token',
    prompt: 'Premium SaaS için fütüristik ürün lansmanı metni ve görsel yerleşimi'
  },
  {
    id: 'indirim',
    tab: '🔥 Viral İndirim & E-Ticaret',
    tag: 'Sınırlı Süre Fırsatı',
    title: 'Büyük Sezon Sonu İndirimi: Sepette %50 Net',
    sub: 'Tüm koleksiyonlarda geçerli kupon kodunuz: MOTOR2026. Stoklarla sınırlıdır.',
    btnText: '🛒 Fırsatı Yakala',
    confidence: '99.4%',
    renderTime: '0.28s',
    tokens: '245 token',
    prompt: 'Instagram Story için aciliyet hissi uyandıran e-ticaret indirim tasarımı'
  },
  {
    id: 'etkinlik',
    tab: '🎯 Özel Etkinlik & Zirve',
    tag: 'Canlı Masterclass',
    title: 'Yapay Zekâ ile Dijital Pazarlama Zirvesi',
    sub: 'Sektörün öncü kreatif direktörleriyle interaktif canlı soru-cevap oturumu.',
    btnText: '🎟️ Ücretsiz Kaydol',
    confidence: '99.9%',
    renderTime: '0.41s',
    tokens: '290 token',
    prompt: 'LinkedIn ve Instagram için kurumsal etkinlik duyurusu ve konuşmacı görseli'
  },
  {
    id: 'podcast',
    tab: '🎧 Podcast & Medya Çıktısı',
    tag: 'Yeni Bölüm Yayında',
    title: 'Bölüm 42: Tasarımda Otomasyon Devrimi',
    sub: 'Reklamsız ses ayıklama, dinamik dalga formu ve tek tıkla video klip oluşturma.',
    btnText: '▶️ Şimdi Dinle',
    confidence: '99.6%',
    renderTime: '0.31s',
    tokens: '268 token',
    prompt: 'Spotify ve YouTube için dikkat çekici podcast kapağı ve alıntı şablonu'
  }
];

function LiveAIStudioShowcase({ onEnter }: { onEnter: () => void }) {
  const [activeTab, setActiveTab] = useState(demoPresets[0].id);
  const [isGenerating, setIsGenerating] = useState(false);

  const current = demoPresets.find((p) => p.id === activeTab) || demoPresets[0];

  const handleSwitchTab = (id: string) => {
    if (id === activeTab) return;
    setIsGenerating(true);
    setActiveTab(id);
    setTimeout(() => setIsGenerating(false), 380);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 450);
  };

  return (
    <section className="lp-demo-section">
      <motion.div
        className="lp-sec-header"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
      >
        <span className="lp-sec-label">Canlı Demo</span>
        <h2 className="lp-sec-title">
          Yapay Zekânın Hızını{' '}
          <span className="lp-shimmer-text">Doğrudan Deneyimleyin.</span>
        </h2>
        <p className="lp-sec-desc">
          Aşağıdaki senaryolara tıklayın; yapay zekânın başlık, etiket ve yerleşimleri
          nasıl milisaniyeler içinde kusursuz bir tasarıma dönüştürdüğünü görün.
        </p>
      </motion.div>

      <motion.div
        className="lp-demo-window"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Window Topbar */}
        <div className="lp-demo-topbar">
          <div className="lp-demo-dots">
            <span /><span /><span />
          </div>
          <div className="lp-demo-status-pill">
            <span className="lp-demo-status-dot" />
            <span>✦ Neural Sentezleyici Aktif · GPU Destekli</span>
          </div>
        </div>

        {/* Interactive Scenario Tabs */}
        <div className="lp-demo-tabs">
          {demoPresets.map((preset) => (
            <button
              key={preset.id}
              className={`lp-demo-tab ${activeTab === preset.id ? 'active' : ''}`}
              onClick={() => handleSwitchTab(preset.id)}
            >
              {preset.tab}
            </button>
          ))}
        </div>

        {/* Demo Content Grid */}
        <div className="lp-demo-content-grid">
          {/* Left: Input & Engine Controls */}
          <div className="lp-demo-left">
            <div>
              <span className="lp-sec-label" style={{ marginBottom: '10px' }}>Girdi & İstek</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0 10px', color: '#FFFFFF' }}>
                Kısa bir fikir girin, şablon tamamlansın.
              </h3>
              <p className="lp-demo-sub">
                Tasarımcınız olmadan da kurumsal kimliğinizi koruyan, yüksek dönüşüm odaklı
                içerikler üretin.
              </p>
            </div>

            <div className="lp-ai-prompt-input">
              <span>✦</span>
              <span>"{current.prompt}"</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="lp-demo-btn" onClick={handleRegenerate}>
                <span>⚡</span> AI ile Yeniden Oluştur
              </button>
              <button className="lp-btn-glass" onClick={onEnter}>
                Portala Git →
              </button>
            </div>

            <div className="lp-demo-meta-row" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
              <span className="lp-demo-meta-pill">✦ Güven Skoru: <strong>{current.confidence}</strong></span>
              <span className="lp-demo-meta-pill">⚡ Tepki: <strong>{current.renderTime}</strong></span>
              <span className="lp-demo-meta-pill">📦 İşlenen: <strong>{current.tokens}</strong></span>
            </div>
          </div>

          {/* Right: Real-time Render Canvas Card */}
          <div className="lp-demo-preview-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (isGenerating ? '-gen' : '')}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="lp-demo-preview-canvas"
              >
                <div className="lp-demo-scanline" />
                <span className="lp-demo-preview-tag">{current.tag}</span>
                <h4 className="lp-demo-preview-h">{current.title}</h4>
                <p className="lp-demo-preview-p">{current.sub}</p>
                <div style={{ marginTop: '16px' }}>
                  <span
                    style={{
                      background: '#FF6B1A',
                      color: '#FFF',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'inline-block',
                      boxShadow: '0 4px 14px rgba(255, 107, 26, 0.4)',
                    }}
                  >
                    {current.btnText}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="lp-demo-meta-row">
              <span>Otomatik 4K Render Çözünürlüğü</span>
              <span style={{ color: '#FF6B1A', fontWeight: 700 }}>1080 × 1080 (1:1)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
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

  const howItWorks = [
    {
      step: '01',
      title: 'Şablonu Bir Kez Oluşturun',
      desc: 'Markanıza uygun tasarım şablonunu belirleyin. Bir kere hazırlayın; aynı şablonu yüzlerce farklı gönderi için tekrar tekrar kullanın.',
      icon: '🎯',
      color: '#FF6B1A',
    },
    {
      step: '02',
      title: 'Fotoğrafları Yükleyin, AI Yazsın',
      desc: 'Görsellerinizi toplu yükleyin ve kısa bir fikir iletin. Yapay zekâ başlık, açıklama ve tipografiyi anında eksiksiz doldursun.',
      icon: '⚡',
      color: '#FFA26B',
    },
    {
      step: '03',
      title: 'Ultra HD 4K Çıktınızı Alın',
      desc: 'Saniyeler içinde tek tek veya tüm galeriyi tek tıkla yüksek çözünürlükte indirin, doğrudan sosyal medyanızda paylaşın.',
      icon: '🚀',
      color: '#E9570F',
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

      {/* AI Neural Network & Synapse Background Canvas */}
      <AINeuralCanvas />

      {/* Ambient glowing blobs */}
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
            indirmeden toplu çıktıya, profesyonel içerik üreticilerinin ihtiyacı
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
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(255, 107, 26, 0.55)' }}
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
              <div className="lp-avatar" style={{ background: '#FFA26B' }}>M</div>
              <div className="lp-avatar" style={{ background: '#E9570F' }}>T</div>
            </div>
            <span>Sosyal medya yöneticileri ve kreatif ajanslar için tasarlandı</span>
          </motion.div>
        </div>

        {/* Hero Mockup with Floating AI Chips */}
        <motion.div
          className="lp-hero-visual"
          style={{ rotateY: mockupRotate, scale: mockupScale }}
        >
          {/* Floating 3D AI Badges */}
          <div className="lp-ai-float-chip lp-chip-1">
            <span style={{ color: '#FF6B1A' }}>✦</span>
            <span>GPT-4o & Claude AI Motoru: Aktif</span>
          </div>
          <div className="lp-ai-float-chip lp-chip-2">
            <span>💎</span>
            <span>4K Ultra-HD · Sıfır Kayıp</span>
          </div>

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
                'AI Metin & Başlık Sentezi',
                'Otomatik Şablon Düzeni',
                'Toplu Fotoğraf İşleme',
                'Reklamsız MP3 / MP4 İndirici',
                '4K Ultra HD Çıktı',
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

      {/* ═══════════ CANLI INTERAKTIF AI STUDYOSU ═══════════ */}
      <LiveAIStudioShowcase onEnter={onEnter} />

      {/* ═══════════ LUXURY BENTO GRID FEATURES ═══════════ */}
      <section className="lp-features">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="lp-sec-label">Yapay Zekâ Mimarisi</span>
          <h2 className="lp-sec-title">
            Sosyal medya yöneticinizin{' '}
            <span className="lp-shimmer-text">tüm ihtiyaçları</span> tek stüdyoda.
          </h2>
          <p className="lp-sec-desc">
            Manuel tasarım döngüsünü tamamen ortadan kaldırın. Şablondan AI metne,
            toplu renderdan medya ayıklamaya kadar entegre güç.
          </p>
        </motion.div>

        <div className="lp-bento-grid">
          {/* Card 1: Large Bento (Span 2) - AI Text & Copy Assistant */}
          <motion.article
            className="lp-bento-card lp-bento-large"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="lp-bento-top">
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">✦ Yapay Zekâ Sentezi</span>
                <div className="lp-bento-icon" style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #E9570F 100%)' }}>
                  🤖
                </div>
              </div>
              <h3 className="lp-bento-title">Akıllı Metin & Başlık Sentezleyici</h3>
              <p className="lp-bento-desc">
                Tek bir cümlelik taslak girin; GPT-4o ve Claude destekli AI motorumuz kurumsal
                tonunuza en uygun başlık, alt başlık, etiket ve eylem çağrısı (CTA) metinlerini anında üretsin.
              </p>
            </div>

            <div className="lp-bento-visual">
              <div className="lp-ai-prompt-box">
                <div className="lp-ai-prompt-input">
                  <span>✦ İstem:</span>
                  <span>"Fütüristik tasarım stüdyosu için dikkat çekici lansman başlığı"</span>
                </div>
                <div className="lp-ai-output-cards">
                  <div className="lp-ai-output-pill">
                    <span className="lp-ai-output-label">Vurgulu Başlık</span>
                    <span className="lp-ai-output-val">Geleceğin Grafik Motoru</span>
                  </div>
                  <div className="lp-ai-output-pill">
                    <span className="lp-ai-output-label">AI Güven</span>
                    <span className="lp-ai-output-val" style={{ color: '#FF6B1A' }}>%99.8 Doğruluk</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-bento-shine" />
          </motion.article>

          {/* Card 2: Smart Template Engine */}
          <motion.article
            className="lp-bento-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="lp-bento-top">
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Otomasyon</span>
                <div className="lp-bento-icon" style={{ background: 'linear-gradient(135deg, #FFA26B 0%, #FF6B1A 100%)' }}>
                  🎨
                </div>
              </div>
              <h3 className="lp-bento-title">Akıllı Şablon Motoru</h3>
              <p className="lp-bento-desc">
                Şablonunuzu bir kez kurgulayın; marka renkleri, fontlar ve logolar kilitli kalsın.
                Her içerikte sıfırdan düzenlemeye son verin.
              </p>
            </div>

            <div className="lp-bento-visual">
              <div className="lp-stack-layers">
                <div className="lp-stack-layer lp-stack-layer-1">Instagram Post (1:1)</div>
                <div className="lp-stack-layer lp-stack-layer-2">Story / Reels (9:16)</div>
                <div className="lp-stack-layer lp-stack-layer-3">
                  <span>✦ Dinamik Katman</span>
                  <span>Kilitli</span>
                </div>
              </div>
            </div>
            <div className="lp-bento-shine" />
          </motion.article>

          {/* Card 3: Batch Production */}
          <motion.article
            className="lp-bento-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="lp-bento-top">
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Toplu İşlem</span>
                <div className="lp-bento-icon" style={{ background: 'linear-gradient(135deg, #E9570F 0%, #FF8533 100%)' }}>
                  📦
                </div>
              </div>
              <h3 className="lp-bento-title">Toplu İçerik Otomasyonu</h3>
              <p className="lp-bento-desc">
                Fotoğraflarınızı toplu olarak sürükleyin; sistem tüm görselleri şablon koordinatlarına
                otomatik yerleştirip sıraya alsın.
              </p>
            </div>

            <div className="lp-bento-visual" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  50+ Görsel / Dk
                </span>
                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Sıfır Kayıp
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--lp-muted)' }}>ZIP veya tek tek doğrudan indirme</span>
            </div>
            <div className="lp-bento-shine" />
          </motion.article>

          {/* Card 4: 4K GPU Render */}
          <motion.article
            className="lp-bento-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="lp-bento-top">
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Ultra-HD</span>
                <div className="lp-bento-icon" style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #FFA26B 100%)' }}>
                  💎
                </div>
              </div>
              <h3 className="lp-bento-title">Sıfır Kayıplı 4K Render</h3>
              <p className="lp-bento-desc">
                Piksellerde bulanıklığa yer yok. Vektörel hassasiyette, kristal netliğinde tipografi
                ve yüksek dinamik aralıklı (HDR) renk yönetimi.
              </p>
            </div>

            <div className="lp-bento-visual" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#FFF', fontWeight: 700 }}>Çıktı Kalitesi:</span>
              <span style={{ background: '#FF6B1A', color: '#FFF', padding: '3px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                4K Ultra-HD
              </span>
            </div>
            <div className="lp-bento-shine" />
          </motion.article>

          {/* Card 5: Media Downloader */}
          <motion.article
            className="lp-bento-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="lp-bento-top">
              <div className="lp-bento-header-row">
                <span className="lp-bento-tag">Reklamsız</span>
                <div className="lp-bento-icon" style={{ background: 'linear-gradient(135deg, #FF8533 0%, #E9570F 100%)' }}>
                  🎵
                </div>
              </div>
              <h3 className="lp-bento-title">MP3 & MP4 İndirici</h3>
              <p className="lp-bento-desc">
                Sosyal medya içerikleriniz için müzik ve video indirmek hiç bu kadar güvenli olmamıştı.
                Reklamsız, doğrudan YouTube bağlantısıyla ayıklayın.
              </p>
            </div>

            <div className="lp-bento-visual">
              <div className="lp-waveform-strip">
                {[...Array(16)].map((_, idx) => (
                  <div key={idx} className="lp-wave-bar" style={{ animationDelay: `${idx * 0.08}s` }} />
                ))}
              </div>
            </div>
            <div className="lp-bento-shine" />
          </motion.article>
        </div>
      </section>

      {/* ═══════════ BEFORE VS AFTER COMPARISON ═══════ */}
      <section className="lp-comparison">
        <motion.div
          className="lp-sec-header"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="lp-sec-label">Karşılaştırma</span>
          <h2 className="lp-sec-title">
            Eski yöntemlerin zaman kaybını{' '}
            <span className="lp-shimmer-text">geride bırakın.</span>
          </h2>
          <p className="lp-sec-desc">
            Saatler süren manuel hizalama ve kopyala-yapıştır rutinleri yerine
            Grafik Motoru'nun akıllı otomasyonuna geçin.
          </p>
        </motion.div>

        <div className="lp-comp-grid">
          {/* Old Way */}
          <motion.div
            className="lp-comp-card lp-comp-old"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="lp-comp-badge lp-comp-badge-old">✕ Geleneksel Yol</span>
            <h3 className="lp-comp-title">Yavaş ve Yorucu Süreç</h3>
            <ul className="lp-comp-list">
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Her yeni gönderi için saatlerce Photoshop açıp katmanları tek tek aramak</span>
              </li>
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Metinleri ve başlıkları farklı pencerelerden tek tek kopyalayıp hizalamak</span>
              </li>
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Görsel boyutları kaydığında tipografi hiyerarşisini sıfırdan düzenlemek</span>
              </li>
              <li className="lp-comp-item lp-comp-item-old">
                <span className="lp-comp-icon lp-comp-icon-old">✕</span>
                <span>Şüpheli ve reklam dolu sitelerde arka plan müziği veya video aramak</span>
              </li>
            </ul>
          </motion.div>

          {/* New Way - Grafik Motoru */}
          <motion.div
            className="lp-comp-card lp-comp-new"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="lp-comp-badge lp-comp-badge-new">✦ Grafik Motoru ile</span>
            <h3 className="lp-comp-title">10 Kat Daha Hızlı Akış</h3>
            <ul className="lp-comp-list">
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Şablonunuzu bir kez oluşturun; sınırsız gönderi için anında kullanın</span>
              </li>
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Yapay zekâ konunuza göre başlık, alt başlık ve etiketleri anında doldursun</span>
              </li>
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Fotoğraflarınızı toplu yükleyin; sistem pikselleri otomatik olarak ortalasın</span>
              </li>
              <li className="lp-comp-item lp-comp-item-new">
                <span className="lp-comp-icon lp-comp-icon-new">✓</span>
                <span>Dahili MP3 & MP4 indiriciyle güvenli, reklamsız medya indirme kolaylığı</span>
              </li>
            </ul>
          </motion.div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Tüm Sistemler Operasyonel · v2.4
          </span>
          <p className="lp-footer-by">
            by <strong>Tunafx</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
