import { PROGRAM_START, PROGRAM_END } from '../i18n/translations'

// Day of week constants
export const DRAW_DAYS = [5, 6, 0]  // Fri, Sat, Sun
export const USE_DAYS  = [1, 2, 3, 4] // Mon, Tue, Wed, Thu

/** Is today a draw day? (Fri/Sat/Sun) */
export function isDrawDay(date = new Date()) {
  return DRAW_DAYS.includes(date.getDay())
}

/** Is today a use/redemption day? (Mon–Thu) */
export function isUseDay(date = new Date()) {
  return USE_DAYS.includes(date.getDay())
}

/** Is today within the program period? */
export function isProgramActive(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d >= PROGRAM_START && d <= PROGRAM_END
}

export function isProgramBefore(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d < PROGRAM_START
}

export function isProgramAfter(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d > PROGRAM_END
}

/**
 * Calculate coupon expiry date.
 * Coupons expire every Friday at midnight.
 * - Drawn on Fri → expires next Fri (+7 days)
 * - Drawn on Sat → expires next Fri (+6 days)
 * - Drawn on Sun → expires next Fri (+5 days)
 */
export function getExpiryDate(drawnDateStr) {
  const date = new Date(drawnDateStr + 'T00:00:00')
  const day  = date.getDay()
  let daysToNextFriday
  if (day === 5)      daysToNextFriday = 7 // Fri
  else if (day === 6) daysToNextFriday = 6 // Sat
  else                daysToNextFriday = 5 // Sun
  const expiry = new Date(date)
  expiry.setDate(date.getDate() + daysToNextFriday)
  return expiry
}

/** Is a coupon (still) active: unused and not expired? */
export function isCouponActive(coupon) {
  if (coupon.status === 'used')    return false
  if (coupon.status === 'expired') return false
  const expiry = getExpiryDate(coupon.drawn_date)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return today < expiry
}

/** Is a coupon expired (unused but past expiry)? */
export function isCouponExpired(coupon) {
  if (coupon.status !== 'unused') return false
  const expiry = getExpiryDate(coupon.drawn_date)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return today >= expiry
}

/** Compute the effective status, accounting for expiry */
export function effectiveStatus(coupon) {
  if (coupon.status === 'used') return 'used'
  if (isCouponExpired(coupon))  return 'expired'
  return 'unused'
}

/**
 * Get the start of the current draw week (most recent Friday).
 * Mon–Thu → previous Friday
 * Fri–Sun → this Friday
 */
export function getCurrentDrawWeekStart(date = new Date()) {
  const d   = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  // Days since last Friday: Fri=0, Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
  const daysSinceFriday = ((day - 5) + 7) % 7
  d.setDate(d.getDate() - daysSinceFriday)
  return d
}

/** Format a date string (YYYY-MM-DD) to locale display */
export function formatDate(dateStr, lang = 'zh') {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (lang === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Format expiry date from a drawn_date string */
export function formatExpiry(drawnDateStr, lang = 'zh') {
  const expiry = getExpiryDate(drawnDateStr)
  const month  = expiry.getMonth() + 1
  const day    = expiry.getDate()
  if (lang === 'zh') return `${month}月${day}日`
  return expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Today as YYYY-MM-DD */
export function todayStr() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}
