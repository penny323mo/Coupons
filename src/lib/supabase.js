import { createClient } from '@supabase/supabase-js'
import { processLock } from '@supabase/auth-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// iOS Safari can leave the cross-tab Navigator lock held by a suspended or stale tab,
// which makes sign-in wait forever. An in-tab lock avoids that.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { lock: processLock },
})

/** Reject if a request takes longer than `ms`, so the UI never hangs on a dead network. */
export function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}
