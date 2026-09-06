import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

export function LandingPage({ onEnter, onLogin }: LandingPageProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animations
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleEnter = () => {
    onEnter();
  };

  const featureCards = [
    {
      icon: '🪄',
      title: 'AI Sihirbaz',
      desc: 'Fotoğraflarınızı yükleyin, yapay zeka otomatik olarak en iyi yerleşimi bulsun. Başlıklar, açıklamalar ve görsel düzen saniyeler içinde hazır.',
      gradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
    },
    {
      icon: '⚡',
      title: 'Akıllı Şablonlar',
      desc: 'Profesyonel şablonlardan birini seçin veya kendi tasarımınızı oluşturun. Bir kez hazırlayın, binlerce paylaşımı aynı kaliteyle üretin.',
      gradient: 'linear-gradient(135deg, #00B4D8 0%, #48CAE4 100%)',
    },
    {
      icon: '🚀',
      title: 'Tek Tık Çıktı',
      desc: 'PNG, JPEG ve yüksek DPI çıktılarınızı tek tıkla indirin. Sosyal medya, baskı ve dijital platformlar için anında hazır.',
      gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FFBF69 100%)',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Şablonunuzu Seçin',
      desc: 'Hazır profesyonel şablonlardan birini seçin veya sıfırdan kendi tasarımınızı oluşturun.',
      icon: '🎨',
    },
    {
      step: '02',
      title: 'İçeriği Ekleyin',
      desc: 'Fotoğraflarınızı yükleyin, metinlerinizi yazın. AI otomatik olarak en iyi yerleşimi oluştursun.',
      icon: '📸',
    },
    {
      step: '03',
      title: 'İndirin & Paylaşın',
      desc: 'Yüksek çözünürlüklü çıktınızı indirin veya toplu dışa aktarma ile tüm sayfaları tek seferde alın.',
      icon: '📤',
    },
  ];

  const stats = [
    { value: '100+', label: 'Hazır Şablon' },
    { value: 'AI', label: 'Yapay Zeka Destekli' },
    { value: '4K', label: 'Yüksek Çözünürlük' },
    { value: '∞', label: 'Toplu Dışa Aktarma' },
  ];

  return (
    <div
      ref={containerRef}
      className="landing-page-root"
      onMouseMove={handleMouseMove}
    >
      {/* Mouse follower glow */}
      <div
        className="landing-mouse-glow"
        style={{
          left: mousePos.x - 250,
          top: mousePos.y - 250,
          opacity: mousePos.x === -1000 ? 0 : 0.6,
        }}
      />

      {/* Animated background blobs */}
      <div className="landing-blobs-container">
        <div className="landing-blob landing-blob-1" />
        <div className="landing-blob landing-blob-2" />
        <div className="landing-blob landing-blob-3" />
      </div>

      {/* Noise texture overlay */}
      <div className="ds-noise" />

      {/* ===== HEADER ===== */}
      <motion.header
        className="landing-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-header-brand">
          <div className="landing-logo-mark">G</div>
          <div>
            <h2 className="landing-brand-title">Grafik Motoru</h2>
            <p className="landing-brand-sub">AI Tasarım Platformu</p>
          </div>
        </div>
        <div className="landing-header-actions">
          <button className="landing-btn-ghost" onClick={onLogin}>
            Giriş Yap
          </button>
          <button className="landing-btn-primary" onClick={handleEnter}>
            Portala Git →
          </button>
        </div>
      </motion.header>

      {/* ===== HERO SECTION ===== */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <motion.div
            className="landing-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="landing-badge-dot" />
            ✨ Yapay Zeka Destekli Tasarım
          </motion.div>

          <motion.h1
            className="landing-hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Grafikleriniz<br />
            <span className="landing-gradient-text">kendini oluştursun.</span>
          </motion.h1>

          <motion.p
            className="landing-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            Fotoğraf yükleyin, başlığınızı yazın — Grafik Motoru saniyeler içinde
            kurumsal tasarımınızı oluştursun. Şablonlar, AI Sihirbaz ve otomatik
            yerleşim ile profesyonel sonuçlara ulaşın.
          </motion.p>

          <motion.div
            className="landing-hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="landing-btn-primary landing-btn-lg" onClick={handleEnter}>
              Hemen Başla
            </button>
            <a href="#nasil-calisir" className="landing-btn-secondary landing-btn-lg">
              Nasıl Çalışır?
            </a>
          </motion.div>
        </div>

        {/* Hero Mockup */}
        <motion.div
          className="landing-hero-visual"
          initial={{ opacity: 0, scale: 0.85, rotateY: -12 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-mockup-glow" />
          <div className="landing-mockup-float-icon">🪄</div>
          <div className="landing-mockup-card">
            {/* Shimmer effect */}
            <div className="landing-mockup-shimmer" />
            {/* Grid dots */}
            <div className="landing-mockup-grid" />
            {/* Card content */}
            <div className="landing-mockup-inner">
              {/* Window dots */}
              <div className="landing-mockup-dots">
                <span /><span /><span />
              </div>
              {/* Image area */}
              <div className="landing-mockup-img-area">
                <div className="landing-mockup-img-icon">🖼️</div>
                <div className="landing-mockup-scanline" />
              </div>
              {/* Text placeholders */}
              <div className="landing-mockup-text-1" />
              <div className="landing-mockup-text-2" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== STATS BAR ===== */}
      <motion.section
        className="landing-stats"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {stats.map((stat, i) => (
          <div key={i} className="landing-stat-item">
            <div className="landing-stat-value">{stat.value}</div>
            <div className="landing-stat-label">{stat.label}</div>
          </div>
        ))}
      </motion.section>

      {/* ===== FEATURES ===== */}
      <section className="landing-features">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="landing-section-title">Neler Yapabilirsiniz?</h2>
          <p className="landing-section-desc">
            Grafik Motoru, profesyonel tasarım sürecinizi baştan sona kolaylaştırır.
          </p>
        </motion.div>

        <div className="landing-features-grid">
          {featureCards.map((card, i) => (
            <motion.article
              key={i}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div
                className="landing-feature-icon"
                style={{ background: card.gradient }}
              >
                {card.icon}
              </div>
              <h3 className="landing-feature-title">{card.title}</h3>
              <p className="landing-feature-desc">{card.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-how" id="nasil-calisir">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="landing-section-title">Nasıl Çalışır?</h2>
          <p className="landing-section-desc">
            Sadece üç adımda profesyonel tasarımlarınızı oluşturun.
          </p>
        </motion.div>

        <div className="landing-how-grid">
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              className="landing-how-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.7,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="landing-how-step">{item.step}</div>
              <div className="landing-how-icon">{item.icon}</div>
              <h3 className="landing-how-title">{item.title}</h3>
              <p className="landing-how-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <motion.section
        className="landing-cta"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-cta-glow" />
        <h2 className="landing-cta-title">Tasarım yapmaya hazır mısınız?</h2>
        <p className="landing-cta-desc">
          Grafik Motoru ile profesyonel tasarımlarınızı saniyeler içinde oluşturun.
          Ücretsiz başlayın, sınırsız oluşturun.
        </p>
        <button className="landing-btn-primary landing-btn-lg landing-cta-btn" onClick={handleEnter}>
          Hemen Başla →
        </button>
      </motion.section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <div className="landing-logo-mark landing-logo-mark-sm">G</div>
          <span>Grafik Motoru</span>
        </div>
        <p className="landing-footer-credit">
          by <strong>Tunafx</strong>
        </p>
      </footer>
    </div>
  );
}
