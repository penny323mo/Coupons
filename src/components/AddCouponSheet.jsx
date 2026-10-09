import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { FACE_VALUES, MERCHANT_DISCOUNT } from '../lib/campaigns'
import { enabledPlatforms, platformLabel } from '../lib/platforms'
import {
  todayStr, parseDate, campaignOn, isClaimDay, claimWindow, couponKind, CLAIM_DAYS, WEEKLY_CLAIMS,
} from '../lib/dates'
import { Sheet, Segmented } from './ui'

export default function AddCouponSheet({ preset }) {
  const { profile } = useAuth()
  const { lang, tr } = useLang()
  const { closeAdd, showToast } = useUI()
  const { coupons, addCoupon } = useCoupons()

  const wallets = enabledPlatforms(profile)
  const [kind,      setKind]      = useState('gov')
  const [platform,  setPlatform]  = useState(preset.platform ?? wallets[0] ?? '')
  const [faceValue, setFaceValue] = useState(20)
  const [drawnDate, setDrawnDate] = useState(todayStr())
  const [merchant,  setMerchant]  = useState('')
  const [notes,     setNotes]     = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const date = drawnDate ? parseDate(drawnDate) : new Date()
  const campaign = campaignOn(date)
  const kinds = campaign?.merchantVouchers ? ['gov', 'merchant_discount', 'merchant_gift'] : ['gov']
  const activeKind = kinds.includes(kind) ? kind : 'gov'

  // Gentle warnings; the user may still be back-filling odd data
  const warnings = []
  if (drawnDate && !campaign) warnings.push(tr.warnOutside)
  else if (drawnDate && !CLAIM_DAYS.includes(date.getDay())) warnings.push(tr.warnNotClaimDay)
  if (activeKind === 'gov' && drawnDate && isClaimDay(date)) {
    const { start, end } = claimWindow(date)
    const n = coupons.filter(c => couponKind(c) === 'gov' && c.platform === platform
      && parseDate(c.drawn_date) >= start && parseDate(c.drawn_date) <= end).length
    if (n >= WEEKLY_CLAIMS) warnings.push(tr.warnCap(n))
  }

  async function handleSave() {
    if (!platform || !drawnDate || (activeKind !== 'gov' && !merchant.trim())) {
      setError(tr.errRequired)
      return
    }
    setSaving(true)
    setError('')
    const { error: err, needsMigration } = await addCoupon({
      kind:       activeKind,
      platform,
      face_value: activeKind === 'gov' ? faceValue : activeKind === 'merchant_discount' ? MERCHANT_DISCOUNT.off : 0,
      drawn_date: drawnDate,
      store_name: activeKind === 'gov' ? null : merchant.trim(),
      notes:      notes.trim() || null,
    })
    setSaving(false)
    if (err) { setError(needsMigration ? tr.migrationNeeded : tr.errGeneric); return }
    showToast(tr.saved)
    closeAdd()
  }

  return (
    <Sheet title={tr.addTitle} onClose={closeAdd} className="form-sheet">
      {kinds.length > 1 && (
        <>
          <Segmented label={tr.kind} value={activeKind} onChange={setKind}
            options={kinds.map(k => ({ value: k, label: tr[k] }))} />
          <p className="field-hint">{tr.kindHint[activeKind]}</p>
        </>
      )}

      <label className="field">
        <span>{tr.platform}</span>
        <select value={platform} onChange={e => setPlatform(e.target.value)}>
          {wallets.map(k => <option key={k} value={k}>{platformLabel(k, lang)}</option>)}
        </select>
      </label>

      {activeKind === 'gov' && (
        <div className="field">
          <span>{tr.faceValue}</span>
          <div className="chips values" role="radiogroup" aria-label={tr.faceValue}>
            {FACE_VALUES.map(v => (
              <button key={v} type="button" role="radio" aria-checked={faceValue === v}
                className={faceValue === v ? 'on' : ''} onClick={() => setFaceValue(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeKind !== 'gov' && (
        <label className="field">
          <span>{tr.merchant}</span>
          <input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder={tr.merchantHint} />
        </label>
      )}

      <label className="field">
        <span>{tr.drawnDate}</span>
        <input type="date" value={drawnDate} max={todayStr()} onChange={e => setDrawnDate(e.target.value)} />
      </label>

      <label className="field">
        <span>{activeKind === 'merchant_gift' ? tr.giftDesc : tr.notes}</span>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder={activeKind === 'merchant_gift' ? tr.giftHint : ''} />
      </label>

      {warnings.map(w => <p key={w} className="note warn">{w}</p>)}
      {error && <p className="note error" role="alert">{error}</p>}

      <div className="sheet-actions row">
        <button type="button" className="glass-btn" onClick={closeAdd}>{tr.cancel}</button>
        <button type="button" className="primary-btn" onClick={handleSave} disabled={saving}>
          {saving ? tr.saving : tr.save}
        </button>
      </div>
    </Sheet>
  )
}
