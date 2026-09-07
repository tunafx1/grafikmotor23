import { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ChevronRight, Download, Moon, Sun, Wrench, CloudUpload, LogIn, Loader2, HardDrive, Pencil, Undo2, Redo2 } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

type Props = {
  templateName: string; isDark: boolean; onTheme: () => void;
  isSigningIn?: boolean; userName: string | null; user?: FirebaseUser | null; cloudStatus: string; isCloudSynced: boolean;
  onLogin: () => void; onLogout: () => void; onSave: () => void;
  onTools?: () => void; onExport: () => void; exportPanelOpen?: boolean;
  onRename?: (newName: string) => void;
  onUserUpdated?: () => void;
  onOpenTemplates?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

export function WorkspaceHeader(p: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(p.templateName);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(p.templateName);
  }, [p.templateName]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== p.templateName && p.onRename) {
      p.onRename(trimmed);
    } else {
      setTempName(p.templateName);
    }
  };

  const activeUser = p.user && !p.user.isAnonymous ? p.user : null;
  const initialLetter = activeUser ? ((activeUser.displayName || activeUser.email || 'K')[0]).toUpperCase() : 'K';

  return (
    <>
      <header id="app-header" className="workspace-header">
        <div className="workspace-brand">
          <div className="workspace-mark">
            <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" className="workspace-logo-img" />
          </div>
          <span>grafik<span className="brand-light">motoru</span><small>TASARIM STÜDYOSU</small></span>
        </div>

        <div className="workspace-breadcrumb">
          <button
            type="button"
            onClick={p.onOpenTemplates}
            className="workspace-breadcrumb-root hover:text-[#FF6B1A] transition flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
            title="Şablonlarım & Çalışmalarım Menüsünü Aç"
          >
            <span>Çalışmalarım</span>
          </button>
          <ChevronRight size={13} className="opacity-40" />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="workspace-title-inline-input"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCommit();
                if (e.key === 'Escape') {
                  setTempName(p.templateName);
                  setIsEditing(false);
                }
              }}
              onBlur={handleCommit}
              maxLength={60}
            />
          ) : (
            <button
              type="button"
              className="workspace-title-btn"
              onClick={() => p.onRename && setIsEditing(true)}
              title={p.onRename ? 'Tasarım adını düzenlemek için tıklayın' : p.templateName}
            >
              <strong title={p.templateName}>{p.templateName}</strong>
              {p.onRename && <Pencil size={11} className="workspace-title-pencil" />}
            </button>
          )}
        </div>

        <div className="workspace-header-actions">
          {/* Undo / Redo */}
          {p.onUndo && (
            <button
              type="button"
              className="workspace-icon-button disabled:opacity-30"
              onClick={p.onUndo}
              disabled={!p.canUndo}
              title="Geri Al (Cmd/Ctrl + Z)"
              aria-label="Geri Al"
            >
              <Undo2 size={15} />
            </button>
          )}
          {p.onRedo && (
            <button
              type="button"
              className="workspace-icon-button disabled:opacity-30"
              onClick={p.onRedo}
              disabled={!p.canRedo}
              title="İleri Al (Cmd/Ctrl + Y)"
              aria-label="İleri Al"
            >
              <Redo2 size={15} />
            </button>
          )}

          {/* Unified Save Status */}
          <div className="workspace-save-status" role="status">
            {p.cloudStatus === 'syncing' ? (
              <span className="ws-status-badge syncing">
                <Loader2 size={13} className="animate-spin text-[#FF6B1A]"/>
                <span>Kaydediliyor...</span>
              </span>
            ) : p.userName && p.isCloudSynced && p.cloudStatus === 'synced' ? (
              <span className="ws-status-badge synced">
                <span className="ws-status-dot-green" />
                <span>Buluta kaydedildi</span>
              </span>
            ) : p.cloudStatus === 'error' ? (
              <span className="ws-status-badge error text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />
                <span>Kaydetme başarısız</span>
              </span>
            ) : (
              <span className="ws-status-badge local">
                <HardDrive size={13}/>
                <span>Bu cihazda kayıtlı</span>
              </span>
            )}
          </div>

          {p.userName && (!p.isCloudSynced || p.cloudStatus === 'error') && (
            <button className="workspace-button ws-save-btn" onClick={p.onSave}>
              <CloudUpload size={15}/>
              <span>Kaydet</span>
            </button>
          )}

          {p.onTools && (
            <button className="workspace-icon-button" onClick={p.onTools} title="Medya araçları" aria-label="Medya araçları">
              <Wrench size={16}/>
            </button>
          )}

          <button className="workspace-icon-button" onClick={p.onTheme} title={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'} aria-label={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}>
            {p.isDark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>

          {/* Profile Avatar Button if logged in, or Login button if guest */}
          {activeUser ? (
            <button 
              type="button" 
              className="workspace-profile-btn" 
              onClick={() => setIsProfileOpen(true)}
              title={`${activeUser.displayName || activeUser.email || 'Hesabım'} — Profil ve Şifre Ayarları`}
              aria-label="Profil ve Şifre Ayarları"
            >
              {activeUser.photoURL ? (
                <img 
                  src={activeUser.photoURL} 
                  alt={activeUser.displayName || 'Profil'} 
                  className="ws-avatar-img" 
                />
              ) : (
                <div className="ws-avatar-fallback">
                  {initialLetter}
                </div>
              )}
              <span className="ws-profile-dot-online" />
            </button>
          ) : (
            <button 
              className="workspace-button workspace-account" 
              disabled={p.isSigningIn} 
              aria-busy={p.isSigningIn} 
              onClick={p.onLogin} 
              title="Giriş yap"
            >
              {p.isSigningIn ? <Loader2 size={15} className="animate-spin"/> : <LogIn size={15}/>}
              <span>{p.isSigningIn ? 'Giriş yapılıyor…' : 'Giriş yap'}</span>
            </button>
          )}

          {/* Prominent Download Button */}
          <button 
            className="workspace-button workspace-primary ws-export-btn" 
            onClick={p.onExport} 
            aria-label="İndir" 
          >
            <Download size={15}/>
            <span>İndir</span>
          </button>
        </div>
      </header>

      {/* Account Settings & Password Management Modal */}
      {activeUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={activeUser}
          onLogout={p.onLogout}
          onUserUpdated={p.onUserUpdated}
        />
      )}
    </>
  );
}
