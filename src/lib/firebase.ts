import { storage } from './storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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

// Initialize Firestore with multi-tab persistence
const targetDbId = isValidConfig 
  ? ((firebaseConfig as any).firestoreDatabaseId || 'ai-studio-grafikotomasyonm-5229ff0f-8304-405c-af2a-76613e388830') 
  : undefined;

console.log('Initializing Firestore with Database ID:', targetDbId || '(default)');

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true,
}, targetDbId);

// Check if quota was exceeded in a prior session to immediately go offline and avoid background write retry storms
if (isValidConfig && typeof window !== 'undefined' && storage.getItem('firestore_quota_exceeded') === 'true') {
  console.log('Detected prior Firestore quota exhaustion. Automatically initializing in offline mode.');
  disableNetwork(db).catch(err => {
    console.error('Failed to disable Firestore network during startup:', err);
  });
}

// Initialize Authentication
const auth = getAuth(app);

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
    console.warn('Firebase Anonymous Auth failed or is disabled. Operating in local offline mode:', err);
    // Gracefully switch to offline mode to avoid permission errors
    await disableFirestoreNetwork();
    return null;
  }
}


export async function loginWithGoogle(): Promise<any> {
  if (!isValidConfig) return null;
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

export async function logoutUser(): Promise<void> {
  if (!isValidConfig) return;
  await signOut(auth);
}

export async function disableFirestoreNetwork(): Promise<void> {
  if (!isValidConfig) return;
  try {
    console.log('Disabling Firestore Network to avoid background retry loops and quota errors.');
    await disableNetwork(db);
  } catch (err) {
    console.error('Failed to disable Firestore network:', err);
  }
}

export async function enableFirestoreNetwork(): Promise<void> {
  if (!isValidConfig) return;
  try {
    console.log('Enabling Firestore Network.');
    await enableNetwork(db);
  } catch (err) {
    console.error('Failed to enable Firestore network:', err);
  }
}

export { app, db, auth, isValidConfig, analytics };
