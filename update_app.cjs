const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(line => line.includes('if (!user) {'));
const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('return (') && lines[idx+1].includes('<div id="graphics-engine-app"'));

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find boundaries', startIndex, endIndex);
  process.exit(1);
}

const replacement = `  if (!user) {
    return (
      <main className="ds-landing-root" aria-label="Karşılama Ekranı">
        
        {/* Background Blobs (Aria-hidden for accessibility) */}
        <div className="ds-blob" style={{ width: '500px', height: '500px', background: 'var(--ds-color-accent-primary)', top: '-160px', left: '-120px' }} aria-hidden="true" />
        <div className="ds-blob" style={{ width: '450px', height: '450px', background: '#65dfff', right: '-120px', top: '180px' }} aria-hidden="true" />
        <div className="ds-blob" style={{ width: '400px', height: '400px', background: 'var(--ds-color-accent-secondary)', bottom: '-120px', left: '35%' }} aria-hidden="true" />

        <div className="ds-container">
          
          {/* HEADER */}
          <header className="ds-header ds-glass-panel" aria-label="Ana Menü">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-4)' }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'var(--ds-color-accent-gradient)',
                borderRadius: '16px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: 'white', fontWeight: 800, fontSize: '24px'
              }} aria-hidden="true">G</div>
              <div>
                <h2 style={{ fontSize: 'var(--ds-font-size-body)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Grafik Motoru</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-secondary)', margin: 0, fontWeight: 500 }}>
                  Yapay Zeka Destekli Tasarım Platformu
                </p>
              </div>
            </div>
            <button 
              className="ds-btn ds-btn-primary"
              onClick={handleGoogleLogin}
              aria-label="Portala Giriş Yap"
            >
              Portala Git &rarr;
            </button>
          </header>

          {/* HERO SECTION */}
          <section className="ds-hero" aria-label="Tanıtım">
            <div>
              <div className="ds-badge" aria-hidden="true">
                ✨ Living Aurora AI
              </div>
              <h1 className="ds-hero-title">
                Grafikleriniz<br />kendini oluştursun.
              </h1>
              <p className="ds-hero-desc">
                Fotoğraf yükleyin, başlığınızı yazın. Grafik Motoru saniyeler içinde kurumsal tasarımınızı oluştursun. Şablonlar, AI Sihirbaz ve otomatik yerleşim tek ekranda.
              </p>
              <div className="ds-hero-actions">
                <button 
                  className="ds-btn ds-btn-primary"
                  onClick={handleGoogleLogin}
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
              </div>
            </div>

            {/* MOCKUP VISUAL */}
            <div className="ds-mockup-wrapper" aria-hidden="true">
              <div className="ds-mockup-card ds-glass-panel">
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                  backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginBottom: 'var(--ds-space-4)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ds-color-accent-secondary)' }} />
                  </div>
                  <div style={{
                    width: '100%', flex: 1, background: 'linear-gradient(135deg, #dfe7ff, #ffffff)',
                    borderRadius: '16px', marginBottom: 'var(--ds-space-6)'
                  }} />
                  <div style={{ width: '75%', height: '22px', background: 'var(--ds-color-accent-secondary)', borderRadius: '12px', marginBottom: 'var(--ds-space-4)' }} />
                  <div style={{ width: '55%', height: '16px', background: '#cfd8ef', borderRadius: '12px' }} />
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section className="ds-features" aria-label="Özellikler">
            {[
              { icon: '🪄', title: 'AI Sihirbaz', desc: 'Fotoğrafları otomatik yerleştirir, başlıkları oluşturur ve tasarımı saniyeler içinde hazırlar.' },
              { icon: '⚡', title: 'Akıllı Şablonlar', desc: 'Bir kez tasarlayın. Binlerce paylaşımı aynı kaliteyle üretin.' },
              { icon: '🚀', title: 'Tek Tık Çıktı', desc: 'PNG, JPEG ve yüksek DPI çıktılar. Sosyal medya ve baskı için hazır.' }
            ].map((feature, i) => (
              <article key={i} className="ds-feature-card ds-glass-panel">
                <div style={{ fontSize: '2rem', marginBottom: 'var(--ds-space-4)' }} aria-hidden="true">{feature.icon}</div>
                <h3 className="ds-feature-title">{feature.title}</h3>
                <p className="ds-feature-desc" style={{ margin: 0 }}>{feature.desc}</p>
              </article>
            ))}
          </section>

          {/* FOOTER */}
          <footer style={{
            textAlign: 'center',
            padding: 'var(--ds-space-8) 0',
            color: 'var(--ds-color-text-tertiary)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            by <strong>Tunafx</strong>
          </footer>
        </div>
      </main>
    );
  }`;

lines.splice(startIndex, endIndex - startIndex, replacement);
fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully updated Landing Page with Class-based Architecture.');
