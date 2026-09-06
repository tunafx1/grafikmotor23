import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
async function post(path, body) {
  return fetch(base + path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
}
const home = await fetch(base, {signal:AbortSignal.timeout(5000)});
assert.equal(home.status, 200);
assert.match(await home.text(), /<div id="root"><\/div>/);
for (const path of ['/api/yt-download','/api/yt-info']) {
  const result = await post(path, {url:'https://example.test/watch?v=abcdefghijk'});
  assert.equal(result.status, 400, path);
}
const invalidStream = await fetch(base + '/api/yt-stream?url=invalid', {signal:AbortSignal.timeout(5000)});
assert.equal(invalidStream.status, 400);
const download = await post('/api/yt-download', {url:'https://youtu.be/abcdefghijk',format:'mp3',title:'test file'});
assert.equal(download.status, 200);
const data = await download.json();
const target = new URL(data.downloadUrl, base);
assert.equal(target.searchParams.get('format'), 'mp3');
assert.equal(target.searchParams.get('title'), 'test file');
assert.equal(target.searchParams.get('url'), 'https://www.youtube.com/watch?v=abcdefghijk');
const invalidText = await post('/api/generate-text', {fields:[]});
assert.equal(invalidText.status, 400);
if (process.env.TEST_EXPECT_NO_AI_KEY === '1') {
  const missingKey = await post('/api/generate-text', {
    systemPrompt:'Kısa Türkçe başlık üret.',templateName:'Test',brief:'',context:[],
    fields:[{id:'title',name:'Başlık',role:'title',text:'Korunacak metin'}],
  });
  assert.equal(missingKey.status, 503);
  const error = await missingKey.json();
  assert.equal(error.reason, 'missing_api_key');
  assert.equal(error.texts, undefined);
}
// No media stream or external AI call is requested by this smoke test.
console.log('API smoke: homepage, invalid URLs, download route, and AI validation passed.');
