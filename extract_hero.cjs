const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// The new LandingHero component
const heroComponent = `
function LandingHero({ onLogin }) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const heroRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize to -1 to 1 for 3D tilt
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;
    
    setMousePos({ x, y, normX, normY });
  };

  const tiltX = mousePos.normY * -10; // max 10 deg
  const tiltY = mousePos.normX * 10;

  return (
    <section 
      className="ds-hero" 
      aria-label="Tanıtım"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      style={{ perspective: '1200px' }}
    >
      <div style={{ zIndex: 10 }}>
        <motion.div 
          className="ds-badge" aria-hidden="true"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          ✨ Living Aurora AI
        </motion.div>
        
        <motion.h1 
          className="ds-hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Grafikleriniz<br />kendini oluştursun.
        </motion.h1>
        
        <motion.p 
          className="ds-hero-desc"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Fotoğraf yükleyin, başlığınızı yazın. Grafik Motoru saniyeler içinde kurumsal tasarımınızı oluştursun. Şablonlar, AI Sihirbaz ve otomatik yerleşim tek ekranda.
        </motion.p>
        
        <motion.div 
          className="ds-hero-actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button 
            className="ds-btn ds-btn-primary"
            onClick={onLogin}
            aria-label="Portala Giriş Yap"
          >
            Portala Git
          </button>
          <button 
            className="ds-btn ds-btn-secondary"
            aria-label="Nasıl Çalıştığını Öğren"
          >
            Nasıl Çalışıyor
          </button>
        </motion.div>
      </div>

      {/* MOCKUP VISUAL with 3D Parallax */}
      <motion.div 
        className="ds-mockup-wrapper" 
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          transformStyle: 'preserve-3d',
          transform: \`rotateX(\${tiltX}deg) rotateY(\${tiltY}deg)\`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Glow Ring (Behind Card) */}
        <div 
          className="ds-anim-spin"
          style={{
            position: 'absolute', width: '120%', height: '120%', top: '-10%', left: '-10%',
            background: 'conic-gradient(from 0deg, transparent, var(--ds-color-accent-primary), var(--ds-color-accent-secondary), transparent)',
            borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, zIndex: -1
          }} 
        />
        
        {/* AI Wizard Floating Emoji */}
        <div 
          className="ds-anim-float"
          style={{
            position: 'absolute', top: '-20px', right: '-20px', zIndex: 20,
            fontSize: '48px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
          }}
        >
          🪄
        </div>

        <div className="ds-mockup-card ds-glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
          {/* Mouse Follow Glow */}
          <div style={{
            position: 'absolute', width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none', zIndex: 1,
            left: mousePos.x - 150, top: mousePos.y - 150,
            transition: 'opacity 0.3s ease', opacity: mousePos.x === 0 ? 0 : 1
          }} />

          {/* Light Reflection (Shimmer) */}
          <div 
            style={{
              position: 'absolute', inset: -100, zIndex: 15, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'ds-shimmer 6s infinite'
            }} 
          />

          {/* Static grid background for mockup */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none', zIndex: 0
          }} />
          
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginBottom: 'var(--ds-space-4)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
            </div>
            
            {/* Image Placeholder with Scanline */}
            <div style={{
              width: '100%', flex: 1, background: 'linear-gradient(135deg, #dfe7ff, #ffffff)',
              borderRadius: '16px', marginBottom: 'var(--ds-space-6)', position: 'relative', overflow: 'hidden'
            }}>
              {/* Image Icon Simulation */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5, fontSize: '3rem' }}>
                🖼️
              </div>
              {/* Scanline Animation */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'var(--ds-color-accent-primary)',
                boxShadow: '0 0 15px 4px var(--ds-color-accent-primary)',
                animation: 'ds-scanline 3s infinite'
              }} />
            </div>
            
            {/* Text Expansion Simulation */}
            <div style={{ 
              height: '22px', background: 'var(--ds-color-accent-secondary)', borderRadius: '12px', 
              marginBottom: 'var(--ds-space-4)', '--target-width': '75%', animation: 'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards' 
            }} />
            <div style={{ 
              height: '16px', background: '#cfd8ef', borderRadius: '12px',
              '--target-width': '55%', animation: 'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards' 
            }} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

`;

// Insert the component before "export default function App"
const insertPoint = content.indexOf('export default function App()');
if (insertPoint === -1) {
  console.error('Could not find App function');
  process.exit(1);
}
let newContent = content.substring(0, insertPoint) + heroComponent + content.substring(insertPoint);

// Replace the old section with the new component call
const oldSectionStart = newContent.indexOf('<section className="ds-hero" aria-label="Tanıtım">');
const oldSectionEnd = newContent.indexOf('</section>', oldSectionStart) + 10;
if (oldSectionStart === -1 || oldSectionEnd === -1) {
  console.error('Could not find old hero section');
  process.exit(1);
}

newContent = newContent.substring(0, oldSectionStart) + '<LandingHero onLogin={handleGoogleLogin} />' + newContent.substring(oldSectionEnd);

fs.writeFileSync(file, newContent);
console.log('Successfully added LandingHero to App.tsx');
