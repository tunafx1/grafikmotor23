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
      <div 
        className="ds-landing-root"
        style={{
          backgroundColor: 'var(--ds-color-bg-base)',
          fontFamily: 'var(--ds-font-family)',
          color: 'var(--ds-color-text-primary)',
          minHeight: '100vh',
          position: 'relative',
          overflowX: 'hidden'
        }}
      >
        {/* BACKGROUND BLOBS (Static, no animation) */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          background: '#7b6cff', top: '-160px', left: '-120px',
          borderRadius: '50%', filter: 'blur(130px)', opacity: 0.55, zIndex: 0
        }} />
        <div style={{
          position: 'absolute', width: '450px', height: '450px',
          background: '#65dfff', right: '-120px', top: '180px',
          borderRadius: '50%', filter: 'blur(130px)', opacity: 0.55, zIndex: 0
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px',
          background: '#ffd46a', bottom: '-120px', left: '35%',
          borderRadius: '50%', filter: 'blur(130px)', opacity: 0.55, zIndex: 0
        }} />

        {/* CONTAINER */}
        <div style={{
          maxWidth: 'var(--ds-layout-max-width)',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
          padding: 'var(--ds-space-6)'
        }}>
          
          {/* HEADER */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--ds-space-4) var(--ds-space-6)',
            background: 'var(--ds-color-bg-glass)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid var(--ds-color-border-glass)',
            borderRadius: 'calc(var(--ds-radius-card) * 0.75)',
            boxShadow: 'var(--ds-shadow-glass)',
            marginBottom: 'var(--ds-space-16)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-4)' }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'var(--ds-color-accent-gradient)',
                borderRadius: '16px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: 'white', fontWeight: 800, fontSize: '24px'
              }}>G</div>
              <div>
                <h2 style={{ fontSize: 'var(--ds-font-size-body)', fontWeight: 800, margin: 0 }}>Grafik Motoru</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-secondary)', margin: 0 }}>
                  Yapay Zeka Destekli Tasarım Platformu
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleGoogleLogin}
              style={{
                padding: 'var(--ds-space-3) var(--ds-space-6)',
                borderRadius: 'var(--ds-radius-pill)',
                background: 'var(--ds-color-accent-gradient)',
                color: 'white',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Portala Git &rarr;
            </button>
          </header>

          {/* HERO */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--ds-space-16)',
            alignItems: 'center',
            minHeight: '60vh',
            marginBottom: 'var(--ds-space-24)'
          }}>
            {/* Hero Content */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--ds-space-2)',
                padding: 'var(--ds-space-2) var(--ds-space-4)',
                background: 'white', borderRadius: 'var(--ds-radius-pill)',
                boxShadow: 'var(--ds-shadow-glass)', marginBottom: 'var(--ds-space-6)',
                fontWeight: 600, fontSize: '0.875rem'
              }}>
                ✨ Living Aurora AI
              </div>
              <h1 style={{
                fontSize: 'var(--ds-font-size-hero)',
                lineHeight: 'var(--ds-line-height-hero)',
                letterSpacing: 'var(--ds-letter-spacing-hero)',
                fontWeight: 800,
                marginBottom: 'var(--ds-space-6)'
              }}>
                Grafikleriniz<br />kendini oluştursun.
              </h1>
              <p style={{
                fontSize: 'var(--ds-font-size-body)',
                lineHeight: 'var(--ds-line-height-body)',
                color: 'var(--ds-color-text-secondary)',
                marginBottom: 'var(--ds-space-8)',
                maxWidth: '540px'
              }}>
                Fotoğraf yükleyin, başlığınızı yazın. Grafik Motoru saniyeler içinde kurumsal tasarımınızı oluştursun. Şablonlar, AI Sihirbaz ve otomatik yerleşim tek ekranda.
              </p>
              <div style={{ display: 'flex', gap: 'var(--ds-space-4)' }}>
                <button 
                  onClick={handleGoogleLogin}
                  style={{
                    padding: 'var(--ds-space-4) var(--ds-space-8)',
                    borderRadius: 'var(--ds-radius-pill)',
                    background: 'var(--ds-color-accent-primary)',
                    color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer'
                  }}
                >
                  Portala Git
                </button>
                <button style={{
                  padding: 'var(--ds-space-4) var(--ds-space-8)',
                  borderRadius: 'var(--ds-radius-pill)',
                  background: 'white', color: 'var(--ds-color-text-primary)',
                  fontWeight: 700, border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}>
                  Nasıl Çalışıyor
                </button>
              </div>
            </div>

            {/* Mockup / Visual */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                width: '100%', maxWidth: '420px',
                aspectRatio: '3/4',
                background: 'var(--ds-color-bg-glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 'var(--ds-radius-card)',
                boxShadow: 'var(--ds-shadow-glass-heavy)',
                padding: 'var(--ds-space-6)',
                display: 'flex', flexDirection: 'column',
                border: '1px solid var(--ds-color-border-glass)',
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Static grid background for mockup */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                  backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none'
                }} />
                
                {/* Mockup elements */}
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

          {/* FEATURES */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--ds-space-8)',
            marginBottom: 'var(--ds-space-24)'
          }}>
            {[
              { icon: '🪄', title: 'AI Sihirbaz', desc: 'Fotoğrafları otomatik yerleştirir, başlıkları oluşturur ve tasarımı saniyeler içinde hazırlar.' },
              { icon: '⚡', title: 'Akıllı Şablonlar', desc: 'Bir kez tasarlayın. Binlerce paylaşımı aynı kaliteyle üretin.' },
              { icon: '🚀', title: 'Tek Tık Çıktı', desc: 'PNG, JPEG ve yüksek DPI çıktılar. Sosyal medya ve baskı için hazır.' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: 'var(--ds-space-8)',
                background: 'var(--ds-color-bg-glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 'calc(var(--ds-radius-card) * 0.75)',
                boxShadow: 'var(--ds-shadow-glass)',
                border: '1px solid var(--ds-color-border-glass)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--ds-space-4)' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--ds-space-2)' }}>{feature.title}</h3>
                <p style={{ color: 'var(--ds-color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </section>

          {/* FOOTER */}
          <footer style={{
            textAlign: 'center',
            padding: 'var(--ds-space-8) 0',
            color: 'var(--ds-color-text-tertiary)',
            fontWeight: 600
          }}>
            by <strong>Tunafx</strong>
          </footer>
        </div>
      </div>
    );
  }`;

lines.splice(startIndex, endIndex - startIndex, replacement);
fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully updated Landing Page.');
