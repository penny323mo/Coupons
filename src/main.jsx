import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { CouponsProvider } from './contexts/CouponsContext'
import { UIProvider } from './contexts/UIContext'
import { startLens } from './lib/lens'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
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
)

startLens(`${import.meta.env.BASE_URL}backdrop.svg`)
