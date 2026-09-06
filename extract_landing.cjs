const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import for Lenis at the top
if (!content.includes('import Lenis')) {
  content = content.replace('import React', "import Lenis from 'lenis';\nimport React");
  content = content.replace("import { motion, AnimatePresence }", "import { motion, AnimatePresence, useScroll, useTransform }");
}

// 2. We need to replace the current LandingHero and the `if (!user)` block with a new LandingPage component.
// Find where LandingHero starts
const heroStart = content.indexOf('function LandingHero({ onLogin }) {');
// Find where App starts
const appStart = content.indexOf('export default function App() {');

if (heroStart === -1 || appStart === -1) {
  console.error('Could not find components');
  process.exit(1);
}

// Remove the old LandingHero
const beforeHero = content.substring(0, heroStart);
let afterHero = content.substring(appStart);

const newLandingPage = `
function LandingPage({ onLogin }) {
  const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000, normX: 0, normY: 0 });
  const { scrollYProgress } = useScroll();
  
  // Parallax for Background Blobs
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  // Dynamic Header Blur & Opacity
  const headerBlur = useTransform(scrollYProgress, [0, 0.05], [0, 24]);
  const headerBgOpacity = useTransform(scrollYProgress, [0, 0.05], [0.1, 0.85]);
  const headerBorderOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      smooth: true,
      wheelMultiplier: 1,
    });
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    
    return () => lenis.destroy();
  }, []);

  const handleGlobalMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const featureCards = [
    { icon: '🪄', title: 'AI Sihirbaz', desc: 'Fotoğrafları otomatik yerleştirir, başlıkları oluşturur ve tasarımı saniyeler içinde hazırlar.' },
    { icon: '⚡', title: 'Akıllı Şablonlar', desc: 'Bir kez tasarlayın. Binlerce paylaşımı aynı kaliteyle üretin.' },
    { icon: '🚀', title: 'Tek Tık Çıktı', desc: 'PNG, JPEG ve yüksek DPI çıktılar. Sosyal medya ve baskı için hazır.' }
  ];

  return (
    <main 
      className="ds-landing-root" 
      aria-label="Karşılama Ekranı"
      onMouseMove={handleGlobalMouseMove}
    >
      {/* Global Mouse Light */}
      <div style={{
        position: 'fixed', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(107, 92, 255, 0.15) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 9999,
        left: mousePos.x - 300, top: mousePos.y - 300,
        transition: 'opacity 0.3s ease', opacity: mousePos.x === -1000 ? 0 : 1,
        mixBlendMode: 'screen'
      }} />

      {/* Parallax Background Blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div className="ds-blob" style={{ width: '600px', height: '600px', background: 'var(--ds-color-accent-primary)', top: '-10%', left: '-10%', y: blob1Y }} />
        <motion.div className="ds-blob" style={{ width: '500px', height: '500px', background: '#65dfff', right: '-10%', top: '30%', y: blob2Y }} />
        <motion.div className="ds-blob" style={{ width: '550px', height: '550px', background: 'var(--ds-color-accent-secondary)', bottom: '-20%', left: '20%', y: blob3Y }} />
      </div>

      <div className="ds-container">
        
        {/* DYNAMIC HEADER */}
        <motion.header 
          className="ds-header"
          style={{
            position: 'sticky', top: 'var(--ds-space-6)', zIndex: 100,
            backdropFilter: useTransform(headerBlur, b => \`blur(\${b}px) saturate(180%)\`),
            WebkitBackdropFilter: useTransform(headerBlur, b => \`blur(\${b}px) saturate(180%)\`),
            backgroundColor: useTransform(headerBgOpacity, o => \`rgba(255,255,255,\${o})\`),
            border: useTransform(headerBorderOpacity, o => \`1px solid rgba(255,255,255,\${o * 0.7})\`),
            boxShadow: useTransform(headerBorderOpacity, o => \`0 15px 45px rgba(0,0,0,\${o * 0.08})\`)
          }}
          aria-label="Ana Menü"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-4)' }}>
            <div style={{
              width: '52px', height: '52px', background: 'var(--ds-color-accent-gradient)',
              borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', fontWeight: 800, fontSize: '24px'
            }} aria-hidden="true">G</div>
            <div>
              <h2 style={{ fontSize: 'var(--ds-font-size-body)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Grafik Motoru</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-secondary)', margin: 0, fontWeight: 500 }}>
                Yapay Zeka Destekli Tasarım Platformu
              </p>
            </div>
          </div>
          <button className="ds-btn ds-btn-primary" onClick={onLogin} aria-label="Portala Giriş Yap">
            Portala Git &rarr;
          </button>
        </motion.header>

        {/* HERO SECTION */}
        <section className="ds-hero" aria-label="Tanıtım" style={{ perspective: '1200px' }}>
          <div style={{ zIndex: 10 }}>
            <motion.div className="ds-badge" aria-hidden="true" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              ✨ Living Aurora AI
            </motion.div>
            <motion.h1 className="ds-hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
              Grafikleriniz<br />kendini oluştursun.
            </motion.h1>
            <motion.p className="ds-hero-desc" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
              Fotoğraf yükleyin, başlığınızı yazın. Grafik Motoru saniyeler içinde kurumsal tasarımınızı oluştursun. Şablonlar, AI Sihirbaz ve otomatik yerleşim tek ekranda.
            </motion.p>
            <motion.div className="ds-hero-actions" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <button className="ds-btn ds-btn-primary" onClick={onLogin}>Portala Git</button>
              <button className="ds-btn ds-btn-secondary">Nasıl Çalışıyor</button>
            </motion.div>
          </div>

          <motion.div 
            className="ds-mockup-wrapper" 
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ds-anim-spin" style={{ position: 'absolute', width: '120%', height: '120%', top: '-10%', left: '-10%', background: 'conic-gradient(from 0deg, transparent, var(--ds-color-accent-primary), var(--ds-color-accent-secondary), transparent)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, zIndex: -1 }} />
            <div className="ds-anim-float" style={{ position: 'absolute', top: '-20px', right: '-20px', zIndex: 20, fontSize: '48px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>🪄</div>

            <motion.div 
              className="ds-mockup-card ds-glass-panel" 
              style={{ overflow: 'hidden', position: 'relative' }}
              whileHover={{ rotateX: 5, rotateY: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div style={{ position: 'absolute', inset: -100, zIndex: 15, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'ds-shimmer 6s infinite' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
              
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginBottom: 'var(--ds-space-4)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} /><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} /><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
                </div>
                
                <div style={{ width: '100%', flex: 1, background: 'linear-gradient(135deg, #dfe7ff, #ffffff)', borderRadius: '16px', marginBottom: 'var(--ds-space-6)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5, fontSize: '3rem' }}>🖼️</div>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--ds-color-accent-primary)', boxShadow: '0 0 15px 4px var(--ds-color-accent-primary)', animation: 'ds-scanline 3s infinite' }} />
                </div>
                
                <div style={{ height: '22px', background: 'var(--ds-color-accent-secondary)', borderRadius: '12px', marginBottom: 'var(--ds-space-4)', '--target-width': '75%', animation: 'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards' }} />
                <div style={{ height: '16px', background: '#cfd8ef', borderRadius: '12px', '--target-width': '55%', animation: 'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards' }} />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES SECTION (Scroll Reveal & Stagger) */}
        <section className="ds-features" aria-label="Özellikler">
          {featureCards.map((feature, i) => (
            <motion.article 
              key={i} 
              className="ds-feature-card ds-glass-panel"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03, rotateY: 5, rotateX: 5, boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--ds-space-4)' }} aria-hidden="true">{feature.icon}</div>
              <h3 className="ds-feature-title">{feature.title}</h3>
              <p className="ds-feature-desc" style={{ margin: 0 }}>{feature.desc}</p>
            </motion.article>
          ))}
        </section>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', padding: 'var(--ds-space-16) 0 var(--ds-space-8) 0', color: 'var(--ds-color-text-tertiary)', fontWeight: 600, fontSize: '0.875rem' }}>
          by <strong>Tunafx</strong>
        </footer>
      </div>
    </main>
  );
}

`;

// 3. Now replace the landing page block inside `if (!user)` in App with `<LandingPage onLogin={handleGoogleLogin} />`
// Wait, the if(!user) block currently returns `<main className="ds-landing-root"...` OR in my previous script I replaced it exactly? No, in my last script I literally replaced it with a plain DOM structure. 
// I need to find `if (!user) {` and replace it up to the `return (` of the main app.
const ifStart = afterHero.indexOf('if (!user) {');
const ifEnd = afterHero.indexOf('return (', ifStart + 10);
if (ifStart === -1 || ifEnd === -1) {
  console.error('Could not find if(!user) block inside App');
  process.exit(1);
}

// Ensure we don't accidentally cut the main app's return. The `ifEnd` should be the start of `return (` for the main app.
// We just replace the `if (!user)` block.
const replacementAppPart = `  if (!user) {
    return <LandingPage onLogin={handleGoogleLogin} />;
  }

  `;
afterHero = afterHero.substring(0, ifStart) + replacementAppPart + afterHero.substring(ifEnd);

// Combine everything
content = beforeHero + newLandingPage + afterHero;
fs.writeFileSync(file, content);
console.log('Successfully refactored LandingPage into Phase 3 (Lenis, Stagger, Parallax)');
