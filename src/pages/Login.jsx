import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

export default function Login() {
  const { user } = useAuth()
  const { lang, setLang, tr } = useLang()

  const [mode,     setMode]     = useState('login') // 'login' | 'register'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) { setError(tr.errRequired); return }

    if (mode === 'register') {
      if (password.length < 6)       { setError(tr.errPwdLength); return }
      if (password !== confirm)      { setError(tr.errPwdMatch);  return }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) setError(tr.errLogin)
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) { setError(tr.errRegister); return }
        // Update display_name if provided
        if (name && data.user) {
          await supabase.from('profiles').update({ display_name: name }).eq('id', data.user.id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col">
      {/* Language toggle */}
      <div className="flex justify-end p-4 safe-top">
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{tr.appName}</h1>
          <p className="text-white/70 text-sm mt-1">{tr.appSubtitle}</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {mode === 'login' ? tr.loginTitle : tr.registerTitle}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">{tr.displayName}</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ah Ming"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-1">{tr.email}</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">{tr.password}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">{tr.confirmPassword}</label>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? '...' : (mode === 'login' ? tr.login : tr.register)}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-gray-400 text-sm">
              {mode === 'login' ? tr.noAccount : tr.hasAccount}{' '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-primary-600 text-sm font-semibold"
            >
              {mode === 'login' ? tr.register : tr.login}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
