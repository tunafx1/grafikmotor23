const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject MagicParticles Component
const particlesComponent = `
function MagicParticles() {
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', inset: -100, pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: \`\${p.x}%\`,
            top: \`\${p.y}%\`,
            width: p.size,
            height: p.size,
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 10px 2px rgba(255,255,255,0.8)'
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}
`;

// Inject component before LandingPage
const lpIndex = content.indexOf('function LandingPage');
content = content.substring(0, lpIndex) + particlesComponent + '\n' + content.substring(lpIndex);

// 2. Add Pulse to Background Blobs
content = content.replace(
  'className="ds-blob" style={{ width: \'600px\'',
  'className="ds-blob ds-ai-blob-pulse" style={{ width: \'600px\''
);
content = content.replace(
  'className="ds-blob" style={{ width: \'500px\'',
  'className="ds-blob ds-ai-blob-pulse" style={{ animationDelay: \'-2s\', width: \'500px\''
);
content = content.replace(
  'className="ds-blob" style={{ width: \'550px\'',
  'className="ds-blob ds-ai-blob-pulse" style={{ animationDelay: \'-4s\', width: \'550px\''
);

// 3. Add Sparkles to AI Wizard and MagicParticles
content = content.replace(
  '<div className="ds-anim-float" style={{ position: \'absolute\', top: \'-20px\', right: \'-20px\', zIndex: 20, fontSize: \'48px\', filter: \'drop-shadow(0 10px 20px rgba(0,0,0,0.2))\' }}>🪄</div>',
  `<div className="ds-anim-float" style={{ position: 'absolute', top: '-30px', right: '-30px', zIndex: 20, fontSize: '56px', filter: 'drop-shadow(0 10px 30px rgba(107, 92, 255, 0.4))' }}>
              🪄
              <div className="ds-ai-sparkle" style={{ top: '-10px', right: '-10px', animationDelay: '0s' }} />
              <div className="ds-ai-sparkle" style={{ top: '20px', left: '-15px', animationDelay: '1s' }} />
              <div className="ds-ai-sparkle" style={{ bottom: '-10px', right: '10px', animationDelay: '2s' }} />
            </div>`
);

// Inject MagicParticles behind Mockup Card
content = content.replace(
  '<div className="ds-mockup-card ds-glass-panel"',
  '<MagicParticles />\n            <div className="ds-mockup-card ds-glass-panel"'
);

// 4. Update Placeholder with Data Flow
content = content.replace(
  '<div style={{ width: \'100%\', flex: 1, background: \'linear-gradient(135deg, #dfe7ff, #ffffff)\', borderRadius: \'16px\', marginBottom: \'var(--ds-space-6)\', position: \'relative\', overflow: \'hidden\' }}>',
  '<div className="ds-ai-data-placeholder" style={{ width: \'100%\', flex: 1, background: \'linear-gradient(135deg, #dfe7ff, #ffffff)\', borderRadius: \'16px\', marginBottom: \'var(--ds-space-6)\', position: \'relative\', overflow: \'hidden\' }}>'
);

// 5. Add Glow Tip to Expanding Texts
content = content.replace(
  'animation: \'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards\' }} />',
  'animation: \'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards\' }}><div className="ds-glow-tip"/></div>'
);
content = content.replace(
  'animation: \'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards\' }} />',
  'animation: \'ds-expand-width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards\' }}><div className="ds-glow-tip"/></div>'
);

fs.writeFileSync(file, content);
console.log('Successfully injected AI Identity into App.tsx');
