export const PLATFORMS = {
  MPay:        { zh: 'MPay 澳門錢包',      en: 'MPay',           short: 'MPay',   tint: '#f08a24' },
  AlipayMacau: { zh: '支付寶（澳門）',     en: 'Alipay Macau',   short: '支付寶', tint: '#1677ff' },
  BOC:         { zh: '中銀手機銀行',       en: 'BOC Mobile',     short: '中銀',   tint: '#c8102e' },
  ICBC:        { zh: '工銀e支付',          en: 'ICBC e-Pay',     short: '工銀',   tint: '#c7000b' },
  TaiFungPay:  { zh: '豐付寶',             en: 'TaiFung Pay',    short: '豐付寶', tint: '#0b8a5f' },
  Guangfa:     { zh: '廣發移動支付錢包',   en: 'Guangfa Wallet', short: '廣發',   tint: '#d4202c' },
  LusoPay:     { zh: 'LusoPay（國際銀行）', en: 'LusoPay',        short: 'Luso',   tint: '#00539b' },
  UePay:       { zh: '澳門錢包 UePay',     en: 'UePay',          short: 'UePay',  tint: '#14a0e0' },
}

export const PLATFORM_KEYS = Object.keys(PLATFORMS)

// Legacy / stale platform keys seen in older rows → canonical key
const LEGACY_PLATFORM_MAP = {
  '樂享支付': 'TaiFungPay',
  '樂享':     'TaiFungPay',
  'FunPay':   'TaiFungPay',
  'fun_pay':  'TaiFungPay',
  'LokHong':  'TaiFungPay',
  'lok_hong': 'TaiFungPay',
  'TaiFung':  'TaiFungPay',
  '豐付寶':   'TaiFungPay',
}

export function normalizePlatform(key) {
  if (!key) return key
  if (PLATFORMS[key]) return key
  if (LEGACY_PLATFORM_MAP[key]) return LEGACY_PLATFORM_MAP[key]
  const lower = key.toLowerCase()
  for (const [legacy, canonical] of Object.entries(LEGACY_PLATFORM_MAP)) {
    if (legacy.toLowerCase() === lower) return canonical
  }
  return key
}

export function platformLabel(key, lang) {
  const canonical = normalizePlatform(key)
  return PLATFORMS[canonical]?.[lang] ?? canonical
}

/** Valid, de-duplicated platform keys enabled in a profile (all when unset). */
export function enabledPlatforms(profile) {
  return (profile?.enabled_platforms ?? PLATFORM_KEYS)
    .map(normalizePlatform)
    .filter((k, i, arr) => PLATFORMS[k] && arr.indexOf(k) === i)
}
