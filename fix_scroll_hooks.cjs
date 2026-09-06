const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// We will replace the entire block of SCROLLYTELLING LOGIC up to the return statement.
const startIndex = content.indexOf('  // SCROLLYTELLING LOGIC');
const endIndex = content.indexOf('  return (', startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find block");
    process.exit(1);
}

const newHooks = `  // SCROLLYTELLING LOGIC
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Scene 1: Photo In
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.2, 1], [1, 1, 0, 0]);
  const scene1Y = useTransform(scrollYProgress, [0, 0.15, 0.2, 1], [0, 0, -40, -40]);
  const photoY = useTransform(scrollYProgress, [0, 0.1, 1], [100, 0, 0]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);

  // Scene 2: AI Thinking
  const scene2Opacity = useTransform(scrollYProgress, [0, 0.15, 0.2, 0.35, 0.4, 1], [0, 0, 1, 1, 0, 0]);
  const scene2Y = useTransform(scrollYProgress, [0, 0.15, 0.2, 0.35, 0.4, 1], [40, 40, 0, 0, -40, -40]);
  const aiScanOpacity = useTransform(scrollYProgress, [0, 0.15, 0.2, 0.35, 0.4, 1], [0, 0, 1, 1, 0, 0]);
  const sparkleScale = useTransform(scrollYProgress, [0, 0.2, 0.3, 0.4, 1], [1, 1, 2, 1, 1]);

  // Scene 3: Template Layout
  const scene3Opacity = useTransform(scrollYProgress, [0, 0.35, 0.4, 0.55, 0.6, 1], [0, 0, 1, 1, 0, 0]);
  const scene3Y = useTransform(scrollYProgress, [0, 0.35, 0.4, 0.55, 0.6, 1], [40, 40, 0, 0, -40, -40]);
  const templateScaleX = useTransform(scrollYProgress, [0, 0.35, 0.45, 1], [0, 0, 1, 1]);
  const templateOpacity = useTransform(scrollYProgress, [0, 0.35, 0.45, 1], [0, 0, 1, 1]);

  // Scene 4: Editor Opens
  const scene4Opacity = useTransform(scrollYProgress, [0, 0.55, 0.6, 0.75, 0.8, 1], [0, 0, 1, 1, 0, 0]);
  const scene4Y = useTransform(scrollYProgress, [0, 0.55, 0.6, 0.75, 0.8, 1], [40, 40, 0, 0, -40, -40]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5, 0.6, 0.8, 0.9, 1], [1, 1, 0.75, 0.75, 1.1, 1.1]);
  const panelLeftX = useTransform(scrollYProgress, [0, 0.55, 0.65, 0.75, 0.8, 1], [-200, -200, 0, 0, -200, -200]);
  const panelRightX = useTransform(scrollYProgress, [0, 0.55, 0.65, 0.75, 0.8, 1], [200, 200, 0, 0, 200, 200]);
  const panelsOpacity = useTransform(scrollYProgress, [0, 0.55, 0.6, 0.75, 0.8, 1], [0, 0, 1, 1, 0, 0]);

  // Scene 5: Export / Ready
  const scene5Opacity = useTransform(scrollYProgress, [0, 0.75, 0.85, 1], [0, 0, 1, 1]);
  const scene5Y = useTransform(scrollYProgress, [0, 0.75, 0.85, 1], [40, 40, 0, 0]);
  const ctaScale = useTransform(scrollYProgress, [0, 0.8, 0.9, 1], [0.8, 0.8, 1, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.8, 0.9, 1], [0, 0, 1, 1]);

  // Global Scroll Indicator
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

`;

content = content.substring(0, startIndex) + newHooks + content.substring(endIndex);

fs.writeFileSync(file, content);
console.log('Hooks updated successfully');
