import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthErrorMessage } from '../src/lib/firebase';

test('returns a generic message when no error is given', () => {
  assert.equal(getAuthErrorMessage(null), 'Bilinmeyen bir hata oluştu.');
  assert.equal(getAuthErrorMessage(undefined), 'Bilinmeyen bir hata oluştu.');
});

test('maps known Firebase Auth error codes to Turkish messages', () => {
  assert.match(getAuthErrorMessage({ code: 'auth/user-not-found' }), /hesap bulunamadı/);
  assert.match(getAuthErrorMessage({ code: 'auth/wrong-password' }), /şifre hatalı/);
  assert.match(getAuthErrorMessage({ code: 'auth/too-many-requests' }), /Çok fazla başarısız deneme/);
  assert.match(getAuthErrorMessage({ code: 'auth/popup-closed-by-user' }), /kapatıldı/);
});

test('falls back to the error message for unrecognized codes', () => {
  assert.equal(getAuthErrorMessage({ code: 'auth/some-unmapped-code', message: 'raw detail' }), 'raw detail');
});

test('falls back to a generic message when neither code nor message is present', () => {
  assert.equal(getAuthErrorMessage({}), 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
});
