import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { enabledPlatforms, platformLabel } from '../lib/platforms'
import { effectiveStatus, couponKind, campaignOfCoupon, currentCampaign, KINDS } from '../lib/dates'
import CouponRow from '../components/CouponRow'
import { Segmented, Spinner } from '../components/ui'

const STATUS = ['unused', 'used', 'expired', 'all']

export default function Coupons() {
  const { profile } = useAuth()
  const { lang, tr } = useLang()
  const { openAdd } = useUI()
  const { coupons, loading } = useCoupons()

  const [status,   setStatus]   = useState('unused')
  const [platform, setPlatform] = useState('all')
  const [kind,     setKind]     = useState('all')
  // Only the current round lives here; finished rounds are in the archive
  const round = currentCampaign().id
  const inRound = coupons.filter(c => campaignOfCoupon(c).id === round)
  const wallets = [...new Set([...enabledPlatforms(profile), ...inRound.map(c => c.platform)])]

  const filtered = inRound.filter(c =>
    (status === 'all' || effectiveStatus(c) === status)
    && (platform === 'all' || c.platform === platform)
    && (kind === 'all' || couponKind(c) === kind))

  const unused = inRound.filter(c => effectiveStatus(c) === 'unused').length
  const saved = inRound.filter(c => c.status === 'used').reduce((s, c) => s + c.face_value, 0)

  return (
    <>
      <section className="hero">
        <div>
          <h1>{tr.couponsTitle}</h1>
          <p className="summary">{tr.couponsSummary(unused, saved)}</p>
        </div>
      </section>

      <Segmented label={tr.couponsTitle} value={status} onChange={setStatus}
        options={STATUS.map(s => ({ value: s, label: s === 'all' ? tr.all : tr[s] }))} />

      <div className="filters">
        <select value={platform} onChange={e => setPlatform(e.target.value)} aria-label={tr.allWallets}>
          <option value="all">{tr.allWallets}</option>
          {wallets.map(k => <option key={k} value={k}>{platformLabel(k, lang)}</option>)}
        </select>
        <select value={kind} onChange={e => setKind(e.target.value)} aria-label={tr.allKinds}>
          <option value="all">{tr.allKinds}</option>
          {KINDS.map(k => <option key={k} value={k}>{tr[k]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card empty"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty"><p>{tr.noResults}</p></div>
      ) : (
        <div className="list">
          {filtered.map(c => <CouponRow key={c.id} coupon={c} />)}
        </div>
      )}
    </>
  )
}
