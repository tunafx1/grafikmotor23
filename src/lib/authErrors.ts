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
