/**
 * คณิตศาสตร์การลอยของกระทง — คำนวณตำแหน่งจาก "เวลา" อย่างเดียว (deterministic)
 * ทุกเครื่องที่เห็นกระทงใบเดียวกันจึงเห็นตำแหน่งใกล้เคียงกัน โดยไม่ต้องส่งตำแหน่งผ่านเน็ตทุกเฟรม
 *
 * พิกัด: x = สัดส่วนความกว้างฉาก (0..1), d = ความลึก (0 = ริมตลิ่ง, 1 = ขอบฟ้า)
 */

export const KRATHONG_LIFETIME_MS = 10 * 60 * 1000 // กระทงลอยให้เห็น 10 นาที
const FADE_MS = 45_000
const PUSH_OUT_MS = 40_000 // ช่วงแรกกระทงจะค่อย ๆ ถูกผลักออกจากตลิ่งไปยังเลนของตัวเอง

export const HORIZON = 0.42 // ระดับขอบฟ้า (สัดส่วนความสูงฉาก)
export const NEAR = 0.975 // ขอบน้ำด้านล่างสุด

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/** ความลึก → ตำแหน่ง y (สัดส่วนความสูง) แบบ perspective */
export const depthToY = (d) => HORIZON + (NEAR - HORIZON) * Math.pow(1 - d, 1.5)

/** ตำแหน่ง y → ความลึก (ใช้ตอนแปลงจุดวางกระทงที่มือของอวตาร) */
export const yToDepth = (yFrac) => {
  const t = clamp((yFrac - HORIZON) / (NEAR - HORIZON), 0, 1)
  return 1 - Math.pow(t, 1 / 1.5)
}

/** ยิ่งไกลยิ่งเล็ก */
export const depthToScale = (d) => 0.2 + 0.8 * Math.pow(1 - d, 1.5)

/** สุ่มค่าประจำกระทงแต่ละใบ (เลน/ความเร็ว/จังหวะโยก) */
export function makeDriftParams(startX, startD) {
  return {
    seed: Math.random(),
    lane: 0.18 + Math.random() * 0.62,
    startX: clamp(startX, 0.02, 0.9),
    startD: clamp(startD, 0, 0.3),
  }
}

/**
 * ตำแหน่งของกระทง ณ เวลา now
 * @param rec   ข้อมูลกระทง (createdAt, seed, lane, startX, startD)
 * @param now   เวลาปัจจุบัน (ms, เทียบนาฬิกาเซิร์ฟเวอร์)
 * @param flow  ความเร็วกระแสน้ำของฉาก
 * @param offsetX  เลื่อนจุดเริ่ม (ใช้กระจายกระทงของคนอื่นไม่ให้ทับกันที่ท่าน้ำ)
 */
export function krathongPose(rec, now, flow = 1, offsetX = 0) {
  const t = Math.max(0, now - rec.createdAt)
  const s = t / 1000
  const out = easeOutCubic(Math.min(1, t / PUSH_OUT_MS))

  const d = rec.startD + (rec.lane - rec.startD) * out
  const perspectiveSpeed = 0.45 + 0.55 * depthToScale(rec.lane)
  const v = (0.0011 + rec.seed * 0.0009) * flow * perspectiveSpeed
  const sway = 0.012 * Math.sin(s * 0.35 + rec.seed * 6.283) * out
  const x = rec.startX + offsetX + 0.06 * out + v * s + sway

  let opacity = 1
  const remain = KRATHONG_LIFETIME_MS - t
  if (remain < FADE_MS) opacity = clamp(remain / FADE_MS, 0, 1)
  if (x > 1.02) opacity *= clamp(1 - (x - 1.02) / 0.08, 0, 1)

  return {
    x,
    d,
    y: depthToY(d),
    scale: depthToScale(d),
    opacity,
    bob: Math.sin(s * 1.9 + rec.seed * 10), // -1..1
    tilt: Math.sin(s * 1.3 + rec.seed * 7) * 4, // องศา
  }
}

export const isExpired = (rec, now) => now - rec.createdAt > KRATHONG_LIFETIME_MS
