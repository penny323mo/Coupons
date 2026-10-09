import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep the same object for the same person so token refreshes don't refetch everything
      const next = session?.user ?? null
      setUser(prev => (prev?.id === next?.id ? prev : next))
      // Defer: calling Supabase from inside this callback can deadlock the auth lock
      if (session?.user) setTimeout(() => fetchProfile(session.user.id), 0)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function refreshProfile() {
    if (!user) return
    await fetchProfile(user.id)
  }

  /**
   * Upsert, so accounts created before the profile trigger existed get their row on first save.
   * The change shows at once and is rolled back if the server refuses.
   */
  async function updateProfile(updates) {
    if (!user) return { error: new Error('Not logged in') }
    const before = profile
    setProfile(prev => ({ ...(prev ?? { id: user.id }), ...updates }))
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single()
    if (error) {
      console.error('profile save failed', error)
      setProfile(before)
    } else {
      setProfile(data)
    }
    return { data, error }
  }

  /** Google OAuth; returns to the app root, where main.jsx picks the session out of the URL. */
  async function signInWithGoogle() {
    // Ask the server first so a disabled provider gives a message here, not a raw JSON page
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      })
      const settings = await res.json()
      if (settings?.external && !settings.external.google) {
        return { error: { code: 'google_disabled', message: 'Google provider is not enabled' } }
      }
    } catch { /* fall through and let the redirect report any problem */ }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
