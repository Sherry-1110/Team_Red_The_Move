import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { SavedMovesProvider } from './contexts/SavedMovesContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SavedMovesProvider>
        <App />
      </SavedMovesProvider>
    </AuthProvider>
  </StrictMode>,
)
