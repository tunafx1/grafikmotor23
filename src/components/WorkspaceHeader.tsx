import { ChevronRight, Download, Moon, Sun, Wrench, CloudUpload, LogIn, LogOut, Loader2, HardDrive } from 'lucide-react';

type Props = {
  templateName: string; isDark: boolean; onTheme: () => void;
  isSigningIn?: boolean; userName: string | null; cloudStatus: string; isCloudSynced: boolean;
  onLogin: () => void; onLogout: () => void; onSave: () => void;
  onTools: () => void; onExport: () => void; exportPanelOpen: boolean;
};

export function WorkspaceHeader(p: Props) {
  return (
    <header id="app-header" className="workspace-header">
      <div className="workspace-brand">
        <div className="workspace-mark">
          <img src="/grafik_motoru_icon_512.png" alt="Grafik Motoru" className="workspace-logo-img" />
        </div>
        <span>grafik<span className="brand-light">motoru</span><small>TASARIM STÜDYOSU</small></span>
      </div>

      <div className="workspace-breadcrumb">
        <span className="workspace-breadcrumb-root">Çalışmalarım</span>
        <ChevronRight size={13} className="opacity-40" />
        <strong title={p.templateName}>{p.templateName}</strong>
      </div>

      <div className="workspace-header-actions">
        <div className="workspace-save-status" role="status">
          {p.cloudStatus === 'syncing' ? (
            <span className="ws-status-badge syncing">
              <Loader2 size={13} className="animate-spin text-[#FF6B1A]"/>
              <span>Eşitleniyor</span>
            </span>
          ) : p.userName && p.isCloudSynced && p.cloudStatus === 'synced' ? (
            <span className="ws-status-badge synced">
              <span className="ws-status-dot-green" />
              <span>Buluta kaydedildi</span>
            </span>
          ) : (
            <span className="ws-status-badge local">
              <HardDrive size={13}/>
              <span>Yerel çalışma</span>
            </span>
          )}
        </div>

        {p.userName && (!p.isCloudSynced || p.cloudStatus === 'error') && (
          <button className="workspace-button ws-save-btn" onClick={p.onSave}>
            <CloudUpload size={15}/>
            <span>Kaydet</span>
          </button>
        )}

        <button className="workspace-icon-button" onClick={p.onTools} title="Medya araçları" aria-label="Medya araçları">
          <Wrench size={16}/>
        </button>

        <button className="workspace-icon-button" onClick={p.onTheme} title={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'} aria-label={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}>
          {p.isDark ? <Sun size={16}/> : <Moon size={16}/>}
        </button>

        <button 
          className="workspace-button workspace-account" 
          disabled={p.isSigningIn} 
          aria-busy={p.isSigningIn} 
          onClick={p.userName ? p.onLogout : p.onLogin} 
          title={p.userName ? `${p.userName} — çıkış yap` : 'Giriş yap'}
        >
          {p.isSigningIn ? <Loader2 size={15} className="animate-spin"/> : p.userName ? <LogOut size={15}/> : <LogIn size={15}/>}
          <span>{p.isSigningIn ? 'Giriş yapılıyor…' : p.userName || 'Giriş yap'}</span>
        </button>

        <button 
          className="workspace-button workspace-primary ws-export-btn" 
          onClick={p.onExport} 
          aria-label="Dışa aktar" 
          aria-expanded={p.exportPanelOpen}
        >
          <Download size={15}/>
          <span>Dışa aktar</span>
        </button>
      </div>
    </header>
  );
}
