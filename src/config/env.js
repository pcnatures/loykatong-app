/**
 * รวมค่าจาก .env ไว้ที่เดียว — คอมโพเนนต์อื่นไม่ต้องอ่าน import.meta.env เอง
 * ทุกค่าเป็น "ไม่บังคับ": ถ้าไม่กรอก แอปจะ fallback ไปโหมดสาธิตอัตโนมัติ
 */
const env = import.meta.env ?? {}

const clean = (v) => (typeof v === 'string' ? v.trim() : '')

export const FIREBASE_CONFIG = {
  apiKey: clean(env.VITE_FIREBASE_API_KEY),
  authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: clean(env.VITE_FIREBASE_DATABASE_URL),
  projectId: clean(env.VITE_FIREBASE_PROJECT_ID),
  appId: clean(env.VITE_FIREBASE_APP_ID),
}

export const SUPABASE_URL = clean(env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = clean(env.VITE_SUPABASE_ANON_KEY)

function detectRealtimeProvider() {
  const forced = clean(env.VITE_REALTIME_PROVIDER).toLowerCase()
  if (['firebase', 'supabase', 'local'].includes(forced)) return forced
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL) return 'firebase'
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return 'supabase'
  return 'local'
}

/** 'firebase' | 'supabase' | 'local' */
export const REALTIME_PROVIDER = detectRealtimeProvider()
