import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { PLATFORMS, enabledPlatforms, platformLabel } from '../lib/platforms'
import {
  currentCampaign, campaignState, campaignWeek, isClaimDay, isInClaimWindow, claimWindow,
  effectiveStatus, couponKind, canUseOn, parseDate, formatDay, todayStr, WEEKLY_CLAIMS,
  roundNumber, archivedCampaigns, couponsOfCampaign, roundStats,
} from '../lib/dates'
import { USE_MULTIPLE } from '../lib/campaigns'
import { Battery } from '../components/ui'

function VoucherChip({ coupon, onUse }) {
  const { tr } = useLang()
  const kind = couponKind(coupon)
  const label = kind === 'gov'
    ? tr.useChip(coupon.face_value, coupon.face_value * USE_MULTIPLE)
    : `${tr[kind]}${coupon.store_name ? ` · ${coupon.store_name}` : ''}`
  return (
    <button type="button" className={`vchip ${kind}`} onClick={() => onUse(coupon)} aria-label={label} title={label}>
      {kind === 'gov' && <><strong>{coupon.face_value}</strong><small>{tr.chipMin(coupon.face_value * USE_MULTIPLE)}</small></>}
      {kind === 'merchant_discount' && <><strong>−{coupon.face_value}</strong><small>{tr.chipDeal}</small></>}
      {kind === 'merchant_gift' && <><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5S10.5 3.5 8 4.2 7.6 7.5 12 7.5Zm0 0s1.5-4 4-3.3.4 3.3-4 3.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg><small>{tr.chipGift}</small></>}
    </button>
  )
}

function WalletCard({ platform, coupons }) {
  const { lang, tr } = useLang()
  const { openAdd, showToast } = useUI()
  const { updateCoupons } = useCoupons()
  const navigate = useNavigate()
  const info = PLATFORMS[platform]
  const claimed = coupons.filter(c => couponKind(c) === 'gov' && isInClaimWindow(c)).length
  const active = coupons
    .filter(c => effectiveStatus(c) === 'unused')
    .sort((a, b) => KIND_ORDER[couponKind(a)] - KIND_ORDER[couponKind(b)] || b.face_value - a.face_value)
  const activeGov = active.filter(c => couponKind(c) === 'gov')
  const activeTotal = activeGov.reduce((s, c) => s + c.face_value, 0)
  const usable = active.some(c => canUseOn(c))
  const usableGov = activeGov.some(c => canUseOn(c))
  const full = claimed >= WEEKLY_CLAIMS

  // One tap at the till: mark used today, with an undo in the toast
  async function use(coupon) {
    const { error } = await updateCoupons(coupon.id, { status: 'used', used_date: todayStr() })
    if (error) { showToast(tr.errSave(error.message), undefined, 'error'); return }
    const what = couponKind(coupon) === 'gov' ? `MOP ${coupon.face_value}` : tr[couponKind(coupon)]
    showToast(tr.usedOne(`${what}（${info.short}）`), {
      label: tr.undo,
      run: () => updateCoupons(coupon.id, { status: 'unused', used_date: null }),
    })
  }

  return (
    <article className={`card wallet${usable ? ' active' : ''}`}>
      <div className="wallet-head">
        <span className="wallet-dot" style={{ '--tint': info.tint }} aria-hidden="true" />
        <span className="account-name">{info[lang]}</span>
        {full && <span className="badge">{tr.full}</span>}
        <span className="wallet-actions">
          {usableGov && (
            <button type="button" className="mini-btn go" onClick={() => navigate(`/calc?w=${platform}`)}>{tr.walletUse}</button>
          )}
          <button type="button" className="mini-btn plus" onClick={() => openAdd({ platform })}
            aria-label={`${tr.walletRecord} · ${info[lang]}`}>＋</button>
        </span>
      </div>
      <div className="wallet-body">
        <div className="claimed">
          <span><strong>{claimed}</strong><em>/{WEEKLY_CLAIMS}</em> {tr.claimedShort}</span>
          <Battery value={claimed} max={WEEKLY_CLAIMS} tone={full ? 'blue' : 'green'} />
        </div>
        <div className="wallet-total"><strong>{activeTotal}</strong><span>MOP</span></div>
        <div className="vchips" role="group" aria-label={tr.activeList}>
          {active.map(c => <VoucherChip key={c.id} coupon={c} onUse={use} />)}
        </div>
      </div>
    </article>
  )
}

const KIND_ORDER = { gov: 0, merchant_discount: 1, merchant_gift: 2 }

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
    .sort((a, b) => b.face_value - a.face_value)
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
          <span className="muted">{tr.walletsTapHint}</span>
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
