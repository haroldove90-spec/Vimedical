import React from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">Algo salió mal</h1>
          <p className="text-slate-400 mb-8 max-w-md">La aplicación encontró un error inesperado. Por favor, intenta recargar la página.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            Reiniciar y Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
