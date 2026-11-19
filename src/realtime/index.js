import { FIREBASE_CONFIG, REALTIME_PROVIDER, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env'

/**
 * เลือก adapter ตาม .env แล้ว lazy-load SDK เฉพาะตัวที่ใช้ (bundle เล็กลง)
 * ทุก adapter มี interface เดียวกัน:
 *   { mode, label, now(), joinRoom(roomId, me, handlers) → leave(), publish(roomId, record) }
 */
let adapterPromise = null

export function getRealtime() {
  adapterPromise ??= (async () => {
    try {
      if (REALTIME_PROVIDER === 'firebase') {
        const { createFirebaseAdapter } = await import('./firebaseAdapter')
        return createFirebaseAdapter(FIREBASE_CONFIG)
      }
      if (REALTIME_PROVIDER === 'supabase') {
        const { createSupabaseAdapter } = await import('./supabaseAdapter')
        return createSupabaseAdapter(SUPABASE_URL, SUPABASE_ANON_KEY)
      }
    } catch (err) {
      console.error('[realtime] เชื่อมต่อไม่สำเร็จ ใช้โหมดสาธิตแทน', err)
    }
    const { createLocalAdapter } = await import('./localAdapter')
    return createLocalAdapter()
  })()
  return adapterPromise
}
