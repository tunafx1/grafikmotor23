/** Keep configuration, network and user cancellation errors distinct from blocked popups. */
export function describeGoogleLoginError(error: unknown, hostname: string): {title:string;message:string} | null {
  const code = typeof (error as any)?.code === 'string' ? (error as any).code : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/unauthorized-domain':
      return {title:'Bu site için Google girişi etkin değil',message:`${hostname} adresi Firebase Authentication → Settings → Authorized domains listesine eklenmeli. Bu bir popup engeli değil. (${code})`};
    case 'auth/popup-blocked':
      return {title:'Giriş penceresi engellendi',message:`Tarayıcı ayarlarından ${hostname} için açılır pencerelere izin verip tekrar deneyin. Uygulama içi tarayıcı kullanıyorsanız siteyi Chrome veya Safari’de açın. (${code})`};
    case 'auth/operation-not-allowed':
      return {title:'Google sağlayıcısı etkin değil',message:`Firebase Authentication → Sign-in method bölümünde Google ile giriş etkinleştirilmeli. (${code})`};
    case 'auth/network-request-failed':
      return {title:'Google girişine bağlanılamadı',message:`İnternet bağlantısını ve tarayıcının gizlilik veya reklam engelleme ayarlarını kontrol edip tekrar deneyin. (${code})`};
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
    case 'auth/configuration-not-found':
      return {title:'Firebase giriş ayarı eksik',message:`Firebase proje ayarları ve web API anahtarının alan adı kısıtlamaları kontrol edilmeli. (${code})`};
    case 'auth/account-exists-with-different-credential':
      return {title:'Bu hesap başka bir giriş yöntemi kullanıyor',message:'Bu e-posta için daha önce kullandığınız yöntemle giriş yapın.'};
    default:
      return {title:'Google girişi tamamlanamadı',message:`Tekrar deneyin. Sorun devam ederse bu hata kodunu paylaşın: ${code || 'unknown-error'}.`};
  }
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
      if (error.message && typeof error.message === 'string') {
        return error.message;
      }
      return 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
  }
}
