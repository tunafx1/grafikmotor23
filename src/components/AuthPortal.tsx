import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  resendVerificationEmail, 
  reloadCurrentUser, 
  sendResetPassword,
  getAuthErrorMessage 
} from '../lib/firebase';

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
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
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

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

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

      setSuccessNotice('Giriş başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        onCompleteAuth(user);
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
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

    if (!regName.trim()) {
      setErrorMessage('Lütfen adınızı veya kullanıcı adınızı giriniz.');
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
    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
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
      setResendCooldown(45); // 45 seconds cooldown
    } catch (err: any) {
      console.error('Registration error:', err);
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

    try {
      const updatedUser = await reloadCurrentUser();
      if (updatedUser?.emailVerified) {
        setVerifyCheckStatus('✓ E-posta adresiniz başarıyla doğrulandı! Portala giriş yapılıyor...');
        setTimeout(() => {
          onCompleteAuth(updatedUser);
        }, 800);
      } else {
        setVerifyCheckError('E-posta henüz doğrulanmamış. Lütfen gelen kutunuzdaki (ve Spam klasörünüzdeki) bağlantıya tıkladıktan sonra tekrar deneyin.');
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

    try {
      await resendVerificationEmail(currentUserForVerify);
      setVerifyCheckStatus('Doğrulama bağlantısı e-posta adresinize tekrar gönderildi!');
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
        setSuccessNotice('Google ile giriş başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
          onCompleteAuth(user);
        }, 500);
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
      setForgotMessage('Şifre sıfırlama bağlantısı e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol edin.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setForgotError(getAuthErrorMessage(err));
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="ap-page-root">
      {/* Dynamic ambient mesh & background matching landing page */}
      <div className="lp-ambient" aria-hidden="true">
        <div className="lp-mesh lp-mesh-1" />
        <div className="lp-mesh lp-mesh-2" />
        <div className="lp-mesh lp-mesh-3" />
        <div className="lp-grid" />
      </div>

      {/* Floating Header */}
      <header className="ap-top-bar">
        <div className="ap-top-brand" onClick={onBackToLanding} role="button" tabIndex={0}>
          <div className="lp-logo">
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru Monogram" />
          </div>
          <div>
            <h2 className="lp-brand-name">Grafik Motoru</h2>
            <p className="lp-brand-tagline">Kurumsal Portal</p>
          </div>
        </div>

        <button 
          className="ap-back-btn" 
          onClick={onBackToLanding}
          title="Ana Sayfaya Dön"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Ana Sayfaya Dön</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="ap-main-wrap">
        <div className="ap-grid-container">
          {/* Left Column: Value Proposition & Brand Feature Highlights */}
          <motion.div 
            className="ap-left-panel"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ap-badge-pill">
              <span className="ap-badge-pulse" />
              <span>KURUMSAL TASARIM PLATFORMU</span>
            </div>

            <h1 className="ap-headline">
              Görsel Üretim Merkezinize <br />
              <span className="lp-shimmer-text">Hoş Geldiniz.</span>
            </h1>

            <p className="ap-subtext">
              Yapay zekâ destekli sosyal medya şablonları, otomatik formatlama ve yüksek çözünürlüklü grafik motoru tek bir çatı altında.
            </p>

            <div className="ap-features-list">
              <div className="ap-feature-item">
                <div className="ap-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="2.2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h4>AI Tasarım & Metin Sihirbazı</h4>
                  <p>Tek tıkla etkileyici başlıklar, kancalar ve kurumsal içerikler üretin.</p>
                </div>
              </div>

              <div className="ap-feature-item">
                <div className="ap-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="2.2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <h4>4K Ultra & Çoklu Format Çıktısı</h4>
                  <p>Instagram, LinkedIn, X ve YouTube için pikselsiz kayıpsız dışa aktarım.</p>
                </div>
              </div>

              <div className="ap-feature-item">
                <div className="ap-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h4>Güvenli Bulut & Ekip Şablonları</h4>
                  <p>Tasarımlarınız anlık olarak şifrelenip bulut ortamında yedeklenir.</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="ap-trust-pills">
              <div className="ap-trust-pill">
                <span className="ap-trust-check">✓</span>
                <span>%100 Vektörel Netlik</span>
              </div>
              <div className="ap-trust-pill">
                <span className="ap-trust-check">✓</span>
                <span>Anlık Senkronizasyon</span>
              </div>
              <div className="ap-trust-pill">
                <span className="ap-trust-check">✓</span>
                <span>Gizlilik Garantisi</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Auth Card */}
          <motion.div 
            className="ap-right-panel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ap-card">
              {/* BRAND ICON IN CARD */}
              <div className="ap-card-brand-top">
                <div className="ap-card-logo">
                  <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" />
                </div>
                <div className="ap-card-titles">
                  <h2>Grafik Motoru Portal</h2>
                  <p>Görsel üretim ve yönetim paneline erişin</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ═══════════ VERIFICATION SCREEN ═══════════ */}
                {verificationPending ? (
                  <motion.div 
                    key="verification-box"
                    className="ap-verify-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="ap-verify-icon-wrap">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <div className="ap-verify-pulse" />
                    </div>

                    <h3 className="ap-verify-title">E-postanızı Doğrulayın</h3>
                    <p className="ap-verify-desc">
                      Güvenliğiniz için hesabınızı aktifleştirmeden önce e-posta adresinizi doğrulamanız gerekmektedir.
                    </p>

                    <div className="ap-verify-target-email">
                      <span>{verificationEmail}</span>
                    </div>

                    <p className="ap-verify-subnote">
                      Yukarıdaki adrese bir onay bağlantısı gönderdik. Lütfen gelen kutunuzdaki linke tıklayınız.
                    </p>

                    {verifyCheckStatus && (
                      <div className="ap-notice ap-notice-success">
                        <span>{verifyCheckStatus}</span>
                      </div>
                    )}

                    {verifyCheckError && (
                      <div className="ap-notice ap-notice-error">
                        <span>{verifyCheckError}</span>
                      </div>
                    )}

                    <div className="ap-verify-actions">
                      <button 
                        type="button" 
                        className="ap-btn-primary" 
                        onClick={handleCheckVerification}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="ap-spinner" />
                        ) : (
                          <>
                            <span>E-postamı Doğruladım, Portala Gir</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </>
                        )}
                      </button>

                      <div className="ap-verify-resend-row">
                        <button 
                          type="button" 
                          className="ap-btn-link"
                          onClick={handleResendEmail}
                          disabled={resendCooldown > 0 || isLoading}
                        >
                          {resendCooldown > 0 
                            ? `Tekrar Gönder (${resendCooldown}s)` 
                            : 'Tekrar Doğrulama E-postası Gönder'}
                        </button>
                      </div>

                      <button 
                        type="button" 
                        className="ap-btn-secondary"
                        onClick={() => {
                          setVerificationPending(false);
                          setTab('login');
                        }}
                      >
                        ← Başka Bir Hesapla Giriş Yap
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ═══════════ MAIN TAB VIEW (LOGIN / REGISTER) ═══════════ */
                  <motion.div 
                    key="tabs-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* SEGMENTED TAB SWITCHER */}
                    <div className="ap-segmented-tabs">
                      <button 
                        type="button" 
                        className={`ap-seg-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                          setTab('login');
                          setErrorMessage(null);
                        }}
                      >
                        Giriş Yap
                      </button>
                      <button 
                        type="button" 
                        className={`ap-seg-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => {
                          setTab('register');
                          setErrorMessage(null);
                        }}
                      >
                        Kayıt Ol
                      </button>
                    </div>

                    {/* ERROR & SUCCESS NOTICES */}
                    {errorMessage && (
                      <div className="ap-notice ap-notice-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {successNotice && (
                      <div className="ap-notice ap-notice-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17L4 12" />
                        </svg>
                        <span>{successNotice}</span>
                      </div>
                    )}

                    {/* ────── TAB 1: GİRİŞ YAP ────── */}
                    {tab === 'login' && (
                      <form onSubmit={handleLoginSubmit} className="ap-form">
                        <div className="ap-field">
                          <label htmlFor="login-email">E-posta Adresi veya Kullanıcı Adı</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input 
                              id="login-email"
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="ornek@sirket.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-field">
                          <div className="ap-label-row">
                            <label htmlFor="login-password">Şifre</label>
                            <button 
                              type="button" 
                              className="ap-forgot-link" 
                              onClick={() => {
                                setForgotEmail(loginEmail);
                                setIsForgotModalOpen(true);
                              }}
                            >
                              Şifremi Unuttum?
                            </button>
                          </div>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input 
                              id="login-password"
                              type={showLoginPassword ? "text" : "password"}
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              required
                            />
                            <button 
                              type="button" 
                              className="ap-eye-btn"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              aria-label="Şifreyi Göster/Gizle"
                            >
                              {showLoginPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="ap-remember-row">
                          <label className="ap-checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={rememberMe} 
                              onChange={(e) => setRememberMe(e.target.checked)} 
                            />
                            <span>Beni hatırla</span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="ap-btn-primary" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="ap-spinner" />
                          ) : (
                            <>
                              <span>Giriş Yap</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ────── TAB 2: KAYIT OL ────── */}
                    {tab === 'register' && (
                      <form onSubmit={handleRegisterSubmit} className="ap-form">
                        <div className="ap-field">
                          <label htmlFor="reg-name">Ad Soyad / Kullanıcı Adı</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input 
                              id="reg-name"
                              type="text"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="Adınız Soyadınız"
                              autoComplete="name"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-field">
                          <label htmlFor="reg-email">E-posta Adresi (Doğrulanacaktır)</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input 
                              id="reg-email"
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="ornek@sirket.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-field">
                          <label htmlFor="reg-password">Şifre Belirleyin</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input 
                              id="reg-password"
                              type={showRegPassword ? "text" : "password"}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="En az 6 karakter"
                              autoComplete="new-password"
                              required
                            />
                            <button 
                              type="button" 
                              className="ap-eye-btn"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                            >
                              {showRegPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="ap-field">
                          <label htmlFor="reg-password-confirm">Şifre Tekrarı</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <input 
                              id="reg-password-confirm"
                              type={showRegPassword ? "text" : "password"}
                              value={regPasswordConfirm}
                              onChange={(e) => setRegPasswordConfirm(e.target.value)}
                              placeholder="Şifrenizi doğrulayın"
                              autoComplete="new-password"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-terms-row">
                          <label className="ap-checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={termsAccepted} 
                              onChange={(e) => setTermsAccepted(e.target.checked)} 
                              required
                            />
                            <span>
                              <span className="ap-highlight">Kullanım Koşulları</span> ve <span className="ap-highlight">Gizlilik Politikasını</span> okudum, kabul ediyorum.
                            </span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="ap-btn-primary" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="ap-spinner" />
                          ) : (
                            <>
                              <span>Hesap Oluştur ve Doğrula</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ────── DIVIDER ────── */}
                    <div className="ap-divider">
                      <span className="ap-divider-line" />
                      <span className="ap-divider-text">veya Google ile devam et</span>
                      <span className="ap-divider-line" />
                    </div>

                    {/* ────── GOOGLE BUTTON ────── */}
                    <button 
                      type="button" 
                      className="ap-btn-google"
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google Hesabı ile Giriş Yap</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ═══════════ FORGOT PASSWORD MODAL ═══════════ */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="ap-modal-overlay" onClick={() => setIsForgotModalOpen(false)}>
            <motion.div 
              className="ap-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
            >
              <div className="ap-modal-header">
                <h3>Şifrenizi mi Unuttunuz?</h3>
                <button 
                  type="button" 
                  className="ap-modal-close" 
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <p className="ap-modal-desc">
                Kayıtlı e-posta adresinizi girin. Size şifrenizi güvenle sıfırlayabileceğiniz bir bağlantı göndereceğiz.
              </p>

              {forgotMessage && (
                <div className="ap-notice ap-notice-success">
                  <span>{forgotMessage}</span>
                </div>
              )}

              {forgotError && (
                <div className="ap-notice ap-notice-error">
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="ap-form">
                <div className="ap-field">
                  <label htmlFor="forgot-email">E-posta Adresi</label>
                  <div className="ap-input-wrap">
                    <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input 
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ornek@sirket.com"
                      required
                    />
                  </div>
                </div>

                <div className="ap-modal-actions">
                  <button 
                    type="button" 
                    className="ap-btn-secondary" 
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Vazgeç
                  </button>
                  <button 
                    type="submit" 
                    className="ap-btn-primary"
                    disabled={isForgotLoading}
                  >
                    {isForgotLoading ? <span className="ap-spinner" /> : 'Sıfırlama Bağlantısı Gönder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
