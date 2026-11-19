/** นับความยาวแบบ code point (ตรงกับที่ผู้ใช้เห็นมากกว่า .length สำหรับอีโมจิ) */
export const countChars = (str = '') => Array.from(str).length

/** ตัดข้อความไม่ให้เกิน max ตัวอักษร (ไม่ตัดกลางอีโมจิ) */
export const clampChars = (str = '', max) => {
  const chars = Array.from(str)
  return chars.length > max ? chars.slice(0, max).join('') : str
}

const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
export const toThaiDigits = (n) => String(n).replace(/\d/g, (d) => THAI_DIGITS[+d])

/** ปีพุทธศักราช */
export const buddhistYear = (date = new Date()) => date.getFullYear() + 543

export const formatThaiDate = (date = new Date()) =>
  date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

export function timeAgo(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 45) return 'เมื่อสักครู่'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.round(m / 60)
  return `${h} ชั่วโมงที่แล้ว`
}

/**
 * แบ่งข้อความเป็นหน่วยที่ตัดบรรทัดได้
 * ภาษาไทยไม่มีช่องว่างระหว่างคำ จึงใช้ Intl.Segmenter ตัดคำ (รองรับทุกเบราว์เซอร์หลักแล้ว)
 */
export function segmentWords(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('th', { granularity: 'word' })
    return Array.from(seg.segment(text), (s) => s.segment)
  }
  return text.split(/(\s+)/)
}

function segmentGraphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('th', { granularity: 'grapheme' })
    return Array.from(seg.segment(text), (s) => s.segment)
  }
  return Array.from(text)
}

/** ตัดบรรทัดสำหรับวาดบน Canvas — คืนค่าเป็น array ของบรรทัด */
export function wrapCanvasText(ctx, text, maxWidth, maxLines = Infinity) {
  const lines = []
  let line = ''
  const push = () => {
    lines.push(line.trim())
    line = ''
  }
  for (const word of segmentWords(text.replace(/\s+/g, ' '))) {
    const test = line + word
    if (ctx.measureText(test).width <= maxWidth) {
      line = test
      continue
    }
    if (line.trim()) push()
    if (ctx.measureText(word).width <= maxWidth) {
      line = word.trimStart()
      continue
    }
    // คำยาวเกินบรรทัด → ตัดทีละพยางค์ (grapheme)
    for (const g of segmentGraphemes(word)) {
      if (ctx.measureText(line + g).width > maxWidth && line) push()
      line += g
    }
  }
  if (line.trim()) push()

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (last && ctx.measureText(last + '…').width > maxWidth) last = Array.from(last).slice(0, -1).join('')
    kept[maxLines - 1] = last + '…'
    return kept
  }
  return lines
}
