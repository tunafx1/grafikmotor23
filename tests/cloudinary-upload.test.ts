import test from 'node:test';
import assert from 'node:assert/strict';
import {createSignedMediaUpload, readCloudinaryConfig, signCloudinaryParams} from '../api/cloudinary-upload';

test('reads Cloudinary credentials without exposing the secret in signed response', () => {
  const config = readCloudinaryConfig({CLOUDINARY_URL:'cloudinary://123:secret-value@demo'} as NodeJS.ProcessEnv);
  assert.deepEqual(config, {cloudName:'demo', apiKey:'123', apiSecret:'secret-value'});
  const signed = createSignedMediaUpload(config!, {
    userId:'firebase-user_1', kind:'image', contentHash:'a'.repeat(64), timestamp:123456,
  });
  assert.equal(signed.uploadUrl, 'https://api.cloudinary.com/v1_1/demo/image/upload');
  assert.equal('apiSecret' in signed, false);
  assert.equal(signed.folder, 'grafik-motoru/firebase-user_1');
  assert.equal(signed.publicId, `image-${'a'.repeat(64)}`);
});

test('Cloudinary signature is stable regardless of parameter order', () => {
  const first = signCloudinaryParams({timestamp:123, folder:'a', overwrite:'true'}, 'secret');
  const second = signCloudinaryParams({overwrite:'true', folder:'a', timestamp:123}, 'secret');
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{40}$/);
});

test('rejects unsafe user IDs and invalid hashes', () => {
  const config = {cloudName:'demo', apiKey:'123', apiSecret:'secret'};
  assert.throws(() => createSignedMediaUpload(config, {userId:'../bad', kind:'image', contentHash:'a'.repeat(64)}));
  assert.throws(() => createSignedMediaUpload(config, {userId:'safe', kind:'video', contentHash:'bad'}));
});
