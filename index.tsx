import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Request periodic background sync (if supported)
        if ('periodicSync' in registration && (registration as any).periodicSync) {
          (registration as any).periodicSync.register('check-alarms', {
            minInterval: 60000 // Check every minute
          }).then(() => {
            console.log('[PWA] Periodic background sync registered');
          }).catch((err: any) => {
            console.log('[PWA] Periodic sync not supported:', err);
          });
        }
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);