import {
  EmailAuthProvider, GoogleAuthProvider, linkWithCredential,
  reauthenticateWithPopup, updatePassword, type User,
} from 'firebase/auth';

const passwordOperations = { reauthenticateWithPopup, linkWithCredential, updatePassword };

/** Add a login method to the existing UID; never create a second account. */
export async function saveAccountPassword(
  user: User,
  password: string,
  operations = passwordOperations,
): Promise<{ isLinked: boolean }> {
  if (user.isAnonymous || !user.email) {
    throw Object.assign(new Error('Şifre oluşturmak için hesabınıza giriş yapın.'), { code: 'auth/no-current-user' });
  }

  // Open directly from the submit gesture, before any network await. This also
  // refreshes old sessions without signing out and losing the current workspace.
  if (user.providerData.some(provider => provider.providerId === 'google.com')) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: user.email, prompt: 'select_account' });
    await operations.reauthenticateWithPopup(user, provider);
  }

  await user.reload();
  const isLinked = !user.providerData.some(provider => provider.providerId === 'password');
  if (isLinked) {
    await operations.linkWithCredential(user, EmailAuthProvider.credential(user.email!, password));
  } else {
    await operations.updatePassword(user, password);
  }
  return { isLinked };
}
