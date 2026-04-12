export const PLATFORMS = {
  MPay:       { zh: 'MPay (澳門通)',    en: 'MPay' },
  AlipayMacau:{ zh: '支付寶澳門',       en: 'Alipay Macau' },
  BOC:        { zh: '中銀手機銀行',     en: 'BOC Mobile' },
  ICBC:       { zh: '工銀e支付',         en: 'ICBC e-Pay' },
  TaiFungPay: { zh: '豐付寶',           en: 'TaiFung Pay' },
  Guangfa:    { zh: '廣發移動支付錢包', en: 'Guangfa Wallet' },
  LusoPay:    { zh: 'LusoPay',          en: 'LusoPay' },
  UePay:      { zh: '澳門錢包 (UePay)', en: 'UePay' },
}

// Map ALL possible legacy / stale platform keys → current canonical key
// Add any old names here as they come up
export const LEGACY_PLATFORM_MAP = {
  // Old TaiFungPay variants
  '樂享支付':    'TaiFungPay',
  '樂享':        'TaiFungPay',
  'FunPay':      'TaiFungPay',
  'funpay':      'TaiFungPay',
  'Funpay':      'TaiFungPay',
  'fun_pay':     'TaiFungPay',
  'LokHong':     'TaiFungPay',
  'lok_hong':    'TaiFungPay',
  'TaiFung':     'TaiFungPay',
  'taifungpay':  'TaiFungPay',
  '豐付寶':      'TaiFungPay',
}

/**
 * Normalise a platform key.
 * If it's a known legacy key, return the canonical key.
 * Otherwise return as-is.
 */
export function normalizePlatform(key) {
  if (!key) return key
  if (PLATFORMS[key]) return key                    // already canonical
  if (LEGACY_PLATFORM_MAP[key]) return LEGACY_PLATFORM_MAP[key]
  // Case-insensitive fallback
  const lower = key.toLowerCase()
  for (const [legacy, canonical] of Object.entries(LEGACY_PLATFORM_MAP)) {
    if (legacy.toLowerCase() === lower) return canonical
  }
  return key // truly unknown, return as-is
}

/**
 * Get display label for a platform key, handling legacy keys.
 */
export function platformLabel(key, lang) {
  const canonical = normalizePlatform(key)
  return PLATFORMS[canonical]?.[lang] ?? canonical
}

export const FACE_VALUES = [10, 20, 50, 100, 200]

export const PROGRAM_START = new Date('2026-04-10')
export const PROGRAM_END   = new Date('2026-06-18')

export const t = {
  zh: {
    // App
    appName:     '消費大獎賞',
    appSubtitle: '2026 澳門社區消費大獎賞',

    // Nav
    dashboard: '主頁',
    coupons:   '我的券',
    settings:  '設置',

    // Auth
    login:           '登入',
    loginTitle:      '歡迎回來',
    register:        '注冊',
    registerTitle:   '建立帳戶',
    email:           '電郵地址',
    password:        '密碼',
    confirmPassword: '確認密碼',
    displayName:     '顯示名稱（選填）',
    noAccount:       '未有帳戶？',
    hasAccount:      '已有帳戶？',
    logout:          '登出',
    loggingOut:      '正在登出...',

    // Status
    unused:  '未使用',
    used:    '已使用',
    expired: '已過期',

    // Program status banner
    todayDraw:    '今日可抽券 🎰',
    todayUse:     '今日可核銷 ✅',
    beforeStart:  '計劃將於 2026年4月10日 開始',
    afterEnd:     '計劃已於 2026年6月18日 結束',
    drawDays:     '週五、六、日 抽券',
    useDays:      '週一至四 核銷',

    // Dashboard
    thisWeekDraws:  '本週已抽',
    activeCoupons:  '有效券',
    totalSaved:     '已節省',
    times:          '次',
    maxDraws:       '最多3次/週',
    noCoupons:      '未有有效券',
    addFirstCoupon: '點擊 + 號記錄抽到嘅券',
    markAsUsed:     '標記已用',
    expiresOn:      '到期',
    drawnOn:        '抽取日',

    // Add coupon
    addCoupon:    '記錄新券',
    platform:     '平台',
    faceValue:    '面值 (MOP)',
    drawnDate:    '抽取日期',
    notes:        '備注（選填）',
    cancel:       '取消',
    save:         '儲存',
    saving:       '儲存中...',
    selectPlatform: '選擇平台',

    // Use coupon modal
    markUsed:   '標記為已使用',
    usedDate:   '使用日期',
    storeName:  '商戶名稱',
    storeHint:  '例：百佳、7-11',
    confirm:    '確認',

    // Coupons page
    all:        '全部',
    filters:    '篩選',
    noResults:  '沒有符合條件的券',
    deleteConfirm: '確定刪除此券？',
    delete:     '刪除',

    // Settings
    settingsTitle:    '設置',
    account:          '帳戶',
    yourEmail:        '你的電郵',
    language:         '語言',
    zh:               '繁體中文',
    en:               'English',
    platformSettings: '參與平台',
    platformHint:     '選擇你使用的電子錢包，新增券時只顯示已選平台',
    applySettings:    '套用設置',
    applied:          '已套用 ✓',
    programInfo:      '計劃資料',
    programPeriod:    '活動期間',
    programPeriodVal: '2026年4月10日 – 6月18日',
    drawPeriod:       '抽券時間',
    drawPeriodVal:    '週五、六、日',
    usePeriod:        '核銷時間',
    usePeriodVal:     '週一至四',
    minSpend:         '最低消費',
    minSpendVal:      'MOP 50 / 次',
    weeklyLimit:      '每週上限',
    weeklyLimitVal:   '3次抽券',
    useRule:          '核銷條件',
    useRuleVal:       '消費達券面值 3 倍',

    // Errors
    errRequired:     '請填寫所有必填欄位',
    errPwdMatch:     '密碼不一致',
    errPwdLength:    '密碼最少6位',
    errGeneric:      '發生錯誤，請重試',
    errLogin:        '電郵或密碼錯誤',
    errRegister:     '注冊失敗，請重試',
  },

  en: {
    // App
    appName:     'MO Rewards',
    appSubtitle: '2026 Macau Consumer Rewards',

    // Nav
    dashboard: 'Home',
    coupons:   'My Coupons',
    settings:  'Settings',

    // Auth
    login:           'Login',
    loginTitle:      'Welcome back',
    register:        'Register',
    registerTitle:   'Create account',
    email:           'Email address',
    password:        'Password',
    confirmPassword: 'Confirm password',
    displayName:     'Display name (optional)',
    noAccount:       "Don't have an account?",
    hasAccount:      'Already have an account?',
    logout:          'Logout',
    loggingOut:      'Logging out...',

    // Status
    unused:  'Unused',
    used:    'Used',
    expired: 'Expired',

    // Program status banner
    todayDraw:    'Draw day today 🎰',
    todayUse:     'Redemption day today ✅',
    beforeStart:  'Program starts on 10 Apr 2026',
    afterEnd:     'Program ended on 18 Jun 2026',
    drawDays:     'Draw: Fri, Sat, Sun',
    useDays:      'Redeem: Mon – Thu',

    // Dashboard
    thisWeekDraws:  "This week's draws",
    activeCoupons:  'Active coupons',
    totalSaved:     'Total saved',
    times:          '',
    maxDraws:       'Max 3/week',
    noCoupons:      'No active coupons',
    addFirstCoupon: 'Tap + to record a drawn coupon',
    markAsUsed:     'Mark used',
    expiresOn:      'Expires',
    drawnOn:        'Drawn',

    // Add coupon
    addCoupon:    'Record coupon',
    platform:     'Platform',
    faceValue:    'Value (MOP)',
    drawnDate:    'Drawn date',
    notes:        'Notes (optional)',
    cancel:       'Cancel',
    save:         'Save',
    saving:       'Saving...',
    selectPlatform: 'Select platform',

    // Use coupon modal
    markUsed:  'Mark as used',
    usedDate:  'Date used',
    storeName: 'Store name',
    storeHint: 'e.g. PARKnSHOP, 7-Eleven',
    confirm:   'Confirm',

    // Coupons page
    all:       'All',
    filters:   'Filter',
    noResults: 'No coupons found',
    deleteConfirm: 'Delete this coupon?',
    delete:    'Delete',

    // Settings
    settingsTitle:    'Settings',
    account:          'Account',
    yourEmail:        'Your email',
    language:         'Language',
    zh:               '繁體中文',
    en:               'English',
    platformSettings: 'Platforms',
    platformHint:     'Select the e-wallets you use. Only selected platforms appear when adding coupons.',
    applySettings:    'Apply settings',
    applied:          'Applied ✓',
    programInfo:      'Program info',
    programPeriod:    'Period',
    programPeriodVal: '10 Apr – 18 Jun 2026',
    drawPeriod:       'Draw days',
    drawPeriodVal:    'Fri, Sat, Sun',
    usePeriod:        'Redeem days',
    usePeriodVal:     'Mon – Thu',
    minSpend:         'Min. spend',
    minSpendVal:      'MOP 50 / draw',
    weeklyLimit:      'Weekly limit',
    weeklyLimitVal:   '3 draws / week',
    useRule:          'Redemption rule',
    useRuleVal:       'Spend 3× the coupon value',

    // Errors
    errRequired:  'Please fill in all required fields',
    errPwdMatch:  'Passwords do not match',
    errPwdLength: 'Password must be at least 6 characters',
    errGeneric:   'Something went wrong. Please try again.',
    errLogin:     'Invalid email or password',
    errRegister:  'Registration failed. Please try again.',
  }
}
