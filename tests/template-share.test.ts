import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShareCode,
  normalizeShareCode,
  SHARE_QUERY_PARAM,
  compressTemplateJson,
  decompressTemplateJson,
  buildShareLink
} from '../src/lib/templatesDb';

test('compressTemplateJson and decompressTemplateJson roundtrip data correctly', async () => {
  const original = JSON.stringify({
    name: 'Test Template'.repeat(50),
    width: 1080,
    height: 1080,
    regions: [{ id: '1', type: 'text', name: 'Title', content: 'Long description '.repeat(20) }]
  });
  const compressed = await compressTemplateJson(original);
  assert.ok(compressed.length > 0);
  assert.ok(compressed.length < original.length);
  const decompressed = await decompressTemplateJson(compressed);
  assert.equal(decompressed, original);

  // Link generation includes compressed data
  const link = buildShareLink('ABCD2345', compressed);
  assert.ok(link.includes('sablon=ABCD2345'));
  assert.ok(link.includes('&d=' + compressed));
});

test('formatShareCode splits 8-character codes into 4-4 blocks', () => {
  assert.equal(formatShareCode('ABCD2345'), 'ABCD-2345');
  assert.equal(formatShareCode('short'), 'short');
});

test('normalizeShareCode parses raw codes, hyphenated codes, and full URLs', () => {
  // Raw code
  assert.equal(normalizeShareCode('ABCD2345'), 'ABCD2345');
  // Hyphenated
  assert.equal(normalizeShareCode('abcd-2345'), 'ABCD2345');
  // With whitespace
  assert.equal(normalizeShareCode('  ABCD 2345  '), 'ABCD2345');
  // Full share link
  assert.equal(normalizeShareCode(`https://grafik-motoru.app/?${SHARE_QUERY_PARAM}=ABCD2345`), 'ABCD2345');
  assert.equal(normalizeShareCode(`http://localhost:5173/?${SHARE_QUERY_PARAM}=ABCD-2345`), 'ABCD2345');

  // Invalid inputs (wrong length, invalid chars like 0/O/1/I)
  assert.equal(normalizeShareCode(''), null);
  assert.equal(normalizeShareCode('TOO-SHORT'), null);
  assert.equal(normalizeShareCode('ABC01234'), null); // Contains 0 and 1 which are excluded from alphabet
  assert.equal(normalizeShareCode('INVALID-LONG-CODE'), null);
});

test('server API saves and retrieves shared template', async () => {
  const { default: app } = await import('../api/index');
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const testCode = 'TEST9999';
    const samplePayload = {
      code: testCode,
      ownerId: 'test-user-123',
      ownerName: 'Test Designer',
      name: 'Sample Template',
      templateJson: JSON.stringify({
        width: 1080,
        height: 1080,
        regions: [],
        name: 'Sample Template'
      }),
      version: 1,
    };

    // POST /api/share-template
    const postRes = await fetch(`${baseUrl}/api/share-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePayload),
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.equal(postData.success, true);
    assert.equal(postData.code, testCode);

    // GET /api/shared-template/:code
    const getRes = await fetch(`${baseUrl}/api/shared-template/${testCode}`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.code, testCode);
    assert.equal(getData.name, 'Sample Template');
    assert.equal(getData.ownerName, 'Test Designer');
    assert.equal(JSON.parse(getData.templateJson).width, 1080);

    // GET with hyphenated code should also work
    const getHyphenRes = await fetch(`${baseUrl}/api/shared-template/TEST-9999`);
    assert.equal(getHyphenRes.status, 200);
    const getHyphenData = await getHyphenRes.json();
    assert.equal(getHyphenData.code, testCode);

    // Non-existent code returns 404
    const notFoundRes = await fetch(`${baseUrl}/api/shared-template/ZZZZ9999`);
    assert.equal(notFoundRes.status, 404);
  } finally {
    server.close();
  }
});
