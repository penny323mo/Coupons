import { createContext, useContext, useState, useCallback, useRef } from 'react'

const UIContext = createContext(null)

/** App-wide glass toast (optionally with an undo action) and the shared "record voucher" sheet. */
export function UIProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [addFor, setAddFor] = useState(null) // null = closed, {} = open, { platform } = preset
  const timer = useRef(null)

  const hideToast = useCallback(() => { clearTimeout(timer.current); setToast(null) }, [])

  const showToast = useCallback((text, action, tone = 'ok') => {
    clearTimeout(timer.current)
    setToast({ text, action, tone, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), action || tone === 'error' ? 5000 : 2600)
  }, [])

  return (
    <UIContext.Provider value={{
      toast, showToast, hideToast,
      addFor, openAdd: (preset = {}) => setAddFor(preset), closeAdd: () => setAddFor(null),
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  return useContext(UIContext)
}
