import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./utils/logger";

// Global error handler for uncaught errors
window.onerror = function(message, source, lineno, colno, error) {
  logger.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

// Global handler for unhandled promise rejections
window.onunhandledrejection = function(event) {
  logger.error('Unhandled rejection:', event.reason);
};

// Service Worker Registration - Trekker's Ghost Mode
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.log('[GonePal] Ghost Mode activated:', registration.scope);
      })
      .catch((error) => {
        logger.log('[GonePal] Ghost Mode failed:', error);
      });
  });
}

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  logger.error('Failed to render app:', error);
  document.getElementById("root")!.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1>Something went wrong</h1>
      <p>Please refresh the page or try again later.</p>
    </div>
  `;
}
