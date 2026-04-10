import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import {
  isDrawDay, isUseDay, isProgramActive, isProgramBefore, isProgramAfter,
  isCouponActive, effectiveStatus, getCurrentDrawWeekStart, formatExpiry,
} from '../lib/dates'
import { PLATFORMS } from '../i18n/translations'
import AddCouponModal from '../components/AddCouponModal'
import UseModal       from '../components/UseModal'

function StatusBanner({ tr }) {
  const today = new Date()
  if (isProgramBefore(today)) {
    return (
      <div className="bg-gray-100 rounded-2xl p-3 text-center text-sm text-gray-500">
        {tr.beforeStart}
      </div>
    )
  }
  if (isProgramAfter(today)) {
    return (
      <div className="bg-gray-100 rounded-2xl p-3 text-center text-sm text-gray-500">
        {tr.afterEnd}
      </div>
    )
  }
  if (isDrawDay(today)) {
    return (
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-3 text-center">
        <div className="text-white font-bold text-base">{tr.todayDraw}</div>
        <div className="text-white/80 text-xs mt-0.5">{tr.useDays}</div>
      </div>
    )
  }
  if (isUseDay(today)) {
    return (
      <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-3 text-center">
        <div className="text-white font-bold text-base">{tr.todayUse}</div>
        <div className="text-white/80 text-xs mt-0.5">{tr.drawDays}</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { lang, tr }      = useLang()

  const [coupons,      setCoupons]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [useTarget,    setUseTarget]    = useState(null)

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', user.id)
      .order('drawn_date', { ascending: false })
    setCoupons(data ?? [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  // Auto-mark expired coupons (fire-and-forget)
  useEffect(() => {
    if (!coupons.length) return
    const toExpire = coupons.filter(c => effectiveStatus(c) === 'expired' && c.status === 'unused')
    if (!toExpire.length) return
    const ids = toExpire.map(c => c.id)
    supabase.from('coupons').update({ status: 'expired' }).in('id', ids).then(() => {})
  }, [coupons])

  // Stats
  const weekStart   = getCurrentDrawWeekStart()
  const weekCoupons = coupons.filter(c => {
    const d = new Date(c.drawn_date + 'T00:00:00')
    return d >= weekStart
  })
  const weekDraws = weekCoupons.length

  const activeCoupons = coupons.filter(c => isCouponActive(c))
  const totalSaved    = coupons
    .filter(c => c.status === 'used')
    .reduce((sum, c) => sum + c.face_value, 0)

  const displayName = profile?.display_name?.split('@')[0] || ''

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-700 px-4 pt-12 pb-6 safe-top">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/70 text-sm">
              {displayName ? `👋 ${displayName}` : tr.appSubtitle}
            </p>
            <h1 className="text-white font-bold text-xl">{tr.appName}</h1>
          </div>
          <div className="text-3xl">🎰</div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4 pb-6">
        {/* Status banner */}
        <StatusBanner tr={tr} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">{weekDraws}</div>
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{tr.thisWeekDraws}</div>
            <div className="text-[10px] text-gray-300 mt-0.5">{tr.maxDraws}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-500">{activeCoupons.length}</div>
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{tr.activeCoupons}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-500">{totalSaved}</div>
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{tr.totalSaved}</div>
            <div className="text-[10px] text-gray-300">MOP</div>
          </div>
        </div>

        {/* Draw progress bar */}
        {isProgramActive() && (
          <div className="card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">{tr.thisWeekDraws}</span>
              <span className="text-sm text-primary-600 font-bold">{weekDraws} / 3</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min((weekDraws / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Active coupons */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            {tr.activeCoupons}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : activeCoupons.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-2">🎫</div>
              <p className="text-gray-400 text-sm">{tr.noCoupons}</p>
              <p className="text-gray-300 text-xs mt-1">{tr.addFirstCoupon}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCoupons.map(coupon => {
                const platformLabel = PLATFORMS[coupon.platform]?.[lang] ?? coupon.platform
                return (
                  <div key={coupon.id} className="card flex items-center gap-3">
                    <div className="bg-primary-600 text-white font-bold text-xl rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
                      {coupon.face_value}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">MOP {coupon.face_value}</div>
                      <div className="text-sm text-gray-500">{platformLabel}</div>
                      <div className="text-xs text-orange-500 mt-0.5">
                        {tr.expiresOn} {formatExpiry(coupon.drawn_date, lang)}
                      </div>
                    </div>
                    <button
                      onClick={() => setUseTarget(coupon)}
                      className="text-xs bg-green-500 text-white px-3 py-2 rounded-xl font-medium shrink-0"
                    >
                      {tr.markAsUsed}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg text-3xl flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label={tr.addCoupon}
      >
        +
      </button>

      {showAdd && (
        <AddCouponModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchCoupons() }}
        />
      )}

      {useTarget && (
        <UseModal
          coupon={useTarget}
          onClose={() => setUseTarget(null)}
          onUpdated={() => { setUseTarget(null); fetchCoupons() }}
        />
      )}
    </div>
  )
}
