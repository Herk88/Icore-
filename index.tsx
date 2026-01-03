
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// CRITICAL: Unregister legacy service workers to prevent old app from loading
// Wrapped in a function and try-catch to handle "document in invalid state" errors
const unregisterLegacyServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering legacy service worker:', registration);
        registration.unregister();
      }
    } catch (error) {
      console.warn('Service Worker unregistration failed (non-critical):', error);
    }
  }
};

// Execute when safe to ensure document state is valid
if (document.readyState === 'complete') {
  unregisterLegacyServiceWorkers();
} else {
  window.addEventListener('load', unregisterLegacyServiceWorkers);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
