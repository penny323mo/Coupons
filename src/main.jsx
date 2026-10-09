import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { CouponsProvider } from './contexts/CouponsContext'
import { UIProvider } from './contexts/UIContext'
import { startLens } from './lib/lens'
import { supabase } from './lib/supabase'
import App from './App'
import './styles.css'

// OAuth and email links return tokens in the URL hash, which HashRouter also uses.
// Let Supabase read them first, then hand the hash back to the router.
async function readAuthCallback() {
  if (!/(access_token|error_description)=/.test(window.location.hash)) return
  const failure = new URLSearchParams(window.location.hash.slice(1)).get('error_description')
  await supabase.auth.getSession()
  if (failure) sessionStorage.setItem('authError', failure)
  history.replaceState(null, '', `${window.location.pathname}${failure ? '#/login' : '#/'}`)
}

readAuthCallback().finally(() => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LangProvider>
        <AuthProvider>
          <CouponsProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </CouponsProvider>
        </AuthProvider>
      </LangProvider>
    </HashRouter>
  </React.StrictMode>
))

startLens(`${import.meta.env.BASE_URL}backdrop.svg`)
