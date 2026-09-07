import { GraphicData, DesignTemplate, TextStyle, Region, FixedElement } from './types';

interface TextSpan {
  text: string;
  isBold: boolean;
  isItalic: boolean;
}

interface Token {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isNewline: boolean;
  isSpace: boolean;
}

// Parse markdown tags **bold** and *italic*
export function parseMarkdownText(text: string): TextSpan[] {
  const spans: TextSpan[] = [];
  let i = 0;
  let currentText = '';
  let isBold = false;
  let isItalic = false;

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      if (currentText) {
        spans.push({ text: currentText, isBold, isItalic });
        currentText = '';
      }
      isBold = !isBold;
      i += 2;
    } else if (text.startsWith('*', i)) {
      if (currentText) {
        spans.push({ text: currentText, isBold, isItalic });
        currentText = '';
      }
      isItalic = !isItalic;
      i += 1;
    } else if (text.startsWith('\n', i)) {
      if (currentText) {
        spans.push({ text: currentText, isBold, isItalic });
        currentText = '';
      }
      spans.push({ text: '\n', isBold: false, isItalic: false });
      i += 1;
    } else {
      currentText += text[i];
      i += 1;
    }
  }
  if (currentText) {
    spans.push({ text: currentText, isBold, isItalic });
  }
  return spans;
}

// Tokenize parsed spans into words, spaces, and newlines
export function tokenizeSpans(spans: TextSpan[]): Token[] {
  const tokens: Token[] = [];
  for (const span of spans) {
    if (span.text === '\n') {
      tokens.push({ text: '\n', isBold: false, isItalic: false, isNewline: true, isSpace: false });
      continue;
    }

    const parts = span.text.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      const isSpace = /^\s+$/.test(part);
      tokens.push({
        text: part,
        isBold: span.isBold,
        isItalic: span.isItalic,
        isNewline: false,
        isSpace
      });
    }
  }
  return tokens;
}

// Helper to construct the CSS/Canvas font string
function getFontString(fontFamily: string, fontSize: number, isBold: boolean, isItalic: boolean, baseWeight: string = 'normal', baseStyle: string = 'normal'): string {
  let weight = baseWeight;
  if (isBold) {
    weight = '900'; // Ultra bold for strong contrast
  } else if (baseWeight === 'bold') {
    weight = '700';
  }
  const style = (isItalic || baseStyle === 'italic') ? 'italic' : 'normal';
  return `${style} ${weight} ${fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}

// Async image loader cache to prevent flickering
const imageCache: Record<string, HTMLImageElement> = {};

export function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache[url]) {
    return Promise.resolve(imageCache[url]);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Support external images without CORS issues where possible
    img.onload = () => {
      imageCache[url] = img;
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
    img.src = url;
  });
}

// Draw a single social icon (Instagram, Globe, Mail, Phone) using vector paths
function drawSocialIcon(
  ctx: CanvasRenderingContext2D,
  type: 'instagram' | 'globe' | 'mail' | 'phone' | 'none',
  x: number,
  y: number,
  size: number,
  color: string
) {
  if (type === 'none') return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'instagram') {
    // Outer box
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, size * 0.25);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.23, 0, Math.PI * 2);
    ctx.stroke();

    // Top-right dot
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x + size * 0.77, y + size * 0.23, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'globe') {
    // Circle
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - ctx.lineWidth, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x + ctx.lineWidth, y + size / 2);
    ctx.lineTo(x + size - ctx.lineWidth, y + size / 2);
    ctx.stroke();

    // Verticals/Ellipses
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, size * 0.25, size / 2 - ctx.lineWidth, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'mail') {
    ctx.beginPath();
    ctx.roundRect(x, y + size * 0.1, size, size * 0.8, size * 0.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.2);
    ctx.lineTo(x + size / 2, y + size * 0.6);
    ctx.lineTo(x + size, y + size * 0.2);
    ctx.stroke();
  } else if (type === 'phone') {
    ctx.beginPath();
    ctx.roundRect(x + size * 0.2, y, size * 0.6, size, size * 0.15);
    ctx.stroke();

    // Bottom speaker line
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y + size * 0.85);
    ctx.lineTo(x + size * 0.6, y + size * 0.85);
    ctx.stroke();
  }

  ctx.restore();
}

// Deep wrap text that supports markdown formatting
export function drawFormattedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: TextStyle,
  primaryColorOverride?: string,
  bgOptions?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    hasBackground?: boolean;
    hasBorder?: boolean;
  }
) {
  ctx.save();

  if (style.letterSpacing !== undefined) {
    ctx.letterSpacing = `${style.letterSpacing}px`;
  }

  const textColor = style.color || '#000000';
  const spans = parseMarkdownText(text);
  const tokens = tokenizeSpans(spans);

  // Parse lines based on token size measurements
  const lines: Token[][] = [];
  let currentLine: Token[] = [];
  let currentLineWidth = 0;

  for (const token of tokens) {
    if (token.isNewline) {
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
      continue;
    }

    // Set font metrics
    ctx.font = getFontString(style.fontFamily, style.fontSize, token.isBold, token.isItalic, style.fontWeight, style.fontStyle);
    const measured = ctx.measureText(token.text);
    const tokenWidth = measured.width;

    if (currentLineWidth + tokenWidth > width && !token.isSpace) {
      // Push line and start new one
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [token];
        currentLineWidth = tokenWidth;
      } else {
        // Single word exceeds line width, force wrap
        currentLine.push(token);
        lines.push(currentLine);
        currentLine = [];
        currentLineWidth = 0;
      }
    } else {
      currentLine.push(token);
      currentLineWidth += tokenWidth;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // Draw lines
  const lineHeightPx = style.fontSize * style.lineHeight;
  const totalTextHeight = lines.length * lineHeightPx;
  
  // Vertically centered inside bounding box
  let startY = y + (height - totalTextHeight) / 2 + style.fontSize * 0.85;
  if (startY < y + style.fontSize * 0.85) {
    startY = y + style.fontSize * 0.85; // Clamped to avoid drawing above boundary
  }

  // Draw background if configured
  if (bgOptions && bgOptions.hasBackground !== false && bgOptions.backgroundColor && bgOptions.backgroundColor !== 'transparent') {
    // Determine dynamic horizontal and vertical padding based on font size for perfect proportions
    const paddingX = Math.max(12, style.fontSize * 0.4);
    const paddingY = Math.max(6, style.fontSize * 0.2);

    let maxLineWidth = 0;
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      let lineWidth = 0;
      for (const token of line) {
        ctx.font = getFontString(style.fontFamily, style.fontSize, token.isBold, token.isItalic, style.fontWeight, style.fontStyle);
        lineWidth += ctx.measureText(token.text).width;
      }
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
    }

    if (maxLineWidth > 0) {
      const bgWidth = maxLineWidth + paddingX * 2;
      const bgHeight = totalTextHeight + paddingY * 2;

      // Vertical start matches text visual block
      const bgTop = startY - style.fontSize * 0.85 - paddingY;

      let bgLeft = x;
      if (style.align === 'center') {
        bgLeft = x + (width - maxLineWidth) / 2 - paddingX;
      } else if (style.align === 'right') {
        bgLeft = x + width - maxLineWidth - paddingX;
      } else {
        bgLeft = x - paddingX;
      }

      ctx.save();
      ctx.globalAlpha = bgOptions.opacity !== undefined ? bgOptions.opacity : 1;

      // Draw rounded/rectangular background
      ctx.beginPath();
      const radius = bgOptions.borderRadius ?? 0;
      if (radius > 0) {
        ctx.roundRect(bgLeft, bgTop, bgWidth, bgHeight, radius);
      } else {
        ctx.rect(bgLeft, bgTop, bgWidth, bgHeight);
      }
      
      ctx.fillStyle = bgOptions.backgroundColor;
      ctx.fill();

      // Draw border if configured
      if (bgOptions.hasBorder !== false && bgOptions.borderWidth && bgOptions.borderWidth > 0 && bgOptions.borderColor && bgOptions.borderColor !== 'transparent') {
        ctx.strokeStyle = bgOptions.borderColor;
        ctx.lineWidth = bgOptions.borderWidth;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    
    // Calculate full line width for alignment calculations
    let lineWidth = 0;
    for (const token of line) {
      ctx.font = getFontString(style.fontFamily, style.fontSize, token.isBold, token.isItalic, style.fontWeight, style.fontStyle);
      lineWidth += ctx.measureText(token.text).width;
    }

    // Horizontal offset depending on align style
    let drawX = x;
    if (style.align === 'center') {
      drawX = x + (width - lineWidth) / 2;
    } else if (style.align === 'right') {
      drawX = x + (width - lineWidth);
    }

    // Draw tokens sequentially
    for (const token of line) {
      ctx.font = getFontString(style.fontFamily, style.fontSize, token.isBold, token.isItalic, style.fontWeight, style.fontStyle);
      
      // Styling and colors
      ctx.fillStyle = textColor;
      if (token.isBold && primaryColorOverride) {
        // Bold segments can use an accent highlight if we want
        ctx.fillStyle = primaryColorOverride;
      }

      // Add text shadow support
      if (style.hasShadow !== false && style.shadowColor && style.shadowColor !== 'transparent') {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = style.shadowBlur ?? 4;
        ctx.shadowOffsetX = style.shadowOffsetX ?? 2;
        ctx.shadowOffsetY = style.shadowOffsetY ?? 2;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillText(token.text, drawX, startY + l * lineHeightPx);
      drawX += ctx.measureText(token.text).width;
    }
    
    // Clear shadows so they don't leak to other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.restore();
}

// Core rendering executor that draws a template onto a given HTML Canvas
async function renderTemplateFrame(
  canvas: HTMLCanvasElement,
  template: DesignTemplate,
  dynamicTexts: Record<string, string>,
  dynamicImages: GraphicData['dynamicImages'],
  options?: {
    isExport?: boolean;
    paletteOverrides?: {
      primary?: string;
      accent?: string;
      text?: string;
      bg?: string;
      boldHighlight?: string;
    };
    hiddenElements?: string[];
    showGrid?: boolean;
    showSafeMargins?: boolean;
    scale?: number; // scale factor for exporting high-res (e.g. 2 for 2x DPI)
    selectedNodeId?: string | null;
    highlightColor?: string;
    boldHighlightColor?: string;
    editingImageRegionId?: string | null;
    targetVideoRegionId?: string;
    renderPhase?: 'all' | 'background' | 'foreground';
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = options?.scale || 1;
  const width = template.width * scale;
  const height = template.height * scale;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // Apply colors
  const primaryColor = options?.paletteOverrides?.primary || template.palette.primary;
  const accentColor = options?.paletteOverrides?.accent || template.palette.accent;
  const textColor = options?.paletteOverrides?.text || template.palette.text;
  const bgColor = options?.paletteOverrides?.bg || template.palette.bg;

  // 1. Draw Canvas Background (Color, Gradient, or Image)
  // When rendering foreground layer for video compositing, leave background transparent
  if (options?.renderPhase !== 'foreground') {
    ctx.save();
    ctx.scale(scale, scale);

    if (template.backgroundGradient) {
      const gradColors = options?.paletteOverrides?.bg 
        ? [bgColor, '#E2E8F0'] // generic fallback shift
        : template.backgroundGradient.colors;
      
      let gradient: CanvasGradient;
      if (template.backgroundGradient.type === 'radial') {
        gradient = ctx.createRadialGradient(
          template.width / 2, template.height / 2, 50,
          template.width / 2, template.height / 2, Math.max(template.width, template.height) / 2
        );
      } else {
        const angleRad = ((template.backgroundGradient.angle || 0) * Math.PI) / 180;
        const x1 = template.width / 2 - Math.cos(angleRad) * (template.width / 2);
        const y1 = template.height / 2 - Math.sin(angleRad) * (template.height / 2);
        const x2 = template.width / 2 + Math.cos(angleRad) * (template.width / 2);
        const y2 = template.height / 2 + Math.sin(angleRad) * (template.height / 2);
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      }

      gradColors.forEach((color, idx) => {
        gradient.addColorStop(idx / (gradColors.length - 1), color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, template.width, template.height);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, template.width, template.height);
    }

    // Draw background image if configured
    if (template.backgroundImageUrl) {
      try {
        const bgImg = await loadImage(template.backgroundImageUrl);
        ctx.drawImage(bgImg, 0, 0, template.width, template.height);
      } catch (err) {
        console.warn('Background image failed to load', err);
      }
    }
    ctx.restore();
  }

  // 2. Render all non-hidden Fixed Elements and Regions
  const renderList = [
    ...template.fixedElements.map((el, idx) => ({ item: el, isRegion: false, order: 0, index: idx, zIndex: el.zIndex ?? 0 })),
    ...template.regions.map((reg, idx) => ({ item: reg, isRegion: true, order: 1, index: idx, zIndex: reg.zIndex ?? 0 }))
  ];

  // Sort by zIndex, then order, then index
  renderList.sort((a, b) => {
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.index - b.index;
  });

  const videoNodeIndex = options?.targetVideoRegionId
    ? renderList.findIndex(n => n.isRegion && n.item.id === options.targetVideoRegionId)
    : -1;

  // Draw elements based on sorted order
  for (let i = 0; i < renderList.length; i++) {
    const node = renderList[i];
    const id = node.item.id;
    if (options?.hiddenElements?.includes(id) || (node.item as any).hidden) {
      continue; // Skip rendering
    }

    // Layer filtering for video compositing
    if (options?.renderPhase === 'background' && videoNodeIndex !== -1) {
      if (i >= videoNodeIndex) continue; // Only draw elements sorted before video
    } else if (options?.renderPhase === 'foreground' && videoNodeIndex !== -1) {
      if (i <= videoNodeIndex) continue; // Only draw elements sorted after video
    }

    ctx.save();
    ctx.scale(scale, scale);

    if (node.isRegion) {
      const reg = node.item as Region;

      // Draw Region background/borders (only if not fitting to text)
      const shouldDrawOuterBg = reg.hasBackground !== false && reg.backgroundColor && reg.backgroundColor !== 'transparent' && !(reg.type === 'text' && reg.fitBackgroundToText);
      if (shouldDrawOuterBg) {
        ctx.fillStyle = reg.backgroundColor;
        ctx.globalAlpha = reg.opacity;
        ctx.beginPath();
        if (reg.borderRadius > 0) {
          ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
        } else {
          ctx.rect(reg.x, reg.y, reg.width, reg.height);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Content depending on Region type
      if (reg.type === 'image') {
        const customImgData = dynamicImages[reg.id];
        const imageUrl = customImgData?.url || reg.placeholderImage;

        if (imageUrl) {
          try {
            const img = await loadImage(imageUrl);
            
            // Calculate standard cover fit dimensions
            const imgRatio = img.width / img.height;
            const regRatio = reg.width / reg.height;
            let drawWidth = reg.width;
            let drawHeight = reg.height;

            if (imgRatio > regRatio) {
              // Image is wider than region
              drawWidth = reg.height * imgRatio;
            } else {
              // Image is taller than region
              drawHeight = reg.width / imgRatio;
            }

            const scaleFactor = customImgData?.scale ?? 1.0;
            const offsetX = customImgData?.offsetX ?? 0;
            const offsetY = customImgData?.offsetY ?? 0;
            const rotation = customImgData?.rotation ?? 0; // In degrees

            // Center of the image container
            const centerX = reg.x + reg.width / 2;
            const centerY = reg.y + reg.height / 2;

            const finalDrawWidth = drawWidth * scaleFactor;
            const finalDrawHeight = drawHeight * scaleFactor;

            // Draw unclipped, semi-transparent preview if this image region is currently being edited with mouse
            if (options?.editingImageRegionId === reg.id) {
              ctx.save();
              ctx.globalAlpha = 0.35;
              ctx.translate(centerX + offsetX, centerY + offsetY);
              if (rotation !== 0) {
                ctx.rotate((rotation * Math.PI) / 180);
              }
              ctx.drawImage(img, -finalDrawWidth / 2, -finalDrawHeight / 2, finalDrawWidth, finalDrawHeight);
              
              // Draw dashed outline around the entire unclipped image bounds
              ctx.strokeStyle = options?.highlightColor || '#FF6B1A';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(-finalDrawWidth / 2, -finalDrawHeight / 2, finalDrawWidth, finalDrawHeight);
              ctx.restore();
            }

            ctx.save();
            const shouldClip = reg.clipImage !== false;
            if (shouldClip) {
              // Apply clipping path to region bounding box (with border-radius support)
              ctx.beginPath();
              if (reg.borderRadius > 0) {
                ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
              } else {
                ctx.rect(reg.x, reg.y, reg.width, reg.height);
              }
              ctx.clip();
            }

            ctx.translate(centerX + offsetX, centerY + offsetY);
            if (rotation !== 0) {
              ctx.rotate((rotation * Math.PI) / 180);
            }

            // Draw image centered inside translation matrix
            ctx.drawImage(img, -finalDrawWidth / 2, -finalDrawHeight / 2, finalDrawWidth, finalDrawHeight);
            ctx.restore();

            // If this region contains a video and we are NOT in export mode, draw a small video indicator badge
            if (customImgData?.isVideo && !options?.isExport) {
              ctx.save();
              const badgeW = 64;
              const badgeH = 24;
              const badgeX = reg.x + reg.width - badgeW - 12;
              const badgeY = reg.y + reg.height - badgeH - 12;

              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
              ctx.fill();

              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('▶ MP4', badgeX + badgeW / 2, badgeY + badgeH / 2);
              ctx.restore();
            }
          } catch (err) {
            console.warn(`Failed to load region image: ${imageUrl}`, err);
            // Fallback warning text in canvas
            ctx.fillStyle = '#3A3A3C';
            ctx.fillRect(reg.x, reg.y, reg.width, reg.height);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.fillText('Resim yüklenemedi', reg.x + 20, reg.y + reg.height / 2);
          }
        }
      } else if (reg.type === 'text' && reg.textStyle) {
        const textValue = dynamicTexts[reg.id] !== undefined ? dynamicTexts[reg.id] : (reg.placeholderText || '');
        const textStyleCopy = { ...reg.textStyle };

        // Override text colors if needed
        if (!textStyleCopy.isCustomColor) {
          if (textStyleCopy.color === '#0F172A' || textStyleCopy.color === '#000000' || textStyleCopy.color === '#111827' || textStyleCopy.color === 'rgba(255,255,255,0.95)') {
            textStyleCopy.color = textColor;
          } else if (textStyleCopy.color === '#6C5CE7' || textStyleCopy.color === '#FF6B1A') {
            textStyleCopy.color = primaryColor || '#FF6B1A';
          }
        }

        const resolvedBorderColor = (reg.borderColor === '#6C5CE7' || reg.borderColor === '#6C5CE7') ? primaryColor : ((reg.borderColor === '#FF9F0A' || reg.borderColor === '#FF9F0A') ? accentColor : reg.borderColor);

        drawFormattedText(
          ctx,
          textValue,
          reg.x,
          reg.y,
          reg.width,
          reg.height,
          textStyleCopy,
          options?.boldHighlightColor || options?.paletteOverrides?.boldHighlight || template.palette.boldHighlight || primaryColor, // allows using custom or primary color highlight for bold texts
          reg.fitBackgroundToText ? {
            backgroundColor: reg.backgroundColor,
            borderColor: resolvedBorderColor,
            borderWidth: reg.borderWidth,
            borderRadius: reg.borderRadius,
            opacity: reg.opacity,
            hasBackground: reg.hasBackground,
            hasBorder: reg.hasBorder
          } : undefined
        );
      }

      // Draw Region Border (only if not fitting to text)
      const shouldDrawOuterBorder = reg.hasBorder !== false && reg.borderWidth > 0 && reg.borderColor && reg.borderColor !== 'transparent' && !(reg.type === 'text' && reg.fitBackgroundToText);
      if (shouldDrawOuterBorder) {
        ctx.strokeStyle = (reg.borderColor === '#6C5CE7' || reg.borderColor === '#6C5CE7') ? primaryColor : ((reg.borderColor === '#FF9F0A' || reg.borderColor === '#FF9F0A') ? accentColor : reg.borderColor);
        ctx.lineWidth = reg.borderWidth;
        ctx.beginPath();
        if (reg.borderRadius > 0) {
          ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
        } else {
          ctx.rect(reg.x, reg.y, reg.width, reg.height);
        }
        ctx.stroke();
      }

    } else {
      // Draw Fixed Elements (Branding, Logos, Shapes, Static text)
      const el = node.item as FixedElement;

      if (el.type === 'shape') {
        const color = el.backgroundColor || el.color || accentColor;
        ctx.fillStyle = (color === '#FF9F0A' || color === '#FF9F0A' || color === '#FF9F0A') ? accentColor : ((color === '#6C5CE7' || color === '#6C5CE7') ? primaryColor : color);
        ctx.globalAlpha = 1.0;

        if (el.shapeType === 'rect') {
          ctx.beginPath();
          if (el.borderRadius && el.borderRadius > 0) {
            ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
          } else {
            ctx.rect(el.x, el.y, el.width, el.height);
          }
          ctx.fill();
          if (el.borderWidth && el.borderColor) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = el.borderWidth;
            ctx.stroke();
          }
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.shapeType === 'line') {
          ctx.strokeStyle = color;
          ctx.lineWidth = el.height || 2;
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y);
          ctx.stroke();
        }
      } else if (el.type === 'logo' || el.type === 'social') {
        ctx.save();
        if (el.textStyle?.letterSpacing !== undefined) {
          ctx.letterSpacing = `${el.textStyle.letterSpacing}px`;
        }
        const color = el.textStyle?.color || textColor;
        const resolvedColor = color === '#6C5CE7' ? primaryColor : (color === 'rgba(255,255,255,0.72)' || color === 'rgba(255,255,255,0.72)' ? textColor : color);

        let iconWidth = 0;
        if (el.iconType && el.iconType !== 'none') {
          iconWidth = el.textStyle ? el.textStyle.fontSize * 1.3 : 24;
          const iconY = el.y + (el.height - iconWidth) / 2;
          
          let iconX = el.x;
          if (el.textStyle?.align === 'center') {
            // Measure full text width to center icon + text combo
            ctx.font = getFontString(el.textStyle.fontFamily, el.textStyle.fontSize, el.textStyle.fontWeight === 'bold', false);
            const textWidth = ctx.measureText(el.content || '').width;
            const comboWidth = iconWidth + 10 + textWidth;
            iconX = el.x + (el.width - comboWidth) / 2;
          } else if (el.textStyle?.align === 'right') {
            ctx.font = getFontString(el.textStyle.fontFamily, el.textStyle.fontSize, el.textStyle.fontWeight === 'bold', false);
            const textWidth = ctx.measureText(el.content || '').width;
            iconX = el.x + el.width - (iconWidth + 10 + textWidth);
          }

          drawSocialIcon(ctx, el.iconType, iconX, iconY, iconWidth, resolvedColor);
        }

        if (el.content && el.textStyle) {
          ctx.fillStyle = resolvedColor;
          ctx.font = getFontString(el.textStyle.fontFamily, el.textStyle.fontSize, el.textStyle.fontWeight === 'bold', false, el.textStyle.fontWeight);
          
          let textX = el.x + (iconWidth > 0 ? iconWidth + 10 : 0);
          let textY = el.y + el.height / 2 + el.textStyle.fontSize * 0.35; // centered vertically

          if (el.textStyle.align === 'center') {
            ctx.textAlign = 'center';
            textX = el.x + el.width / 2 + (iconWidth > 0 ? (iconWidth + 10) / 2 : 0);
          } else if (el.textStyle.align === 'right') {
            ctx.textAlign = 'right';
            textX = el.x + el.width;
          } else {
            ctx.textAlign = 'left';
          }

          ctx.fillText(el.content, textX, textY);
          ctx.textAlign = 'left'; // reset
        }
        ctx.restore();
      } else if (el.type === 'text' && el.textStyle && el.content) {
        ctx.save();
        if (el.textStyle.letterSpacing !== undefined) {
          ctx.letterSpacing = `${el.textStyle.letterSpacing}px`;
        }
        // Simple static text
        const color = el.textStyle.color || textColor;
        const resolvedColor = el.textStyle.isCustomColor
          ? color
          : (color === '#34C759' ? '#34C759' : (color === '#6C5CE7' ? primaryColor : color));

        ctx.fillStyle = resolvedColor;
        ctx.font = getFontString(el.textStyle.fontFamily, el.textStyle.fontSize, el.textStyle.fontWeight === 'bold', false, el.textStyle.fontWeight);
        
        let textX = el.x;
        let textY = el.y + el.height / 2 + el.textStyle.fontSize * 0.35;

        if (el.textStyle.align === 'center') {
          ctx.textAlign = 'center';
          textX = el.x + el.width / 2;
        } else if (el.textStyle.align === 'right') {
          ctx.textAlign = 'right';
          textX = el.x + el.width;
        } else {
          ctx.textAlign = 'left';
        }

        ctx.fillText(el.content, textX, textY);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // 2.5 Draw Selection/Resize Handles ONLY when editing on canvas (Never during export)
  if (!options?.isExport) {
    ctx.save();
    ctx.scale(scale, scale);

    const activeHighlight = options?.highlightColor || '#FF6B1A';

    // Draw outline and handles ONLY for the currently selected region
    for (const reg of template.regions) {
      if (options?.hiddenElements?.includes(reg.id) || reg.hidden) continue;
      
      const isSelected = reg.id === options?.selectedNodeId;
      if (!isSelected) continue; // DO NOT draw dashed border lines for unselected regions!

      ctx.beginPath();
      ctx.rect(reg.x, reg.y, reg.width, reg.height);
      ctx.strokeStyle = activeHighlight;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Draw circular handles at the 4 corners of selected region only if not locked
      if (!reg.locked) {
        ctx.fillStyle = '#3A3A3C';
        ctx.strokeStyle = activeHighlight;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);

        const corners = [
          { x: reg.x, y: reg.y }, // TL
          { x: reg.x + reg.width, y: reg.y }, // TR
          { x: reg.x, y: reg.y + reg.height }, // BL
          { x: reg.x + reg.width, y: reg.y + reg.height } // BR
        ];

        for (const corner of corners) {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Draw outlines for fixed elements ONLY when selected
    for (const el of template.fixedElements) {
      if (options?.hiddenElements?.includes(el.id) || el.hidden) continue;

      const isSelected = el.id === options?.selectedNodeId;
      if (!isSelected) continue;

      ctx.beginPath();
      if (el.type === 'shape' && el.shapeType === 'circle') {
        ctx.arc(el.x, el.y, el.width / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(el.x, el.y, el.width, el.height);
      }
      ctx.strokeStyle = activeHighlight;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Draw handles only if not locked
      if (!el.locked) {
        ctx.fillStyle = '#3A3A3C';
        ctx.strokeStyle = activeHighlight;
        ctx.lineWidth = 2.5;
        
        const corners = [
          { x: el.x, y: el.y }, // TL
          { x: el.x + el.width, y: el.y }, // TR
          { x: el.x, y: el.y + el.height }, // BL
          { x: el.x + el.width, y: el.y + el.height } // BR
        ];

        for (const corner of corners) {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // 3. Draw alignment Grid if requested
  if (options?.showGrid) {
    ctx.save();
    ctx.scale(scale, scale);
    const activeHighlight = options?.paletteOverrides?.accent || '#FF6B1A';
    ctx.strokeStyle = activeHighlight.startsWith('#') 
      ? `${activeHighlight}26` // Hex transparency 15%
      : 'rgba(255, 107, 26, 0.15)';
    ctx.lineWidth = 1;

    // Draw grid lines
    const step = 50;
    ctx.beginPath();
    // Verticals
    for (let x = 0; x < template.width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, template.height);
    }
    // Horizontals
    for (let y = 0; y < template.height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(template.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Draw Safe margins outline if requested
  if (options?.showSafeMargins) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // clean red safe boundary
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, template.width - 80, template.height - 80);
    ctx.restore();
  }
}

const renderVersions = new WeakMap<HTMLCanvasElement, number>();
const fontLoads = new Map<string, Promise<unknown>>();

export async function renderTemplateToCanvas(...args: Parameters<typeof renderTemplateFrame>) {
  const [target, template, texts, images, options] = args;
  const version = (renderVersions.get(target) || 0) + 1;
  renderVersions.set(target, version);
  const styles = [...template.regions, ...template.fixedElements].map(r => r.textStyle).filter(Boolean);
  if (document.fonts) {
    await Promise.all(styles.map(style => {
      const font = `${style!.fontWeight || 'normal'} 16px "${style!.fontFamily}"`;
      if (!fontLoads.has(font)) fontLoads.set(font, document.fonts.load(font).catch(() => undefined));
      return fontLoads.get(font);
    }));
  }
  const draft = document.createElement('canvas');
  await renderTemplateFrame(draft, template, texts, images, options);
  if (renderVersions.get(target) !== version) return;
  target.width = draft.width;
  target.height = draft.height;
  target.getContext('2d')?.drawImage(draft, 0, 0);
}
