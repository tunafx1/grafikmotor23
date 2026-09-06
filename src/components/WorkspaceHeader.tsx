import { Layers, ChevronRight, Download, Moon, Sun, Wrench, CloudUpload, LogIn, LogOut, Check, Loader2, HardDrive } from 'lucide-react';

type Props = {
  templateName: string; isDark: boolean; onTheme: () => void;
  isSigningIn?: boolean; userName: string | null; cloudStatus: string; isCloudSynced: boolean;
  onLogin: () => void; onLogout: () => void; onSave: () => void;
  onTools: () => void; onExport: () => void; exportPanelOpen: boolean;
};

export function WorkspaceHeader(p: Props) {
  return <header id="app-header" className="workspace-header">
    <div className="workspace-brand"><div className="workspace-mark"><Layers size={22}/></div><span>grafik<span className="brand-light">motoru</span><small>TASARIM STÜDYOSU</small></span></div>
    <div className="workspace-breadcrumb"><span>Çalışmalarım</span><ChevronRight size={14}/><strong title={p.templateName}>{p.templateName}</strong></div>
    <div className="workspace-header-actions">
      <span className="workspace-save-status" role="status">
        {p.cloudStatus === 'syncing' ? <><Loader2 size={14} className="animate-spin"/>Eşitleniyor</> : p.userName && p.isCloudSynced && p.cloudStatus === 'synced' ? <><Check size={14}/>Buluta kaydedildi</> : <><HardDrive size={14}/>Yerel çalışma</>}
      </span>
      {p.userName && (!p.isCloudSynced || p.cloudStatus === 'error') && <button className="workspace-button" onClick={p.onSave}><CloudUpload size={16}/><span>Kaydet</span></button>}
      <button className="workspace-icon-button" onClick={p.onTools} title="Medya araçları" aria-label="Medya araçları"><Wrench size={17}/></button>
      <button className="workspace-icon-button" onClick={p.onTheme} title={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'} aria-label={p.isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}>{p.isDark ? <Sun size={17}/> : <Moon size={17}/>}</button>
      <button className="workspace-button workspace-account" disabled={p.isSigningIn} aria-busy={p.isSigningIn} onClick={p.userName ? p.onLogout : p.onLogin} title={p.userName ? `${p.userName} — çıkış yap` : 'Bulut kaydı için Google ile giriş yap'}>{p.isSigningIn ? <Loader2 size={16} className="animate-spin"/> : p.userName ? <LogOut size={16}/> : <LogIn size={16}/>}<span>{p.isSigningIn ? 'Giriş yapılıyor…' : p.userName || 'Giriş yap'}</span></button>
      <button className="workspace-button workspace-primary" onClick={p.onExport} aria-label="Dışa aktar" aria-expanded={p.exportPanelOpen}><Download size={16}/><span>Dışa aktar</span></button>
    </div>
  </header>;
}
