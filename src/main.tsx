import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { startBackgroundSync } from '@services/sync';

// Le service worker (vite-plugin-pwa) est enregistré par PWAUpdatePrompt,
// qui propose la mise à jour quand une nouvelle version est disponible.

// Rejoue les créations enregistrées hors ligne (au démarrage, au retour du
// réseau et périodiquement).
startBackgroundSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
