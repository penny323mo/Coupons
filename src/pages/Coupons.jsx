import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { effectiveStatus } from '../lib/dates'
import { PLATFORMS, platformLabel, normalizePlatform } from '../i18n/translations'
import CouponCard      from '../components/CouponCard'
import AddCouponModal  from '../components/AddCouponModal'

const STATUS_FILTERS = ['all', 'unused', 'used', 'expired']

export default function Coupons() {
  const { user, profile } = useAuth()
  const { lang, tr }      = useLang()

  const [coupons,       setCoupons]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [platformFilter,setPlatformFilter]= useState('all')
  const [showAdd,       setShowAdd]       = useState(false)

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', user.id)
      .order('drawn_date', { ascending: false })

    const rows = data ?? []

    // Auto-expire in DB (fire-and-forget)
    const toExpire = rows.filter(c => effectiveStatus(c) === 'expired' && c.status === 'unused')
    if (toExpire.length) {
      supabase.from('coupons').update({ status: 'expired' })
        .in('id', toExpire.map(c => c.id)).then(() => {})
    }

    setCoupons(rows)
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const enabledPlatforms = (profile?.enabled_platforms ?? Object.keys(PLATFORMS))
    .map(normalizePlatform)
    .filter((k, i, arr) => PLATFORMS[k] && arr.indexOf(k) === i)

  // Filter
  const filtered = coupons.filter(c => {
    const effStatus = effectiveStatus(c)
    if (statusFilter  !== 'all' && effStatus !== statusFilter)       return false
    if (platformFilter !== 'all' && normalizePlatform(c.platform) !== platformFilter)   return false
    return true
  })

  // Summary counts
  const counts = coupons.reduce((acc, c) => {
    acc[effectiveStatus(c)] = (acc[effectiveStatus(c)] ?? 0) + 1
    return acc
  }, { unused: 0, used: 0, expired: 0 })

  const totalSaved = coupons
    .filter(c => c.status === 'used')
    .reduce((sum, c) => sum + c.face_value, 0)

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-12 pb-4 safe-top">
        <h1 className="text-white font-bold text-xl">{tr.coupons}</h1>
        <p className="text-white/70 text-xs mt-0.5">{tr.appSubtitle}</p>
      </div>

      {/* Summary strip */}
      <div className="bg-primary-700 px-4 py-3 flex gap-4 text-center">
        {[
          { key: 'unused', color: 'text-blue-300' },
          { key: 'used',   color: 'text-green-300' },
          { key: 'expired',color: 'text-gray-400'  },
        ].map(({ key, color }) => (
          <div key={key} className="flex-1">
            <div className={`text-lg font-bold ${color}`}>{counts[key] ?? 0}</div>
            <div className="text-white/50 text-[10px]">{tr[key]}</div>
          </div>
        ))}
        <div className="flex-1">
          <div className="text-lg font-bold text-yellow-300">{totalSaved}</div>
          <div className="text-white/50 text-[10px]">{tr.totalSaved} MOP</div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">
        {/* Status filter tabs */}
        <div className="flex bg-white rounded-2xl p-1 gap-1 shadow-sm">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors
                ${statusFilter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-400'
                }`}
            >
              {f === 'all' ? tr.all : tr[f]}
            </button>
          ))}
        </div>

        {/* Platform filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${platformFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 shadow-sm'}`}
          >
            {tr.all}
          </button>
          {enabledPlatforms.map(key => (
            <button
              key={key}
              onClick={() => setPlatformFilter(platformFilter === key ? 'all' : key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${platformFilter === key ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 shadow-sm'}`}
            >
              {platformLabel(key, lang)}
            </button>
          ))}
        </div>

        {/* Coupon list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-3 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-2">🎫</div>
            <p className="text-gray-400 text-sm">{tr.noResults}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(coupon => (
              <CouponCard key={coupon.id} coupon={coupon} onRefresh={fetchCoupons} />
            ))}
          </div>
        )}
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
    </div>
  )
}
