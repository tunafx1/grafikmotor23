import express from 'express';
import cors from 'cors';
import { extractVideoId, streamMedia } from './media-stream.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({status:'ok', service:'yt-dlp-downloader'}));
app.get('/download', (req, res) => {
  const id = extractVideoId(req.query.url);
  if (!id) return res.status(400).json({error:'Geçerli bir YouTube bağlantısı girin.'});
  const format = req.query.format === 'mp3' || req.query.format === 'audio' ? 'mp3' : 'mp4';
  streamMedia(res, id, format, req.query.title);
});
app.listen(process.env.PORT || 4000);
