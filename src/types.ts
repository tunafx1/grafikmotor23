export interface TextStyle {
  fontFamily: string; // 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono' | 'Syne'
  fontSize: number; // Pixels
  color: string; // Hex color
  fontWeight: 'normal' | 'bold' | '300' | '500' | '700' | '900';
  fontStyle?: 'normal' | 'italic';
  lineHeight: number; // e.g. 1.2
  align: 'left' | 'center' | 'right';
  letterSpacing?: number; // Pixels
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  hasShadow?: boolean;
  underline?: boolean;
  highlightColor?: string;
  highlightOpacity?: number;
  dropCap?: boolean;
  isCustomColor?: boolean;
}

export type TextRole = 'title' | 'subtitle' | 'description' | 'callToAction' | 'label' | 'date' | 'price' | 'normal';

export interface Region {
  id: string;
  name: string;
  type: 'image' | 'text' | 'container';
  x: number; // X position in canvas
  y: number; // Y position in canvas
  width: number;
  height: number;
  backgroundColor: string; // Hex color or transparent
  opacity: number; // 0 to 1
  borderColor: string; // Hex color
  borderWidth: number; // Pixels
  borderRadius: number; // Pixels
  isDynamic: boolean;
  zIndex?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  hasShadow?: boolean;
  blendMode?: GlobalCompositeOperation;
  padding?: number;
  /** Horizontal inset around each line when the text background is fitted. */
  backgroundPaddingX?: number;
  /** Vertical inset around each line when the text background is fitted. */
  backgroundPaddingY?: number;
  lockAspectRatio?: boolean;
  fitBackgroundToText?: boolean;
  hasBackground?: boolean;
  hasBorder?: boolean;
  hidden?: boolean;
  locked?: boolean;
  // If type is text
  textStyle?: TextStyle;
  placeholderText?: string;
  textRole?: TextRole;
  /** This instruction is sent to AI only when generating this text region. */
  aiPrompt?: string;
  // If type is image
  placeholderImage?: string;
  clipImage?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface FixedElement {
  id: string;
  type: 'logo' | 'social' | 'shape' | 'text';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  hidden?: boolean;
  locked?: boolean;
  opacity?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  hasShadow?: boolean;
  blendMode?: GlobalCompositeOperation;
  lockAspectRatio?: boolean;
  // Shape specific
  shapeType?: 'rect' | 'circle' | 'line' | 'star';
  color?: string; // Fill or stroke color
  backgroundColor?: string; // Shape fill
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Text/Logo specific
  content?: string; // Text string, image URL, or handle name
  textStyle?: TextStyle;
  iconType?: 'instagram' | 'globe' | 'mail' | 'phone' | 'none';
}

export interface TemplatePage {
  backgroundImageUrl?: string;
  id: string; // '1' (Cover/Kapak) or '2' (Collage/Kolaj)
  name: string;
  regions: Region[];
  fixedElements: FixedElement[];
  pageRole?: 'cover' | '1-image' | '2-image' | '3-image' | 'custom';
}

export interface DesignTemplate {
  sourceTemplateId?: string;
  productionBrief?: string;
  createdAt?: string;
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    colors: string[]; // hex array
    angle?: number;
  };
  backgroundImageUrl?: string;
  backgroundPattern?: {
    type: 'none' | 'grid' | 'dots' | 'circles';
    color: string;
    size: number;
    opacity: number;
  };
  overlay?: {
    color: string;
    opacity: number;
    vignette?: number;
  };
  regions: Region[];
  fixedElements: FixedElement[];
  palette: {
    primary: string;
    accent: string;
    text: string;
    bg: string;
    boldHighlight?: string;
  };
  pages?: TemplatePage[];
  aiSystemPrompt?: string;
}

export interface SequenceMediaItem {
  mediaId?: string;
  id: string;
  type: 'image' | 'video';
  file?: File;
  url: string;           // Blob URL or Data URL
  thumbnailUrl: string;  // Snapshot JPEG for canvas & AI
  duration?: number;     // Video duration in seconds
  originalName?: string;
}

export interface GraphicData {
  templateId: string;
  dynamicTexts: Record<string, string>; // regionId -> text
  dynamicImages: Record<string, {
    url: string;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    mediaId?: string;
    isVideo?: boolean;
    videoUrl?: string;
    duration?: number;
    thumbnailUrl?: string;
  }>; // regionId -> image options
  paletteOverrides?: {
    primary?: string;
    accent?: string;
    text?: string;
    bg?: string;
    boldHighlight?: string;
  };
  hiddenElements?: string[]; // list of fixedElement or region IDs to hide
}
