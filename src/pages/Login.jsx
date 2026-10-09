import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, withTimeout } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { currentCampaign } from '../lib/dates'
import { Segmented } from '../components/ui'

const BASE = import.meta.env.BASE_URL

export default function Login() {
  const { user, signInWithGoogle } = useAuth()
  const { lang, setLang, tr } = useLang()

  const [mode,      setMode]      = useState('login') // 'login' | 'register'
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [name,      setName]      = useState('')
  const [error,     setError]     = useState(() => {
    const failure = sessionStorage.getItem('authError')
    sessionStorage.removeItem('authError')
    return failure ? tr.authFailed(failure) : ''
  })
  const [loading,   setLoading]   = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleGoogle() {
    setError('')
    setLoading(true)
    const { error: err } = await signInWithGoogle()
    // On success the browser leaves for Google; only failures come back here
    if (err) { setError(tr.authFailed(err.message)); setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError(tr.errRequired); return }
    if (mode === 'register') {
      if (password.length < 6)  { setError(tr.errPwdLength); return }
      if (password !== confirm) { setError(tr.errPwdMatch);  return }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await withTimeout(supabase.auth.signInWithPassword({ email, password }))
        if (err) setError(err.message)
      } else {
        const { data, error: err } = await withTimeout(supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
        }))
        if (err) { setError(err.message); return }
        if (name && data.user) {
          await supabase.from('profiles').update({ display_name: name }).eq('id', data.user.id)
        }
        // No session = email confirmation required
        if (!data.session) setEmailSent(true)
      }
    } catch (e) {
      setError(e.message === 'timeout' ? tr.errTimeout : tr.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shell login">
      <header className="topbar">
        <span />
        <button type="button" className="pill lang-pill" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <main className="login-main">
        <div className="login-brand">
          <span className="logo big"><img src={`${BASE}icon.svg`} alt="" /></span>
          <h1>{tr.appName}</h1>
          <p className="summary">{currentCampaign().name[lang]}</p>
        </div>

        <section className="settings-card login-card">
          {emailSent ? (
            <div className="center">
              <h2>{tr.emailSentTitle}</h2>
              <p className="muted">{tr.emailSent(email)}</p>
              <button type="button" className="primary-btn wide" onClick={() => { setEmailSent(false); setMode('login') }}>
                {tr.login}
              </button>
            </div>
          ) : (
            <>
              <button type="button" className="google-btn" onClick={handleGoogle} disabled={loading}>
                <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                </svg>
                {tr.google}
              </button>
              <div className="divider"><span>{tr.orEmail}</span></div>

              <Segmented label={tr.login} value={mode} onChange={m => { setMode(m); setError('') }}
                options={[{ value: 'login', label: tr.login }, { value: 'register', label: tr.register }]} />
              <p className="muted">{mode === 'login' ? tr.loginHint : tr.registerTitle}</p>

              <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <label className="field">
                    <span>{tr.displayName}</span>
                    <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                  </label>
                )}
                <label className="field">
                  <span>{tr.email}</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" inputMode="email" />
                </label>
                <label className="field">
                  <span>{tr.password}</span>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                </label>
                {mode === 'register' && (
                  <label className="field">
                    <span>{tr.confirmPassword}</span>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      required autoComplete="new-password" />
                  </label>
                )}
                {error && <p className="note error" role="alert">{error}</p>}
                <button type="submit" className="primary-btn wide" disabled={loading}>
                  {loading ? '…' : mode === 'login' ? tr.login : tr.register}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
