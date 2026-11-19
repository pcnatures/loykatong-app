/**
 * ระบบกรองคำหยาบเบื้องต้น (ไทย + อังกฤษ)
 *
 * แนวทาง:
 * 1) normalize: NFC, ลบอักขระล่องหน (zero-width), แปลง leetspeak (f4ck → fack, $h1t → shit)
 * 2) จับคำแม้มีตัวคั่น/พิมพ์ซ้ำ เช่น "ค.ว.ย", "ค ว ย", "fuuuck", "s-h-i-t"
 * 3) มีข้อยกเว้นคำปกติที่บังเอิญมีคำหยาบซ้อนอยู่ เช่น "หีบ", "สัดส่วน"
 * 4) แทนที่ส่วนที่ไม่สุภาพด้วย ✿ (ไม่บล็อกการส่ง เพื่อไม่ให้ผู้ใช้หงุดหงิด)
 *
 * หมายเหตุ: นี่คือการกรองฝั่ง client — ควรมีการกรองซ้ำฝั่งเซิร์ฟเวอร์ (Cloud Functions /
 * Postgres trigger) ในระบบจริง และแอปนี้กรองซ้ำตอน "แสดงผล" ข้อมูลจากคนอื่นด้วย
 */

/** w = คำ, notAfter = ข้อความที่ถ้าตามหลังคำนี้ถือว่าเป็นคำปกติ */
const THAI_WORDS = [
  { w: 'ควย' },
  { w: 'หี', notAfter: ['บ', 'ย', '่', '้', '๊', '๋'] }, // หีบ, หีบเพลง, เหี่ยว ฯลฯ
  { w: 'เย็ด' },
  { w: 'แตด' },
  { w: 'เหี้ย', notAfter: ['ม'] }, // เหี้ยมหาญ
  { w: 'เหี่ย', notAfter: ['ว'] }, // เหี่ยวเฉา
  { w: 'เชี่ย', notAfter: ['ว'] }, // เชี่ยวชาญ
  { w: 'เชี้ย' },
  { w: 'สัส', notAfter: ['ดี'] }, // สัสดี (ตำแหน่งราชการ)
  { w: 'สัด', notAfter: ['ส่วน'] }, // สัดส่วน
  { w: 'ไอ้สัตว์' },
  { w: 'อีสัตว์' },
  { w: 'มึง' },
  { w: 'แม่ง', notAfter: ['าน'] }, // แม่งาน
  { w: 'ระยำ' },
  { w: 'จัญไร' },
  { w: 'ชาติหมา' },
  { w: 'ไอ้ห่า' },
  { w: 'อีห่า' },
  { w: 'ห่าราก' },
  { w: 'ไอ้เวร' },
  { w: 'อีเวร' },
  { w: 'อีดอก' },
  { w: 'ดอกทอง', notAfter: ['กวาว', 'อุไร'] }, // ดอกทองกวาว, ดอกทองอุไร
  { w: 'ส้นตีน' },
  { w: 'ฉิบหาย' },
  { w: 'ชิบหาย' },
  { w: 'ตอแหล' },
  { w: 'เงี่ยน' },
  { w: 'ร่าน' },
  { w: 'ไอ้ควาย' },
  { w: 'อีควาย' },
  { w: 'ไอ้เหี้ย' },
]

/** boundary = ต้องเป็นคำเดี่ยว (กันคำปกติอย่าง "Dickens", "class") */
const EN_WORDS = [
  { w: 'fuck' },
  { w: 'fck', boundary: true },
  { w: 'fuk', boundary: true },
  { w: 'shit', notAfter: ['ake'] }, // shiitake/shitake
  { w: 'bitch' },
  { w: 'bastard' },
  { w: 'asshole' },
  { w: 'ass', boundary: true },
  { w: 'cunt' },
  { w: 'dick', boundary: true },
  { w: 'cock', boundary: true },
  { w: 'pussy' },
  { w: 'slut' },
  { w: 'whore' },
  { w: 'nigger' },
  { w: 'nigga' },
  { w: 'faggot' },
  { w: 'fag', boundary: true },
  { w: 'retard' },
  { w: 'wtf', boundary: true },
  { w: 'stfu', boundary: true },
]

const LEET = { 0: 'o', 1: 'i', '!': 'i', '|': 'i', 3: 'e', 4: 'a', '@': 'a', $: 's', 5: 's', 7: 't', '+': 't' }
const ZERO_WIDTH = /[​-‍⁠﻿­]/g
// ตัวคั่นที่คนชอบแทรกเพื่อหลบตัวกรอง
const SEP = "[\\s._\\-~^'\"`,*·•]*"

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function buildPattern({ w, boundary, notAfter }) {
  const body = Array.from(w)
    .map((ch) => `${escapeRe(ch)}+`)
    .join(SEP)
  const left = boundary ? '(?<![a-z])' : ''
  const right = [boundary ? '(?![a-z])' : '', ...(notAfter ?? []).map((s) => `(?!${escapeRe(s)})`)].join('')
  return `${left}${body}${right}`
}

const PATTERN = new RegExp([...THAI_WORDS, ...EN_WORDS].map(buildPattern).join('|'), 'gu')

/** normalize แบบรักษาความยาวเดิม (1 ตัวต่อ 1 ตัว) เพื่อให้ index ตรงกับข้อความต้นฉบับ */
function prepare(text) {
  const original = String(text ?? '')
    .normalize('NFC')
    .replace(ZERO_WIDTH, '')
  let normalized = ''
  for (const ch of original) {
    const lower = ch.length === 1 && ch >= 'A' && ch <= 'Z' ? ch.toLowerCase() : ch
    normalized += LEET[lower] ?? lower
  }
  return { original, normalized }
}

/**
 * ตรวจข้อความ
 * @returns {{ clean: boolean, matches: string[], masked: string }}
 */
export function checkProfanity(text, maskChar = '✿') {
  const { original, normalized } = prepare(text)
  const matches = []
  let masked = ''
  let last = 0
  PATTERN.lastIndex = 0
  for (const m of normalized.matchAll(PATTERN)) {
    const start = m.index
    const end = start + m[0].length
    const found = original.slice(start, end)
    matches.push(found)
    const len = Math.min(4, Math.max(2, Array.from(found.replace(/\s/g, '')).length))
    masked += original.slice(last, start) + maskChar.repeat(len)
    last = end
  }
  masked += original.slice(last)
  return { clean: matches.length === 0, matches, masked }
}

export const maskProfanity = (text) => checkProfanity(text).masked
