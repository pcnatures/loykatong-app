import { createElement } from 'react'
import Avatar from '../components/avatar/Avatar'
import Krathong from '../components/krathong/Krathong'
import SceneBackdrop from '../components/river/SceneBackdrop'
import { getScene } from '../config/scenes'
import { seededRandom } from './ids'
import { buddhistYear, formatThaiDate, toThaiDigits, wrapCanvasText } from './thaiText'

/*
 * การ์ดภาพที่ระลึก (1080 × 1350 — สัดส่วน 4:5 เหมาะกับ IG/Facebook/LINE)
 *
 * ใช้ Canvas API วาดเองทั้งหมดแทน html2canvas เพราะ
 *  - คมชัดกว่า (อวตาร/กระทงเป็น SVG ถูก render เป็นภาพเวกเตอร์ที่ความละเอียดจริง)
 *  - html2canvas ยังอ่านสี oklch() ของ Tailwind v4 ไม่ได้ และมักเพี้ยนกับ backdrop-filter
 *  - ควบคุมการตัดคำภาษาไทยได้เอง (Intl.Segmenter)
 */
export const CARD_W = 1080
export const CARD_H = 1350
const HORIZON = 690
const WATER_END = 965

const GOLD = '#efc55a'
const FONT_DISPLAY = '"Charm", "Mitr", serif'
const FONT_BODY = '"Mitr", "Noto Sans Thai", sans-serif'

async function loadFonts() {
  if (!document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load(`700 120px ${FONT_DISPLAY}`),
      document.fonts.load(`400 40px ${FONT_BODY}`),
      document.fonts.load(`500 36px ${FONT_BODY}`),
    ])
  } catch {
    /* ใช้ฟอนต์สำรองของระบบ */
  }
}

/** แปลง React element (SVG) → HTMLImageElement ที่ขนาดจริงเพื่อความคมชัด */
async function svgToImage(element, width, height) {
  const mod = await import('react-dom/server')
  const renderToStaticMarkup = mod.renderToStaticMarkup ?? mod.default?.renderToStaticMarkup
  const markup = renderToStaticMarkup(element).replace('<svg', `<svg width="${Math.round(width)}" height="${Math.round(height)}"`)
  const img = new Image()
  img.decoding = 'async'
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  })
  return img
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function diamond(ctx, x, y, s, fill = GOLD) {
  ctx.save()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.lineTo(x + s, y)
  ctx.lineTo(x, y + s)
  ctx.lineTo(x - s, y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** ลายกนกอย่างง่ายที่มุมกรอบ */
function cornerOrnament(ctx, x, y, sx, sy) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  ctx.strokeStyle = GOLD
  ctx.fillStyle = GOLD
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 90)
  ctx.bezierCurveTo(0, 30, 30, 0, 90, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(18, 70)
  ctx.bezierCurveTo(16, 40, 40, 16, 70, 18)
  ctx.bezierCurveTo(52, 26, 38, 36, 34, 52)
  ctx.bezierCurveTo(30, 40, 22, 48, 18, 70)
  ctx.fill()
  diamond(ctx, 10, 10, 8)
  ctx.beginPath()
  ctx.arc(46, 46, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawSky(ctx, scene, rnd) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON)
  g.addColorStop(0, '#040918')
  g.addColorStop(0.55, '#0b1840')
  g.addColorStop(0.88, '#1a2f72')
  g.addColorStop(1, scene.skyGlow)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CARD_W, HORIZON)

  for (let i = 0; i < 140; i++) {
    const x = rnd() * CARD_W
    const y = rnd() * (HORIZON - 120)
    const r = rnd() < 0.12 ? 2.2 : 0.6 + rnd() * 1.2
    ctx.globalAlpha = 0.35 + rnd() * 0.65
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // จันทร์เพ็ญ
  const mx = 880
  const my = 330
  const glow = ctx.createRadialGradient(mx, my, 40, mx, my, 200)
  glow.addColorStop(0, 'rgba(255,236,190,0.45)')
  glow.addColorStop(1, 'rgba(255,236,190,0)')
  ctx.fillStyle = glow
  ctx.fillRect(mx - 220, my - 220, 440, 440)
  const moon = ctx.createRadialGradient(mx - 18, my - 20, 6, mx, my, 62)
  moon.addColorStop(0, '#fffdf2')
  moon.addColorStop(0.6, '#fff1c8')
  moon.addColorStop(1, '#f2d690')
  ctx.fillStyle = moon
  ctx.beginPath()
  ctx.arc(mx, my, 60, 0, Math.PI * 2)
  ctx.fill()

  if (scene.lanterns) {
    for (let i = 0; i < 18; i++) {
      const x = 60 + rnd() * 960
      const y = 260 + rnd() * 380
      const s = 8 + rnd() * 10
      ctx.fillStyle = 'rgba(255,160,70,0.35)'
      ctx.beginPath()
      ctx.arc(x, y, s * 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffb04a'
      roundRect(ctx, x - s / 2, y - s * 0.6, s, s * 1.2, s * 0.35)
      ctx.fill()
    }
  }
}

function drawWater(ctx, scene, rnd) {
  const g = ctx.createLinearGradient(0, HORIZON, 0, WATER_END)
  g.addColorStop(0, scene.water[0])
  g.addColorStop(1, scene.water[1])
  ctx.fillStyle = g
  ctx.fillRect(0, HORIZON, CARD_W, WATER_END - HORIZON)

  // เงาจันทร์ระยิบระยับ
  for (let i = 0; i < 13; i++) {
    const y = HORIZON + 8 + i * 20
    const w = 30 + rnd() * 70
    const mg = ctx.createLinearGradient(880 - w / 2, 0, 880 + w / 2, 0)
    mg.addColorStop(0, 'rgba(255,238,190,0)')
    mg.addColorStop(0.5, `rgba(255,238,190,${0.6 - i * 0.035})`)
    mg.addColorStop(1, 'rgba(255,238,190,0)')
    ctx.fillStyle = mg
    roundRect(ctx, 880 - w / 2, y, w, 3 + i * 0.25, 2)
    ctx.fill()
  }
  // แสงไฟสะท้อน
  for (let i = 0; i < 12; i++) {
    const x = rnd() * CARD_W
    const color = scene.lights[i % scene.lights.length]
    const lg = ctx.createLinearGradient(0, HORIZON, 0, HORIZON + 90)
    lg.addColorStop(0, `${color}aa`)
    lg.addColorStop(1, `${color}00`)
    ctx.fillStyle = lg
    ctx.fillRect(x - 6, HORIZON, 12, 90)
  }
  // ระลอกคลื่น
  ctx.strokeStyle = 'rgba(207,224,255,0.22)'
  ctx.lineWidth = 2
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const y = HORIZON + 20 + Math.pow(t, 1.5) * (WATER_END - HORIZON - 30)
    const amp = 2 + t * 5
    const len = 60 + t * 140
    ctx.beginPath()
    for (let x = -20; x < CARD_W + 20; x += 4) {
      const yy = y + Math.sin((x / len) * Math.PI * 2 + i) * amp
      if (x === -20) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
}

function drawPier(ctx) {
  ctx.fillStyle = '#2a190e'
  for (const x of [40, 170, 300]) ctx.fillRect(x, 930, 12, WATER_END - 930)
  const g = ctx.createLinearGradient(0, 905, 0, 940)
  g.addColorStop(0, '#7a4f2c')
  g.addColorStop(1, '#3b2414')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 905)
  ctx.lineTo(330, 905)
  ctx.lineTo(345, 940)
  ctx.lineTo(0, 940)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(42,25,14,0.8)'
  ctx.lineWidth = 2
  for (let i = 1; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo((i * 330) / 8, 905)
    ctx.lineTo((i * 345) / 8, 940)
    ctx.stroke()
  }
}

/**
 * สร้างการ์ด
 * @param {{ avatar, krathong, name, wish, location, date?: Date }} data
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderSouvenirCard({ avatar, krathong, name, wish, location, date = new Date() }) {
  await loadFonts()
  const scene = getScene(location.scene)
  const rnd = seededRandom(`${name}|${wish}|${location.id}`)

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')

  const [backdropImg, avatarImg, krathongImg] = await Promise.all([
    svgToImage(createElement(SceneBackdrop, { scene: location.scene, sceneConfig: scene }), CARD_W, CARD_W * 0.3),
    svgToImage(createElement(Avatar, { avatar, pose: 'wai' }), 300, 450),
    svgToImage(createElement(Krathong, { krathong }), 400, 350),
  ])

  drawSky(ctx, scene, rnd)
  ctx.drawImage(backdropImg, 0, HORIZON - CARD_W * 0.3 + 2, CARD_W, CARD_W * 0.3)
  drawWater(ctx, scene, rnd)
  drawPier(ctx)

  // แสงเทียนสะท้อนน้ำใต้กระทง
  const kx = 650
  const ky = 905
  const halo = ctx.createRadialGradient(kx, ky, 10, kx, ky, 260)
  halo.addColorStop(0, 'rgba(255,190,100,0.45)')
  halo.addColorStop(1, 'rgba(255,190,100,0)')
  ctx.fillStyle = halo
  ctx.fillRect(kx - 280, ky - 280, 560, 400)
  // เงาสะท้อนกระทง
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.translate(0, ky * 2 + 10)
  ctx.scale(1, -1)
  ctx.drawImage(krathongImg, kx - 200, ky - 350 * 0.81, 400, 350)
  ctx.restore()
  ctx.drawImage(krathongImg, kx - 200, ky - 350 * 0.81, 400, 350)

  ctx.drawImage(avatarImg, 30, 905 - 450 * (288 / 300), 300, 450)

  // ไล่สีด้านบนให้หัวเรื่องอ่านง่าย
  const top = ctx.createLinearGradient(0, 0, 0, 300)
  top.addColorStop(0, 'rgba(4,9,24,0.85)')
  top.addColorStop(1, 'rgba(4,9,24,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, CARD_W, 300)

  // หัวเรื่อง
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const title = ctx.createLinearGradient(0, 70, 0, 190)
  title.addColorStop(0, '#fff6dc')
  title.addColorStop(0.5, '#f6d985')
  title.addColorStop(1, '#c48d27')
  ctx.fillStyle = title
  ctx.shadowColor = 'rgba(255,190,90,0.6)'
  ctx.shadowBlur = 24
  ctx.font = `700 132px ${FONT_DISPLAY}`
  ctx.fillText('ลอยกระทง', CARD_W / 2, 190)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#f6d985'
  ctx.font = `400 34px ${FONT_BODY}`
  ctx.fillText(`พ.ศ. ${toThaiDigits(buddhistYear(date))}`, CARD_W / 2, 248)
  diamond(ctx, CARD_W / 2 - 150, 236, 6)
  diamond(ctx, CARD_W / 2 + 150, 236, 6)

  // แผงคำอธิษฐาน
  const panel = ctx.createLinearGradient(0, WATER_END, 0, CARD_H)
  panel.addColorStop(0, '#0a1638')
  panel.addColorStop(1, '#040918')
  ctx.fillStyle = panel
  ctx.fillRect(0, WATER_END, CARD_W, CARD_H - WATER_END)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(90, WATER_END)
  ctx.lineTo(CARD_W - 90, WATER_END)
  ctx.stroke()
  diamond(ctx, CARD_W / 2, WATER_END, 12)
  diamond(ctx, CARD_W / 2, WATER_END, 5, '#081230')

  ctx.fillStyle = 'rgba(239,197,90,0.85)'
  ctx.font = `400 26px ${FONT_BODY}`
  ctx.fillText('คำอธิษฐาน', CARD_W / 2, WATER_END + 50)

  // คำอธิษฐาน (สูงสุด 4 บรรทัด จัดกึ่งกลางแนวตั้งในพื้นที่ y 1035–1215)
  const text = wish?.trim() ? `“${wish.trim()}”` : 'อธิษฐานอยู่ในใจ'
  ctx.font = `400 38px ${FONT_BODY}`
  const lines = wrapCanvasText(ctx, text, 860, 4)
  const lineH = 50
  const first = 1035 + (180 - lines.length * lineH) / 2 + 36
  ctx.fillStyle = '#fff6dc'
  lines.forEach((ln, i) => ctx.fillText(ln, CARD_W / 2, first + i * lineH))

  ctx.fillStyle = GOLD
  ctx.font = `500 36px ${FONT_BODY}`
  ctx.fillText(`— ${name} —`, CARD_W / 2, 1264)

  ctx.fillStyle = 'rgba(246,217,133,0.75)'
  ctx.font = `400 24px ${FONT_BODY}`
  const meta = `${location.name} · ${formatThaiDate(date)}`
  const metaW = ctx.measureText(meta).width
  ctx.fillText(meta, CARD_W / 2 + 12, 1304)
  // ไอคอนหมุด
  const px = CARD_W / 2 - metaW / 2 - 6
  ctx.beginPath()
  ctx.arc(px, 1293, 8, Math.PI, 0)
  ctx.lineTo(px, 1308)
  ctx.closePath()
  ctx.fill()

  // กรอบทอง 2 ชั้น + ลายมุม
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 4
  ctx.strokeRect(22, 22, CARD_W - 44, CARD_H - 44)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.5
  ctx.strokeRect(36, 36, CARD_W - 72, CARD_H - 72)
  ctx.globalAlpha = 1
  cornerOrnament(ctx, 36, 36, 1, 1)
  cornerOrnament(ctx, CARD_W - 36, 36, -1, 1)
  cornerOrnament(ctx, 36, CARD_H - 36, 1, -1)
  cornerOrnament(ctx, CARD_W - 36, CARD_H - 36, -1, -1)

  return canvas
}

export const canvasToBlob = (canvas, type = 'image/png', quality = 0.92) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality))

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
