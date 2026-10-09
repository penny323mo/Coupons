import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { normalizePlatform } from '../lib/platforms'
import { effectiveStatus } from '../lib/dates'

const CouponsContext = createContext(null)

// Postgres: undefined column / check violation → the autumn migration has not been run
const NEEDS_MIGRATION = new Set(['42703', '23514', 'PGRST204'])

export function CouponsProvider({ children }) {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) { setCoupons([]); setLoading(true); return }
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', user.id)
      .order('drawn_date', { ascending: false })
      .order('created_at', { ascending: false })
    const rows = data ?? []

    // Fix legacy platform keys and persist cleared vouchers (fire-and-forget)
    rows.forEach(c => {
      const canonical = normalizePlatform(c.platform)
      if (canonical !== c.platform) {
        supabase.from('coupons').update({ platform: canonical }).eq('id', c.id).then(() => {})
        c.platform = canonical
      }
    })
    const toExpire = rows.filter(c => c.status === 'unused' && effectiveStatus(c) === 'expired')
    if (toExpire.length) {
      supabase.from('coupons').update({ status: 'expired' }).in('id', toExpire.map(c => c.id)).then(() => {})
      toExpire.forEach(c => { c.status = 'expired' })
    }

    setCoupons(rows)
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // Re-evaluate expiry when the app comes back to the foreground
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  async function addCoupon(fields) {
    const row = { user_id: user.id, status: 'unused', ...fields }
    // Government vouchers omit `kind` so they still save before the migration runs
    if (row.kind === 'gov') delete row.kind
    const { error } = await supabase.from('coupons').insert(row)
    if (error) return { error, needsMigration: NEEDS_MIGRATION.has(error.code) }
    await refresh()
    return {}
  }

  async function updateCoupon(id, updates) {
    const { error } = await supabase.from('coupons').update(updates).eq('id', id)
    if (!error) await refresh()
    return { error }
  }

  async function deleteCoupon(id) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (!error) await refresh()
    return { error }
  }

  return (
    <CouponsContext.Provider value={{ coupons, loading, refresh, addCoupon, updateCoupon, deleteCoupon }}>
      {children}
    </CouponsContext.Provider>
  )
}

export function useCoupons() {
  return useContext(CouponsContext)
}
