const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

const aiCSS = `
/* ==========================================================
   FAZ 5: AI KIMLIGI VE SIHIR 
   ========================================================== */

/* 1. Pulse Energy (Yapay Zeka Nabzi) */
@keyframes ds-ai-pulse {
  0% { transform: scale(1); opacity: 0.8; filter: hue-rotate(0deg); }
  50% { transform: scale(1.05); opacity: 1; filter: hue-rotate(15deg); }
  100% { transform: scale(1); opacity: 0.8; filter: hue-rotate(0deg); }
}
.ds-ai-blob-pulse {
  animation: ds-ai-pulse 8s ease-in-out infinite;
}

/* 2. Sparkle Rotation (Sihirbaz Işıltısı) */
@keyframes ds-sparkle-spin {
  0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
  25% { transform: rotate(90deg) scale(1.2); opacity: 1; }
  50% { transform: rotate(180deg) scale(0.8); opacity: 0; }
  100% { transform: rotate(360deg) scale(0.8); opacity: 0; }
}
.ds-ai-sparkle {
  position: absolute;
  width: 12px; height: 12px;
  background: radial-gradient(circle, #fff, transparent);
  clip-path: polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%);
  animation: ds-sparkle-spin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* 3. Data Flow (Yapay Zeka Düşünme/Taraması) */
@keyframes ds-data-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}
.ds-ai-data-placeholder {
  position: relative;
  overflow: hidden;
}
.ds-ai-data-placeholder::before {
  content: '';
  position: absolute;
  inset: -50%;
  background-image: radial-gradient(var(--ds-color-accent-primary) 1px, transparent 1px);
  background-size: 16px 16px;
  opacity: 0.15;
  animation: ds-data-flow 10s linear infinite;
  pointer-events: none;
}

/* 4. Glow Tip for Expanding Text */
.ds-glow-tip {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 20px;
  background: linear-gradient(90deg, transparent, #ffffff);
  opacity: 0.8;
  filter: blur(4px);
}
`;

fs.appendFileSync(file, aiCSS);
console.log('Successfully added AI Magic CSS to index.css');
