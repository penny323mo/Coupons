import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { PLATFORMS, FACE_VALUES } from '../i18n/translations'
import { todayStr } from '../lib/dates'

export default function AddCouponModal({ onClose, onAdded }) {
  const { user, profile } = useAuth()
  const { lang, tr } = useLang()

  const enabledKeys = (profile?.enabled_platforms ?? Object.keys(PLATFORMS)).filter(k => PLATFORMS[k])

  const [platform,   setPlatform]   = useState(enabledKeys[0] || '')
  const [faceValue,  setFaceValue]  = useState(50)
  const [drawnDate,  setDrawnDate]  = useState(todayStr())
  const [notes,      setNotes]      = useState('')
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)

  async function handleSave() {
    if (!platform) { setError(tr.errRequired); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('coupons').insert({
      user_id:    user.id,
      platform,
      face_value: faceValue,
      drawn_date: drawnDate,
      notes:      notes || null,
      status:     'unused',
    })
    setSaving(false)
    if (err) { setError(tr.errGeneric); return }
    onAdded()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-10 safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-gray-800 mb-5">{tr.addCoupon}</h2>

        <div className="space-y-4">
          {/* Platform */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.platform}</label>
            <select
              className="input"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              {enabledKeys.map(key => (
                <option key={key} value={key}>{PLATFORMS[key]?.[lang] ?? key}</option>
              ))}
            </select>
          </div>

          {/* Face value */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.faceValue}</label>
            <div className="flex gap-2 flex-wrap">
              {FACE_VALUES.map(v => (
                <button
                  key={v}
                  onClick={() => setFaceValue(v)}
                  className={`flex-1 min-w-[52px] py-2.5 rounded-xl font-bold text-base transition-colors
                    ${faceValue === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Drawn date */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.drawnDate}</label>
            <input
              type="date"
              className="input"
              value={drawnDate}
              onChange={e => setDrawnDate(e.target.value)}
              max={todayStr()}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">{tr.notes}</label>
            <input
              type="text"
              className="input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">
              {tr.cancel}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50">
              {saving ? tr.saving : tr.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
