/**
 * Rounds of the Macau community consumption scheme (DSEDT + Macao Chamber of Commerce).
 * Sources: gov.mo news 1272306 (autumn launch), 1227166 (spring launch).
 */
export const CAMPAIGNS = [
  {
    id: '2026-spring',
    name: { zh: '2026社區消費大獎賞', en: '2026 Community Consumption Rewards' },
    short: { zh: '大獎賞', en: 'Spring round' },
    start: '2026-04-10',
    end: '2026-06-18',
    weeks: 10,
    anyDayUse: false,         // redeem Mon–Thu only
    merchantVouchers: false,
  },
  {
    id: '2026-autumn',
    name: { zh: '2026社區消費連環賞', en: '2026 Community Spending Rewards' },
    short: { zh: '連環賞', en: 'Autumn round' },
    start: '2026-10-09',
    end: '2026-12-17',
    weeks: 10,
    anyDayUse: true,          // redeem any day from the claim day until Thursday
    merchantVouchers: true,   // 商戶滿減券 + 消費禮遇券
    totalBudget: 468,         // MOP million
    site: 'https://rewards.dsedt.gov.mo',
    hotline: '2857 5472 / 2857 5439',
  },
]

export const FACE_VALUES = [10, 20, 50, 100, 200]
export const MIN_SPEND = 50
export const USE_MULTIPLE = 3

// 商戶滿減券: spend 100, get 12 off
export const MERCHANT_DISCOUNT = { threshold: 100, off: 12 }
