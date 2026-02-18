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

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
