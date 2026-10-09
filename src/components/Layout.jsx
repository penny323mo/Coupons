import { Outlet } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { currentCampaign, campaignState, isClaimDay } from '../lib/dates'
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
  const { addFor } = useUI()
  const campaign = currentCampaign()

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href={`${BASE}#/`} aria-label={tr.appName}>
          <span className="logo"><img src={`${BASE}icon.svg`} alt="" /></span>
          <span className="brand-text">
            <span className="brand-name">{tr.appName}</span>
            <small>{campaign.name[lang]}</small>
          </span>
        </a>
        <StatePill />
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
