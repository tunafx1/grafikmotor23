const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// We will inject the Loading state, Cursor, Noise, and Text Reveal.
// Find LandingPage
const lpStart = content.indexOf('function LandingPage({ onLogin }) {');
const lpEnd = content.indexOf('export default function App() {');

if (lpStart === -1 || lpEnd === -1) {
  console.error("LandingPage not found");
  process.exit(1);
}

let lpBlock = content.substring(lpStart, lpEnd);

// 1. Add state for Loading and Cursor
lpBlock = lpBlock.replace(
  'const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000, normX: 0, normY: 0 });',
  `const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000, normX: 0, normY: 0 });
  const [cursorHover, setCursorHover] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Initial premium loading sequence
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);`
);

// 2. Add Mouse Hover Detect for Cursor
lpBlock = lpBlock.replace(
  'setMousePos({ x: e.clientX, y: e.clientY });',
  `setMousePos({ x: e.clientX, y: e.clientY });
    // Check if hovering over interactive element
    const target = e.target;
    if (target.tagName.toLowerCase() === 'button' || target.closest('button')) {
      if (!cursorHover) setCursorHover(true);
    } else {
      if (cursorHover) setCursorHover(false);
    }`
);

// 3. Update the return to include Noise, Cursor, and Loading
lpBlock = lpBlock.replace(
  '<main \n      className="ds-landing-root"',
  `<main 
      className="ds-landing-root" `
);

// Add Noise and Custom Cursor directly inside the main
lpBlock = lpBlock.replace(
  '{/* Global Mouse Light */}',
  `{/* FAZ 4: Premium Noise Overlay */}
      <div className="ds-noise" />
      
      {/* FAZ 4: Premium Custom Cursor */}
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
        <div style={{
          width: cursorHover ? '48px' : '16px',
          height: cursorHover ? '48px' : '16px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'width 0.2s, height 0.2s',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
           {cursorHover && <span style={{ color: 'black', fontSize: '10px', fontWeight: 700, mixBlendMode: 'normal' }}>TIKLA</span>}
        </div>
      </motion.div>

      {/* FAZ 4: Premium Loading Sequence */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999, background: 'var(--ds-color-surface-primary)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'
            }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                width: '64px', height: '64px', background: 'var(--ds-color-accent-gradient)',
                borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: 'white', fontWeight: 800, fontSize: '32px', marginBottom: '16px',
                boxShadow: 'var(--ds-shadow-glass-heavy)'
              }}
            >G</motion.div>
            <motion.div 
              style={{ width: '120px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}
            >
              <motion.div 
                initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1, ease: "easeInOut" }}
                style={{ width: '100%', height: '100%', background: 'var(--ds-color-accent-primary)' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Mouse Light */}`
);

// 4. Update Buttons to use Button Physics
lpBlock = lpBlock.replace(
  '<button className="ds-btn ds-btn-primary" onClick={onLogin} aria-label="Portala Giriş Yap">',
  '<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="ds-btn ds-btn-primary" onClick={onLogin} aria-label="Portala Giriş Yap">'
);
lpBlock = lpBlock.replace(
  '</button>',
  '</motion.button>'
);

// Hero Actions Buttons
lpBlock = lpBlock.replace(
  '<button className="ds-btn ds-btn-primary" onClick={onLogin}>Portala Git</button>',
  '<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="ds-btn ds-btn-primary" onClick={onLogin}>Portala Git</motion.button>'
);
lpBlock = lpBlock.replace(
  '<button className="ds-btn ds-btn-secondary">Nasıl Çalışıyor</button>',
  '<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="ds-btn ds-btn-secondary">Nasıl Çalışıyor</motion.button>'
);


// 5. Text Reveal on Title
const titleString = `<motion.h1 className="ds-hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
              Grafikleriniz<br />kendini oluştursun.
            </motion.h1>`;
const titleReplacement = `<h1 className="ds-hero-title" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ overflow: 'hidden' }}>
                <motion.div initial={{ y: '100%' }} animate={{ y: '0%' }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                  Grafikleriniz
                </motion.div>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.div initial={{ y: '100%' }} animate={{ y: '0%' }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                  kendini oluştursun.
                </motion.div>
              </div>
            </h1>`;
lpBlock = lpBlock.replace(titleString, titleReplacement);

// 6. Header shimmer
const headerStart = lpBlock.indexOf('<motion.header');
lpBlock = lpBlock.replace(
  'className="ds-header"',
  'className="ds-header"\n          style={{ position: "relative", overflow: "hidden", ...arguments[0] }}' // wait, this is regex. Better exact matching
);

// We'll just add the shimmer inside the header
const headerGIndex = lpBlock.indexOf('aria-hidden="true">G</div>');
if (headerGIndex !== -1) {
   lpBlock = lpBlock.substring(0, headerGIndex + 26) + 
   `
   {/* Faz 4: Header Light Reflection */}
   <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', transform: 'skewX(-20deg) translateX(-150%)', animation: 'ds-shimmer 8s infinite 2s', pointerEvents: 'none', zIndex: 0 }} />
   ` + lpBlock.substring(headerGIndex + 26);
}


content = content.substring(0, lpStart) + lpBlock + content.substring(lpEnd);
fs.writeFileSync(file, content);
console.log('Successfully added Premium micro-interactions to App.tsx');
