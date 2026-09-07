import test from 'node:test';
import assert from 'node:assert/strict';
import { isMediaVideo, extractVideoSnapshot } from '../src/utils/mediaUtils';
import { storage } from '../src/lib/storage';
import { renderTemplateToCanvas } from '../src/canvasRenderer';
import type { DesignTemplate } from '../src/types';

test('blob URLs are not assumed to be videos; MIME type identifies files', () => {
  assert.equal(isMediaVideo('blob:http://localhost/photo'), false);
  assert.equal(isMediaVideo(new File([''], 'photo.png', {type: 'image/png'})), false);
  assert.equal(isMediaVideo(new File([''], 'clip', {type: 'video/mp4'})), true);
  assert.equal(isMediaVideo('https://example.test/clip.webm?v=2'), true);
});

test('storage quota failure is reported and leaves previous data intact', () => {
  const events: string[] = [];
  const oldWindow = globalThis.window;
  Object.assign(globalThis, {window: {localStorage: {
    getItem: () => 'previous project',
    setItem: () => { throw new Error('QuotaExceededError'); },
  }, dispatchEvent: (event: Event) => events.push(event.type)}});
  try {
    assert.equal(storage.setItem('project', 'next project'), false);
    assert.equal(storage.getItem('project'), 'previous project');
    assert.deepEqual(events, ['workspace-storage-error']);
  } finally { Object.assign(globalThis, {window: oldWindow}); }
});

test('late image loads cannot overwrite newer canvas renders; export scale is preserved', async () => {
  const oldDocument = globalThis.document;
  const oldImage = globalThis.Image;
  const pending = new Map<string, any>();
  class FakeCanvas {
    width = 0; height = 0; painted = '';
    context = new Proxy({} as any, {get: (_, key) => key === 'drawImage'
      ? (source: any) => {this.painted = source.painted || source.src;}
      : () => {}, set: () => true});
    getContext() {return this.context;}
  }
  class FakeImage {
    width = 100; height = 100; onload?: () => void; _src = '';
    set src(value: string) { this._src = value; pending.set(value, this); }
    get src() { return this._src; }
  }
  Object.assign(globalThis, {document: {createElement: () => new FakeCanvas()}, Image: FakeImage});
  const template: DesignTemplate = {id: 'test', name: 'test', width: 100, height: 80, backgroundColor: '#fff', palette: {primary:'#000', accent:'#000', text:'#000', bg:'#fff'}, regions: [], fixedElements: []};
  try {
    const target = new FakeCanvas();
    const old = renderTemplateToCanvas(target as any, {...template, backgroundImageUrl:'old-image'}, {}, {});
    const next = renderTemplateToCanvas(target as any, {...template, backgroundImageUrl:'new-image'}, {}, {}, {scale:2});
    pending.get('new-image').onload();
    await next;
    pending.get('old-image').onload();
    await old;
    assert.equal(target.painted, 'new-image');
    assert.equal(target.width, 200);
    assert.equal(target.height, 160);
  } finally { Object.assign(globalThis, {document: oldDocument, Image: oldImage}); }
});

test('video snapshot retains duration after cleanup resets the source', async () => {
  const oldDocument = globalThis.document;
  const video: any = {
    duration: 12, videoWidth: 1920, videoHeight: 1080,
    pause() {}, removeAttribute() {}, load() {this.duration = NaN;},
  };
  Object.defineProperty(video, 'currentTime', {set() {queueMicrotask(() => video.onseeked?.());}});
  Object.assign(globalThis, {document: {createElement: (type: string) => type === 'video' ? video : {
    getContext: () => ({drawImage() {}}), toDataURL: () => 'data:image/jpeg;base64,test',
  }}});
  try {
    const result = extractVideoSnapshot('https://example.test/video.mp4');
    video.onloadedmetadata();
    const snapshot = await result;
    assert.equal(snapshot.duration, 12);
    assert.equal(snapshot.width, 1000);
    assert.equal(snapshot.height, 563);
    assert.equal(video.onseeked, null);
  } finally { Object.assign(globalThis, {document: oldDocument}); }
});

test('persisted videos hydrate only matching media and preserve untouched references', async () => {
  const {replaceVideoUrls, videoFileExtension} = await import('../src/lib/mediaStore');
  const original = {first: {mediaId:'video-a', videoUrl:'blob:expired'}, second: {url:'photo.jpg'}};
  const updated = replaceVideoUrls(original, new Map([['video-a', 'blob:restored']]));
  assert.equal(updated.first.videoUrl, 'blob:restored');
  assert.equal(original.first.videoUrl, 'blob:expired');
  assert.equal(updated.second, original.second);
  assert.equal(replaceVideoUrls(updated, new Map([['video-a','blob:restored']])), updated);
  assert.equal(videoFileExtension(new Blob([], {type:'video/webm;codecs=vp9'})), 'webm');
  assert.equal(videoFileExtension(new Blob([], {type:'video/mp4'})), 'mp4');
});

test('exports use page-specific layers and background, including intentionally empty layers', async () => {
  const {resolveExportTemplate, safeFileName} = await import('../src/utils/exportAssets');
  const template = {id:'test',name:'test',regions:[{id:'base'}],fixedElements:[{id:'logo'}],backgroundImageUrl:'base.png',pages:[{id:'page-2',regions:[{id:'layout'}],fixedElements:[],backgroundImageUrl:'layout.png'}]} as any;
  const resolved = resolveExportTemplate(template, {templatePageId:'page-2',regions:[],backgroundImageUrl:'custom.png'});
  assert.deepEqual(resolved.regions, []);
  assert.deepEqual(resolved.fixedElements, []);
  assert.equal(resolved.backgroundImageUrl, 'custom.png');
  assert.equal(safeFileName('  My / design: 2  '), 'My_design_2');
  assert.equal(safeFileName('///'), 'tasarim');
});

test('YouTube parsing rejects unrelated hosts and preserves watch, short, and share IDs', async () => {
  const {extractVideoId, transcodeArguments} = await import('../downloader-service/media-stream.js');
  assert.equal(extractVideoId('https://www.youtube.com/watch?feature=share&v=abcdefghijk'), 'abcdefghijk');
  assert.equal(extractVideoId('https://youtu.be/abcdefghijk?t=3'), 'abcdefghijk');
  assert.equal(extractVideoId('https://youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
  assert.equal(extractVideoId('https://example.test/watch?v=abcdefghijk'), null);
  assert.equal(extractVideoId({url:'invalid'}), null);
  assert.ok(transcodeArguments('mp3').includes('libmp3lame'));
  assert.ok(transcodeArguments('mp4').includes('libx264'));
});

test('locked layer passes through to topmost unlocked layer on canvas hit test', async () => {
  const { findTopmostUnlockedElement } = await import('../src/utils/canvasHitTest');

  const template = {
    regions: [
      {
        id: 'bg-image-locked',
        name: 'Arka Plan',
        type: 'image' as const,
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        zIndex: 0,
        locked: true,
      },
      {
        id: 'text-layer-unlocked',
        name: 'Başlık',
        type: 'text' as const,
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        zIndex: 5,
        locked: false,
      },
      {
        id: 'overlay-banner-locked',
        name: 'Kilitli Katman Üst',
        type: 'image' as const,
        x: 150,
        y: 150,
        width: 200,
        height: 100,
        zIndex: 10,
        locked: true,
      },
    ],
    fixedElements: [],
  };

  // Case 1: Clicking at (200, 180) has:
  // - overlay-banner-locked (zIndex 10, locked) -> MUST SKIP!
  // - text-layer-unlocked (zIndex 5, unlocked) -> MUST SELECT!
  // - bg-image-locked (zIndex 0, locked)
  const hit1 = findTopmostUnlockedElement(template as any, 200, 180, []);
  assert.ok(hit1);
  assert.equal(hit1.id, 'text-layer-unlocked');
  assert.equal(hit1.type, 'region');

  // Case 2: Clicking at (50, 50) where ONLY bg-image-locked is present:
  // bg-image-locked is locked -> MUST RETURN NULL!
  const hit2 = findTopmostUnlockedElement(template as any, 50, 50, []);
  assert.equal(hit2, null);

  // Case 3: When text-layer-unlocked is also locked:
  // Both overlay and text are locked at (200, 180) -> MUST RETURN NULL!
  const templateAllLocked = {
    ...template,
    regions: template.regions.map(r => ({ ...r, locked: true })),
  };
  const hit3 = findTopmostUnlockedElement(templateAllLocked as any, 200, 180, []);
  assert.equal(hit3, null);
});

