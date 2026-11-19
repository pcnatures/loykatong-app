/**
 * ตำแหน่งองค์ประกอบในฉาก (หน่วย px) คำนวณจากขนาดฉากจริง
 * ใช้ร่วมกันระหว่าง อวตารบนท่าน้ำ / กระทงในมือ / กระทงที่ลอยอยู่ → ส่งต่อกันได้แนบเนียน
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export const KRATHONG_ASPECT = 140 / 160 // สูง/กว้าง ของ viewBox กระทง
export const KRATHONG_ANCHOR_Y = 0.81 // ตำแหน่งแนวน้ำในกล่องกระทง

export function sceneLayout(W, H) {
  const aH = clamp(H * 0.36, 110, 250)
  const aW = (aH * 2) / 3
  const aLeft = Math.max(6, W * 0.035)
  const feetY = H * 0.955
  const aTop = feetY - aH * (288 / 300)
  const base = aW * 0.74
  return {
    W,
    H,
    aH,
    aW,
    aLeft,
    aTop,
    feetY,
    base,
    kH: base * KRATHONG_ASPECT,
    pierRight: aLeft + aW * 0.9,
    pierTop: H * 0.9,
    touch: { x: aLeft + aW * 1.08, y: H * 0.966 },
  }
}

/** มุมซ้ายบนของกล่องกระทง เมื่อต้องการให้แนวน้ำอยู่ที่ (x, y) */
export const krathongBoxAt = (L, x, y) => ({ x: x - L.base / 2, y: y - L.kH * KRATHONG_ANCHOR_Y })
