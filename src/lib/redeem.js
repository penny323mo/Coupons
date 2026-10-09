import { MERCHANT_DISCOUNT, USE_MULTIPLE } from './campaigns'
import { getExpiryDate } from './dates'

const MAX_SEARCH = 16 // 2^16 subsets is still instant

/**
 * Work out the best e-voucher combination for one payment.
 * A voucher can be used when the single payment is at least 3× its face value; when a
 * wallet holds several, they are redeemed together as long as the total still meets 3×.
 * The merchant discount (spend 100, 12 off) is applied first, so the 3× check runs on
 * the amount after it.
 */
export function planRedemption({ amount, coupons, merchantDiscount = false }) {
  const gross = Math.max(Number(amount) || 0, 0)
  const merchantOff = merchantDiscount && gross >= MERCHANT_DISCOUNT.threshold ? MERCHANT_DISCOUNT.off : 0
  const net = gross - merchantOff
  const cap = Math.floor(net / USE_MULTIPLE)

  const pool = [...coupons]
    .sort((a, b) => getExpiryDate(a.drawn_date) - getExpiryDate(b.drawn_date) || a.face_value - b.face_value)
    .slice(0, MAX_SEARCH)

  let best = { total: 0, mask: 0, count: 0, urgency: 0 }
  for (let mask = 1; mask < 1 << pool.length; mask++) {
    let total = 0, count = 0, urgency = 0
    for (let i = 0; i < pool.length; i++) {
      if (mask & (1 << i)) { total += pool[i].face_value; count++; urgency += pool.length - i }
    }
    if (total > cap) continue
    // Most value first; then use the vouchers that expire soonest; then fewer vouchers.
    if (total > best.total
      || (total === best.total && urgency > best.urgency)
      || (total === best.total && urgency === best.urgency && count < best.count)) {
      best = { total, mask, count, urgency }
    }
  }

  const used = pool.filter((_, i) => best.mask & (1 << i))
  const allValue = coupons.reduce((s, c) => s + c.face_value, 0)
  const needNet = allValue * USE_MULTIPLE
  const spendToUseAll = merchantDiscount && needNet + MERCHANT_DISCOUNT.off >= MERCHANT_DISCOUNT.threshold
    ? needNet + MERCHANT_DISCOUNT.off
    : needNet

  return {
    gross, merchantOff, net, cap, used,
    voucherTotal: best.total,
    pay: Math.max(net - best.total, 0),
    allValue, spendToUseAll,
  }
}
