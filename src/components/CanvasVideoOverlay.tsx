import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Film } from 'lucide-react';
import { Region } from '../types';

export interface CanvasVideoOverlayProps {
  templateWidth: number;
  templateHeight: number;
  displayWidth: number;
  regions: Region[];
  dynamicImages: Record<string, any>;
  playingRegionId: string | null;
  onSetPlayingRegionId: (id: string | null) => void;
  isMuted?: boolean;
  onToggleMute?: (muted: boolean) => void;
}

function formatVideoTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface SingleVideoPlayerProps {
  reg: Region;
  videoSrc: string;
  imgData: any;
  templateWidth: number;
  templateHeight: number;
  displayWidth: number;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

function SingleVideoPlayer({
  reg,
  videoSrc,
  imgData,
  templateWidth,
  templateHeight,
  displayWidth,
  onClose,
  isMuted,
  onToggleMute
}: SingleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.currentTime = 0;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPaused(false);
        })
        .catch(err => {
          console.warn("Autoplay was prevented, trying muted:", err);
          // Fallback to muted autoplay
          v.muted = true;
          v.play().catch(e => {
            console.error("Muted playback also failed:", e);
            setHasError(true);
          });
        });
    }
  }, [videoSrc]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPaused(false);
    } else {
      v.pause();
      setIsPaused(true);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration);
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    v.currentTime = pct * v.duration;
  };

  const leftPercent = (reg.x / templateWidth) * 100;
  const topPercent = (reg.y / templateHeight) * 100;
  const widthPercent = (reg.width / templateWidth) * 100;
  const heightPercent = (reg.height / templateHeight) * 100;
  const pixelRadius = Math.round(((reg.borderRadius || 0) / templateWidth) * displayWidth);

  const scale = imgData?.scale ?? 1.0;
  const offsetX = imgData?.offsetX ?? 0;
  const offsetY = imgData?.offsetY ?? 0;
  const rotation = imgData?.rotation ?? 0;

  const translateXPercent = reg.width > 0 ? (offsetX / reg.width) * 100 : 0;
  const translateYPercent = reg.height > 0 ? (offsetY / reg.height) * 100 : 0;

  return (
    <div
      className="absolute overflow-hidden shadow-2xl z-30 bg-black group select-none"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        borderRadius: `${pixelRadius}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-900 text-white">
          <Film className="w-8 h-8 text-red-400 mb-2 opacity-80" />
          <p className="text-xs font-semibold">Video yüklenemedi</p>
          <p className="text-[10px] text-gray-400 mt-1">Lütfen videoyu yeniden seçin veya tarayıcınızı kontrol edin.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-bold"
          >
            Kapat
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
            onClick={togglePlay}
            onError={() => setHasError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
              transform: `translate(${translateXPercent}%, ${translateYPercent}%) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />

          {/* Top Header Badge & Close Button */}
          <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-auto z-40 transition-opacity duration-200">
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>CANLI MP4</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/80 hover:bg-red-600 backdrop-blur-md text-white border border-white/25 transition-all shadow-lg cursor-pointer flex items-center gap-1 hover:scale-105"
              title="Durdur ve Düzenlemeye Dön"
            >
              <X className="w-3.5 h-3.5" />
              <span>Durdur</span>
            </button>
          </div>

          {/* Center Pause Indicator */}
          {isPaused && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer z-35"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center pl-1 shadow-2xl hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current text-black" />
              </div>
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-1.5 pointer-events-auto z-40">
            {/* Progress Scrubber Bar */}
            <div
              className="w-full h-1.5 bg-white/25 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all duration-150 relative"
              onClick={handleSeek}
              title="İleri / Geri Sar"
            >
              <div
                className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#34C759] rounded-full transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between text-white text-[11px] font-medium pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 hover:text-[#34C759] transition cursor-pointer"
                  title={isPaused ? "Oynat" : "Durdur"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </button>
                <span className="tabular-nums text-[10px] text-white/90 font-medium">
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute();
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-semibold"
                  title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3 h-3 text-red-400" />
                      <span>Sessiz</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-[#34C759]" />
                      <span>Sesli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CanvasVideoOverlay({
  templateWidth,
  templateHeight,
  displayWidth,
  regions,
  dynamicImages,
  playingRegionId,
  onSetPlayingRegionId,
  isMuted = false,
  onToggleMute
}: CanvasVideoOverlayProps) {
  // Find all image regions that contain a video
  const videoRegions = regions.filter(reg => {
    if (reg.type !== 'image') return false;
    const imgData = dynamicImages[reg.id];
    return imgData?.isVideo && (imgData?.videoUrl || imgData?.url);
  });

  if (videoRegions.length === 0) {
    return null;
  }

  const handleMuteToggle = () => {
    if (onToggleMute) {
      onToggleMute(!isMuted);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {videoRegions.map(reg => {
        const imgData = dynamicImages[reg.id];
        const videoSrc = imgData.videoUrl || imgData.url;
        const isThisPlaying = playingRegionId === reg.id;

        if (isThisPlaying) {
          return (
            <SingleVideoPlayer
              key={reg.id}
              reg={reg}
              videoSrc={videoSrc}
              imgData={imgData}
              templateWidth={templateWidth}
              templateHeight={templateHeight}
              displayWidth={displayWidth}
              onClose={() => onSetPlayingRegionId(null)}
              isMuted={isMuted}
              onToggleMute={handleMuteToggle}
            />
          );
        }

        // When not playing, render centered sleek Play button
        const leftPercent = (reg.x / templateWidth) * 100;
        const topPercent = (reg.y / templateHeight) * 100;
        const widthPercent = (reg.width / templateWidth) * 100;
        const heightPercent = (reg.height / templateHeight) * 100;
        const pixelRadius = Math.round(((reg.borderRadius || 0) / templateWidth) * displayWidth);

        return (
          <div
            key={reg.id}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              borderRadius: `${pixelRadius}px`
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetPlayingRegionId(reg.id);
              }}
              className="pointer-events-auto group flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/80 hover:bg-black/95 backdrop-blur-md border border-white/30 text-white font-bold text-xs sm:text-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              title="Videoyu Şablon İçinde Canlı Oynat"
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#34C759] flex items-center justify-center text-white text-[10px] shadow-md group-hover:scale-110 transition-transform pl-0.5">
                <Play className="w-3.5 h-3.5 fill-current text-white" />
              </span>
              <span className="tracking-wide font-bold">Videoyu Oynat</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
