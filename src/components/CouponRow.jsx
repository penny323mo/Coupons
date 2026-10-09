import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { useCoupons } from '../contexts/CouponsContext'
import { platformLabel } from '../lib/platforms'
import {
  effectiveStatus, couponKind, canUseOn, daysLeft, lastUseDate, formatDay, formatDate, todayStr,
} from '../lib/dates'
import { Sheet } from './ui'

function Tile({ coupon, kind, status }) {
  return (
    <div className={`tile ${kind} ${status}`} aria-hidden="true">
      {kind === 'merchant_gift'
        ? <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5S10.5 3.5 8 4.2 7.6 7.5 12 7.5Zm0 0s1.5-4 4-3.3.4 3.3-4 3.3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
        : <>
            <small>{kind === 'merchant_discount' ? '−' : 'MOP'}</small>
            <strong>{coupon.face_value}</strong>
          </>}
    </div>
  )
}

export default function CouponRow({ coupon }) {
  const { lang, tr } = useLang()
  const { showToast } = useUI()
  const { updateCoupon, deleteCoupon } = useCoupons()
  const [sheet, setSheet] = useState(null) // 'actions' | 'use' | 'delete'
  const [usedDate, setUsedDate] = useState(todayStr())
  const [store, setStore] = useState(coupon.store_name ?? '')
  const [busy, setBusy] = useState(false)

  const status = effectiveStatus(coupon)
  const kind = couponKind(coupon)
  const left = daysLeft(coupon.drawn_date)
  const usableToday = canUseOn(coupon)

  const title = kind === 'gov'
    ? `MOP ${coupon.face_value}`
    : coupon.store_name || tr[kind]
  const sub = [platformLabel(coupon.platform, lang), kind === 'gov' ? null : tr[kind]].filter(Boolean).join(' · ')

  let meta, metaTone = ''
  if (status === 'unused') {
    meta = `${tr.lastDay(formatDay(lastUseDate(coupon.drawn_date), lang, true))} · ${tr.daysLeft(left)}`
    if (left <= 1) metaTone = 'urgent'
    if (!usableToday) { meta = `${tr.notYetUsable} · ${meta}`; metaTone = 'muted' }
  } else if (status === 'used') {
    meta = [coupon.used_date && tr.usedOn(formatDate(coupon.used_date, lang)), kind === 'gov' ? coupon.store_name : null]
      .filter(Boolean).join(' · ')
  } else {
    meta = tr.claimedOn(formatDate(coupon.drawn_date, lang))
  }

  async function run(fn, toast) {
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (!error) { setSheet(null); showToast(toast) }
  }

  const markUsed = () => run(() => updateCoupon(coupon.id, {
    status: 'used', used_date: usedDate, store_name: store.trim() || null,
  }), tr.savedUse)
  const undoUse = () => run(() => updateCoupon(coupon.id, { status: 'unused', used_date: null }), tr.saved)
  const remove = () => run(() => deleteCoupon(coupon.id), tr.deleted)

  return (
    <>
      <article className={`coupon card ${status}${usableToday ? ' usable' : ''}`}>
        <button type="button" className="coupon-body" onClick={() => setSheet('actions')}>
          <Tile coupon={coupon} kind={kind} status={status} />
          <span className="coupon-info">
            <strong>{title}</strong>
            <span className="coupon-sub">{sub}</span>
            {kind === 'merchant_gift' && coupon.notes && <span className="coupon-sub">{coupon.notes}</span>}
            {meta && <span className={`coupon-meta ${metaTone}`}>{meta}</span>}
          </span>
        </button>
        <div className="coupon-side">
          {status === 'unused'
            ? <button type="button" className="use-btn" onClick={() => setSheet('use')}>{tr.use}</button>
            : <span className={`badge ${status}`}>{tr[status]}</span>}
        </div>
      </article>

      {sheet === 'actions' && (
        <Sheet title={title} onClose={() => setSheet(null)} className="action-sheet">
          <p className="sheet-text">{sub}{meta ? `\n${meta}` : ''}</p>
          <div className="sheet-actions">
            {status === 'unused' && <button type="button" onClick={() => setSheet('use')}>{tr.markUsed}</button>}
            {status === 'used' && <button type="button" onClick={undoUse} disabled={busy}>{tr.undoUse}</button>}
            <button type="button" className="danger" onClick={() => setSheet('delete')}>{tr.delete}</button>
            <button type="button" className="cancel" onClick={() => setSheet(null)}>{tr.cancel}</button>
          </div>
        </Sheet>
      )}

      {sheet === 'delete' && (
        <Sheet title={tr.delete} onClose={() => setSheet(null)} className="action-sheet">
          <p className="sheet-text">{title} · {sub}{'\n'}{tr.deleteConfirm}</p>
          <div className="sheet-actions">
            <button type="button" className="danger" onClick={remove} disabled={busy}>{tr.delete}</button>
            <button type="button" className="cancel" onClick={() => setSheet(null)}>{tr.cancel}</button>
          </div>
        </Sheet>
      )}

      {sheet === 'use' && (
        <Sheet title={tr.useTitle} onClose={() => setSheet(null)} className="form-sheet">
          <div className="sheet-coupon">
            <Tile coupon={coupon} kind={kind} status={status} />
            <span className="coupon-info">
              <strong>{title}</strong>
              <span className="coupon-sub">{sub}</span>
            </span>
          </div>
          <label className="field">
            <span>{tr.usedDate}</span>
            <input type="date" value={usedDate} min={coupon.drawn_date} max={todayStr()}
              onChange={e => setUsedDate(e.target.value)} />
          </label>
          <label className="field">
            <span>{tr.storeName}</span>
            <input value={store} onChange={e => setStore(e.target.value)} placeholder={tr.storeHint} />
          </label>
          <div className="sheet-actions row">
            <button type="button" className="glass-btn" onClick={() => setSheet(null)}>{tr.cancel}</button>
            <button type="button" className="primary-btn" onClick={markUsed} disabled={busy || !usedDate}>{tr.confirm}</button>
          </div>
        </Sheet>
      )}
    </>
  )
}
