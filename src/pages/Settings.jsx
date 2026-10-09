import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useUI } from '../contexts/UIContext'
import { CAMPAIGNS, FACE_VALUES } from '../lib/campaigns'
import { PLATFORMS, PLATFORM_KEYS, enabledPlatforms } from '../lib/platforms'
import { currentCampaign, parseDate, formatDay } from '../lib/dates'
import { Segmented, Switch } from '../components/ui'

function period(c, lang) {
  const year = parseDate(c.start).getFullYear()
  const range = `${formatDay(parseDate(c.start), lang)} – ${formatDay(parseDate(c.end), lang)}`
  return lang === 'zh' ? `${year}年${range}` : `${range} ${year}`
}

function InfoRows({ rows }) {
  return (
    <dl className="info">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  )
}

export default function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const { lang, setLang, tr } = useLang()
  const { showToast } = useUI()
  const [loggingOut, setLoggingOut] = useState(false)
  const [saving, setSaving] = useState(false)

  const enabled = enabledPlatforms(profile)
  const campaign = currentCampaign()
  const previous = CAMPAIGNS.filter(c => c.id !== campaign.id)

  async function toggle(key, on) {
    const next = on ? PLATFORM_KEYS.filter(k => k === key || enabled.includes(k)) : enabled.filter(k => k !== key)
    setSaving(true)
    const { error } = await updateProfile({ enabled_platforms: next })
    setSaving(false)
    showToast(error ? tr.errGeneric : tr.platformSaved)
  }

  function changeLang(l) {
    setLang(l)
    updateProfile({ language: l })
  }

  return (
    <>
      <section className="hero">
        <div>
          <h1>{tr.settingsTitle}</h1>
          <p className="summary">{user?.email}</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="capsule danger lens" disabled={loggingOut}
            onClick={async () => { setLoggingOut(true); await signOut() }}>
            {loggingOut ? tr.loggingOut : tr.logout}
          </button>
        </div>
      </section>

      <section className="settings-card">
        <h2>{tr.language}</h2>
        <Segmented label={tr.language} value={lang} onChange={changeLang}
          options={[{ value: 'zh', label: tr.langZh }, { value: 'en', label: tr.langEn }]} />
      </section>

      <section className="settings-card">
        <h2>{tr.platformSettings}</h2>
        <p className="muted">{tr.platformHint}</p>
        {PLATFORM_KEYS.map(key => (
          <label key={key} className="row-field">
            <span className="wallet-label">
              <span className="wallet-dot" style={{ '--tint': PLATFORMS[key].tint }} aria-hidden="true" />
              {PLATFORMS[key][lang]}
            </span>
            <Switch checked={enabled.includes(key)} disabled={saving} label={PLATFORMS[key][lang]}
              onChange={on => toggle(key, on)} />
          </label>
        ))}
      </section>

      <section className="settings-card">
        <h2>{tr.roundInfo} <small>{campaign.name[lang]}</small></h2>
        <InfoRows rows={[
          [tr.period,     period(campaign, lang)],
          [tr.claimTime,  tr.claimTimeVal],
          [tr.claimRule,  tr.claimRuleVal],
          [tr.weeklyCap,  tr.weeklyCapVal],
          [tr.useTime,    campaign.anyDayUse ? tr.useTimeNew : tr.useTimeOld],
          [tr.useRule,    tr.useRuleVal],
          [tr.clearRule,  tr.clearRuleVal],
          [tr.faceValues, FACE_VALUES.join(' / ')],
          ...(campaign.merchantVouchers ? [[tr.merchantVouchers, tr.merchantVal]] : []),
          [tr.seniorCard, tr.seniorVal],
        ]} />
        {campaign.site && (
          <InfoRows rows={[
            [tr.officialSite, <a key="site" href={campaign.site} target="_blank" rel="noreferrer">{campaign.site.replace('https://', '')}</a>],
            [tr.hotline, campaign.hotline],
          ]} />
        )}
        <p className="caption">{tr.unconfirmed}</p>

        {previous.map(c => (
          <details key={c.id}>
            <summary>{tr.previousRound} · {c.name[lang]}</summary>
            <InfoRows rows={[
              [tr.period,  period(c, lang)],
              [tr.useTime, c.anyDayUse ? tr.useTimeNew : tr.useTimeOld],
            ]} />
          </details>
        ))}
      </section>
    </>
  )
}
