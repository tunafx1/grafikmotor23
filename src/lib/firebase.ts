import { storage } from './storage';
import { saveAccountPassword } from './accountPassword';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Safely load config from root. Vite allows importing JSON natively.
import firebaseConfig from '../../firebase-applet-config.json';

const isValidConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isValidConfig) {
  console.warn(
    'Firebase config is missing or invalid. Storing and syncing cloud templates will be disabled until Firebase is fully provisioned.'
  );
}

// Initialize Firebase App
const app = !getApps().length 
  ? initializeApp(isValidConfig ? firebaseConfig : {
      apiKey: "MOCK_KEY",
      authDomain: "mock.firebaseapp.com",
      projectId: "mock-project-id",
      storageBucket: "mock.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:12345"
    })
  : getApp();

// Firebase browser SDKs create persistent browser resources. Keep this module
// import-safe for Node-based tooling and unit tests.
const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

// Initialize Firestore with multi-tab persistence
const targetDbId = isValidConfig 
  ? ((firebaseConfig as any).firestoreDatabaseId || 'ai-studio-grafikotomasyonm-5229ff0f-8304-405c-af2a-76613e388830') 
  : undefined;

let db: ReturnType<typeof getFirestore>;
if (!isBrowser) {
  // Cloud data access is a browser-only feature of this client bundle. The
  // placeholder is never used by server/test code, but retains the exported
  // type for browser consumers.
  db = undefined as unknown as ReturnType<typeof getFirestore>;
} else try {
  db = isBrowser
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
      }, targetDbId)
    : getFirestore(app, targetDbId);
} catch (error: any) {
  // Vite can reevaluate this module during HMR; reuse the configured instance.
  if (error?.code !== 'failed-precondition') throw error;
  db = getFirestore(app, targetDbId);
}

const mediaStorage = isBrowser
  ? getStorage(app)
  : undefined as unknown as ReturnType<typeof getStorage>;
if (isBrowser) {
  mediaStorage.maxOperationRetryTime = 15_000;
  mediaStorage.maxUploadRetryTime = 20_000;
}

// Ensure Firestore network is ready and clear any stale offline quota locks
if (isValidConfig && typeof window !== 'undefined') {
  try {
    storage.removeItem('firestore_quota_exceeded');
  } catch { /* noop */ }
}

// Initialize Authentication
const auth = isBrowser
  ? getAuth(app)
  : undefined as unknown as ReturnType<typeof getAuth>;

// Safe Analytics Initialization
let analytics: Analytics | null = null;
if (isValidConfig && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn('Firebase Analytics could not be initialized:', err);
  }
}

// Helper function to handle anonymous sign in with safe fallback
export async function ensureUserSignIn(): Promise<{ uid: string; isAnonymous?: boolean } | null> {
  if (!isValidConfig) return null;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return currentUser;
    }
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (err) {
    console.warn('Firebase Anonymous Auth failed or is disabled:', err);
    return null;
  }
}

export async function loginWithGoogle(): Promise<any> {
  if (!isValidConfig) throw Object.assign(new Error('Firebase configuration missing'), {code:'auth/configuration-not-found'});
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
}

/**
 * Register a new user with email and password, set display name,
 * and send verification email.
 */
export async function registerWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  if (!isValidConfig) throw Object.assign(new Error('Firebase configuration missing'), {code:'auth/configuration-not-found'});
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  if (displayName && displayName.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not update display name:', e);
    }
  }

  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn('Could not send verification email automatically:', e);
  }

  return user;
}

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!isValidConfig) throw Object.assign(new Error('Firebase configuration missing'), {code:'auth/configuration-not-found'});
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
}

/**
 * Resend verification email to the user.
 */
export async function resendVerificationEmail(targetUser?: User | null): Promise<void> {
  const u = targetUser || auth.currentUser;
  if (!u) {
    throw Object.assign(new Error('Aktif kullanıcı bulunamadı.'), { code: 'auth/no-current-user' });
  }
  await sendEmailVerification(u);
}

/**
 * Reload current user from server to refresh `emailVerified` status.
 */
export async function reloadCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

/**
 * Send password reset email.
 */
export async function sendResetPassword(email: string): Promise<void> {
  if (!isValidConfig) throw Object.assign(new Error('Firebase configuration missing'), {code:'auth/configuration-not-found'});
  auth.languageCode = 'tr';
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Link a password to the current user (e.g. Google user setting a password)
 * or update existing password.
 */
export async function setOrUpdateAccountPassword(newPassword: string): Promise<{ isLinked: boolean }> {
  if (!isValidConfig) throw Object.assign(new Error('Firebase configuration missing'), { code: 'auth/configuration-not-found' });
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw Object.assign(new Error('Aktif bir kullanıcı oturumu bulunamadı.'), { code: 'auth/no-current-user' });
  }

  return saveAccountPassword(currentUser, newPassword);
}

export { getAuthErrorMessage } from './authErrors';

export async function logoutUser(): Promise<void> {
  if (!isValidConfig) return;
  await signOut(auth);
}

export async function disableFirestoreNetwork(): Promise<void> {
  if (!isValidConfig) return;
  try {
    await disableNetwork(db);
  } catch (err) {
    console.error('Failed to disable Firestore network:', err);
  }
}

export async function enableFirestoreNetwork(): Promise<void> {
  if (!isValidConfig) return;
  try {
    await enableNetwork(db);
  } catch (err) {
    console.error('Failed to enable Firestore network:', err);
  }
}

export { app, db, auth, isValidConfig, analytics, mediaStorage };
