import { DesignTemplate, Region } from '../types';
import { renderTemplateToCanvas } from '../canvasRenderer';

export interface VideoCompositorOptions {
  scale?: number;
  paletteOverrides?: any;
  hiddenElements?: string[];
  highlightColor?: string;
  fps?: number;
}

/**
 * Draws an active HTMLVideoElement frame into a Canvas 2D context using the
 * region's exact geometry, aspect ratio (cover fit), border-radius clipping,
 * and user transform parameters (scale, offsetX, offsetY, rotation).
 */
function drawVideoFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  reg: Region,
  videoData: any,
  scale: number
) {
  const vidWidth = video.videoWidth || reg.width;
  const vidHeight = video.videoHeight || reg.height;
  const imgRatio = vidWidth / (vidHeight || 1);
  const regRatio = reg.width / (reg.height || 1);
  let drawWidth = reg.width;
  let drawHeight = reg.height;

  if (imgRatio > regRatio) {
    drawWidth = reg.height * imgRatio;
  } else {
    drawHeight = reg.width / imgRatio;
  }

  const scaleFactor = videoData?.scale ?? 1.0;
  const offsetX = videoData?.offsetX ?? 0;
  const offsetY = videoData?.offsetY ?? 0;
  const rotation = videoData?.rotation ?? 0;

  const centerX = reg.x + reg.width / 2;
  const centerY = reg.y + reg.height / 2;

  const finalDrawWidth = drawWidth * scaleFactor;
  const finalDrawHeight = drawHeight * scaleFactor;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Region Background if configured
  if (reg.hasBackground !== false && reg.backgroundColor && reg.backgroundColor !== 'transparent') {
    ctx.fillStyle = reg.backgroundColor;
    ctx.globalAlpha = reg.opacity ?? 1;
    ctx.beginPath();
    if (reg.borderRadius > 0) {
      ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
    } else {
      ctx.rect(reg.x, reg.y, reg.width, reg.height);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 2. Clipping Path (handles rounded borders on video frame)
  const shouldClip = reg.clipImage !== false;
  if (shouldClip) {
    ctx.beginPath();
    if (reg.borderRadius > 0) {
      ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
    } else {
      ctx.rect(reg.x, reg.y, reg.width, reg.height);
    }
    ctx.clip();
  }

  // 3. Translation, Rotation, and Draw
  ctx.translate(centerX + offsetX, centerY + offsetY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  ctx.drawImage(video, -finalDrawWidth / 2, -finalDrawHeight / 2, finalDrawWidth, finalDrawHeight);
  ctx.restore();

  // 4. Region Border if configured
  if (reg.hasBorder !== false && reg.borderWidth > 0 && reg.borderColor && reg.borderColor !== 'transparent') {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = reg.borderColor;
    ctx.lineWidth = reg.borderWidth;
    ctx.beginPath();
    if (reg.borderRadius > 0) {
      ctx.roundRect(reg.x, reg.y, reg.width, reg.height, reg.borderRadius);
    } else {
      ctx.rect(reg.x, reg.y, reg.width, reg.height);
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Composites a video into a full template design (background, graphics, texts, logos,
 * and audio) in real time using Canvas + Web Audio API + MediaRecorder.
 * Returns a high-quality video Blob (MP4/WebM).
 */
export async function compositeTemplateVideo(
  template: DesignTemplate,
  pageData: any,
  options: VideoCompositorOptions = {},
  onProgress?: (progressPct: number) => void
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') throw new Error('Bu tarayıcı video kaydını desteklemiyor. Güncel bir tarayıcı deneyin.');
  const regions = pageData.regions || template.regions || [];
  const images = pageData.dynamicImages || {};

  // Find the video region on this page
  const videoRegion = regions.find(
    (r: Region) => r.type === 'image' && !r.hidden && !(pageData.hiddenElements || []).includes(r.id) && images[r.id]?.isVideo && (images[r.id]?.videoUrl || images[r.id]?.url)
  );

  if (!videoRegion) {
    throw new Error('Bu sayfada dışa aktarılacak bir video bulunamadı.');
  }

  const videoData = images[videoRegion.id];
  const videoUrl = videoData.videoUrl || videoData.url;

  // 1. Create and load invisible HTML5 video element
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.muted = false; // Muted false so audio tracks can be captured by Web Audio API
  video.currentTime = 0;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      reject(new Error('Video yüklenemedi. Dosyayı yeniden yükleyip tekrar deneyin.'));
    }, 10000);

    video.onloadeddata = () => {
      clearTimeout(timeout);
      resolve();
    };

    video.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error('Video dosyası yüklenemedi veya desteklenmeyen format.'));
    };

    video.load();
  });

  const duration = (video.duration && !isNaN(video.duration) && video.duration > 0)
    ? video.duration
    : (videoData.duration || 5);

  const scale = options.scale || 1.0;
  const width = Math.round(template.width * scale);
  const height = Math.round(template.height * scale);

  // 2. Pre-render Background Layer (Canvas background, gradient, background image, underlying shapes)
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = width;
  bgCanvas.height = height;

  await renderTemplateToCanvas(
    bgCanvas,
    template,
    pageData.dynamicTexts || {},
    images,
    {
      ...options,
      isExport: true,
      renderPhase: 'background',
      targetVideoRegionId: videoRegion.id,
      scale
    }
  );

  // 3. Pre-render Foreground Layer (Header texts, descriptions, school logos, quote icons, social handles)
  const fgCanvas = document.createElement('canvas');
  fgCanvas.width = width;
  fgCanvas.height = height;

  await renderTemplateToCanvas(
    fgCanvas,
    template,
    pageData.dynamicTexts || {},
    images,
    {
      ...options,
      isExport: true,
      renderPhase: 'foreground',
      targetVideoRegionId: videoRegion.id,
      scale
    }
  );

  // 4. Create Main Compositor Canvas
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = width;
  mainCanvas.height = height;
  const mainCtx = mainCanvas.getContext('2d', { alpha: false });
  if (!mainCtx) {
    throw new Error('Canvas 2D render context oluşturulamadı.');
  }

  // 5. Connect Web Audio API to route video sound directly into recorder without speaker noise
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  let audioStreamDestination: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;

  if (AudioContextClass) {
    try {
      audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaElementSource(video);
      audioStreamDestination = audioCtx.createMediaStreamDestination();
      source.connect(audioStreamDestination);
      // NOTE: We do NOT connect to audioCtx.destination, so export remains silent to user!
    } catch (aErr) {
      console.warn('AudioContext stream capture notice:', aErr);
    }
  }

  // 6. Capture stream from canvas at 30 FPS
  const fps = options.fps || 30;
  const canvasStream = mainCanvas.captureStream(fps);

  if (audioStreamDestination) {
    const audioTracks = audioStreamDestination.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }
  }

  // 7. Select best supported MediaRecorder container format (MP4 preferred, WebM fallback)
  let mimeType = 'video/mp4;codecs=avc1';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp9,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 6_500_000 // 6.5 Mbps high quality video
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const renderCurrentFrame = () => {
    // 1. Draw pre-rendered background
    mainCtx.drawImage(bgCanvas, 0, 0);

    // 2. Draw live video frame inside region
    drawVideoFrameToCanvas(mainCtx, video, videoRegion, videoData, scale);

    // 3. Draw pre-rendered foreground
    mainCtx.drawImage(fgCanvas, 0, 0);
  };

  // Render first frame immediately
  renderCurrentFrame();

  return new Promise<Blob>((resolve, reject) => {
    let animFrameId: number;
    let isFinished = false;
    let cleanedUp = false;
    let timeout: ReturnType<typeof setTimeout>;
    let stopTimer: ReturnType<typeof setTimeout>;

    const finalize = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      isFinished = true;
      clearTimeout(timeout);
      clearTimeout(stopTimer);
      cancelAnimationFrame(animFrameId);
      video.pause();
      video.removeAttribute('src');
      video.load();
      canvasStream.getTracks().forEach(track => track.stop());

      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };

    recorder.onstop = () => {
      finalize();
      if (recordedChunks.length === 0) {
        reject(new Error('Video kaydı boş oluşturuldu.'));
        return;
      }
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(finalBlob);
    };

    recorder.onerror = (e) => {
      finalize();
      reject(e);
    };

    recorder.start(100);
    video.currentTime = 0;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(err => {
        if (recorder.state !== 'inactive') recorder.stop();
        finalize();
        reject(new Error('Video oynatılamadığı için dışa aktarılamadı. Dosyayı ve tarayıcı izinlerini kontrol edin.'));
      });
    }

    const frameLoop = () => {
      if (isFinished) return;

      renderCurrentFrame();

      if (onProgress && duration > 0) {
        const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
        onProgress(pct);
      }

      if (video.ended || video.currentTime >= duration - 0.04) {
        if (!isFinished) {
          isFinished = true;
          if (onProgress) onProgress(100);
          stopTimer = setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, 150);
        }
        return;
      }

      animFrameId = requestAnimationFrame(frameLoop);
    };

    animFrameId = requestAnimationFrame(frameLoop);

    // Safety timeout to prevent hanging forever
    timeout = setTimeout(() => {
      if (!isFinished && recorder.state !== 'inactive') {
        isFinished = true;
        if (onProgress) onProgress(100);
        recorder.stop();
      }
    }, (duration + 5) * 1000);
  });
}
