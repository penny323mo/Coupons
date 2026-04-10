import { createContext, useContext, useState, useEffect } from 'react'
import { t } from '../i18n/translations'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('lang') || 'zh'
  })

  function setLang(l) {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  const tr = t[lang]

  return (
    <LangContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
