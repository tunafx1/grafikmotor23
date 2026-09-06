import { storage } from './storage';
import { saveAccountPassword } from './accountPassword';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, disableNetwork, enableNetwork } from 'firebase/firestore';
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

/**
 * Human-readable Turkish error messages for Firebase Auth errors.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Bilinmeyen bir hata oluştu.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Lütfen geçerli bir e-posta adresi girin.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmıştır. Lütfen destek ile iletişime geçin.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresine ait bir hesap bulunamadı.';
    case 'auth/wrong-password':
      return 'Girdiğiniz şifre hatalı. Lütfen tekrar deneyin.';
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresiyle zaten kayıtlı bir hesap var. Giriş yapabilirsiniz.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
    case 'auth/popup-closed-by-user':
      return 'Giriş penceresi tamamlanmadan kapatıldı.';
    case 'auth/cancelled-popup-request':
      return 'Önceki oturum açma işlemi iptal edildi.';
    case 'auth/network-request-failed':
      return 'Ağ bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
    case 'auth/operation-not-allowed':
      return "Firebase konsolunda 'E-posta/Şifre' (Email/Password) ile kayıt seçeneği henüz etkinleştirilmemiş. Firebase Console > Authentication > Sign-in method sekmesinden 'Email/Password' sağlayıcısını etkinleştirmeniz gerekmektedir.";
    case 'auth/unverified-email':
      return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki linke tıklayın.';
    case 'auth/requires-recent-login':
      return 'Güvenlik nedeniyle şifre belirlemeden önce lütfen oturumunuzu kapatıp tekrar giriş yapın.';
    case 'auth/unauthorized-domain':
      return `${typeof window !== 'undefined' ? window.location.hostname : 'Bu site'} adresi Firebase Google girişine izin verilen alan adları arasında değil. Firebase Console → Authentication → Settings → Authorized domains bölümüne bu alan adını ekleyin.`;
    case 'auth/popup-blocked':
      return 'Google doğrulama penceresi engellendi. Bu site için açılır pencerelere izin verin veya e-posta bağlantısını kullanın.';
    case 'auth/user-mismatch':
      return 'Farklı bir Google hesabı seçildi. Profilinizdeki e-posta adresine ait Google hesabını seçin.';
    case 'auth/password-does-not-meet-requirements':
      return 'Şifreniz güvenlik koşullarını karşılamıyor. Daha uzun, büyük/küçük harf, rakam ve özel karakter içeren bir şifre deneyin.';
    case 'auth/credential-already-in-use':
      return 'Bu kimlik bilgisi başka bir hesap tarafından kullanılıyor.';
    default:
      return error.message || 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
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
