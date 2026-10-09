import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, withTimeout } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { currentCampaign } from '../lib/dates'
import { Segmented } from '../components/ui'

const BASE = import.meta.env.BASE_URL

export default function Login() {
  const { user } = useAuth()
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
