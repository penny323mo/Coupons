import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { PLATFORMS, enabledPlatforms } from '../lib/platforms'
import {
  currentCampaign, campaignState, campaignWeek, isClaimDay, isInClaimWindow, claimWindow,
  effectiveStatus, couponKind, canUseOn, getExpiryDate, parseDate, formatDay, WEEKLY_CLAIMS,
  roundNumber, archivedCampaigns, couponsOfCampaign, roundStats,
} from '../lib/dates'
import CouponRow from '../components/CouponRow'
import { Battery, Spinner } from '../components/ui'

function WalletCard({ platform, coupons }) {
  const { lang, tr } = useLang()
  const { openAdd } = useUI()
  const navigate = useNavigate()
  const info = PLATFORMS[platform]
  const claimed = coupons.filter(c => couponKind(c) === 'gov' && isInClaimWindow(c)).length
  const active = coupons.filter(c => effectiveStatus(c) === 'unused')
  const activeGov = active.filter(c => couponKind(c) === 'gov')
  const activeTotal = activeGov.reduce((s, c) => s + c.face_value, 0)
  const usable = active.some(c => canUseOn(c))
  const usableGov = activeGov.some(c => canUseOn(c))
  const full = claimed >= WEEKLY_CLAIMS

  return (
    <article className={`card wallet${usable ? ' active' : ''}`}>
      <div className="card-top">
        <span className="wallet-dot" style={{ '--tint': info.tint }} aria-hidden="true" />
        <span className="account-identity">
          <span className="account-name">{info[lang]}</span>
        </span>
        {full && <span className="badge">{tr.full}</span>}
      </div>
      <div className="quota">
        <div className="quota-head"><strong>{claimed}<em>/{WEEKLY_CLAIMS}</em></strong><span>{tr.claimedThisWeek}</span></div>
        <Battery value={claimed} max={WEEKLY_CLAIMS} tone={full ? 'blue' : 'green'} />
      </div>
      <div className="quota">
        <div className="quota-head"><strong>{activeTotal}</strong><span>{tr.activeValue}</span></div>
        <small className="quota-note">{tr.count(activeGov.length)}</small>
      </div>
      <div className="card-bottom">
        {usableGov && (
          <button type="button" className="card-use go" onClick={() => navigate(`/calc?w=${platform}`)}>{tr.walletUse}</button>
        )}
        <button type="button" className="card-use" onClick={() => openAdd({ platform })}>{tr.walletRecord}</button>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { lang, tr } = useLang()
  const { openAdd } = useUI()
  const { coupons, loading } = useCoupons()

  const today = new Date()
  const campaign = currentCampaign(today)
  const state = campaignState(campaign, today)
  const claimDay = isClaimDay(today)
  const wallets = enabledPlatforms(profile)

  // Days left until the Friday 00:00 clear, counting today
  const untilClear = ((5 - today.getDay() + 7) % 7) || 7
  const nextClaim = claimWindow(today).start

  let summary
  if (state === 'before') summary = tr.summaryBefore(formatDay(parseDate(campaign.start), lang, true))
  else if (state === 'after') summary = tr.summaryAfter(formatDay(parseDate(campaign.end), lang, true))
  else if (claimDay) summary = tr.summaryClaim
  else summary = campaign.anyDayUse ? tr.summaryUse : tr.summaryUseOld

  const roundCoupons = couponsOfCampaign(coupons, campaign)
  // Only show finished rounds that have records
  const archive = archivedCampaigns(today).filter(c => couponsOfCampaign(coupons, c).length > 0)
  const active = roundCoupons
    .filter(c => effectiveStatus(c) === 'unused')
    .sort((a, b) => getExpiryDate(a) - getExpiryDate(b) || b.face_value - a.face_value)
  const usableValue = active.filter(c => couponKind(c) === 'gov' && canUseOn(c)).reduce((s, c) => s + c.face_value, 0)

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            {tr.round(roundNumber(campaign))} · {campaign.short[lang]}{state === 'active' ? ` · ${tr.weekOf(campaignWeek(campaign, today), campaign.weeks)}` : ''}
          </p>
          <h1>{tr.overview}</h1>
          <p className="summary">{summary}</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="capsule lens" onClick={() => openAdd()} disabled={!wallets.length}>{tr.record}</button>
        </div>
      </section>

      {state === 'active' && (
        <section className="today glass">
          <div>
            <strong>{claimDay ? tr.todayClaim : tr.todayUse}</strong>
            <p>{claimDay ? tr.clearHint : tr.claimNext(formatDay(nextClaim, lang, true))}</p>
          </div>
          <div className="today-figure">
            <strong>MOP {usableValue}</strong>
            <span>{tr.daysLeft(untilClear)}</span>
          </div>
        </section>
      )}

      <section>
        <div className="section-heading">
          <h2>{tr.wallets}</h2>
          <span className="muted">{tr.walletsHint}</span>
        </div>
        {wallets.length === 0
          ? <article className="card notice">{tr.noWallets}</article>
          : (
            <div className="cards">
              {wallets.map(p => (
                <WalletCard key={p} platform={p} coupons={roundCoupons.filter(c => c.platform === p)} />
              ))}
            </div>
          )}
      </section>

      <section>
        <div className="section-heading">
          <h2>{tr.activeList}</h2>
          <span className="muted">{tr.activeListHint}</span>
        </div>
        {loading ? (
          <div className="card empty"><Spinner /></div>
        ) : active.length === 0 ? (
          <div className="card empty">
            <strong>{tr.noActive}</strong>
            <p>{tr.noActiveHint}</p>
          </div>
        ) : (
          <div className="list">
            {active.map(c => <CouponRow key={c.id} coupon={c} />)}
          </div>
        )}
      </section>

      {archive.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>{tr.archive}</h2>
            <span className="muted">{tr.archiveHint}</span>
          </div>
          <div className="list">
            {archive.map(c => {
              const stats = roundStats(couponsOfCampaign(coupons, c))
              return (
                <Link key={c.id} to={`/archive/${c.id}`} className="card archive-card">
                  <span className="archive-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24"><path d="M3.5 5.5h17v4h-17zM5 9.5v9a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-9M10 13.5h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <span className="coupon-info">
                    <span className="coupon-sub">{tr.round(roundNumber(c))} · {tr.archived}</span>
                    <strong>{c.name[lang]}</strong>
                    <span className="coupon-sub">{tr.archiveSummary(stats.count, stats.saved)}</span>
                  </span>
                  <span className="chevron" aria-hidden="true">›</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
