const toRgb = (hex) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/** ผสมสี a กับ b (t = 0..1) */
export const mix = (a, b, t) => {
  const A = toRgb(a)
  const B = toRgb(b)
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}
export const darken = (hex, t) => mix(hex, '#000000', t)
export const lighten = (hex, t) => mix(hex, '#ffffff', t)

/** ความสว่างโดยประมาณ (0..1) ใช้เลือกสีตัดให้อ่านง่าย */
export const luminance = (hex) => {
  const [r, g, b] = toRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
