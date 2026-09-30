import test from 'node:test';
import assert from 'node:assert/strict';
import { isMediaVideo } from '../src/utils/mediaUtils';

test('detects video by File MIME type', () => {
  const file = { type: 'video/mp4', name: 'clip.mp4' } as File;
  assert.equal(isMediaVideo(file), true);
});

test('detects video by File extension when MIME type is missing', () => {
  const file = { type: '', name: 'clip.mov' } as File;
  assert.equal(isMediaVideo(file), true);
});

test('rejects image File', () => {
  const file = { type: 'image/png', name: 'photo.png' } as File;
  assert.equal(isMediaVideo(file), false);
});

test('detects video by URL extension, ignoring query string', () => {
  assert.equal(isMediaVideo('https://cdn.example.com/video.webm?token=abc'), true);
});

test('detects video by data: URL prefix', () => {
  assert.equal(isMediaVideo('data:video/mp4;base64,AAAA'), true);
});

test('rejects a plain image URL', () => {
  assert.equal(isMediaVideo('https://cdn.example.com/photo.jpg'), false);
});

test('returns false for empty input', () => {
  assert.equal(isMediaVideo(''), false);
});
