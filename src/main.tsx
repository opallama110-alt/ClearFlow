import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/inter'
import './index.css'
import './App.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import UpdateBanner from './components/UpdateBanner'
import { reportError } from './firebase'
import { ConfirmProvider } from './hooks/useConfirm'
import './hooks/useInstallPrompt'
import { ToastProvider } from './hooks/useToast'
import { applyTheme, readThemePreference } from './hooks/useTheme'
import { registerServiceWorker } from './registerServiceWorker'

applyTheme(readThemePreference())

window.addEventListener('error', (event) => reportError(event.error ?? event.message, 'window-error'))
window.addEventListener('unhandledrejection', (event) => reportError(event.reason, 'unhandled-rejection'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <App />
          <UpdateBanner />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)

registerServiceWorker()
