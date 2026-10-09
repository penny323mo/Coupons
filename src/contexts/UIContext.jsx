import { createContext, useContext, useState, useCallback, useRef } from 'react'

const UIContext = createContext(null)

/** App-wide glass toast and the shared "record voucher" sheet. */
export function UIProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [addFor, setAddFor] = useState(null) // null = closed, {} = open, { platform } = preset
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    clearTimeout(timer.current)
    setToast({ text, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <UIContext.Provider value={{ toast, showToast, addFor, openAdd: (preset = {}) => setAddFor(preset), closeAdd: () => setAddFor(null) }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  return useContext(UIContext)
}
