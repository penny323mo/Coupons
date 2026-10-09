import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useCoupons } from '../contexts/CouponsContext'
import { useUI } from '../contexts/UIContext'
import { enabledPlatforms, platformLabel } from '../lib/platforms'
import { couponKind, canUseOn, currentCampaign, todayStr } from '../lib/dates'
import { planRedemption } from '../lib/redeem'
import { Switch } from '../components/ui'

export default function Calc() {
  const { profile } = useAuth()
  const { lang, tr } = useLang()
  const { coupons, updateCoupons } = useCoupons()
  const { showToast } = useUI()
  const [params] = useSearchParams()

  const usable = coupons.filter(c => couponKind(c) === 'gov' && canUseOn(c))
  const wallets = enabledPlatforms(profile)
  // Default to the wallet holding the most usable value
  const richest = [...wallets].sort((a, b) =>
    usable.filter(c => c.platform === b).reduce((s, c) => s + c.face_value, 0)
    - usable.filter(c => c.platform === a).reduce((s, c) => s + c.face_value, 0))[0] ?? ''

  const [platform, setPlatform] = useState(wallets.includes(params.get('w')) ? params.get('w') : richest)
  const [amount,   setAmount]   = useState('')
  const [merchant, setMerchant] = useState(false)

  const pool = usable.filter(c => c.platform === platform)
  const plan = planRedemption({ amount, coupons: pool, merchantDiscount: merchant })
  const showMerchant = currentCampaign().merchantVouchers

  async function redeem() {
    const ids = plan.used.map(c => c.id)
    const { error } = await updateCoupons(ids, { status: 'used', used_date: todayStr() })
    if (error) { showToast(tr.errGeneric); return }
    setAmount('')
    showToast(tr.usedMany(ids.length, plan.voucherTotal), {
      label: tr.undo,
      run: () => updateCoupons(ids, { status: 'unused', used_date: null }),
    })
  }

  return (
    <>
      <section className="hero">
        <div>
          <h1>{tr.calcTitle}</h1>
          <p className="summary">{tr.calcSummary}</p>
        </div>
      </section>

      <section className="settings-card">
        <label className="row-field">
          <span>{tr.calcWallet}</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            {wallets.map(k => {
              const v = usable.filter(c => c.platform === k).reduce((s, c) => s + c.face_value, 0)
              return <option key={k} value={k}>{platformLabel(k, lang)}{v ? ` · ${v}` : ''}</option>
            })}
          </select>
        </label>
        <label className="row-field">
          <span>{tr.amount}</span>
          <input className="amount" type="number" inputMode="decimal" min="0" step="0.1" placeholder="0"
            value={amount} onChange={e => setAmount(e.target.value)} />
        </label>
        {showMerchant && (
          <label className="row-field">
            <span>{tr.withMerchant}<small>{tr.withMerchantHint}</small></span>
            <Switch checked={merchant} onChange={setMerchant} label={tr.withMerchant} />
          </label>
        )}
      </section>

      <section className="settings-card result">
        <h2>{tr.calcResult}</h2>
        {pool.length === 0 ? (
          <p className="muted">{tr.calcNoCoupons}</p>
        ) : (
          <>
            <dl className="receipt">
              <div><dt>{tr.calcGross}</dt><dd>{plan.gross.toFixed(1)}</dd></div>
              {plan.merchantOff > 0 && <div><dt>{tr.calcMerchant}</dt><dd>−{plan.merchantOff}</dd></div>}
              <div><dt>{tr.calcVoucher}</dt><dd>{plan.voucherTotal ? `−${plan.voucherTotal}` : 0}</dd></div>
              <div className="total"><dt>{tr.calcPay}</dt><dd>MOP {plan.pay.toFixed(1)}</dd></div>
            </dl>
            {plan.gross > 0 && (plan.used.length
              ? <><div className="chips used">
                  <span className="muted">{tr.calcUses}</span>
                  {plan.used.map(c => <span key={c.id} className="chip on">{c.face_value}</span>)}
                </div>
                <button type="button" className="primary-btn wide" onClick={redeem}>
                  {tr.redeemNow(plan.used.length, plan.voucherTotal)}
                </button></>
              : <p className="note warn">{tr.calcNone}</p>)}
            <p className="muted">{tr.calcAll(plan.allValue, plan.spendToUseAll)}</p>
          </>
        )}
        <p className="caption">{tr.calcNote}</p>
      </section>
    </>
  )
}
