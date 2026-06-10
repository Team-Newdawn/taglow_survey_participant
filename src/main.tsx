import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { escapeEmbeddedContext, recordAuthDiagnosticsFromWindow } from './view/participant/auth/authDiagnostics';

// The school portal links to the survey inside an iframe, where Google OAuth is
// blocked. Break out to a top-level page first; if a sandbox forbids it, continue
// booting so the login page can offer a "open in new window" fallback.
if (escapeEmbeddedContext() !== 'escaped') {
  // Snapshot any OAuth error / blocked storage before Supabase clears the URL hash
  // and the access guard bounces an unauthenticated visitor back to /login.
  recordAuthDiagnosticsFromWindow();

  const root = document.getElementById('root');

  if (!root) {
    throw new Error('Root element was not found.');
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
