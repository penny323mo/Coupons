import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { platformLabel as getPlatformLabel } from '../i18n/translations'
import { effectiveStatus, formatDate, formatExpiry } from '../lib/dates'
import UseModal from './UseModal'

const STATUS_STYLES = {
  unused:  'bg-blue-100 text-blue-700',
  used:    'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
}

const VALUE_COLORS = {
  unused:  'bg-primary-600',
  used:    'bg-green-500',
  expired: 'bg-gray-300',
}

export default function CouponCard({ coupon, onRefresh }) {
  const { lang, tr } = useLang()
  const [showUse,    setShowUse]    = useState(false)
  const [confirming, setConfirming] = useState(false)

  const status        = effectiveStatus(coupon)
  const platformLbl = getPlatformLabel(coupon.platform, lang)

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    await supabase.from('coupons').delete().eq('id', coupon.id)
    onRefresh()
  }

  return (
    <>
      <div className="card flex items-stretch gap-3 overflow-hidden">
        {/* Left: value block */}
        <div className={`${VALUE_COLORS[status]} text-white font-bold text-xl rounded-xl w-16 flex items-center justify-center shrink-0 transition-colors`}>
          {coupon.face_value}
        </div>

        {/* Middle: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-base">MOP {coupon.face_value}</span>
            <span className={`badge ${STATUS_STYLES[status]}`}>
              {tr[status]}
            </span>
          </div>
          <div className="text-sm text-gray-500">{platformLbl}</div>

          {status === 'unused' && (
            <div className="text-xs text-orange-500 mt-1">
              {tr.expiresOn} {formatExpiry(coupon.drawn_date, lang)}
            </div>
          )}
          {status === 'used' && coupon.store_name && (
            <div className="text-xs text-gray-400 mt-1 truncate">📍 {coupon.store_name}</div>
          )}
          {status === 'used' && coupon.used_date && (
            <div className="text-xs text-gray-400">{formatDate(coupon.used_date, lang)}</div>
          )}
          {status === 'expired' && (
            <div className="text-xs text-gray-400 mt-1">
              {tr.drawnOn} {formatDate(coupon.drawn_date, lang)}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-1.5 shrink-0 justify-center">
          {status === 'unused' && (
            <button
              onClick={() => setShowUse(true)}
              className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium"
            >
              {tr.markAsUsed}
            </button>
          )}
          <button
            onClick={handleDelete}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
              ${confirming ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            {confirming ? tr.deleteConfirm.replace('確定', '').replace('Delete ', '').trim() || '?' : tr.delete}
          </button>
        </div>
      </div>

      {showUse && (
        <UseModal
          coupon={coupon}
          onClose={() => setShowUse(false)}
          onUpdated={() => { setShowUse(false); onRefresh() }}
        />
      )}
    </>
  )
}
