const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

// Update Shadows to Multi-layered Smooth Shadows
content = content.replace(
  '--ds-shadow-glass: 0 15px 45px rgba(0, 0, 0, 0.08);',
  '--ds-shadow-glass: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.08);'
);
content = content.replace(
  '--ds-shadow-glass-heavy: 0 35px 90px rgba(0, 0, 0, 0.12);',
  '--ds-shadow-glass-heavy: 0 10px 15px rgba(0, 0, 0, 0.03), 0 25px 50px rgba(0, 0, 0, 0.08), 0 50px 100px rgba(0, 0, 0, 0.14);'
);

// Append Premium CSS elements
const premiumCSS = `
/* ==========================================================
   FAZ 4: PREMIUM POLISH 
   ========================================================== */

/* 1. Noise Texture Overlay */
.ds-noise {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* 2. Glass Reflection (Specular Highlight) */
.ds-glass-panel {
  box-shadow: 
    var(--ds-shadow-glass),
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.7),
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.2);
}

.ds-mockup-card {
  box-shadow: 
    var(--ds-shadow-glass-heavy),
    inset 1.5px 1.5px 0 0 rgba(255, 255, 255, 0.8),
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.2);
}

/* 3. Gradient Shift Animation */
@keyframes ds-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.ds-btn-primary {
  background-size: 200% 200%;
  animation: ds-gradient-shift 4s ease infinite;
}

/* 4. Premium Focus State */
.ds-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ds-color-bg-base), 0 0 0 6px var(--ds-color-accent-primary);
}

/* 5. Hide System Cursor when inside landing page */
.ds-landing-root {
  cursor: none;
}
.ds-landing-root button, 
.ds-landing-root a {
  cursor: none;
}
`;

fs.appendFileSync(file, premiumCSS);
console.log('Successfully added Premium Polish CSS to index.css');
