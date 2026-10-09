import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { FACE_VALUES, MERCHANT_DISCOUNT } from '../lib/campaigns'
import { PLATFORMS, enabledPlatforms } from '../lib/platforms'
import {
  todayStr, parseDate, campaignOn, claimWindow, couponKind, formatDay, CLAIM_DAYS, WEEKLY_CLAIMS,
} from '../lib/dates'
import { Sheet, Segmented } from './ui'

const LAST_WALLET = 'lastWallet'
const MAX_BATCH = 6

function readLastWallet() {
  try { return localStorage.getItem(LAST_WALLET) } catch { return null }
}

export default function AddCouponSheet({ preset }) {
  const { profile } = useAuth()
  const { lang, tr } = useLang()
  const { closeAdd, showToast } = useUI()
  const { coupons, addCoupons } = useCoupons()

  const wallets = enabledPlatforms(profile)
  const last = readLastWallet()
  const [kind,      setKind]      = useState('gov')
  const [platform,  setPlatform]  = useState(preset.platform ?? (wallets.includes(last) ? last : wallets[0]) ?? '')
  const [values,    setValues]    = useState([])   // vouchers drawn in this batch
  const [drawnDate, setDrawnDate] = useState(todayStr())
  const [editDate,  setEditDate]  = useState(false)
  const [merchant,  setMerchant]  = useState('')
  const [notes,     setNotes]     = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const date = drawnDate ? parseDate(drawnDate) : new Date()
  const campaign = campaignOn(date)
  const kinds = campaign?.merchantVouchers ? ['gov', 'merchant_discount', 'merchant_gift'] : ['gov']
  const activeKind = kinds.includes(kind) ? kind : 'gov'

  // Government vouchers already recorded for each wallet in this date's claim weekend
  const { start, end } = claimWindow(date)
  const claimedFor = p => coupons.filter(c => couponKind(c) === 'gov' && c.platform === p
    && parseDate(c.drawn_date) >= start && parseDate(c.drawn_date) <= end).length
  const claimed = claimedFor(platform)
  const left = Math.max(WEEKLY_CLAIMS - claimed, 0)

  const warnings = []
  if (drawnDate && !campaign) warnings.push(tr.warnOutside)
  else if (drawnDate && !CLAIM_DAYS.includes(date.getDay())) warnings.push(tr.warnNotClaimDay)
  if (activeKind === 'gov' && CLAIM_DAYS.includes(date.getDay()) && claimed + values.length > WEEKLY_CLAIMS) {
    warnings.push(tr.warnCap(claimed))
  }

  function pickWallet(p) {
    setPlatform(p)
    setError('')
  }

  function addValue(v) {
    setError('')
    setValues(prev => prev.length >= MAX_BATCH ? prev : [...prev, v])
  }

  async function handleSave() {
    if (!platform || !drawnDate) { setError(tr.errRequired); return }
    if (activeKind === 'gov' && values.length === 0) { setError(tr.errPickValue); return }
    if (activeKind !== 'gov' && !merchant.trim()) { setError(tr.errMerchant); return }

    const base = { kind: activeKind, platform, drawn_date: drawnDate, notes: notes.trim() || null }
    const rows = activeKind === 'gov'
      ? values.map(v => ({ ...base, face_value: v, store_name: null }))
      : [{
          ...base,
          face_value: activeKind === 'merchant_discount' ? MERCHANT_DISCOUNT.off : 0,
          store_name: merchant.trim(),
        }]

    setSaving(true)
    setError('')
    const { error: err, needsMigration } = await addCoupons(rows)
    setSaving(false)
    if (err) { setError(needsMigration ? tr.migrationNeeded : tr.errGeneric); return }
    try { localStorage.setItem(LAST_WALLET, platform) } catch { /* private mode */ }
    showToast(activeKind === 'gov'
      ? tr.savedBatch(rows.length, rows.reduce((s, r) => s + r.face_value, 0))
      : tr.saved)
    closeAdd()
  }

  const total = values.reduce((s, v) => s + v, 0)
  const saveLabel = activeKind === 'gov' && values.length
    ? tr.saveBatch(values.length, total)
    : tr.save

  return (
    <Sheet title={tr.addTitle} onClose={closeAdd} className="form-sheet">
      {kinds.length > 1 && (
        <Segmented label={tr.kind} value={activeKind} onChange={setKind}
          options={kinds.map(k => ({ value: k, label: tr[k] }))} />
      )}

      <div className="field">
        <span>{tr.stepWallet}</span>
        <div className="wallet-pick" role="radiogroup" aria-label={tr.platform}>
          {wallets.map(p => {
            const n = claimedFor(p)
            return (
              <button key={p} type="button" role="radio" aria-checked={p === platform}
                className={p === platform ? 'on' : ''} onClick={() => pickWallet(p)}>
                <span className="wallet-dot" style={{ '--tint': PLATFORMS[p].tint }} aria-hidden="true" />
                <span className="wallet-pick-name">{lang === 'zh' ? PLATFORMS[p].short : PLATFORMS[p].en}</span>
                {activeKind === 'gov' && <small>{n}/{WEEKLY_CLAIMS}</small>}
              </button>
            )
          })}
        </div>
      </div>

      {activeKind === 'gov' ? (
        <div className="field">
          <span>{tr.stepValues(left)}</span>
          <div className="chips values" role="group" aria-label={tr.faceValue}>
            {FACE_VALUES.map(v => (
              <button key={v} type="button" onClick={() => addValue(v)} disabled={values.length >= MAX_BATCH}>
                {v}
              </button>
            ))}
          </div>
          <div className="tray" aria-live="polite">
            {values.length === 0
              ? <span className="tray-empty">{tr.trayEmpty}</span>
              : values.map((v, i) => (
                  <button key={i} type="button" className="tray-chip"
                    aria-label={tr.removeValue(v)}
                    onClick={() => setValues(prev => prev.filter((_, j) => j !== i))}>
                    {v}<span aria-hidden="true">×</span>
                  </button>
                ))}
            {values.length > 0 && <span className="tray-total">MOP {total}</span>}
          </div>
        </div>
      ) : (
        <>
          <p className="field-hint">{tr.kindHint[activeKind]}</p>
          <label className="field">
            <span>{tr.merchant}</span>
            <input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder={tr.merchantHint} />
          </label>
          <label className="field">
            <span>{activeKind === 'merchant_gift' ? tr.giftDesc : tr.notes}</span>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={activeKind === 'merchant_gift' ? tr.giftHint : ''} />
          </label>
        </>
      )}

      <div className="date-row">
        <span>{tr.drawnDate}</span>
        {editDate
          ? <input type="date" value={drawnDate} max={todayStr()} autoFocus
              onChange={e => setDrawnDate(e.target.value)} />
          : <button type="button" className="link-btn" onClick={() => setEditDate(true)}>
              {drawnDate === todayStr() ? tr.today : ''}{formatDay(date, lang, true)} · {tr.change}
            </button>}
      </div>

      {warnings.map(w => <p key={w} className="note warn">{w}</p>)}
      {error && <p className="note error" role="alert">{error}</p>}

      <div className="sheet-actions row">
        <button type="button" className="glass-btn" onClick={closeAdd}>{tr.cancel}</button>
        <button type="button" className="primary-btn" onClick={handleSave} disabled={saving}>
          {saving ? tr.saving : saveLabel}
        </button>
      </div>
    </Sheet>
  )
}
