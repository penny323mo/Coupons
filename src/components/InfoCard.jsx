import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { PLATFORMS } from '../lib/platforms'
import { USE_MULTIPLE } from '../lib/campaigns'
import {
  campaignWeek, isClaimDay, claimWindow, couponKind, canUseOn, parseDate, formatDay,
} from '../lib/dates'

const TICK_MS = 4000

/** The headline card: what is usable now, when it clears, and a rotating line of tips. */
export default function InfoCard({ campaign, state, active }) {
  const { lang, tr } = useLang()
  const today = new Date()

  const gov = active.filter(c => couponKind(c) === 'gov' && canUseOn(c))
  const total = gov.reduce((s, c) => s + c.face_value, 0)
  const walletCount = new Set(active.map(c => c.platform)).size
  const merchantCount = active.filter(c => couponKind(c) === 'merchant_discount').length
  const untilClear = ((5 - today.getDay() + 7) % 7) || 7

  // Wallet holding the most value: how much one payment needs to use it all
  const byWallet = Object.entries(gov.reduce((m, c) => ({ ...m, [c.platform]: (m[c.platform] ?? 0) + c.face_value }), {}))
    .sort((a, b) => b[1] - a[1])
  const largest = gov.reduce((m, c) => Math.max(m, c.face_value), 0)

  const lines = []
  if (state === 'before') lines.push(tr.summaryBefore(formatDay(parseDate(campaign.start), lang, true)))
  else if (state === 'after') lines.push(tr.summaryAfter(formatDay(parseDate(campaign.end), lang, true)))
  else {
    lines.push(isClaimDay(today) ? tr.tickClaim : tr.tickNextClaim(formatDay(claimWindow(today).start, lang, true)))
    lines.push(tr.tickClear(untilClear))
    if (byWallet.length) {
      const [p, v] = byWallet[0]
      lines.push(tr.tickAllAtOnce(lang === 'zh' ? PLATFORMS[p]?.short ?? p : PLATFORMS[p]?.en ?? p, v, v * USE_MULTIPLE))
    }
    if (largest) lines.push(tr.tickLargest(largest, largest * USE_MULTIPLE))
    if (merchantCount) lines.push(tr.tickMerchant(merchantCount))
    lines.push(tr.tickWeek(campaignWeek(campaign, today), campaign.weeks, formatDay(parseDate(campaign.end), lang, true)))
    lines.push(tr.tickSenior)
  }

  const [i, setI] = useState(0)
  const index = i % lines.length
  useEffect(() => {
    if (lines.length < 2) return undefined
    const t = setInterval(() => setI(n => n + 1), TICK_MS)
    return () => clearInterval(t)
  }, [lines.length])

  const ring = Math.min(untilClear / 7, 1)

  return (
    <section className="infocard glass">
      <div className="info-main">
        <div className="info-figure">
          <span className="info-label">{tr.infoLabel}</span>
          <div className="info-amount"><small>MOP</small><strong>{total}</strong></div>
          <span className="info-sub">{tr.infoSub(active.length, walletCount)}</span>
        </div>
        {state === 'active' && (
          <div className="countdown" role="img" aria-label={tr.tickClear(untilClear)}>
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="27" className="ring-bg" />
              <circle cx="32" cy="32" r="27" className={`ring-fg${untilClear <= 1 ? ' urgent' : ''}`}
                strokeDasharray={`${ring * 169.6} 169.6`} />
            </svg>
            <span className="countdown-n">{untilClear}<small>{tr.dayUnit}</small></span>
            <span className="countdown-cap">{tr.ringCaption}</span>
          </div>
        )}
      </div>
      <button type="button" className="ticker" onClick={() => setI(n => n + 1)} aria-live="polite">
        <span key={i} className="ticker-line">{lines[index]}</span>
        {lines.length > 1 && (
          <span className="ticker-dots" aria-hidden="true">
            {lines.map((_, k) => <i key={k} className={k === index ? 'on' : ''} />)}
          </span>
        )}
      </button>
    </section>
  )
}
