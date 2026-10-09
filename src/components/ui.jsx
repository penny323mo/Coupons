import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUI } from '../contexts/UIContext'

/** Glass segmented control with a sliding thumb. */
export function Segmented({ options, value, onChange, label, className = '' }) {
  const index = Math.max(options.findIndex(o => o.value === value), 0)
  return (
    <div className={`seg ${className}`} role="tablist" aria-label={label}
      style={{ '--n': options.length, '--i': index }}>
      <span className="seg-thumb" aria-hidden="true" />
      {options.map(o => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** iOS-style switch (a checkbox underneath, so it stays accessible). */
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <input type="checkbox" className="switch" role="switch" aria-label={label}
      checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
  )
}

/** Thin battery-style meter. tone: green | orange | red | blue */
export function Battery({ value, max, tone = 'green' }) {
  const pct = max > 0 ? Math.min(value / max, 1) * 100 : 0
  return (
    <div className="battery" data-tone={tone} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Glass alert sheet. Closes on backdrop tap and Escape. */
export function Sheet({ title, onClose, children, className = '' }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('sheet-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('sheet-open')
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Top-of-screen glass toast with a green tick. */
export function Toast() {
  const { toast, hideToast } = useUI()
  if (!toast) return null
  return (
    <div key={toast.key} className={`toast show${toast.action ? ' with-action' : ''}${toast.tone === 'error' ? ' error' : ''}`}
      role={toast.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="tick" aria-hidden="true">{toast.tone === 'error' ? '!' : '✓'}</span>
      <span className="toast-text">{toast.text}</span>
      {toast.action && (
        <button type="button" onClick={() => { hideToast(); toast.action.run() }}>{toast.action.label}</button>
      )}
    </div>
  )
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}
