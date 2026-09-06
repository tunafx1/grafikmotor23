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
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Interactive Live Canvas simulation states in Left Showcase
  const [activeFormat, setActiveFormat] = useState<'post' | 'story'>('post');
  const [aiHeadline, setAiHeadline] = useState('Sosyal Medyanı Hızlandır');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Şifre giriniz', color: '#CBD5E1', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Zayıf', color: '#EF4444', width: '25%' };
      case 2:
        return { score: 2, label: 'Orta', color: '#F59E0B', width: '50%' };
      case 3:
        return { score: 3, label: 'Güçlü', color: '#10B981', width: '75%' };
      case 4:
        return { score: 4, label: 'Kusursuz', color: '#059669', width: '100%' };
      default:
        return { score: 0, label: 'Çok Zayıf', color: '#EF4444', width: '15%' };
    }
  };

  const passStrength = getPasswordStrength(regPassword);

  // Trigger mini AI title cycle on showcase
  const handleRegenerateShowcase = () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    const titles = [
      'Geleceğin Tasarım Motoru',
      'Sosyal Medyanı Hızlandır',
      'Yapay Zekâ ile Kusursuz Çıktı',
      'Tek Tıkla 4K Ultra Tasarım',
      'Kreatif Ekiplerin Güç Merkezi'
    ];
    setTimeout(() => {
      const next = titles[(titles.indexOf(aiHeadline) + 1) % titles.length];
      setAiHeadline(next);
      setIsAiGenerating(false);
    }, 450);
  };

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

      setSuccessNotice('Giriş başarılı! Stüdyoya yönlendiriliyorsunuz...');
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
      setVerifyCheckStatus('✓ Test Modu: E-posta başarıyla doğrulandı! Stüdyoya giriş yapılıyor...');
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
        setVerifyCheckStatus('✓ E-posta adresiniz başarıyla doğrulandı! Stüdyoya giriş yapılıyor...');
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
    <div className="ap-page-root">
      {/* Luxury Ambient Mesh & Engineering Grid Background */}
      <div className="lp-ambient" aria-hidden="true">
        <div className="lp-mesh lp-mesh-1" />
        <div className="lp-mesh lp-mesh-2" />
        <div className="lp-mesh lp-mesh-3" />
        <div className="lp-grid" />
      </div>

      {/* Floating Glassmorphic Top Bar */}
      <header className="ap-top-bar">
        <div className="ap-top-brand" onClick={onBackToLanding} role="button" tabIndex={0}>
          <div className="lp-logo">
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru Monogram" />
          </div>
          <div>
            <h2 className="lp-brand-name">Grafik Motoru</h2>
            <p className="lp-brand-tagline">Kurumsal Tasarım Portalı</p>
          </div>
        </div>

        <button 
          className="ap-back-btn" 
          onClick={onBackToLanding}
          title="Ana Sayfaya Dön"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Ana Sayfaya Dön</span>
        </button>
      </header>

      {/* Main Grid Container */}
      <main className="ap-main-wrap">
        <div className="ap-grid-container">
          
          {/* ═══════════════════════════════════════════════════
              LEFT COLUMN: LUXURY LIVE STUDIO SHOWCASE
             ═══════════════════════════════════════════════════ */}
          <motion.div 
            className="ap-left-panel"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ap-badge-pill">
              <span className="ap-badge-pulse" />
              <span>YAPAY ZEKÂ DESTEKLİ TASARIM PLATFORMU</span>
            </div>

            <h1 className="ap-headline">
              Görsel Üretim Merkezinize <br />
              <span className="lp-shimmer-text">Hoş Geldiniz.</span>
            </h1>

            <p className="ap-subtext">
              Sosyal medya için şablonlarınızı tek bir merkezden oluşturun, Gemini yapay zekâsı ile içerikleri saniyeler içinde zenginleştirin ve 4K kalitede dışa aktarın.
            </p>

            {/* Interactive Live Mini Studio Mockup Card */}
            <div className="ap-studio-card">
              {/* Studio Window Top Bar */}
              <div className="ap-studio-topbar">
                <div className="ap-studio-dots">
                  <span className="ap-dot ap-dot-red" />
                  <span className="ap-dot ap-dot-yellow" />
                  <span className="ap-dot ap-dot-green" />
                </div>
                <div className="ap-studio-title-pill">
                  <span className="ap-live-indicator" />
                  <span>Grafik Motoru • Canlı Tuval ({activeFormat === 'post' ? '1:1 Post' : '9:16 Hikaye'})</span>
                </div>
                <div className="ap-studio-format-toggles">
                  <button 
                    type="button"
                    className={`ap-format-pill ${activeFormat === 'post' ? 'active' : ''}`}
                    onClick={() => setActiveFormat('post')}
                  >
                    1:1
                  </button>
                  <button 
                    type="button"
                    className={`ap-format-pill ${activeFormat === 'story' ? 'active' : ''}`}
                    onClick={() => setActiveFormat('story')}
                  >
                    9:16
                  </button>
                </div>
              </div>

              {/* Studio Canvas Interior */}
              <div className={`ap-studio-canvas ${activeFormat === 'story' ? 'is-story' : ''}`}>
                {/* Floating Top Tool Chips */}
                <div className="ap-canvas-tool-dock">
                  <span className="ap-dock-chip active">✦ AI Sihirbazı</span>
                  <span className="ap-dock-chip">Katmanlar</span>
                  <span className="ap-dock-chip">Vektörler</span>
                  <button 
                    type="button" 
                    className="ap-dock-btn-refresh" 
                    onClick={handleRegenerateShowcase}
                    title="Yeni Başlık Üret"
                  >
                    <svg className={isAiGenerating ? 'animate-spin' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                    </svg>
                    <span>Yenile</span>
                  </button>
                </div>

                {/* Simulated Poster Graphic Element */}
                <div className="ap-canvas-content-box">
                  <div className="ap-canvas-selection-box">
                    <span className="ap-handle ap-handle-tl" />
                    <span className="ap-handle ap-handle-tr" />
                    <span className="ap-handle ap-handle-bl" />
                    <span className="ap-handle ap-handle-br" />
                    
                    <div className="ap-canvas-tag">
                      <span className="ap-tag-dot" />
                      <span>Metin Katmanı #01</span>
                    </div>

                    <h3 className="ap-canvas-dynamic-heading">
                      {isAiGenerating ? (
                        <span className="ap-text-loading">Gemini düşünüyor...</span>
                      ) : (
                        aiHeadline
                      )}
                    </h3>
                    <p className="ap-canvas-dynamic-sub">
                      Yüksek çözünürlüklü sosyal medya şablonu • Otomatik formatlama aktif
                    </p>
                  </div>

                  {/* Simulated Floating Cursor with User Badge */}
                  <div className="ap-canvas-user-cursor">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF6B1A">
                      <polygon points="0,0 24,9 12,12 9,24" />
                    </svg>
                    <span className="ap-cursor-pill">Tuna • AI Tasarımcı</span>
                  </div>
                </div>

                {/* Canvas Bottom Telemetry */}
                <div className="ap-canvas-telemetry">
                  <div className="ap-telemetry-chip">
                    <span className="ap-chip-dot green" />
                    <span>Gemini 2.5 • 0.3s</span>
                  </div>
                  <div className="ap-telemetry-chip">
                    <span>4K Ultra-HD Çıktı</span>
                  </div>
                  <div className="ap-telemetry-chip">
                    <span>%100 Vektörel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof Avatar Row */}
            <div className="ap-social-proof-bar">
              <div className="ap-avatar-stack">
                <div className="ap-avatar-img" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA26B)' }}>T</div>
                <div className="ap-avatar-img" style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>M</div>
                <div className="ap-avatar-img" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>K</div>
                <div className="ap-avatar-img" style={{ background: 'linear-gradient(135deg, #8B5CF6, #C084FC)' }}>A</div>
              </div>
              <div className="ap-proof-text">
                <div className="ap-stars">
                  {'★★★★★'.split('').map((s, i) => (
                    <span key={i} className="ap-star">{s}</span>
                  ))}
                  <strong>4.9 / 5</strong>
                </div>
                <p>10.000+ tasarımcı ve kreatif ekip tarafından tercih ediliyor.</p>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════════
              RIGHT COLUMN: MASTERPIECE AUTH CARD
             ═══════════════════════════════════════════════════ */}
          <motion.div 
            className="ap-right-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ap-card">
              
              {/* Brand Header Inside Card */}
              <div className="ap-card-brand-top">
                <div className="ap-card-logo">
                  <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" />
                  <div className="ap-card-logo-glow" />
                </div>
                <div className="ap-card-titles">
                  <h2>Grafik Motoru Portal</h2>
                  <p>Görsel üretim stüdyonuza güvenle erişin</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ═══════════ STATE 1: EMAIL VERIFICATION PENDING ═══════════ */}
                {verificationPending ? (
                  <motion.div 
                    key="verification-box"
                    className="ap-verify-screen"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Pulsing Sonar Envelope */}
                    <div className="ap-verify-sonar-wrap">
                      <div className="ap-sonar-ring ap-sonar-1" />
                      <div className="ap-sonar-ring ap-sonar-2" />
                      <div className="ap-sonar-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="ap-verify-title">E-postanızı Doğrulayın</h3>
                    <p className="ap-verify-desc">
                      Hesap güvenliğinizi sağlamak için doğrulama bağlantısı e-posta adresinize gönderildi:
                    </p>

                    <div className="ap-verify-target-email">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{verificationEmail}</span>
                    </div>

                    {/* 3-Step Process Pipeline */}
                    <div className="ap-verify-pipeline">
                      <div className="ap-pipeline-step done">
                        <span className="ap-step-num">✓</span>
                        <span className="ap-step-text">Kayıt Alındı</span>
                      </div>
                      <div className="ap-pipeline-line active" />
                      <div className="ap-pipeline-step current">
                        <span className="ap-step-num">2</span>
                        <span className="ap-step-text">E-posta Onayı</span>
                      </div>
                      <div className="ap-pipeline-line" />
                      <div className="ap-pipeline-step">
                        <span className="ap-step-num">3</span>
                        <span className="ap-step-text">Stüdyo</span>
                      </div>
                    </div>

                    {/* Quick Mail Provider Shortcuts */}
                    <div className="ap-mail-shortcuts">
                      <span className="ap-shortcuts-label">Gelen kutunuzu açın:</span>
                      <div className="ap-shortcuts-btns">
                        <a 
                          href="https://mail.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ap-btn-mail-app"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 12.713L1.5 6.25V18a2 2 0 002 2h17a2 2 0 002-2V6.25L12 12.713z" />
                            <path fill="#4285F4" d="M22.5 6V4a2 2 0 00-2-2h-17a2 2 0 00-2 2v2l10.5 6.5L22.5 6z" />
                          </svg>
                          <span>Gmail</span>
                        </a>
                        <a 
                          href="https://outlook.live.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ap-btn-mail-app"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path fill="#0078D4" d="M22 6v12a2 2 0 01-2 2h-7V4h7a2 2 0 012 2z" />
                            <path fill="#28A8EA" d="M13 4v16H4a2 2 0 01-2-2V6a2 2 0 012-2h9z" />
                          </svg>
                          <span>Outlook</span>
                        </a>
                      </div>
                    </div>

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
                            ? `Yeni bağlantı için bekleyin (${resendCooldown}s)` 
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
                        ← Farklı Bir Hesapla Giriş Yap
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ═══════════ STATE 2: SIGN-IN & REGISTER FORMS ═══════════ */
                  <motion.div 
                    key="tabs-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* SILKY SMOOTH SEGMENTED CONTROL */}
                    <div className="ap-segmented-tabs">
                      <button 
                        type="button" 
                        className={`ap-seg-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                          setTab('login');
                          setErrorMessage(null);
                          setIsOperationNotAllowed(false);
                        }}
                      >
                        {tab === 'login' && (
                          <motion.div 
                            className="ap-seg-active-pill" 
                            layoutId="portal-tab-indicator"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span className="ap-seg-tab-label">Giriş Yap</span>
                      </button>
                      <button 
                        type="button" 
                        className={`ap-seg-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => {
                          setTab('register');
                          setErrorMessage(null);
                          setIsOperationNotAllowed(false);
                        }}
                      >
                        {tab === 'register' && (
                          <motion.div 
                            className="ap-seg-active-pill" 
                            layoutId="portal-tab-indicator"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span className="ap-seg-tab-label">Kayıt Ol</span>
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

                    {/* Operation Not Allowed Notice Card (with Console Link & Simulation) */}
                    {isOperationNotAllowed && (
                      <div className="ap-operation-card">
                        <div className="ap-operation-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" strokeWidth="2.2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Firebase Konsolunda E-posta/Şifre'yi Açın</span>
                        </div>
                        <p className="ap-operation-desc">
                          Firebase projenizde (<code>grafik-motoru</code>) E-posta ile kayıt yöntemi henüz aktif edilmemiş. 
                          Konsoldan <strong>Authentication → Sign-in method → Email/Password</strong> seçeneğini "Enable" yapıp kaydedin.
                        </p>
                        <div className="ap-operation-actions">
                          <a 
                            href="https://console.firebase.google.com/project/grafik-motoru/authentication/providers" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="ap-btn-console"
                          >
                            <span>Firebase Konsolunu Aç ↗</span>
                          </a>
                          <button
                            type="button"
                            className="ap-btn-sim"
                            onClick={() => {
                              setIsSimulationMode(true);
                              setVerificationEmail(regEmail.trim() || loginEmail.trim() || 'kullanici@ornek.com');
                              setVerificationPending(true);
                              setResendCooldown(30);
                              setVerifyCheckStatus('Test Modu Aktif: Doğrulama ekranı ve adımları simüle edilmektedir.');
                            }}
                          >
                            <span>🧪 Önizleme Modunda Doğrulamayı Test Et</span>
                          </button>
                        </div>
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

                    {/* ────── TAB 1: GİRİŞ YAP (SIGN IN) ────── */}
                    {tab === 'login' && (
                      <form onSubmit={handleLoginSubmit} className="ap-form">
                        <div className="ap-field">
                          <div className="ap-label-row">
                            <label htmlFor="login-email">E-POSTA ADRESİ VEYA KULLANICI ADI</label>
                          </div>
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
                              placeholder="adiniz@sirketiniz.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-field">
                          <div className="ap-label-row">
                            <label htmlFor="login-password">GÜVENLİ ŞİFRE</label>
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
                            <span>Oturumumu açık tut</span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="ap-btn-primary ap-btn-shimmer" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="ap-spinner" />
                          ) : (
                            <>
                              <span>Portala Giriş Yap</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ────── TAB 2: KAYIT OL (SIGN UP) ────── */}
                    {tab === 'register' && (
                      <form onSubmit={handleRegisterSubmit} className="ap-form">
                        <div className="ap-field">
                          <label htmlFor="reg-name">AD SOYAD / KULLANICI ADI</label>
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
                          <label htmlFor="reg-email">KURUMSAL E-POSTA ADRESİ</label>
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
                              placeholder="adiniz@sirketiniz.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="ap-field">
                          <div className="ap-label-row">
                            <label htmlFor="reg-password">GÜVENLİ ŞİFRE</label>
                            {regPassword && (
                              <span className="ap-pass-strength-label" style={{ color: passStrength.color }}>
                                {passStrength.label}
                              </span>
                            )}
                          </div>
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

                          {/* Dynamic Password Strength Progress Bar */}
                          {regPassword && (
                            <div className="ap-pass-meter-track">
                              <div 
                                className="ap-pass-meter-bar" 
                                style={{ width: passStrength.width, background: passStrength.color }} 
                              />
                            </div>
                          )}
                        </div>

                        <div className="ap-field">
                          <label htmlFor="reg-password-confirm">ŞİFRE TEKRARI</label>
                          <div className="ap-input-wrap">
                            <svg className="ap-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <input 
                              id="reg-password-confirm"
                              type={showRegPassword ? "text" : "password"}
                              value={regPasswordConfirm}
                              onChange={(e) => setRegPasswordConfirm(e.target.value)}
                              placeholder="Şifrenizi tekrar doğrulayın"
                              autoComplete="new-password"
                              required
                            />
                            {regPasswordConfirm && (
                              <span className="ap-match-indicator">
                                {regPassword === regPasswordConfirm ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                              </span>
                            )}
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
                              <span className="ap-highlight">Kullanım Koşulları</span> ve <span className="ap-highlight">Gizlilik Politikasını</span> okudum, onaylıyorum.
                            </span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="ap-btn-primary ap-btn-shimmer" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="ap-spinner" />
                          ) : (
                            <>
                              <span>Hesap Oluştur ve E-postamı Doğrula</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ────── TACTILE DIVIDER ────── */}
                    <div className="ap-divider">
                      <span className="ap-divider-line" />
                      <span className="ap-divider-text">veya Google ile tek tıkla devam et</span>
                      <span className="ap-divider-line" />
                    </div>

                    {/* ────── ELEVATED GOOGLE BUTTON ────── */}
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
                      <span>Google Hesabı ile Hızlı Giriş</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </main>

      {/* ═══════════ LUXURY FORGOT PASSWORD MODAL ═══════════ */}
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
                Kayıtlı e-posta adresinizi girin. Size şifrenizi anında ve güvenle sıfırlayabileceğiniz bir bağlantı göndereceğiz.
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
                  <label htmlFor="forgot-email">KAYITLI E-POSTA ADRESİ</label>
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
                      placeholder="adiniz@sirketiniz.com"
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
                    className="ap-btn-primary ap-btn-shimmer"
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
