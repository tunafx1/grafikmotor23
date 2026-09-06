const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

const newKeyframes = `
/* ==========================================================
   FAZ 2: HERO PREMIUM ANIMASYONLARI
   ========================================================== */
@keyframes ds-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes ds-float {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-10px) rotate(5deg); }
  50% { transform: translateY(0) rotate(0); }
  75% { transform: translateY(10px) rotate(-5deg); }
}
@keyframes ds-shimmer {
  0% { transform: translateX(-150%) skewX(-15deg); }
  50%, 100% { transform: translateX(250%) skewX(-15deg); }
}
@keyframes ds-scanline {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes ds-expand-width {
  0% { width: 0%; opacity: 0; }
  100% { width: var(--target-width, 100%); opacity: 1; }
}
@keyframes ds-pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.ds-anim-float {
  animation: ds-float 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.ds-anim-spin {
  animation: ds-spin-slow 20s linear infinite;
}
.ds-anim-pulse {
  animation: ds-pulse-glow 4s ease-in-out infinite;
}
`;

fs.appendFileSync(file, newKeyframes);
console.log('Successfully appended Phase 2 animations to index.css');
