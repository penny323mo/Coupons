import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { PLATFORMS } from '../i18n/translations'
import { todayStr, formatExpiry } from '../lib/dates'

export default function UseModal({ coupon, onClose, onUpdated }) {
  const { lang, tr } = useLang()

  const [usedDate,   setUsedDate]   = useState(todayStr())
  const [storeName,  setStoreName]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const platformLabel = PLATFORMS[coupon.platform]?.[lang] ?? coupon.platform

  async function handleConfirm() {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('coupons')
      .update({ status: 'used', used_date: usedDate, store_name: storeName || null })
      .eq('id', coupon.id)
    setSaving(false)
    if (err) { setError(tr.errGeneric); return }
    onUpdated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-10 safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">{tr.markUsed}</h2>

        {/* Coupon summary */}
        <div className="bg-primary-50 rounded-2xl p-3 mb-5 flex items-center gap-3">
          <div className="bg-primary-600 text-white font-bold text-lg rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
            {coupon.face_value}
          </div>
          <div>
            <div className="font-semibold text-gray-800">MOP {coupon.face_value}</div>
            <div className="text-sm text-gray-500">{platformLabel}</div>
            <div className="text-xs text-orange-500 mt-0.5">
              {tr.expiresOn} {formatExpiry(coupon.drawn_date, lang)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.usedDate}</label>
            <input
              type="date"
              className="input"
              value={usedDate}
              onChange={e => setUsedDate(e.target.value)}
              max={todayStr()}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.storeName}</label>
            <input
              type="text"
              className="input"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder={tr.storeHint}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">
              {tr.cancel}
            </button>
            <button onClick={handleConfirm} disabled={saving} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold disabled:opacity-50">
              {saving ? '...' : tr.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
