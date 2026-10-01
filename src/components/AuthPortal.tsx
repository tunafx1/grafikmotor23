import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  resendVerificationEmail, 
  reloadCurrentUser, 
  sendResetPassword,
  getAuthErrorMessage,
  auth
} from '../lib/firebase';
import './landing.css';

interface AuthPortalProps {
  onBackToLanding: () => void;
  onCompleteAuth: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export function AuthPortal({ onBackToLanding, onCompleteAuth, initialMode = 'login' }: AuthPortalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verification Screen state
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [currentUserForVerify, setCurrentUserForVerify] = useState<User | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyCheckStatus, setVerifyCheckStatus] = useState<string | null>(null);
  const [verifyCheckError, setVerifyCheckError] = useState<string | null>(null);

  // Forgot password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // General Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Auto-complete if user is already authenticated
  useEffect(() => {
    if (auth.currentUser) {
      const isVerified = auth.currentUser.emailVerified || auth.currentUser.providerData.some((p: any) => p.providerId === 'google.com');
      if (isVerified) {
        onCompleteAuth(auth.currentUser);
      }
    }
  }, [onCompleteAuth]);

  // Resend cooldown counter
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Refined Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'En az 6 karakter', color: '#94A3B8', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Zayıf', color: '#EF4444', width: '25%' };
      case 2:
        return { score: 2, label: 'Orta seviye', color: '#F59E0B', width: '50%' };
      case 3:
        return { score: 3, label: 'Güçlü', color: '#10B981', width: '75%' };
      case 4:
        return { score: 4, label: 'Mükemmel', color: '#059669', width: '100%' };
      default:
        return { score: 0, label: 'Çok zayıf', color: '#EF4444', width: '15%' };
    }
  };

  const passStrength = getPasswordStrength(regPassword);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsOperationNotAllowed(false);

    if (!loginEmail.trim()) {
      setErrorMessage('Lütfen e-posta adresinizi giriniz.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Lütfen şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmail(loginEmail.trim(), loginPassword);
      
      // Check if email is verified
      if (!user.emailVerified) {
        setCurrentUserForVerify(user);
        setVerificationEmail(user.email || loginEmail.trim());
        setVerificationPending(true);
        setVerifyCheckStatus('Giriş yapabilmek için lütfen öncelikle e-posta adresinizi onaylayınız.');
        setIsLoading(false);
        return;
      }

      setSuccessNotice('Giriş başarılı. Stüdyonuza yönlendiriliyorsunuz...');
      setTimeout(() => {
        onCompleteAuth(user);
      }, 400);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
      }
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsOperationNotAllowed(false);

    if (!regName.trim()) {
      setErrorMessage('Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Lütfen kullanım koşullarını kabul ettiğinizi onaylayınız.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerWithEmail(regEmail.trim(), regPassword, regName.trim());
      setCurrentUserForVerify(user);
      setVerificationEmail(user.email || regEmail.trim());
      setVerificationPending(true);
      setResendCooldown(45);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
      }
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Check email verification status
  const handleCheckVerification = async () => {
    setVerifyCheckError(null);
    setVerifyCheckStatus(null);
    setIsLoading(true);

    if (isSimulationMode) {
      setVerifyCheckStatus('✓ Test Modu: E-posta başarıyla doğrulandı. Portala erişiliyor...');
      setTimeout(() => {
        onCompleteAuth({
          uid: 'simulated-' + Date.now(),
          email: verificationEmail,
          displayName: regName.trim() || 'Tasarımcı',
          emailVerified: true,
          isAnonymous: false,
        } as any);
      }, 600);
      setIsLoading(false);
      return;
    }

    try {
      const updatedUser = await reloadCurrentUser();
      if (updatedUser?.emailVerified) {
        setVerifyCheckStatus('✓ E-posta adresiniz başarıyla doğrulandı. Stüdyoya giriş yapılıyor...');
        setTimeout(() => {
          onCompleteAuth(updatedUser);
        }, 700);
      } else {
        setVerifyCheckError('E-posta henüz doğrulanmamış görünüyor. Lütfen gelen kutunuzdaki bağlantıya tıkladıktan sonra tekrar deneyin (Spam klasörünü de kontrol ediniz).');
      }
    } catch (err: any) {
      console.error('Reload user error:', err);
      setVerifyCheckError('Doğrulama kontrolü sırasında bir hata oluştu: ' + getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setVerifyCheckError(null);
    setVerifyCheckStatus(null);
    setIsLoading(true);

    if (isSimulationMode) {
      setVerifyCheckStatus('Test Modu: Yeni doğrulama bağlantısı e-postanıza simüle edildi.');
      setResendCooldown(30);
      setIsLoading(false);
      return;
    }

    try {
      await resendVerificationEmail(currentUserForVerify);
      setVerifyCheckStatus('Doğrulama bağlantısı e-posta adresinize tekrar gönderildi.');
      setResendCooldown(60);
    } catch (err: any) {
      console.error('Resend email error:', err);
      setVerifyCheckError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In / Sign-Up
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setSuccessNotice('Google ile giriş başarılı. Yönlendiriliyorsunuz...');
        setTimeout(() => {
          onCompleteAuth(user);
        }, 400);
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!forgotEmail.trim()) {
      setForgotError('Lütfen kayıtlı e-posta adresinizi giriniz.');
      return;
    }

    setIsForgotLoading(true);
    try {
      await sendResetPassword(forgotEmail.trim());
      setForgotMessage('Şifre sıfırlama bağlantısı e-postanıza iletildi. Lütfen gelen kutunuzu kontrol edin.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setForgotError(getAuthErrorMessage(err));
    } finally {
      setIsForgotLoading(false);
    }
  };

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsOperationNotAllowed(false);
  };

  const formAlerts = (
    <>
      {errorMessage && <div className="gm-alert gm-alert-error">{errorMessage}</div>}

      {isOperationNotAllowed && (
        <div className="gm-alert gm-alert-warn">
          <strong>Firebase e-posta yöntemini aktifleştirin</strong>
          <span>
            Firebase konsolunda <b>Authentication → Sign-in method → Email/Password</b> seçeneğini etkinleştirin.
          </span>
          <div className="gm-alert-actions">
            <a href="https://console.firebase.google.com/project/grafik-motoru/authentication/providers" target="_blank" rel="noopener noreferrer">
              Konsolu aç ↗
            </a>
            <button
              type="button"
              onClick={() => {
                setIsSimulationMode(true);
                setVerificationEmail(regEmail.trim() || loginEmail.trim() || 'kullanici@ornek.com');
                setVerificationPending(true);
                setResendCooldown(30);
                setVerifyCheckStatus('Test Modu: Doğrulama akışı önizleniyor.');
              }}
            >
              Önizleme modu
            </button>
          </div>
        </div>
      )}

      {successNotice && <div className="gm-alert gm-alert-success">{successNotice}</div>}
    </>
  );

  return (
    <div className="gm-shell gm-auth">
      <header className="gm-auth-top">
        <button type="button" className="gm-back" onClick={onBackToLanding}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Ana sayfa</span>
        </button>
      </header>

      <main className="gm-auth-main">
        <div className="gm-auth-card">
          <img className="gm-auth-logo" src="/brand/mark.svg" alt="Grafik Motoru" />

          <AnimatePresence mode="wait">
            {verificationPending ? (
              /* ═══════════ E-POSTA DOĞRULAMA ═══════════ */
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="gm-auth-title">E-postanı doğrula</h1>
                <p className="gm-auth-sub">Doğrulama bağlantısını şu adrese gönderdik:</p>
                <div className="gm-email-chip">{verificationEmail}</div>

                <div className="gm-mail-links">
                  <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">Gmail'i aç ↗</a>
                  <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer">Outlook'u aç ↗</a>
                </div>

                {verifyCheckStatus && <div className="gm-alert gm-alert-success">{verifyCheckStatus}</div>}
                {verifyCheckError && <div className="gm-alert gm-alert-error">{verifyCheckError}</div>}

                <div className="gm-stack">
                  <button type="button" className="gm-btn gm-btn-primary gm-btn-block" onClick={handleCheckVerification} disabled={isLoading}>
                    {isLoading ? <span className="gm-spinner" /> : 'Doğruladım, devam et'}
                  </button>
                  <button type="button" className="gm-text-btn" onClick={handleResendEmail} disabled={resendCooldown > 0 || isLoading}>
                    {resendCooldown > 0 ? `Tekrar göndermek için ${resendCooldown} sn bekle` : 'E-postayı tekrar gönder'}
                  </button>
                  <button
                    type="button"
                    className="gm-text-btn gm-text-btn-muted"
                    onClick={() => {
                      setVerificationPending(false);
                      switchTab('login');
                    }}
                  >
                    Farklı bir hesapla giriş yap
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ═══════════ GİRİŞ / KAYIT ═══════════ */
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="gm-auth-title">{tab === 'login' ? 'Tekrar hoş geldin' : 'Hesabını oluştur'}</h1>
                <p className="gm-auth-sub">
                  {tab === 'login' ? 'Stüdyona devam etmek için giriş yap.' : 'Ücretsiz hesapla hemen tasarlamaya başla.'}
                </p>


                <button type="button" className="gm-btn gm-btn-google gm-btn-block" onClick={handleGoogleAuth} disabled={isLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google ile devam et</span>
                </button>

                <div className="gm-divider">
                  <span>veya e-posta ile</span>
                </div>

                {tab === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="gm-form" noValidate>
                    <div className="gm-field">
                      <label htmlFor="login-email">E-posta</label>
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="adiniz@ornek.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <div className="gm-field">
                      <div className="gm-field-row">
                        <label htmlFor="login-password">Şifre</label>
                        <button
                          type="button"
                          className="gm-text-btn gm-text-btn-sm"
                          onClick={() => {
                            setForgotEmail(loginEmail);
                            setIsForgotModalOpen(true);
                          }}
                        >
                          Şifremi unuttum
                        </button>
                      </div>
                      <div className="gm-input-wrap">
                        <input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <PasswordToggle shown={showLoginPassword} onToggle={() => setShowLoginPassword(!showLoginPassword)} />
                      </div>
                    </div>

                    {formAlerts}

                    <button type="submit" className="gm-btn gm-btn-primary gm-btn-block" disabled={isLoading}>
                      {isLoading ? <span className="gm-spinner" /> : 'Giriş yap'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="gm-form" noValidate>
                    <div className="gm-field">
                      <label htmlFor="reg-name">Ad Soyad</label>
                      <input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        autoComplete="name"
                      />
                    </div>

                    <div className="gm-field">
                      <label htmlFor="reg-email">E-posta</label>
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="adiniz@ornek.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <div className="gm-field">
                      <div className="gm-field-row">
                        <label htmlFor="reg-password">Şifre</label>
                        {regPassword && (
                          <span className="gm-strength-label" style={{ color: passStrength.color }}>
                            {passStrength.label}
                          </span>
                        )}
                      </div>
                      <div className="gm-input-wrap">
                        <input
                          id="reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="En az 6 karakter"
                          autoComplete="new-password"
                        />
                        <PasswordToggle shown={showRegPassword} onToggle={() => setShowRegPassword(!showRegPassword)} />
                      </div>
                      <div className="gm-strength">
                        <span style={{ width: regPassword ? passStrength.width : '0%', background: passStrength.color }} />
                      </div>
                    </div>

                    <label className="gm-check">
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                      <span>Kullanım Koşulları ve Gizlilik Politikası'nı kabul ediyorum.</span>
                    </label>

                    {formAlerts}

                    <button type="submit" className="gm-btn gm-btn-primary gm-btn-block" disabled={isLoading}>
                      {isLoading ? <span className="gm-spinner" /> : 'Hesap oluştur'}
                    </button>
                  </form>
                )}

                <p className="gm-auth-switch">
                  {tab === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
                  <button type="button" onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
                    {tab === 'login' ? 'Kayıt ol' : 'Giriş yap'}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════════ ŞİFRE SIFIRLAMA ═══════════ */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <motion.div
            className="gm-dialog-backdrop"
            onClick={() => setIsForgotModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="gm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="gm-dialog-head">
                <h2 id="forgot-title">Şifreni sıfırla</h2>
                <button type="button" className="gm-dialog-close" onClick={() => setIsForgotModalOpen(false)} aria-label="Kapat">
                  ✕
                </button>
              </div>
              <p className="gm-auth-sub gm-left">Kayıtlı e-posta adresini yaz, sıfırlama bağlantısını gönderelim.</p>

              {forgotMessage && (
                <div className="gm-alert gm-alert-success">
                  <strong>{forgotMessage}</strong>
                  <span>
                    Gelmediyse <b>Spam</b> ve <b>Tanıtımlar</b> klasörlerine bak. Google ile kayıt olduysan Google ile giriş yapıp
                    Hesap &amp; Profil bölümünden şifre oluşturabilirsin.
                  </span>
                  <div className="gm-alert-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        switchTab('register');
                      }}
                    >
                      Hesabın yok mu? Kayıt ol →
                    </button>
                  </div>
                </div>
              )}
              {forgotError && <div className="gm-alert gm-alert-error">{forgotError}</div>}

              <form onSubmit={handleForgotPassword} className="gm-form" noValidate>
                <div className="gm-field">
                  <label htmlFor="forgot-email">E-posta</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="adiniz@ornek.com"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
                <button type="submit" className="gm-btn gm-btn-primary gm-btn-block" disabled={isForgotLoading}>
                  {isForgotLoading ? <span className="gm-spinner" /> : 'Bağlantı gönder'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="gm-eye" onClick={onToggle} aria-label={shown ? 'Şifreyi gizle' : 'Şifreyi göster'}>
      {shown ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
