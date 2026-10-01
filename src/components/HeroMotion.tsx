import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

/*
 * Landing hero loop (~8s): photos drop in → the top one fills the template →
 * AI writes the headline → the finished post fans out into 1:1 / 4:5 / 9:16.
 * Everything is positioned in % and text uses container units, so it scales
 * cleanly from phone width to desktop.
 */

const PHOTOS = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80',
];

const HEADLINE = 'Yeni sezon geldi.';
const SUBLINE = 'Seçili ürünlerde %30 indirim';

type Phase = 'drop' | 'place' | 'write' | 'formats';

const TIMELINE: { phase: Phase; ms: number; label: string }[] = [
  { phase: 'drop', ms: 1700, label: 'Fotoğraflarını seç' },
  { phase: 'place', ms: 1300, label: 'Şablona yerleşsin' },
  { phase: 'write', ms: 2200, label: 'AI başlığı yazsın' },
  { phase: 'formats', ms: 3200, label: 'Tüm formatlar hazır' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// Where each dropped photo lands inside the frame before the template fills.
const PILE = [
  { x: '-14%', y: '6%', rotate: -9 },
  { x: '12%', y: '-4%', rotate: 7 },
  { x: '0%', y: '0%', rotate: -2 },
];

function Post({ src, headline, showSub }: { src: string; headline: string; showSub: boolean }) {
  return (
    <div className="gm-post">
      <img src={src} alt="" draggable={false} />
      <div className="gm-post-shade" />
      <span className="gm-post-tag">✦ AI</span>
      <div className="gm-post-copy">
        <strong>
          {headline}
          {headline.length < HEADLINE.length && <span className="gm-caret" />}
        </strong>
        <span style={{ opacity: showSub ? 1 : 0 }}>{SUBLINE}</span>
      </div>
    </div>
  );
}

export function HeroMotion() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(reduceMotion ? TIMELINE.length - 1 : 0);
  const [typed, setTyped] = useState(reduceMotion ? HEADLINE.length : 0);
  const [loop, setLoop] = useState(0);
  const phase = TIMELINE[step].phase;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      if (step === TIMELINE.length - 1) setLoop((n) => n + 1);
      setStep((s) => (s + 1) % TIMELINE.length);
    }, TIMELINE[step].ms);
    return () => clearTimeout(timer);
  }, [step, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase === 'drop') setTyped(0);
    if (phase !== 'write') return;
    const timer = setInterval(() => {
      setTyped((n) => {
        if (n >= HEADLINE.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, 75);
    return () => clearInterval(timer);
  }, [phase, reduceMotion]);

  const placed = phase !== 'drop';
  const fanned = phase === 'formats';
  const headline = HEADLINE.slice(0, typed);

  return (
    <div className="gm-motion" aria-hidden="true">
      <div className="gm-motion-stage">
        {/* Side formats slide out from behind the main post */}
        {(['square', 'story'] as const).map((kind) => (
          <motion.div
            key={kind}
            className={`gm-motion-side gm-motion-side-${kind}`}
            initial={false}
            animate={
              fanned
                ? { opacity: 1, x: '0%', rotate: kind === 'square' ? -6 : 6, scale: 1 }
                : { opacity: 0, x: kind === 'square' ? '40%' : '-40%', rotate: 0, scale: 0.9 }
            }
            transition={{ duration: 0.7, ease: EASE, delay: fanned ? (kind === 'square' ? 0.05 : 0.15) : 0 }}
          >
            <Post src={PHOTOS[0]} headline={HEADLINE} showSub />
            <span className="gm-motion-ratio">{kind === 'square' ? '1:1' : '9:16'}</span>
          </motion.div>
        ))}

        {/* Main 4:5 template frame */}
        <motion.div
          className={`gm-motion-frame ${placed ? 'is-filled' : ''}`}
          initial={false}
          animate={{ scale: fanned ? 0.94 : 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {!placed && <span className="gm-motion-drop-hint">Fotoğrafları bırak</span>}

          {PHOTOS.map((src, i) => {
            const isHero = i === 0;
            const pile = PILE[i];
            const animate = placed
              ? isHero
                ? { opacity: 1, x: '0%', y: '0%', rotate: 0, scale: 1 }
                : { opacity: 0, x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.5 }
              : { opacity: 1, x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.58 };
            return (
              <motion.div
                key={`${i}-${loop}`}
                className="gm-motion-photo"
                style={{ zIndex: isHero ? 3 : 2 - i }}
                initial={reduceMotion ? false : { opacity: 0, x: pile.x, y: '-70%', rotate: pile.rotate * 2, scale: 0.58 }}
                animate={animate}
                transition={{
                  duration: placed ? 0.65 : 0.6,
                  ease: EASE,
                  delay: phase === 'drop' ? 0.15 + (2 - i) * 0.22 : 0,
                }}
              >
                {isHero && placed ? (
                  <Post src={src} headline={headline} showSub={typed >= HEADLINE.length} />
                ) : (
                  <img src={src} alt="" draggable={false} />
                )}
              </motion.div>
            );
          })}

          {phase === 'write' && typed < HEADLINE.length && <div className="gm-motion-scan" />}
          {fanned && <span className="gm-motion-ratio gm-motion-ratio-main">4:5</span>}
        </motion.div>
      </div>

      <div className="gm-motion-caption">
        <div className="gm-motion-dots">
          {TIMELINE.map((t, i) => (
            <span key={t.phase} className={i === step ? 'is-active' : i < step ? 'is-done' : ''} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {TIMELINE[step].label}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
