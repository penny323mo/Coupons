import { NavLink, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

const icons = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" {...stroke} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" {...stroke} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" {...stroke} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" {...stroke} />
    </svg>
  ),
  coupons: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M3.5 7.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5Z" {...stroke} />
      <path d="M14.5 6v1.6M14.5 11.2v1.6M14.5 16.4V18" {...stroke} />
    </svg>
  ),
  calc: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="5" y="2.8" width="14" height="18.4" rx="3" {...stroke} />
      <path d="M8.5 7h7M8.5 11.5h1M12 11.5h0M15.5 11.5h0M8.5 15h1M12 15h0M15.5 15v2.4M8.5 18h1M12 18h0" {...stroke} />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" width="21" height="21" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d="M16.52 7.45 L18.83 8.24 L18.83 11.76 L16.52 12.55 L16.41 12.81 L17.48 15.00 L15.00 17.48 L12.81 16.41 L12.55 16.52 L11.76 18.83 L8.24 18.83 L7.45 16.52 L7.19 16.41 L5.00 17.48 L2.52 15.00 L3.59 12.81 L3.48 12.55 L1.17 11.76 L1.17 8.24 L3.48 7.45 L3.59 7.19 L2.52 5.00 L5.00 2.52 L7.19 3.59 L7.45 3.48 L8.24 1.17 L11.76 1.17 L12.55 3.48 L12.81 3.59 L15.00 2.52 L17.48 5.00 L16.41 7.19 Z M12.90 10 A2.9 2.9 0 1 0 7.10 10 A2.9 2.9 0 1 0 12.90 10 Z" />
    </svg>
  ),
}

const TABS = [
  { to: '/',         key: 'home' },
  { to: '/coupons',  key: 'coupons' },
  { to: '/calc',     key: 'calc' },
  { to: '/settings', key: 'settings' },
]

export default function Dock() {
  const { tr } = useLang()
  const { pathname } = useLocation()
  const index = Math.max(TABS.findIndex(t => t.to === pathname), 0)

  return (
    <nav className="dock lens" aria-label="Main" style={{ '--n': TABS.length, '--i': index }}>
      <span className="dock-thumb" aria-hidden="true" />
      {TABS.map(({ to, key }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'selected' : ''}>
          {icons[key]}
          <span>{tr[key]}</span>
        </NavLink>
      ))}
    </nav>
  )
}
