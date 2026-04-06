import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("GlobalErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h1 style={{ fontSize: '30px', fontWeight: '900', marginBottom: '16px' }}>Error de Inicialización</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '448px' }}>
            La aplicación no pudo iniciar correctamente. 
            <br />
            <span style={{ fontSize: '12px', color: '#f87171', marginTop: '8px', display: 'block' }}>
              {this.state.error?.message || 'Error desconocido'}
            </span>
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              backgroundColor: '#3C6B94',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '16px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(60, 107, 148, 0.2)'
            }}
          >
            Limpiar Caché y Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error:', err));
  });
}

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error Caught:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h2>Error de Carga</h2>
        <p>${message}</p>
        <button onclick="localStorage.clear(); location.reload();">Limpiar y Reintentar</button>
      </div>
    `;
  }
  return false;
};

console.log('Main.tsx: Starting execution');

const rootElement = document.getElementById('root');
console.log('Main.tsx: Root element found:', !!rootElement);

if (rootElement) {
  try {
    console.log('Main.tsx: Attempting to render App');
    createRoot(rootElement).render(
      <StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </StrictMode>,
    );
    console.log('Main.tsx: Render call completed');
  } catch (err) {
    console.error('Main.tsx: Render failed:', err);
  }
} else {
  console.error('Main.tsx: Root element NOT found in DOM');
}
