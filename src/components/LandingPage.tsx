import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ImagePlus, Sparkles, Download } from 'lucide-react';
import { HeroMotion } from './HeroMotion';
import './landing.css';

interface LandingPageProps {
  onEnter: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
}

const STEPS = [
  {
    icon: ImagePlus,
    title: 'Fotoğraflarını seç',
    desc: 'Tek tek ya da toplu yükle; görseller şablonuna otomatik yerleşsin.',
  },
  {
    icon: Sparkles,
    title: 'Tek komut yaz',
    desc: 'Yapay zekâ her gönderi için başlık ve açıklamayı senin yerine yazsın.',
  },
  {
    icon: Download,
    title: 'İndir ve paylaş',
    desc: 'Hazır gönderilerini yüksek çözünürlükte indir, hemen paylaş.',
  },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function LandingPage({ onEnter, onLogin, isLoggedIn }: LandingPageProps) {
  const ctaLabel = isLoggedIn ? 'Stüdyoya git' : 'Ücretsiz başla';

  return (
    <div className="gm-shell gm-landing">
      <header className="gm-nav">
        <a className="gm-brand" href="/" aria-label="Grafik Motoru ana sayfa">
          <img src="/brand/mark.svg" alt="" />
          <span>Grafik Motoru</span>
        </a>
        <button type="button" className="gm-btn gm-btn-quiet" onClick={onLogin ?? onEnter}>
          {isLoggedIn ? 'Stüdyo' : 'Giriş yap'}
        </button>
      </header>

      <main>
        <section className="gm-hero">
          <div className="gm-hero-copy">
            <motion.span className="gm-eyebrow" {...fadeUp(0)}>
              Yapay zekâ destekli toplu tasarım
            </motion.span>
            <motion.h1 {...fadeUp(0.08)}>
              Sosyal medyanı <em>hızlandır.</em>
            </motion.h1>
            <motion.p {...fadeUp(0.16)}>
              Fotoğraflarını yükle, tek bir komut yaz. Grafik Motoru şablonuna göre
              tüm gönderileri başlıklarıyla birlikte saniyeler içinde hazırlasın.
            </motion.p>
            <motion.div className="gm-hero-actions" {...fadeUp(0.24)}>
              <button type="button" className="gm-btn gm-btn-primary gm-btn-lg" onClick={onEnter}>
                {ctaLabel}
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
              <a className="gm-text-link" href="#nasil-calisir">
                Nasıl çalışır?
              </a>
            </motion.div>
          </div>

          <motion.div
            className="gm-hero-visual"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroMotion />
          </motion.div>
        </section>

        <section className="gm-steps" id="nasil-calisir">
          <h2>Üç adımda hazır.</h2>
          <ol>
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <span className="gm-step-icon">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <div>
                  <h3>
                    <span className="gm-step-num">{i + 1}</span>
                    {title}
                  </h3>
                  <p>{desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className="gm-closing">
          <h2>İlk tasarımın birkaç dakika uzakta.</h2>
          <button type="button" className="gm-btn gm-btn-primary gm-btn-lg" onClick={onEnter}>
            {ctaLabel}
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </section>
      </main>

      <footer className="gm-footer">
        <span>© {new Date().getFullYear()} Grafik Motoru</span>
        <span>
          by <strong>Tunafx</strong>
        </span>
      </footer>
    </div>
  );
}
