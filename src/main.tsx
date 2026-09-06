import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#1D1D1F',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#252528',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,69,58,0.15)',
              color: '#FF453A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Beklenmeyen Bir Durum Oluştu
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: 1.5 }}>
              Uygulama beklenmedik bir hatayla karşılaştı. Kaydedilen çalışmalarınız korunur; yeniden yükleyerek tekrar deneyebilirsiniz.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#FF6B1A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Uygulamayı Yeniden Başlat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

// Gracefully hide the native loader after React has mounted and painted
setTimeout(() => {
  const loader = document.getElementById('native-loader');
  if (loader) {
    loader.classList.add('ds-hidden');
    // Remove it from the DOM after the 600ms CSS fade-out transition
    setTimeout(() => loader.remove(), 600);
  }
}, 50);
