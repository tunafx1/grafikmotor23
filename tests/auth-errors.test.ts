import test from 'node:test';
import assert from 'node:assert/strict';
import {describeGoogleLoginError} from '../src/lib/authErrors';

test('unauthorized deployment domain identifies Firebase allowlist rather than blocked popup', () => {
  const notice=describeGoogleLoginError({code:'auth/unauthorized-domain'},'grafik-motoru-studio.vercel.app');
  assert.match(notice!.message,/grafik-motoru-studio\.vercel\.app/);
  assert.match(notice!.message,/Authorized domains/);
  assert.notEqual(notice!.title,describeGoogleLoginError({code:'auth/popup-blocked'},'example.com')!.title);
});
test('canceling Google login does not show an error', () => {
  assert.equal(describeGoogleLoginError({code:'auth/popup-closed-by-user'},'example.com'),null);
  assert.equal(describeGoogleLoginError({code:'auth/cancelled-popup-request'},'example.com'),null);
});
test('provider, configuration and network failures have distinct messages without exposing raw details', () => {
  const messages=['auth/operation-not-allowed','auth/invalid-api-key','auth/network-request-failed'].map(code=>describeGoogleLoginError({code,message:'sensitive backend details'},'example.com')!.message);
  assert.equal(new Set(messages).size,3);
  messages.forEach(message=>assert.ok(!message.includes('sensitive')));
  assert.match(describeGoogleLoginError(new Error('internal details'),'example.com')!.message,/unknown-error/);
});
