import type { DesignTemplate, FixedElement, Region, TextStyle } from '../types';

const rounded = (value: number) => Math.round(value * 100) / 100;

function scaleTextStyle(style: TextStyle | undefined, scale: number): TextStyle | undefined {
  if (!style) return undefined;
  return {
    ...style,
    fontSize: Math.max(1, rounded(style.fontSize * scale)),
    ...(style.letterSpacing === undefined ? {} : { letterSpacing: rounded(style.letterSpacing * scale) }),
    ...(style.shadowBlur === undefined ? {} : { shadowBlur: rounded(style.shadowBlur * scale) }),
    ...(style.shadowOffsetX === undefined ? {} : { shadowOffsetX: rounded(style.shadowOffsetX * scale) }),
    ...(style.shadowOffsetY === undefined ? {} : { shadowOffsetY: rounded(style.shadowOffsetY * scale) }),
  };
}

function scaleRegion(region: Region, scaleX: number, scaleY: number, uniformScale: number): Region {
  return {
    ...region,
    x: rounded(region.x * scaleX),
    y: rounded(region.y * scaleY),
    width: rounded(region.width * scaleX),
    height: rounded(region.height * scaleY),
    borderWidth: rounded(region.borderWidth * uniformScale),
    borderRadius: rounded(region.borderRadius * uniformScale),
    ...(region.backgroundPaddingX === undefined ? {} : { backgroundPaddingX: rounded(region.backgroundPaddingX * uniformScale) }),
    ...(region.backgroundPaddingY === undefined ? {} : { backgroundPaddingY: rounded(region.backgroundPaddingY * uniformScale) }),
    textStyle: scaleTextStyle(region.textStyle, uniformScale),
  };
}

function scaleFixedElement(element: FixedElement, scaleX: number, scaleY: number, uniformScale: number): FixedElement {
  return {
    ...element,
    x: rounded(element.x * scaleX),
    y: rounded(element.y * scaleY),
    width: rounded(element.width * scaleX),
    height: rounded(element.height * scaleY),
    ...(element.borderWidth === undefined ? {} : { borderWidth: rounded(element.borderWidth * uniformScale) }),
    ...(element.borderRadius === undefined ? {} : { borderRadius: rounded(element.borderRadius * uniformScale) }),
    textStyle: scaleTextStyle(element.textStyle, uniformScale),
  };
}

export function resizePageLayout<T extends { regions?: Region[]; fixedElements?: FixedElement[] }>(page: T, oldWidth: number, oldHeight: number, width: number, height: number): T {
  const scaleX = width / oldWidth;
  const scaleY = height / oldHeight;
  const uniformScale = Math.min(scaleX, scaleY);
  return {
    ...page,
    ...(page.regions ? { regions: page.regions.map(region => scaleRegion(region, scaleX, scaleY, uniformScale)) } : {}),
    ...(page.fixedElements ? { fixedElements: page.fixedElements.map(element => scaleFixedElement(element, scaleX, scaleY, uniformScale)) } : {}),
  };
}

/** Resize every layout in a template while preserving relative layer placement. */
export function resizeTemplate(template: DesignTemplate, width: number, height: number): DesignTemplate {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error('Şablon ölçüleri pozitif sayı olmalıdır.');
  }
  const nextWidth = Math.round(width);
  const nextHeight = Math.round(height);
  const scaleX = nextWidth / template.width;
  const scaleY = nextHeight / template.height;
  const uniformScale = Math.min(scaleX, scaleY);
  return {
    ...template,
    width: nextWidth,
    height: nextHeight,
    regions: template.regions.map(region => scaleRegion(region, scaleX, scaleY, uniformScale)),
    fixedElements: template.fixedElements.map(element => scaleFixedElement(element, scaleX, scaleY, uniformScale)),
    pages: template.pages?.map(page => resizePageLayout(page, template.width, template.height, nextWidth, nextHeight)),
  };
}
