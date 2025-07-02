
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from './components/providers/QueryProvider.tsx'

// Note: We're not initializing PostHog here because we're using the PostHogProvider
// in App.tsx which handles the initialization for us

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <App />
  </QueryProvider>
);
