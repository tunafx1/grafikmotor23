import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

/* ─── Floating Particle Component ─── */
function FloatingParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="lp-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="lp-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
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
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Parallax transforms for scroll
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const mockupRotate = useTransform(scrollYProgress, [0, 0.2], [0, 8]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const bgGradientPos = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const featureCards = [
    {
      icon: '🎨',
      title: 'Şablon Oluşturucu',
      desc: 'Şablonunuzu bir kez oluşturun, her paylaşımda metinleri teker teker değiştirmeye son verin. Tek bir tasarım, sınırsız kullanım.',
      gradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
      tag: 'Zaman Tasarrufu',
    },
    {
      icon: '🤖',
      title: 'AI İçerik Asistanı',
      desc: 'Sadece kısa bir metin girin, yapay zeka başlıkları, açıklamaları ve tüm metinleri sizin yerinize oluştursun. Siz sadece fotoğraf yükleyin.',
      gradient: 'linear-gradient(135deg, #00B4D8 0%, #48CAE4 100%)',
      tag: 'Yapay Zeka',
    },
    {
      icon: '📦',
      title: 'Toplu İçerik Üretimi',
      desc: 'Fotoğraflarınızı toplu yükleyin, AI hepsini şablona otomatik yerleştirsin. Onlarca paylaşımı dakikalar içinde hazırlayın.',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
      tag: 'Toplu İşlem',
    },
    {
      icon: '🎵',
      title: 'MP3 & MP4 İndirici',
      desc: 'Reklamsız, hızlı medya indirme. Sosyal medya içerikleriniz için ihtiyacınız olan ses ve videoları kolayca indirin.',
      gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FFBF69 100%)',
      tag: 'Reklamsız',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Şablonu Bir Kez Oluşturun',
      desc: 'Markanıza uygun bir tasarım şablonu oluşturun. Bu şablonu tekrar tekrar kullanacaksınız — her paylaşım için yeniden tasarım yapmaya gerek yok.',
      icon: '🎯',
      color: '#6C5CE7',
    },
    {
      step: '02',
      title: 'Fotoğraf Yükleyin, AI Yerleştirsin',
      desc: 'Fotoğraflarınızı toplu olarak yükleyin, kısa bir metin girin. AI metinleri oluşturup görselleri otomatik yerleştirir.',
      icon: '⚡',
      color: '#00B4D8',
    },
    {
      step: '03',
      title: 'İndirin, Paylaşın',
      desc: 'Hazır tasarımlarınızı yüksek çözünürlükte indirin. Tek tek veya toplu — hepsi tek tıkla.',
      icon: '🚀',
      color: '#FF6B6B',
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
      {/* Animated gradient background */}
      <motion.div
        className="lp-bg-gradient"
        style={{ backgroundPositionY: bgGradientPos }}
      />

      {/* Mouse follower */}
      <div
        className="lp-cursor-glow"
        style={{
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          opacity: mousePos.x === -1000 ? 0 : 1,
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Animated mesh blobs */}
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
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-header-brand">
          <motion.div
            className="lp-logo"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            G
          </motion.div>
          <div>
            <h2 className="lp-brand-name">Grafik Motoru</h2>
            <p className="lp-brand-tagline">Sosyal Medya Yönetim Aracı</p>
          </div>
        </div>
        <div className="lp-header-nav">
          <button className="lp-nav-link" onClick={onLogin}>Giriş Yap</button>
          <motion.button
            className="lp-btn-accent"
            onClick={onEnter}
            whileHover={{ scale: 1.05 }}
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
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <span className="lp-pill-dot" />
            Sosyal Medya Yöneticileri İçin
          </motion.div>

          <motion.h1
            className="lp-hero-h1"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Şablonu bir kez oluştur,{' '}
            <span className="lp-shimmer-text">gerisini AI halleder.</span>
          </motion.h1>

          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Her paylaşımda metinleri teker teker değiştirmeye son verin.
            Şablonunuzu bir kez hazırlayın, fotoğraflarınızı toplu yükleyin,
            kısa bir açıklama girin — AI gerisini halleder. Reklamsız medya
            indirmeden toplu çıktıya, sosyal medya yöneticisinin ihtiyacı
            olan her şey tek bir platformda.
          </motion.p>

          <motion.div
            className="lp-hero-btns"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              className="lp-btn-accent lp-btn-xl"
              onClick={onEnter}
              whileHover={{ scale: 1.06, boxShadow: '0 12px 40px rgba(108,92,231,0.5)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span>✨</span> Hemen Başla — Ücretsiz
            </motion.button>
            <motion.a
              href="#nasil-calisir"
              className="lp-btn-glass lp-btn-xl"
              whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.12)' }}
            >
              Nasıl Çalışır? ↓
            </motion.a>
          </motion.div>

          {/* Social proof mini */}
          <motion.div
            className="lp-social-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <div className="lp-avatars">
              <div className="lp-avatar" style={{ background: '#6C5CE7' }}>T</div>
              <div className="lp-avatar" style={{ background: '#00B4D8' }}>A</div>
              <div className="lp-avatar" style={{ background: '#FF6B6B' }}>M</div>
            </div>
            <span>Sosyal medya yöneticileri tarafından kullanılıyor</span>
          </motion.div>
        </div>

        {/* Hero Visual / Mockup */}
        <motion.div
          className="lp-hero-visual"
          style={{ rotateY: mockupRotate, scale: mockupScale }}
        >
          {/* Orbiting ring */}
          <div className="lp-orbit-ring" />
          <div className="lp-float-emoji lp-float-1">🪄</div>
          <div className="lp-float-emoji lp-float-2">📸</div>
          <div className="lp-float-emoji lp-float-3">⚡</div>

          <motion.div
            className="lp-mockup"
            whileHover={{ rotateX: 5, rotateY: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="lp-mockup-shimmer" />
            <div className="lp-mockup-dots-grid" />
            <div className="lp-mockup-content">
              <div className="lp-mockup-toolbar">
                <span /><span /><span />
              </div>
              <div className="lp-mockup-canvas">
                <div className="lp-mockup-img-placeholder">
                  <div className="lp-mockup-scan" />
                  <span>🖼️</span>
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
              {['Toplu Çıktı', 'AI Metin Üretimi', 'Şablon Motoru', 'MP3 İndirici', 'MP4 İndirici', 'Yüksek Çözünürlük', 'Sosyal Medya', 'Reklamsız'].map((text, i) => (
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
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
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
          initial={{ opacity: 0, y: 40 }}
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
              initial={{ opacity: 0, y: 70, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10, scale: 1.03, boxShadow: '0 20px 50px rgba(108,92,231,0.15)' }}
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
          initial={{ opacity: 0, y: 40 }}
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
            Manuel düzenleme devri bitti. Şablonu hazırla, fotoğrafları at,
            çıktını al.
          </p>
        </motion.div>

        <div className="lp-how-timeline">
          <div className="lp-how-line" />
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              className="lp-how-step"
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
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
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-cta-glow-1" />
        <div className="lp-cta-glow-2" />
        <motion.h2
          className="lp-cta-h2"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Manuel düzenleme devri bitti.
        </motion.h2>
        <motion.p
          className="lp-cta-p"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          Sosyal medya yönetiminde saatler harcamayı bırakın. Şablonunuzu bir kez
          oluşturun, fotoğraflarınızı yükleyin, AI gerisini halleder.
          Ücretsiz başlayın.
        </motion.p>
        <motion.button
          className="lp-btn-accent lp-btn-xl lp-cta-btn"
          onClick={onEnter}
          whileHover={{ scale: 1.07, boxShadow: '0 16px 48px rgba(108,92,231,0.55)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          ✨ Hemen Başla — Ücretsiz
        </motion.button>
      </motion.section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <div className="lp-logo lp-logo-sm">G</div>
          <span className="lp-footer-name">Grafik Motoru</span>
        </div>
        <p className="lp-footer-by">
          by <strong>Tunafx</strong>
        </p>
      </footer>
    </div>
  );
}
