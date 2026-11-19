export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * id ประจำแท็บ (ใช้นับคนออนไลน์และแยกกระทงของเราออกจากของคนอื่น)
 * เก็บใน sessionStorage → รีเฟรชแล้วยังเป็นคนเดิม แต่เปิดแท็บใหม่ = ผู้ใช้อีกคน (สะดวกต่อการทดสอบหลายคน)
 */
export function getClientId() {
  const KEY = 'lk.clientId'
  try {
    let id = sessionStorage.getItem(KEY)
    if (!id) {
      id = uuid()
      sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return uuid()
  }
}

/** แปลง string เป็นตัวเลข 0..1 แบบคงที่ (ใช้สุ่มดาวในการ์ดให้เหมือนเดิมทุกครั้ง) */
export function seededRandom(seedText = 'loykrathong') {
  let h = 2166136261
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
