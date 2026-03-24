import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

console.log('Main.tsx executing...');
const rootElement = document.getElementById('root')!;

if (!rootElement) {
  console.error('Root element not found!');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
console.log('App rendered.');
