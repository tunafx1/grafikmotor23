const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const lpStart = content.indexOf('function LandingPage({ onLogin }) {');
const lpEnd = content.indexOf('export default function App() {');

if (lpStart === -1 || lpEnd === -1) {
  console.error("Could not find LandingPage");
  process.exit(1);
}

const newLandingPage = `
function LandingPage({ onLogin }) {
  const containerRef = React.useRef(null);
  
  // Custom Cursor state
  const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000 });
  const [cursorHover, setCursorHover] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
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
    const target = e.target;
    if (target.tagName?.toLowerCase() === 'button' || target.closest('button')) {
      if (!cursorHover) setCursorHover(true);
    } else {
      if (cursorHover) setCursorHover(false);
    }
  };

  // SCROLLYTELLING LOGIC
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Scene 1: Photo In (0 - 0.2)
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.05, 0.15, 0.2], [1, 1, 1, 0]);
  const photoY = useTransform(scrollYProgress, [0, 0.1], [100, 0]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Scene 2: AI Thinking (0.2 - 0.4)
  const scene2Opacity = useTransform(scrollYProgress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]);
  const aiScanOpacity = useTransform(scrollYProgress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]);
  const sparkleScale = useTransform(scrollYProgress, [0.2, 0.3, 0.4], [1, 2, 1]);

  // Scene 3: Template Layout (0.4 - 0.6)
  const scene3Opacity = useTransform(scrollYProgress, [0.35, 0.4, 0.55, 0.6], [0, 1, 1, 0]);
  const templateScaleX = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
  const templateOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);

  // Scene 4: Editor Opens (0.6 - 0.8)
  const scene4Opacity = useTransform(scrollYProgress, [0.55, 0.6, 0.75, 0.8], [0, 1, 1, 0]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5, 0.6, 0.8, 0.9], [1, 1, 0.75, 0.75, 1.1]);
  const panelLeftX = useTransform(scrollYProgress, [0.55, 0.65, 0.75, 0.8], [-200, 0, 0, -200]);
  const panelRightX = useTransform(scrollYProgress, [0.55, 0.65, 0.75, 0.8], [200, 0, 0, 200]);
  const panelsOpacity = useTransform(scrollYProgress, [0.55, 0.6, 0.75, 0.8], [0, 1, 1, 0]);

  // Scene 5: Export / Ready (0.8 - 1.0)
  const scene5Opacity = useTransform(scrollYProgress, [0.75, 0.85, 1], [0, 1, 1]);
  const ctaScale = useTransform(scrollYProgress, [0.8, 0.9], [0.8, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);

  return (
    <main 
      className="ds-landing-root" 
      aria-label="Film Deneyimi"
      onMouseMove={handleGlobalMouseMove}
    >
      <div className="ds-noise" />
      
      {/* Custom Cursor */}
      <motion.div 
        style={{
          position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 10000,
          mixBlendMode: 'difference'
        }}
        animate={{
          x: mousePos.x - (cursorHover ? 24 : 8),
          y: mousePos.y - (cursorHover ? 24 : 8),
          scale: cursorHover ? 1 : 1,
          opacity: mousePos.x === -1000 ? 0 : 1
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
      >
        <div style={{ width: cursorHover ? '48px' : '16px', height: cursorHover ? '48px' : '16px', backgroundColor: 'white', borderRadius: '50%', transition: 'width 0.2s, height 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           {cursorHover && <span style={{ color: 'black', fontSize: '10px', fontWeight: 700 }}>TIKLA</span>}
        </div>
      </motion.div>

      {/* Loading Sequence */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'var(--ds-color-surface-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} style={{ width: '64px', height: '64px', background: 'var(--ds-color-accent-gradient)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 800, fontSize: '32px', marginBottom: '16px', boxShadow: 'var(--ds-shadow-glass-heavy)' }}>G</motion.div>
            <div style={{ width: '120px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1, ease: "easeInOut" }} style={{ width: '100%', height: '100%', background: 'var(--ds-color-accent-primary)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <motion.header 
        className="ds-header"
        style={{
          position: 'fixed', top: 'var(--ds-space-6)', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, overflow: 'hidden',
          width: 'calc(100% - 48px)', maxWidth: '1200px',
          backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          backgroundColor: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 15px 45px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-4)' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--ds-color-accent-gradient)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 800, fontSize: '20px' }}>G</div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Grafik Motoru</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', margin: 0, fontWeight: 500 }}>AI Tasarım Platformu</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ds-btn ds-btn-primary" onClick={onLogin}>Portala Git &rarr;</motion.button>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', transform: 'skewX(-20deg) translateX(-150%)', animation: 'ds-shimmer 8s infinite 2s', pointerEvents: 'none' }} />
      </motion.header>

      {/* SCROLLYTELLING CONTAINER - 500VH */}
      <div ref={containerRef} style={{ height: '500vh', position: 'relative' }}>
        
        {/* THE VIEWPORT CAMERA (Sticky) */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px' }}>
          
          {/* Parallax Blobs in Camera */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
            <motion.div className="ds-blob ds-ai-blob-pulse" style={{ width: '600px', height: '600px', background: 'var(--ds-color-accent-primary)', top: '-10%', left: '-10%' }} />
            <motion.div className="ds-blob ds-ai-blob-pulse" style={{ animationDelay: '-2s', width: '500px', height: '500px', background: '#65dfff', right: '-10%', top: '30%' }} />
            <motion.div className="ds-blob ds-ai-blob-pulse" style={{ animationDelay: '-4s', width: '550px', height: '550px', background: 'var(--ds-color-accent-secondary)', bottom: '-20%', left: '20%' }} />
          </div>

          <MagicParticles />

          {/* THE MOCKUP CARD (Actor) */}
          <motion.div 
            className="ds-mockup-wrapper"
            style={{ 
              scale: mockupScale,
              position: 'relative',
              zIndex: 10
            }}
          >
            {/* Glow Ring behind card */}
            <div className="ds-anim-spin" style={{ position: 'absolute', width: '120%', height: '120%', top: '-10%', left: '-10%', background: 'conic-gradient(from 0deg, transparent, var(--ds-color-accent-primary), var(--ds-color-accent-secondary), transparent)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, zIndex: -1 }} />
            
            {/* Wizard Icon */}
            <motion.div className="ds-anim-float" style={{ position: 'absolute', top: '-30px', right: '-30px', zIndex: 20, fontSize: '56px', filter: 'drop-shadow(0 10px 30px rgba(107, 92, 255, 0.4))', scale: sparkleScale }}>
              🪄
              <div className="ds-ai-sparkle" style={{ top: '-10px', right: '-10px', animationDelay: '0s' }} />
              <div className="ds-ai-sparkle" style={{ top: '20px', left: '-15px', animationDelay: '1s' }} />
              <div className="ds-ai-sparkle" style={{ bottom: '-10px', right: '10px', animationDelay: '2s' }} />
            </motion.div>

            <div className="ds-mockup-card ds-glass-panel" style={{ overflow: 'hidden', position: 'relative', width: '380px', height: '500px' }}>
              <div style={{ position: 'absolute', inset: -100, zIndex: 15, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'ds-shimmer 6s infinite' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
              
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                {/* Top bar dots */}
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginBottom: 'var(--ds-space-4)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} /><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} /><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
                </div>
                
                {/* Photo Area */}
                <motion.div 
                  className="ds-ai-data-placeholder"
                  style={{ 
                    width: '100%', flex: 1, background: 'linear-gradient(135deg, #dfe7ff, #ffffff)', borderRadius: '16px', marginBottom: 'var(--ds-space-6)', position: 'relative', overflow: 'hidden',
                    opacity: photoOpacity, y: photoY
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5, fontSize: '3rem' }}>🖼️</div>
                  
                  {/* AI Scanline Overlay */}
                  <motion.div style={{ position: 'absolute', inset: 0, opacity: aiScanOpacity, pointerEvents: 'none' }}>
                     <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--ds-color-accent-primary)', boxShadow: '0 0 15px 4px var(--ds-color-accent-primary)', animation: 'ds-scanline 2s infinite' }} />
                  </motion.div>
                </motion.div>
                
                {/* Generated Text Lines */}
                <motion.div style={{ height: '22px', background: 'var(--ds-color-accent-secondary)', borderRadius: '12px', marginBottom: 'var(--ds-space-4)', opacity: templateOpacity, scaleX: templateScaleX, transformOrigin: 'left', position: 'relative' }}>
                  <div className="ds-glow-tip"/>
                </motion.div>
                <motion.div style={{ height: '16px', background: '#cfd8ef', borderRadius: '12px', width: '60%', opacity: templateOpacity, scaleX: templateScaleX, transformOrigin: 'left', position: 'relative' }}>
                  <div className="ds-glow-tip"/>
                </motion.div>

                {/* Success Overlay (Scene 5) */}
                <motion.div 
                  style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '16px', opacity: ctaOpacity, zIndex: 30 }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)', marginBottom: '24px' }}>Tasarımınız Hazır!</h3>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ds-btn ds-btn-primary" onClick={onLogin} style={{ scale: ctaScale, padding: '12px 32px' }}>
                    Şimdi Başla
                  </motion.button>
                </motion.div>

              </div>
            </div>
          </motion.div>

          {/* EDITOR PANELS (Scene 4) */}
          <motion.div style={{ position: 'absolute', left: '10%', top: '30%', width: '220px', height: '400px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--ds-shadow-glass-heavy)', border: '1px solid rgba(255,255,255,0.6)', opacity: panelsOpacity, x: panelLeftX, zIndex: 5 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '16px' }}>Katmanlar</h4>
            <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '12px' }} />
            <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '12px' }} />
            <div style={{ height: '40px', background: 'var(--ds-color-accent-secondary)', borderRadius: '10px', opacity: 0.5 }} />
          </motion.div>
          
          <motion.div style={{ position: 'absolute', right: '10%', top: '40%', width: '240px', height: '280px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--ds-shadow-glass-heavy)', border: '1px solid rgba(255,255,255,0.6)', opacity: panelsOpacity, x: panelRightX, zIndex: 5 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '16px' }}>Özellikler</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
               <div style={{ height: '30px', background: '#f1f5f9', borderRadius: '8px' }} />
               <div style={{ height: '30px', background: '#f1f5f9', borderRadius: '8px' }} />
               <div style={{ height: '30px', background: '#f1f5f9', borderRadius: '8px' }} />
               <div style={{ height: '30px', background: '#f1f5f9', borderRadius: '8px' }} />
            </div>
            <div style={{ height: '40px', background: 'var(--ds-color-accent-primary)', borderRadius: '10px' }} />
          </motion.div>

          {/* STORYTELLING TEXTS */}
          <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%', pointerEvents: 'none', zIndex: 50 }}>
            
            <motion.div style={{ position: 'absolute', width: '100%', opacity: scene1Opacity }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Her şey bir <span style={{ color: 'var(--ds-color-accent-primary)' }}>fotoğrafla</span> başlar.</h2>
            </motion.div>
            
            <motion.div style={{ position: 'absolute', width: '100%', opacity: scene2Opacity }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Yapay zeka <span style={{ color: 'var(--ds-color-accent-primary)' }}>analiz</span> ediyor...</h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--ds-color-text-secondary)', marginTop: '8px' }}>Bağlamı, renkleri ve kompozisyonu algılıyor.</p>
            </motion.div>

            <motion.div style={{ position: 'absolute', width: '100%', opacity: scene3Opacity }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Saniyeler içinde <span style={{ color: 'var(--ds-color-accent-primary)' }}>hazır.</span></h2>
            </motion.div>

            <motion.div style={{ position: 'absolute', width: '100%', opacity: scene4Opacity, bottom: '-80px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Tam kontrol <span style={{ color: 'var(--ds-color-accent-primary)' }}>sizde.</span></h2>
              <p style={{ fontSize: '1rem', color: 'var(--ds-color-text-secondary)', marginTop: '8px' }}>Editör arayüzü ile dilediğiniz gibi özelleştirin.</p>
            </motion.div>

            <motion.div style={{ position: 'absolute', width: '100%', opacity: scene5Opacity, bottom: '-60px' }}>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, textShadow: '0 10px 30px rgba(107,92,255,0.2)' }}>Tek tıkla <span style={{ color: 'var(--ds-color-accent-primary)' }}>çıktı alın.</span></h2>
            </motion.div>

          </div>

        </div>
      </div>
    </main>
  );
}
`;

content = content.substring(0, lpStart) + newLandingPage + '\n\n' + content.substring(lpEnd);

fs.writeFileSync(file, content);
console.log('Successfully applied Scrollytelling Film to App.tsx');
