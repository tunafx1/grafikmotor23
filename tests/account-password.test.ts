import test from 'node:test';
import assert from 'node:assert/strict';
import type { User } from 'firebase/auth';
import { saveAccountPassword } from '../src/lib/accountPassword';

function fixture(providers = ['google.com']) {
  const calls: string[] = [];
  const user = {
    uid: 'original-google-uid', email: 'member@example.com', isAnonymous: false,
    providerData: providers.map(providerId => ({ providerId })),
    reload: async () => { calls.push('reload'); },
  } as unknown as User;
  const operations = {
    reauthenticateWithPopup: async (target: User) => {
      assert.equal(target, user); calls.push('reauth'); return { user };
    },
    linkWithCredential: async (target: User, credential: any) => {
      assert.equal(target.uid, 'original-google-uid');
      assert.equal(credential.providerId, 'password');
      calls.push('link'); return { user };
    },
    updatePassword: async (target: User, password: string) => {
      assert.equal(target, user); assert.equal(password, 'NewPassword123!'); calls.push('update');
    },
  } as unknown as NonNullable<Parameters<typeof saveAccountPassword>[2]>;
  return { user, calls, operations };
}

test('Google account reauthenticates and adds password to the same UID', async () => {
  const f = fixture();
  assert.deepEqual(await saveAccountPassword(f.user, 'NewPassword123!', f.operations), { isLinked: true });
  assert.deepEqual(f.calls, ['reauth', 'reload', 'link']);
});

test('already linked Google account updates password without linking again', async () => {
  const f = fixture(['google.com', 'password']);
  assert.deepEqual(await saveAccountPassword(f.user, 'NewPassword123!', f.operations), { isLinked: false });
  assert.deepEqual(f.calls, ['reauth', 'reload', 'update']);
});

test('password-only account does not open Google', async () => {
  const f = fixture(['password']);
  await saveAccountPassword(f.user, 'NewPassword123!', f.operations);
  assert.deepEqual(f.calls, ['reload', 'update']);
});

test('refresh discovers password added in another tab before choosing update', async () => {
  const f = fixture();
  f.user.reload = async () => { f.user.providerData.push({ providerId: 'password' } as any); };
  assert.deepEqual(await saveAccountPassword(f.user, 'NewPassword123!', f.operations), { isLinked: false });
  assert.deepEqual(f.calls, ['reauth', 'update']);
});

for (const code of ['auth/user-mismatch', 'auth/popup-closed-by-user', 'auth/popup-blocked']) {
  test(`${code} stops before any password change`, async () => {
    const f = fixture();
    f.operations.reauthenticateWithPopup = async () => { throw { code }; };
    await assert.rejects(saveAccountPassword(f.user, 'NewPassword123!', f.operations), { code });
    assert.deepEqual(f.calls, []);
  });
}

test('disabled password provider is surfaced instead of reporting success', async () => {
  const f = fixture();
  f.operations.linkWithCredential = async () => { throw { code: 'auth/operation-not-allowed' }; };
  await assert.rejects(saveAccountPassword(f.user, 'NewPassword123!', f.operations), { code: 'auth/operation-not-allowed' });
});

test('anonymous session cannot create a password account', async () => {
  const f = fixture([]);
  Object.assign(f.user, { isAnonymous: true });
  await assert.rejects(saveAccountPassword(f.user, 'NewPassword123!', f.operations), { code: 'auth/no-current-user' });
  assert.deepEqual(f.calls, []);
});
