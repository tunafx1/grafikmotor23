import { spawn } from 'node:child_process';

export function extractVideoId(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)) {
      id = url.searchParams.get('v');
      if (!id && /^\/(shorts|embed|v)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return typeof id === 'string' && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function transcodeArguments(format) {
  const base = ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0'];
  return format === 'mp3'
    ? [...base, '-vn', '-c:a', 'libmp3lame', '-b:a', '320k', '-f', 'mp3', 'pipe:1']
    : [...base, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'];
}
/** Always transcode: a MIME header and filename do not convert source audio/video. */
export function streamMedia(res, videoId, format, title) {
  const safeTitle = (typeof title === 'string' ? title : 'youtube-media').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().slice(0, 100) || 'youtube-media';
  res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeTitle + '.' + format)}`);
  const source = spawn(process.env.YT_DLP_PATH || 'python3', [
    ...(process.env.YT_DLP_PATH ? [] : ['-m', 'yt_dlp']), '--no-playlist', '--no-warnings',
    '-f', format === 'mp3' ? 'ba/b' : 'b', '-o', '-', `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  const encoder = spawn(process.env.FFMPEG_PATH || 'ffmpeg', transcodeArguments(format));
  let failed = false;
  let sourceDone = false;
  let encoderDone = false;
  const complete = () => { if (sourceDone && encoderDone && !failed) res.end(); };
  const stop = () => { source.kill(); encoder.kill(); };
  const fail = () => {
    if (failed || res.writableEnded || res.destroyed) return;
    failed = true;
    stop();
    if (!res.headersSent) {
      res.removeHeader('Content-Disposition');
      res.status(503).json({error:'Medya indirilemedi. Sunucuda yt-dlp ve ffmpeg kurulu olmalı; bağlantı erişilebilir olmalı.'});
    } else res.destroy();
  };
  source.on('error', fail);
  encoder.on('error', fail);
  source.on('close', code => { if (code !== 0) fail(); else {sourceDone = true; complete();} });
  encoder.on('close', code => { if (code !== 0) fail(); else {encoderDone = true; complete();} });
  source.stderr.on('data', () => {});
  encoder.stderr.on('data', () => {});
  encoder.stdin.on('error', fail);
  source.stdout.pipe(encoder.stdin);
  encoder.stdout.pipe(res, {end:false});
  res.on('close', stop);
}
