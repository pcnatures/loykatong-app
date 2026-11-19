export const KRATHONG_TYPES = [
  { id: 'banana', label: 'กระทงใบตอง', desc: 'พับกลีบใบตองแบบดั้งเดิม' },
  { id: 'lotus', label: 'กระทงดอกบัว', desc: 'กลีบบัวซ้อนชั้นงดงาม' },
  { id: 'bread', label: 'กระทงขนมปัง', desc: 'ปลาได้กิน ย่อยสลายง่าย' },
  { id: 'ice', label: 'กระทงน้ำแข็ง', desc: 'รักษ์โลก ละลายเป็นน้ำ' },
  { id: 'swan', label: 'กระทงหงส์ทอง', desc: 'ดีไซน์แฟนซีสุดอลังการ' },
]

export const FLOWER_COLORS = [
  { id: 'marigold', label: 'ดาวเรือง', color: '#f7a21b', center: '#d9700b' },
  { id: 'rose', label: 'กุหลาบแดง', color: '#e23b55', center: '#9e1631' },
  { id: 'pink', label: 'ชมพูบานเย็น', color: '#ff74b0', center: '#d63e85' },
  { id: 'jasmine', label: 'มะลิขาว', color: '#fff8ec', center: '#f2d98b' },
  { id: 'orchid', label: 'กล้วยไม้ม่วง', color: '#b06ae0', center: '#7a33ad' },
]

export const CANDLE_STYLES = [
  { id: 'classic', label: 'เทียน + ธูป 3 ดอก', desc: 'แบบดั้งเดิม' },
  { id: 'single', label: 'เทียนเล่มเดียว', desc: 'เรียบง่าย' },
  { id: 'twin', label: 'เทียนคู่', desc: 'ลอยคู่รัก' },
  { id: 'tealight', label: 'เทียนหอมดอกบัว', desc: 'ถ้วยเทียนทรงบัว' },
]

export const DEFAULT_KRATHONG = { type: 'banana', flower: 'marigold', candle: 'classic' }

const has = (list, id) => list.some((o) => o.id === id)

export function sanitizeKrathong(input) {
  const k = input && typeof input === 'object' ? input : {}
  return {
    type: has(KRATHONG_TYPES, k.type) ? k.type : DEFAULT_KRATHONG.type,
    flower: has(FLOWER_COLORS, k.flower) ? k.flower : DEFAULT_KRATHONG.flower,
    candle: has(CANDLE_STYLES, k.candle) ? k.candle : DEFAULT_KRATHONG.candle,
  }
}

export const labelOf = (list, id) => (list.find((o) => o.id === id) ?? list[0]).label
