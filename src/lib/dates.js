import { CAMPAIGNS } from './campaigns'

// Day of week constants
export const CLAIM_DAYS = [5, 6, 0]     // Fri, Sat, Sun
export const WEEKLY_CLAIMS = 3          // per wallet account, reset Monday 00:00

/** Parse 'YYYY-MM-DD' as a local date (never UTC). */
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Local date → 'YYYY-MM-DD'. */
export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr() {
  return toDateStr(new Date())
}

function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/* ---------- Campaigns ---------- */

/** Campaign whose period contains the given day, or null. */
export function campaignOn(date = new Date()) {
  const d = startOfDay(date)
  return CAMPAIGNS.find(c => d >= parseDate(c.start) && d <= parseDate(c.end)) ?? null
}

/** The campaign that matters now: the running one, else the next, else the last. */
export function currentCampaign(date = new Date()) {
  const d = startOfDay(date)
  return campaignOn(d)
    ?? CAMPAIGNS.find(c => parseDate(c.start) > d)
    ?? CAMPAIGNS[CAMPAIGNS.length - 1]
}

/** 'before' | 'active' | 'after' for the given campaign. */
export function campaignState(campaign, date = new Date()) {
  const d = startOfDay(date)
  if (d < parseDate(campaign.start)) return 'before'
  if (d > parseDate(campaign.end))   return 'after'
  return 'active'
}

/** 1-based week number inside the campaign (weeks start on the campaign's first Friday). */
export function campaignWeek(campaign, date = new Date()) {
  const days = Math.floor((startOfDay(date) - parseDate(campaign.start)) / 86400000)
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), campaign.weeks)
}

/** Campaign a coupon belongs to (by the day it was claimed). */
export function campaignOfCoupon(coupon) {
  return campaignOn(parseDate(coupon.drawn_date)) ?? currentCampaign(parseDate(coupon.drawn_date))
}

/* ---------- Claim window ---------- */

export function isClaimDay(date = new Date()) {
  return CLAIM_DAYS.includes(date.getDay()) && campaignOn(date) !== null
}

/**
 * The Fri–Sun claim window that the weekly cap applies to.
 * Fri–Sun → this weekend. Mon–Thu → the coming weekend (the cap was reset on Monday).
 */
export function claimWindow(date = new Date()) {
  const d = startOfDay(date)
  const day = d.getDay()
  const friday = CLAIM_DAYS.includes(day)
    ? addDays(d, -((day - 5 + 7) % 7))
    : addDays(d, 5 - day)
  return { start: friday, end: addDays(friday, 2) }
}

export function isInClaimWindow(coupon, date = new Date()) {
  const { start, end } = claimWindow(date)
  const drawn = parseDate(coupon.drawn_date)
  return drawn >= start && drawn <= end
}

/* ---------- Validity ---------- */

/** Official rule: cleared at 00:00 on the Friday after the claim day. */
export function ruleExpiry(drawnDateStr) {
  const date = parseDate(drawnDateStr)
  const days = ((5 - date.getDay() + 7) % 7) || 7
  return addDays(date, days)
}

/** Last usable day under the official rule (the Thursday before clearing). */
export function ruleUseBy(drawnDateStr) {
  return addDays(ruleExpiry(drawnDateStr), -1)
}

/**
 * When a voucher stops being usable (00:00 of that day).
 * A voucher may carry its own `use_by` from the wallet, which wins over the rule.
 * Accepts a coupon row or a bare claim date.
 */
export function getExpiryDate(couponOrDate) {
  if (typeof couponOrDate === 'string') return ruleExpiry(couponOrDate)
  if (couponOrDate.use_by) return addDays(parseDate(couponOrDate.use_by), 1)
  return ruleExpiry(couponOrDate.drawn_date)
}

/** Last day the voucher can be used. */
export function lastUseDate(couponOrDate) {
  return addDays(getExpiryDate(couponOrDate), -1)
}

/** Whole days left including today, 0 once cleared. */
export function daysLeft(couponOrDate, date = new Date()) {
  const diff = Math.ceil((getExpiryDate(couponOrDate) - startOfDay(date)) / 86400000)
  return Math.max(diff, 0)
}

export function isCouponExpired(coupon, date = new Date()) {
  if (coupon.status === 'used')    return false
  if (coupon.status === 'expired') return true
  return startOfDay(date) >= getExpiryDate(coupon)
}

export function effectiveStatus(coupon, date = new Date()) {
  if (coupon.status === 'used') return 'used'
  if (isCouponExpired(coupon, date)) return 'expired'
  return 'unused'
}

export function isCouponActive(coupon, date = new Date()) {
  return effectiveStatus(coupon, date) === 'unused'
}

/**
 * Can this coupon be redeemed on the given day?
 * Spring round: Mon–Thu only. Autumn round: any day from the claim day.
 */
export function canUseOn(coupon, date = new Date()) {
  if (!isCouponActive(coupon, date)) return false
  const d = startOfDay(date)
  if (d < parseDate(coupon.drawn_date)) return false
  if (campaignOfCoupon(coupon).anyDayUse) return true
  return d.getDay() >= 1 && d.getDay() <= 4
}

/* ---------- Coupon kinds ---------- */

export const KINDS = ['gov', 'merchant_discount', 'merchant_gift']

export function couponKind(coupon) {
  return KINDS.includes(coupon.kind) ? coupon.kind : 'gov'
}

/* ---------- Formatting ---------- */

const WEEKDAYS = {
  zh: ['日', '一', '二', '三', '四', '五', '六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

export function formatDay(date, lang = 'zh', withWeekday = false) {
  const wd = WEEKDAYS[lang][date.getDay()]
  if (lang === 'zh') return `${date.getMonth() + 1}月${date.getDate()}日${withWeekday ? `（${wd}）` : ''}`
  const s = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return withWeekday ? `${wd} ${s}` : s
}

export function formatDate(dateStr, lang = 'zh', withWeekday = false) {
  if (!dateStr) return ''
  return formatDay(parseDate(dateStr), lang, withWeekday)
}

/* ---------- Rounds & archive ---------- */

/** 1-based round ("關") number of a campaign. */
export function roundNumber(campaign) {
  return CAMPAIGNS.findIndex(c => c.id === campaign.id) + 1
}

/** Finished rounds other than the current one, newest first. */
export function archivedCampaigns(date = new Date()) {
  const current = currentCampaign(date)
  return CAMPAIGNS.filter(c => c.id !== current.id && campaignState(c, date) === 'after').reverse()
}

export function couponsOfCampaign(coupons, campaign) {
  return coupons.filter(c => campaignOfCoupon(c).id === campaign.id)
}

/** Totals for one round. */
export function roundStats(coupons) {
  const used = coupons.filter(c => c.status === 'used')
  const expired = coupons.filter(c => effectiveStatus(c) === 'expired')
  return {
    count: coupons.length,
    used: used.length,
    saved: used.reduce((s, c) => s + c.face_value, 0),
    wasted: expired.filter(c => couponKind(c) === 'gov').reduce((s, c) => s + c.face_value, 0),
    rate: coupons.length ? Math.round((used.length / coupons.length) * 100) : 0,
  }
}
