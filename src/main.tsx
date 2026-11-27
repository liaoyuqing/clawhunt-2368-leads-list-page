import React from 'react';
import ReactDOM from 'react-dom/client';
import 'tdesign-react/es/style/index.css';
import './styles.css';
import App from './App';

async function bootstrap() {
  if (import.meta.env.MODE !== 'test') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('root element not found');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
