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

  // Enterprise SSO Info Modal
  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);

  // General Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

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
      setErrorMessage('Lütfen adınızı veya kurumsal unvanınızı giriniz.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Lütfen geçerli bir kurumsal e-posta adresi giriniz.');
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

  return (
    <div className="ap-root">
      {/* Calm Warm Background Texture */}
      <div className="ap-ambient-layer" aria-hidden="true">
        <div className="ap-ambient-glow" />
      </div>

      {/* Floating Minimalist Top Bar */}
      <header className="ap-top-nav">
        <div 
          className="ap-brand-mark" 
          onClick={onBackToLanding} 
          role="button" 
          tabIndex={0}
          title="Grafik Motoru Ana Sayfası"
        >
          <div className="ap-brand-icon">
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" />
          </div>
          <div className="ap-brand-meta">
            <span className="ap-brand-name">Grafik Motoru</span>
            <span className="ap-brand-divider">•</span>
            <span className="ap-brand-sub">Kurumsal Tasarım Portalı</span>
          </div>
        </div>

        <button 
          className="ap-btn-ghost-nav" 
          onClick={onBackToLanding}
          title="Ana Sayfaya Dön"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Siteye Dön</span>
        </button>
      </header>

      {/* Main Two-Column Editorial Layout */}
      <main className="ap-content-wrapper">
        <div className="ap-container">
          
          {/* ═══════════════════════════════════════════════════
              LEFT COLUMN: EDITORIAL BRAND & TRUST PRESENTATION
             ═══════════════════════════════════════════════════ */}
          <section className="ap-hero-column">
            {/* Eyebrow Badge */}
            <div className="ap-eyebrow">
              <span className="ap-eyebrow-dot" />
              <span>Kurumsal Tasarım Portalı</span>
            </div>

            {/* Confident Headline */}
            <h1 className="ap-hero-title">
              Kurumsal tasarım sürecinizi <br />
              <span className="ap-hero-accent">tek merkezden</span> yönetin.
            </h1>

            {/* Short Technical Description */}
            <p className="ap-hero-desc">
              Sosyal medya ve dijital kanallarınız için görsel üretim akışını standartlaştırın, şablonları hızla ölçeklendirin ve stüdyo kalitesinde dışa aktarın.
            </p>

            {/* 4 Crisp Product Highlights */}
            <div className="ap-highlights-grid">
              <div className="ap-highlight-card">
                <div className="ap-highlight-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
                <div className="ap-highlight-body">
                  <h4>Akıllı Şablon Akışları</h4>
                  <p>Marka kimliğinize duyarlı, dinamik en-boy oranı adaptasyonu.</p>
                </div>
              </div>

              <div className="ap-highlight-card">
                <div className="ap-highlight-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="ap-highlight-body">
                  <h4>Hızlı İçerik Üretimi</h4>
                  <p>Katman bazlı tipografi düzenleme ve anında görsel formatlama.</p>
                </div>
              </div>

              <div className="ap-highlight-card">
                <div className="ap-highlight-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="m14.83 14.83 4.24 4.24" />
                    <path d="m9.17 14.83-4.24 4.24" />
                  </svg>
                </div>
                <div className="ap-highlight-body">
                  <h4>4K Ultra-HD Çıktı</h4>
                  <p>Vektörel netlikte kayıpsız PNG ve SVG dışa aktarım motoru.</p>
                </div>
              </div>

              <div className="ap-highlight-card">
                <div className="ap-highlight-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="ap-highlight-body">
                  <h4>Takım Kullanımına Uygun</h4>
                  <p>Çoklu kullanıcı desteği, güvenli oturum ve merkezi erişim.</p>
                </div>
              </div>
            </div>

            {/* Social Proof & Trust Strip */}
            <div className="ap-trust-block">
              <div className="ap-trust-avatars">
                <div className="ap-avatar-circle" style={{ background: '#111827', color: '#FFFFFF' }}>G</div>
                <div className="ap-avatar-circle" style={{ background: '#374151', color: '#FFFFFF' }}>M</div>
                <div className="ap-avatar-circle" style={{ background: '#4B5563', color: '#FFFFFF' }}>T</div>
                <div className="ap-avatar-circle" style={{ background: '#FF6B00', color: '#FFFFFF' }}>★</div>
              </div>
              <div className="ap-trust-text">
                <div className="ap-trust-rating">
                  <span className="ap-rating-stars">★★★★★</span>
                  <strong className="ap-rating-num">4.9 / 5</strong>
                </div>
                <p className="ap-trust-caption">
                  10.000+ tasarımcı ve kurumsal ekip tarafından tercih ediliyor.
                </p>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="ap-security-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Kurumsal standartlarda 256-bit şifreleme ve güvenli kimlik doğrulama</span>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              RIGHT COLUMN: REFINED AUTH CARD
             ═══════════════════════════════════════════════════ */}
          <section className="ap-auth-column">
            <div className="ap-card">
              
              {/* Top Header Inside Card */}
              <div className="ap-card-header">
                <div className="ap-card-icon-wrap">
                  <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" />
                </div>
                <div className="ap-card-header-titles">
                  <h2>Portal Erişimi</h2>
                  <p>Tasarım çalışma alanınıza güvenle erişin.</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ═══════════ STATE 1: EMAIL VERIFICATION PENDING ═══════════ */}
                {verificationPending ? (
                  <motion.div 
                    key="verification-box"
                    className="ap-verify-box"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="ap-verify-icon-bubble">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>

                    <h3 className="ap-verify-headline">E-posta Adresinizi Doğrulayın</h3>
                    <p className="ap-verify-subtext">
                      Hesap güvenliğinizi sağlamak için doğrulama bağlantısı e-posta adresinize gönderildi:
                    </p>

                    <div className="ap-verify-email-badge">
                      <span>{verificationEmail}</span>
                    </div>

                    {/* Stepper indicator */}
                    <div className="ap-stepper">
                      <div className="ap-step-item is-done">
                        <span className="ap-step-badge">✓</span>
                        <span className="ap-step-title">Hesap Oluşturuldu</span>
                      </div>
                      <div className="ap-step-divider is-active" />
                      <div className="ap-step-item is-current">
                        <span className="ap-step-badge">2</span>
                        <span className="ap-step-title">E-posta Onayı</span>
                      </div>
                      <div className="ap-step-divider" />
                      <div className="ap-step-item">
                        <span className="ap-step-badge">3</span>
                        <span className="ap-step-title">Stüdyo</span>
                      </div>
                    </div>

                    {/* Quick Mail Links */}
                    <div className="ap-quick-mail">
                      <span className="ap-quick-label">Gelen kutusunu aç:</span>
                      <div className="ap-quick-row">
                        <a 
                          href="https://mail.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ap-mail-tag"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 12.713L1.5 6.25V18a2 2 0 002 2h17a2 2 0 002-2V6.25L12 12.713z" />
                            <path fill="#4285F4" d="M22.5 6V4a2 2 0 00-2-2h-17a2 2 0 00-2 2v2l10.5 6.5L22.5 6z" />
                          </svg>
                          <span>Gmail</span>
                        </a>
                        <a 
                          href="https://outlook.live.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ap-mail-tag"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24">
                            <path fill="#0078D4" d="M22 6v12a2 2 0 01-2 2h-7V4h7a2 2 0 012 2z" />
                            <path fill="#28A8EA" d="M13 4v16H4a2 2 0 01-2-2V6a2 2 0 012-2h9z" />
                          </svg>
                          <span>Outlook</span>
                        </a>
                      </div>
                    </div>

                    {verifyCheckStatus && (
                      <div className="ap-alert ap-alert-success">
                        <span>{verifyCheckStatus}</span>
                      </div>
                    )}

                    {verifyCheckError && (
                      <div className="ap-alert ap-alert-error">
                        <span>{verifyCheckError}</span>
                      </div>
                    )}

                    <div className="ap-verify-btn-stack">
                      <button 
                        type="button" 
                        className="ap-btn-primary" 
                        onClick={handleCheckVerification}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="ap-loader" />
                        ) : (
                          <span>Doğruladım, Portala Devam Et</span>
                        )}
                      </button>

                      <button 
                        type="button" 
                        className="ap-btn-link-action"
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0 || isLoading}
                      >
                        {resendCooldown > 0 
                          ? `Tekrar göndermek için bekleyin (${resendCooldown}s)` 
                          : 'Doğrulama e-postasını tekrar gönder'}
                      </button>

                      <button 
                        type="button" 
                        className="ap-btn-secondary"
                        onClick={() => {
                          setVerificationPending(false);
                          setTab('login');
                        }}
                      >
                        Farklı Bir Hesapla Giriş Yap
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ═══════════ STATE 2: SIGN-IN & REGISTER FORMS ═══════════ */
                  <motion.div 
                    key="forms-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Segmented Control / Tab Switcher */}
                    <div className="ap-segmented-control" role="tablist">
                      <button 
                        type="button" 
                        role="tab"
                        aria-selected={tab === 'login'}
                        className={`ap-tab-item ${tab === 'login' ? 'is-active' : ''}`}
                        onClick={() => {
                          setTab('login');
                          setErrorMessage(null);
                          setIsOperationNotAllowed(false);
                        }}
                      >
                        {tab === 'login' && (
                          <motion.div 
                            className="ap-tab-indicator" 
                            layoutId="portal-tab-indicator"
                            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                          />
                        )}
                        <span className="ap-tab-text">Giriş Yap</span>
                      </button>

                      <button 
                        type="button" 
                        role="tab"
                        aria-selected={tab === 'register'}
                        className={`ap-tab-item ${tab === 'register' ? 'is-active' : ''}`}
                        onClick={() => {
                          setTab('register');
                          setErrorMessage(null);
                          setIsOperationNotAllowed(false);
                        }}
                      >
                        {tab === 'register' && (
                          <motion.div 
                            className="ap-tab-indicator" 
                            layoutId="portal-tab-indicator"
                            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                          />
                        )}
                        <span className="ap-tab-text">Kayıt Ol</span>
                      </button>
                    </div>

                    {/* Error & Success Messages */}
                    {errorMessage && (
                      <div className="ap-alert ap-alert-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Operation Not Allowed Notice */}
                    {isOperationNotAllowed && (
                      <div className="ap-config-alert">
                        <div className="ap-config-header">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Firebase E-posta Yöntemini Aktifleştirin</span>
                        </div>
                        <p className="ap-config-text">
                          Firebase konsolunuzda <strong>Authentication → Sign-in method → Email/Password</strong> seçeneğini "Enable" durumuna getirin.
                        </p>
                        <div className="ap-config-buttons">
                          <a 
                            href="https://console.firebase.google.com/project/grafik-motoru/authentication/providers" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="ap-btn-console-link"
                          >
                            Konsolu Aç ↗
                          </a>
                          <button
                            type="button"
                            className="ap-btn-sim-test"
                            onClick={() => {
                              setIsSimulationMode(true);
                              setVerificationEmail(regEmail.trim() || loginEmail.trim() || 'kullanici@ornek.com');
                              setVerificationPending(true);
                              setResendCooldown(30);
                              setVerifyCheckStatus('Test Modu: Doğrulama akışı önizleniyor.');
                            }}
                          >
                            Önizleme Modu
                          </button>
                        </div>
                      </div>
                    )}

                    {successNotice && (
                      <div className="ap-alert ap-alert-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17L4 12" />
                        </svg>
                        <span>{successNotice}</span>
                      </div>
                    )}

                    {/* ────── TAB 1: GİRİŞ YAP (SIGN IN) ────── */}
                    {tab === 'login' && (
                      <form onSubmit={handleLoginSubmit} className="ap-form">
                        <div className="ap-input-group">
                          <label htmlFor="login-email">E-posta Adresi veya Kullanıcı Adı</label>
                          <div className="ap-input-field">
                            <input 
                              id="login-email"
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="adiniz@kurumunuz.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-input-group">
                          <div className="ap-label-flex">
                            <label htmlFor="login-password">Şifre</label>
                            <button 
                              type="button" 
                              className="ap-link-subtle" 
                              onClick={() => {
                                setForgotEmail(loginEmail);
                                setIsForgotModalOpen(true);
                              }}
                            >
                              Şifremi Unuttum
                            </button>
                          </div>
                          <div className="ap-input-field ap-has-toggle">
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
                              className="ap-password-toggle"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              aria-label="Şifreyi Göster veya Gizle"
                            >
                              {showLoginPassword ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="ap-form-meta-row">
                          <label className="ap-checkbox-item">
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
                            <span className="ap-loader" />
                          ) : (
                            <span>Portala Giriş Yap</span>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ────── TAB 2: KAYIT OL (SIGN UP) ────── */}
                    {tab === 'register' && (
                      <form onSubmit={handleRegisterSubmit} className="ap-form">
                        <div className="ap-input-group">
                          <label htmlFor="reg-name">Ad Soyad</label>
                          <div className="ap-input-field">
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

                        <div className="ap-input-group">
                          <label htmlFor="reg-email">E-posta Adresi</label>
                          <div className="ap-input-field">
                            <input 
                              id="reg-email"
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="adiniz@kurumunuz.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-input-group">
                          <div className="ap-label-flex">
                            <label htmlFor="reg-password">Şifre</label>
                            {regPassword && (
                              <span className="ap-strength-tag" style={{ color: passStrength.color }}>
                                {passStrength.label}
                              </span>
                            )}
                          </div>
                          <div className="ap-input-field ap-has-toggle">
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
                              className="ap-password-toggle"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                            >
                              {showRegPassword ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* Minimal Password Strength Meter */}
                          {regPassword && (
                            <div className="ap-strength-track">
                              <div 
                                className="ap-strength-fill" 
                                style={{ width: passStrength.width, background: passStrength.color }} 
                              />
                            </div>
                          )}
                        </div>

                        <div className="ap-input-group">
                          <label htmlFor="reg-password-confirm">Şifre Tekrar</label>
                          <div className="ap-input-field">
                            <input 
                              id="reg-password-confirm"
                              type={showRegPassword ? "text" : "password"}
                              value={regPasswordConfirm}
                              onChange={(e) => setRegPasswordConfirm(e.target.value)}
                              placeholder="Şifrenizi tekrar yazın"
                              autoComplete="new-password"
                              required
                            />
                            {regPasswordConfirm && (
                              <span className="ap-match-pill">
                                {regPassword === regPasswordConfirm ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ap-form-meta-row">
                          <label className="ap-checkbox-item">
                            <input 
                              type="checkbox" 
                              checked={termsAccepted} 
                              onChange={(e) => setTermsAccepted(e.target.checked)} 
                              required
                            />
                            <span>
                              <span className="ap-text-accent">Kullanım Koşulları</span> ve <span className="ap-text-accent">Gizlilik Politikasını</span> kabul ediyorum.
                            </span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="ap-btn-primary" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="ap-loader" />
                          ) : (
                            <span>Hesap Oluştur</span>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Minimal Quiet Divider */}
                    <div className="ap-or-divider">
                      <span className="ap-divider-bar" />
                      <span className="ap-divider-label">veya</span>
                      <span className="ap-divider-bar" />
                    </div>

                    {/* High-End Google Social Button */}
                    <button 
                      type="button" 
                      className="ap-btn-google-auth"
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google ile devam et</span>
                    </button>

                    {/* Enterprise SSO Link */}
                    <div className="ap-sso-footer">
                      <button 
                        type="button" 
                        className="ap-sso-button"
                        onClick={() => setIsSsoModalOpen(true)}
                      >
                        Kurumsal Tek Oturum Açma (SSO) ile Giriş
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>
      </main>

      {/* ═══════════ REFINED FORGOT PASSWORD MODAL ═══════════ */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="ap-dialog-backdrop" onClick={() => setIsForgotModalOpen(false)}>
            <motion.div 
              className="ap-dialog-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ap-dialog-head">
                <h3>Şifrenizi mi Unuttunuz?</h3>
                <button 
                  type="button" 
                  className="ap-dialog-close" 
                  onClick={() => setIsForgotModalOpen(false)}
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>

              <p className="ap-dialog-desc">
                Kayıtlı e-posta adresinizi girin. Güvenle sıfırlayabileceğiniz bağlantıyı gelen kutunuza iletelim.
              </p>

              {forgotMessage && (
                <div className="ap-alert ap-alert-success">
                  <span>{forgotMessage}</span>
                </div>
              )}

              {forgotError && (
                <div className="ap-alert ap-alert-error">
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="ap-form">
                <div className="ap-input-group">
                  <label htmlFor="forgot-email">E-posta Adresi</label>
                  <div className="ap-input-field">
                    <input 
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="adiniz@kurumunuz.com"
                      required
                    />
                  </div>
                </div>

                <div className="ap-dialog-footer">
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
                    {isForgotLoading ? <span className="ap-loader" /> : 'Sıfırlama Bağlantısı Gönder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ ENTERPRISE SSO MODAL ═══════════ */}
      <AnimatePresence>
        {isSsoModalOpen && (
          <div className="ap-dialog-backdrop" onClick={() => setIsSsoModalOpen(false)}>
            <motion.div 
              className="ap-dialog-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ap-dialog-head">
                <h3>Kurumsal Tek Oturum (SSO)</h3>
                <button 
                  type="button" 
                  className="ap-dialog-close" 
                  onClick={() => setIsSsoModalOpen(false)}
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>

              <p className="ap-dialog-desc">
                Okta, Azure AD veya Google Workspace SAML 2.0 entegrasyonu kurumsal plan kullanıcılarımız için aktiftir. Kurum alan adınızla giriş yapmak için lütfen BT yöneticinizle irtibata geçin veya doğrudan e-posta/şifre yöntemiyle devam edin.
              </p>

              <div className="ap-dialog-footer">
                <button 
                  type="button" 
                  className="ap-btn-primary" 
                  onClick={() => setIsSsoModalOpen(false)}
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
