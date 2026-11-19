import { sanitizeAvatar } from '../config/avatarOptions'
import { sanitizeKrathong } from '../config/krathongOptions'
import { maskProfanity } from '../lib/profanity'
import { clampChars } from '../lib/thaiText'

export const NAME_MAX = 30
export const WISH_MAX = 150

const num = (v, min, max, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
const str = (v, max) => clampChars(typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim() : '', max)

/**
 * ทำให้ข้อมูลกระทงจากแหล่งใดก็ตาม (ฐานข้อมูล / แท็บอื่น) อยู่ในรูปแบบเดียวกันและปลอดภัย
 * - ตัดความยาว, กรองคำหยาบซ้ำอีกรอบตอนแสดงผล (กันคนส่งตรงเข้าฐานข้อมูล)
 * - ตัวเลือกอวตาร/กระทงที่ไม่รู้จักจะถูกแทนด้วยค่าเริ่มต้น
 */
export function normalizeRecord(raw, roomId) {
  if (!raw || typeof raw !== 'object' || !raw.id) return null
  const createdAt = typeof raw.createdAt === 'string' ? Date.parse(raw.createdAt) : Number(raw.createdAt)
  if (!Number.isFinite(createdAt)) return null
  return {
    id: String(raw.id),
    room: roomId,
    clientId: typeof raw.clientId === 'string' ? raw.clientId : '',
    name: maskProfanity(str(raw.name, NAME_MAX)) || 'ผู้ร่วมงาน',
    wish: maskProfanity(str(raw.wish, WISH_MAX)),
    avatar: sanitizeAvatar(raw.avatar),
    krathong: sanitizeKrathong(raw.krathong),
    createdAt,
    seed: num(raw.seed, 0, 1, 0.5),
    lane: num(raw.lane, 0.1, 0.9, 0.5),
    startX: num(raw.startX, 0, 1, 0.3),
    startD: num(raw.startD, 0, 0.4, 0.02),
    demo: raw.demo === true,
  }
}

/** รูปแบบที่บันทึกลงฐานข้อมูล (ตัด field ที่คำนวณได้ทิ้ง) */
export function toStored(rec) {
  return {
    clientId: rec.clientId,
    name: rec.name,
    wish: rec.wish,
    avatar: rec.avatar,
    krathong: rec.krathong,
    createdAt: rec.createdAt,
    seed: rec.seed,
    lane: rec.lane,
    startX: rec.startX,
    startD: rec.startD,
  }
}
