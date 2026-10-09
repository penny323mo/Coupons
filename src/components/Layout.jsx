import { Outlet } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { currentCampaign, campaignState, campaignWeek, roundNumber, isClaimDay } from '../lib/dates'
import { useAuth } from '../contexts/AuthContext'
import { enabledPlatforms } from '../lib/platforms'
import Dock from './Dock'
import AddCouponSheet from './AddCouponSheet'
import { Toast } from './ui'

const BASE = import.meta.env.BASE_URL

export function StatePill() {
  const { lang, tr } = useLang()
  const campaign = currentCampaign()
  const state = campaignState(campaign)
  const today = new Date()
  let text, cls
  if (state === 'before') { text = tr.pillBefore; cls = '' }
  else if (state === 'after') { text = tr.pillAfter; cls = '' }
  else if (isClaimDay(today)) { text = tr.pillClaim; cls = 'claim' }
  else {
    const usable = campaign.anyDayUse || (today.getDay() >= 1 && today.getDay() <= 4)
    text = usable ? tr.pillUse : tr.todayIdle
    cls = usable ? 'online' : ''
  }
  return <span className={`pill state-pill ${cls}`} title={campaign.name[lang]}>{text}</span>
}

export default function Layout() {
  const { lang, tr } = useLang()
  const { addFor, openAdd } = useUI()
  const { profile } = useAuth()
  const campaign = currentCampaign()
  const hasWallets = enabledPlatforms(profile).length > 0
  const roundLine = [
    tr.round(roundNumber(campaign)),
    campaign.short[lang],
    campaignState(campaign) === 'active' ? tr.weekOf(campaignWeek(campaign), campaign.weeks) : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href={`${BASE}#/`} aria-label={tr.appName}>
          <img className="app-icon" src={`${BASE}icon.svg`} alt="" />
          <span className="brand-text">
            <span className="brand-name">{tr.appName}</span>
            <small>{roundLine}</small>
          </span>
        </a>
        <button type="button" className="capsule lens add-btn" onClick={() => openAdd()} disabled={!hasWallets}>
          {tr.record}
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <Dock />
      <Toast />
      {addFor && <AddCouponSheet preset={addFor} />}
    </div>
  )
}
