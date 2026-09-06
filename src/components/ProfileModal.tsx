import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { X, ShieldCheck, KeyRound, LogOut, Check, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { setOrUpdateAccountPassword, getAuthErrorMessage } from '../lib/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onUserUpdated?: () => void;
}

export function ProfileModal({ isOpen, onClose, user, onLogout, onUserUpdated }: ProfileModalProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
  const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');

  const displayName = user.displayName || 'Kullanıcı';
  const email = user.email || '';
  const initialLetter = (displayName[0] || email[0] || 'K').toUpperCase();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await setOrUpdateAccountPassword(password);
      if (res.isLinked) {
        setSuccessMessage('Harika! Şifreniz başarıyla oluşturuldu ve hesabınıza bağlandı. Artık hem Google ile hem de e-posta ve bu şifrenizle giriş yapabilirsiniz.');
      } else {
        setSuccessMessage('Şifreniz başarıyla güncellendi.');
      }
      setPassword('');
      setPasswordConfirm('');
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      console.error('Password linking error:', err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="ap-dialog-backdrop" onClick={onClose} style={{ zIndex: 99999 }}>
        <motion.div
          className="ap-dialog-card ws-profile-dialog"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            maxWidth: '480px',
            width: '92%',
            backgroundColor: '#1E1E20',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
            padding: '28px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} className="text-[#FF6B1A]" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>Hesap & Profil</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Info Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            marginBottom: '22px'
          }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255, 107, 0, 0.6)'
                }}
              />
            ) : (
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF8B3D 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)'
              }}>
                {initialLetter}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {email}
              </div>
              
              {/* Provider Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {hasGoogleProvider && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(66, 133, 244, 0.15)',
                    color: '#8AB4F8',
                    border: '1px solid rgba(66, 133, 244, 0.3)'
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Google Bağlı
                  </span>
                )}
                {hasPasswordProvider ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#86EFAC',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <ShieldCheck size={11} />
                    Şifre Tanımlı
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(255, 107, 0, 0.15)',
                    color: '#FFB27D',
                    border: '1px solid rgba(255, 107, 0, 0.3)'
                  }}>
                    <KeyRound size={11} />
                    Şifresiz (Yalnızca Google)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Linking / Password Setup Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <KeyRound size={16} className="text-[#FF6B1A]" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                {hasPasswordProvider ? 'Şifrenizi Güncelleyin' : 'Hesabınıza Şifre Tanımlayın'}
              </h4>
            </div>
            
            <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
              {hasPasswordProvider 
                ? 'E-posta ve şifrenizle giriş yaparken kullandığınız şifreyi buradan güncelleyebilirsiniz.' 
                : 'Hesabınız Google ile bağlı. Aşağıdan bir şifre belirleyerek sonraki oturumlarınızda Google butonunun yanı sıra e-posta ve şifrenizle de doğrudan giriş yapabilirsiniz.'}
            </p>

            {successMessage && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#86EFAC',
                fontSize: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '14px',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <Check size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '14px',
                lineHeight: 1.4
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '5px' }}>
                  {hasPasswordProvider ? 'Yeni Şifre' : 'Belirlemek İstediğiniz Şifre'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 40px 0 12px',
                      background: '#141416',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.45)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '5px' }}>
                  Şifre Tekrar
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Şifrenizi tekrar yazın"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 40px 0 12px',
                      background: '#141416',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.45)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label="Şifreyi tekrar göster/gizle"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                style={{
                  width: '100%',
                  height: '42px',
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FF8B3D 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isLoading || !password ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !password ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>{hasPasswordProvider ? 'Şifreyi Güncelle' : 'Şifre Oluştur ve Hesaba Bağla'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#FCA5A5',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut size={13} />
              <span>Oturumu Kapat</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
