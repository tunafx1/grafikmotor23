const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

// Find where :root starts
const startIndex = content.indexOf(':root {');

if (startIndex === -1) {
  console.error(':root not found in index.css');
  process.exit(1);
}

const newVars = `
:root {
  /* 1. Colors - Glass & Base */
  --ds-color-surface-primary: #edf3ff;
  --ds-color-surface-glass: rgba(255, 255, 255, 0.55);
  --ds-color-surface-glass-strong: rgba(255, 255, 255, 0.85);
  
  /* 2. Colors - Typography */
  --ds-color-text-primary: #1d2944;
  --ds-color-text-secondary: rgba(29, 41, 68, 0.75);
  --ds-color-text-tertiary: rgba(29, 41, 68, 0.45);
  
  /* 3. Colors - Accents */
  --ds-color-accent-primary: #6b5cff;
  --ds-color-accent-secondary: #ffb91d;
  --ds-color-accent-gradient: linear-gradient(135deg, #ff8a00, #ff6200);
  
  /* 4. Colors - Borders */
  --ds-color-border-glass: rgba(255, 255, 255, 0.7);
  --ds-color-border-light: rgba(109, 92, 255, 0.15);
  
  /* 5. Typography */
  --ds-font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ds-font-size-hero: clamp(2.5rem, 5vw + 1rem, 4.5rem);
  --ds-line-height-hero: 1.05;
  --ds-font-size-h2: clamp(1.5rem, 3vw + 0.5rem, 2rem);
  --ds-font-size-body: 1.125rem;
  --ds-line-height-body: 1.6;
  
  /* 6. Spacing */
  --ds-space-1: 0.25rem;  
  --ds-space-2: 0.5rem;   
  --ds-space-3: 0.75rem;  
  --ds-space-4: 1rem;     
  --ds-space-6: 1.5rem;   
  --ds-space-8: 2rem;     
  --ds-space-12: 3rem;    
  --ds-space-16: 4rem;    
  --ds-space-24: 6rem;    
  
  /* 7. Layout & Effects */
  --ds-layout-max-width: 1200px;
  --ds-shadow-glass: 0 15px 45px rgba(0, 0, 0, 0.08);
  --ds-shadow-glass-heavy: 0 35px 90px rgba(0, 0, 0, 0.12);
  --ds-radius-card: 2rem;
  --ds-radius-pill: 9999px;
  --ds-glass-blur: blur(24px) saturate(180%);
}

/* ==========================================================
   DS COMPONENTS (Karşılama Ekranı Sınıfları)
   ========================================================== */
.ds-landing-root {
  background-color: var(--ds-color-surface-primary);
  font-family: var(--ds-font-family);
  color: var(--ds-color-text-primary);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ds-container {
  max-width: var(--ds-layout-max-width);
  margin: 0 auto;
  padding: 0 var(--ds-space-6);
  position: relative;
  z-index: 10;
}
@media (max-width: 768px) {
  .ds-container {
    padding: 0 var(--ds-space-4);
  }
}

.ds-glass-panel {
  background: var(--ds-color-surface-glass);
  backdrop-filter: var(--ds-glass-blur);
  -webkit-backdrop-filter: var(--ds-glass-blur);
  border: 1px solid var(--ds-color-border-glass);
  box-shadow: var(--ds-shadow-glass);
}

.ds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ds-space-3) var(--ds-space-6);
  border-radius: calc(var(--ds-radius-card) * 0.75);
  margin-top: var(--ds-space-6);
  margin-bottom: var(--ds-space-12);
}
@media (max-width: 768px) {
  .ds-header {
    padding: var(--ds-space-3) var(--ds-space-4);
  }
}

.ds-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: var(--ds-radius-pill);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: -0.01em;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  outline: none;
  text-decoration: none;
}
.ds-btn:focus-visible {
  box-shadow: 0 0 0 4px rgba(107, 92, 255, 0.3);
}
.ds-btn:active {
  transform: scale(0.98);
}
.ds-btn-primary {
  background: var(--ds-color-accent-primary);
  color: white;
}
.ds-btn-primary:hover {
  background: #5a4de0;
}
.ds-btn-secondary {
  background: white;
  color: var(--ds-color-text-primary);
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}
.ds-btn-secondary:hover {
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.ds-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-16);
  align-items: center;
  min-height: 60vh;
  margin-bottom: var(--ds-space-24);
}
@media (max-width: 992px) {
  .ds-hero {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--ds-space-12);
    margin-bottom: var(--ds-space-16);
    padding-top: var(--ds-space-8);
  }
  .ds-hero-actions {
    justify-content: center;
  }
}

.ds-hero-title {
  font-size: var(--ds-font-size-hero);
  line-height: var(--ds-line-height-hero);
  letter-spacing: -0.04em;
  font-weight: 800;
  margin-bottom: var(--ds-space-6);
}
.ds-hero-desc {
  font-size: var(--ds-font-size-body);
  line-height: var(--ds-line-height-body);
  color: var(--ds-color-text-secondary);
  letter-spacing: 0.01em;
  margin-bottom: var(--ds-space-8);
  max-width: 540px;
}
@media (max-width: 992px) {
  .ds-hero-desc { margin-left: auto; margin-right: auto; }
}

.ds-hero-actions {
  display: flex;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
}

.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: 8px 16px;
  background: white;
  border-radius: var(--ds-radius-pill);
  box-shadow: var(--ds-shadow-glass);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--ds-space-6);
  color: var(--ds-color-text-primary);
}

.ds-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ds-space-8);
  margin-bottom: var(--ds-space-24);
}
.ds-feature-card {
  padding: var(--ds-space-8);
  border-radius: calc(var(--ds-radius-card) * 0.75);
}
.ds-feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: var(--ds-space-2);
}
.ds-feature-desc {
  color: var(--ds-color-text-secondary);
  line-height: 1.5;
}

.ds-mockup-wrapper {
  display: flex;
  justify-content: center;
  position: relative;
}
.ds-mockup-card {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 3/4;
  border-radius: var(--ds-radius-card);
  box-shadow: var(--ds-shadow-glass-heavy);
  padding: var(--ds-space-6);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.ds-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(130px);
  opacity: 0.4;
  z-index: 0;
  pointer-events: none;
}
`;

const updatedContent = content.substring(0, startIndex) + newVars + content.substring(content.indexOf('::-webkit-scrollbar'));
fs.writeFileSync(file, updatedContent);
console.log('Successfully added Design System classes to index.css');
