import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { PLATFORMS, normalizePlatform } from '../i18n/translations'

export default function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const { lang, setLang, tr } = useLang()

  const allKeys = Object.keys(PLATFORMS)
  const [enabledPlatforms, setEnabledPlatforms] = useState(allKeys)
  const [applied,  setApplied]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Init from profile
  useEffect(() => {
    if (profile?.enabled_platforms) {
      // Normalize legacy keys (e.g. 樂享支付 → TaiFungPay) then filter to valid
      const normalized = profile.enabled_platforms
        .map(normalizePlatform)
        .filter((k, i, arr) => allKeys.includes(k) && arr.indexOf(k) === i)
      setEnabledPlatforms(normalized)
      
      // Auto-clean ghost/legacy platforms in DB
      const changed = normalized.length !== profile.enabled_platforms.length ||
        normalized.some((k, i) => k !== profile.enabled_platforms[i])
      if (changed && updateProfile) {
        updateProfile({ enabled_platforms: normalized }).catch(() => {})
      }
    }
  }, [profile, allKeys, updateProfile])

  function togglePlatform(key) {
    setEnabledPlatforms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
    setApplied(false)
  }

  async function handleApply() {
    setSaving(true)
    await updateProfile({ enabled_platforms: enabledPlatforms, language: lang })
    setSaving(false)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  async function handleLangChange(l) {
    setLang(l)
    setApplied(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
  }

  const INFO_ROWS = [
    { label: tr.programPeriod, value: tr.programPeriodVal },
    { label: tr.drawPeriod,    value: tr.drawPeriodVal },
    { label: tr.usePeriod,     value: tr.usePeriodVal },
    { label: tr.minSpend,      value: tr.minSpendVal },
    { label: tr.weeklyLimit,   value: tr.weeklyLimitVal },
    { label: tr.useRule,       value: tr.useRuleVal },
  ]

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-12 pb-4 safe-top">
        <h1 className="text-white font-bold text-xl">{tr.settingsTitle}</h1>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-10">

        {/* Account */}
        <section className="card space-y-3">
          <h2 className="font-semibold text-gray-700">{tr.account}</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">{tr.yourEmail}</div>
              <div className="text-sm text-gray-700 font-medium">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-xl disabled:opacity-50"
            >
              {loggingOut ? tr.loggingOut : tr.logout}
            </button>
          </div>
        </section>

        {/* Language */}
        <section className="card space-y-3">
          <h2 className="font-semibold text-gray-700">{tr.language}</h2>
          <div className="flex gap-2">
            {['zh', 'en'].map(l => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
                  ${lang === l ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {tr[l]}
              </button>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="card space-y-3">
          <div>
            <h2 className="font-semibold text-gray-700">{tr.platformSettings}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tr.platformHint}</p>
          </div>
          <div className="space-y-2">
            {allKeys.map(key => {
              const isEnabled = enabledPlatforms.includes(key)
              return (
                <label key={key} className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-sm text-gray-700">{PLATFORMS[key]?.[lang] ?? key}</span>
                  <div
                    onClick={() => togglePlatform(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer
                      ${isEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              )
            })}
          </div>

          <button
            onClick={handleApply}
            disabled={saving}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
              ${applied
                ? 'bg-green-500 text-white'
                : 'bg-primary-600 text-white disabled:opacity-50'
              }`}
          >
            {applied ? tr.applied : saving ? '...' : tr.applySettings}
          </button>
        </section>

        {/* Program info */}
        <section className="card space-y-0">
          <h2 className="font-semibold text-gray-700 mb-3">{tr.programInfo}</h2>
          {INFO_ROWS.map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-400">{label}</span>
              <span className="text-sm text-gray-700 font-medium text-right max-w-[55%]">{value}</span>
            </div>
          ))}
        </section>

      </div>
    </div>
  )
}
