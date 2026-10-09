import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useCoupons } from '../contexts/CouponsContext'
import { CAMPAIGNS } from '../lib/campaigns'
import { platformLabel } from '../lib/platforms'
import { couponsOfCampaign, roundStats, roundNumber, effectiveStatus, parseDate, formatDay } from '../lib/dates'
import CouponRow from '../components/CouponRow'
import { Segmented, Spinner } from '../components/ui'

const STATUS = ['all', 'used', 'expired']

export default function Archive() {
  const { id } = useParams()
  const { lang, tr } = useLang()
  const { coupons, loading } = useCoupons()
  const [status, setStatus] = useState('all')

  const campaign = CAMPAIGNS.find(c => c.id === id)
  if (!campaign) return <Navigate to="/" replace />

  const rows = couponsOfCampaign(coupons, campaign)
  const stats = roundStats(rows)
  const filtered = rows.filter(c => status === 'all' || effectiveStatus(c) === status)

  // Saved per wallet, biggest first
  const byWallet = Object.entries(rows.filter(c => c.status === 'used')
    .reduce((acc, c) => ({ ...acc, [c.platform]: (acc[c.platform] ?? 0) + c.face_value }), {}))
    .sort((a, b) => b[1] - a[1])

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{tr.round(roundNumber(campaign))} · {tr.archived}</p>
          <h1 className="title-sm">{campaign.name[lang]}</h1>
          <p className="summary">
            {formatDay(parseDate(campaign.start), lang)} – {formatDay(parseDate(campaign.end), lang)}
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/" className="capsule lens">{tr.back}</Link>
        </div>
      </section>

      <section className="stats glass">
        <div><strong>{stats.saved}</strong><span>{tr.statSaved}</span></div>
        <div><strong>{stats.used}<em>/{stats.count}</em></strong><span>{tr.statUsed}</span></div>
        <div><strong>{stats.rate}%</strong><span>{tr.statRate}</span></div>
        <div><strong className="warn">{stats.wasted}</strong><span>{tr.statWasted}</span></div>
      </section>

      {byWallet.length > 0 && (
        <section className="settings-card">
          <dl className="info">
            {byWallet.map(([k, v]) => (
              <div key={k}><dt>{platformLabel(k, lang)}</dt><dd>MOP {v}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <Segmented label={tr.archive} value={status} onChange={setStatus}
        options={STATUS.map(s => ({ value: s, label: s === 'all' ? tr.all : tr[s] }))} />

      {loading ? (
        <div className="card empty"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty"><p>{tr.archiveEmpty}</p></div>
      ) : (
        <div className="list">
          {filtered.map(c => <CouponRow key={c.id} coupon={c} />)}
        </div>
      )}
      <p className="caption center">{tr.archiveNote}</p>
    </>
  )
}
