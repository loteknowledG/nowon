import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateServiceWorker = registerSW({
  onNeedRefresh() {
    // simple UX for demo — replace with your own update UI
    if (confirm('New version available — update now?')) updateServiceWorker(true);
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);