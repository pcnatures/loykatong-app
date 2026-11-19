export const GENDERS = [
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
  { id: 'none', label: 'ไม่ระบุ' },
]

export const FACE_SHAPES = [
  { id: 'oval', label: 'รูปไข่' },
  { id: 'round', label: 'กลม' },
  { id: 'heart', label: 'หัวใจ' },
  { id: 'square', label: 'เหลี่ยม' },
]

export const HAIR_STYLES = [
  { id: 'bun', label: 'มวยผมไทย' },
  { id: 'long', label: 'ผมยาวตรง' },
  { id: 'bob', label: 'ผมบ็อบ' },
  { id: 'ponytail', label: 'หางม้า' },
  { id: 'short', label: 'รองทรงสั้น' },
  { id: 'quiff', label: 'เสยทันสมัย' },
]

export const HAIR_COLORS = [
  { id: 'black', label: 'ดำขลับ', color: '#1b1614' },
  { id: 'darkbrown', label: 'น้ำตาลเข้ม', color: '#3b2419' },
  { id: 'brown', label: 'น้ำตาลทอง', color: '#7a4a26' },
  { id: 'silver', label: 'เทาเงิน', color: '#b9b6c4' },
]

export const SKIN_TONES = [
  { id: 's1', label: 'ขาวอมชมพู', color: '#fbe0cc' },
  { id: 's2', label: 'ขาวเหลือง', color: '#f3cfa7' },
  { id: 's3', label: 'สองสี', color: '#e3b084' },
  { id: 's4', label: 'ผิวแทน', color: '#c98d5f' },
  { id: 's5', label: 'ผิวคล้ำ', color: '#a26a43' },
  { id: 's6', label: 'ผิวเข้ม', color: '#6f4329' },
]

export const OUTFITS = [
  { id: 'chakri', label: 'ชุดไทยจักรี', desc: 'ห่มสไบ ผ้าซิ่นยกทอง' },
  { id: 'rajpattern', label: 'ชุดไทยราชปะแตน', desc: 'เสื้อคอตั้งกระดุมทอง' },
  { id: 'prayuk', label: 'ชุดไทยประยุกต์', desc: 'ผ้าลายไทยร่วมสมัย' },
  { id: 'casual', label: 'ชุดลำลองร่วมสมัย', desc: 'เสื้อยืด สบาย ๆ' },
]

export const OUTFIT_COLORS = [
  { id: 'gold', label: 'ทองอร่าม', color: '#d9a43a' },
  { id: 'crimson', label: 'แดงชาด', color: '#b3263c' },
  { id: 'emerald', label: 'เขียวมรกต', color: '#1f7a5a' },
  { id: 'royal', label: 'น้ำเงินราชวงศ์', color: '#2846a3' },
  { id: 'lotus', label: 'ชมพูบัว', color: '#e0709a' },
  { id: 'plum', label: 'ม่วงดอกตะแบก', color: '#7b4bb3' },
  { id: 'ivory', label: 'ขาวงาช้าง', color: '#f1e6cf' },
]

export const DEFAULT_AVATAR = {
  gender: 'female',
  face: 'oval',
  hair: 'bun',
  hairColor: 'black',
  skin: 's2',
  outfit: 'chakri',
  outfitColor: 'gold',
}

/** ทรงผมเริ่มต้นเมื่อเปลี่ยนเพศ (ผู้ใช้เปลี่ยนเองได้ทุกแบบ) */
export const DEFAULT_HAIR_BY_GENDER = { female: 'bun', male: 'short', none: 'bob' }

const pick = (list) => list[Math.floor(Math.random() * list.length)].id

export function randomAvatar() {
  const gender = pick(GENDERS)
  return {
    gender,
    face: pick(FACE_SHAPES),
    hair: Math.random() < 0.6 ? DEFAULT_HAIR_BY_GENDER[gender] : pick(HAIR_STYLES),
    hairColor: Math.random() < 0.7 ? 'black' : pick(HAIR_COLORS),
    skin: pick(SKIN_TONES),
    outfit: pick(OUTFITS),
    outfitColor: pick(OUTFIT_COLORS),
  }
}

const ids = (list) => new Set(list.map((o) => o.id))
const VALID = {
  gender: ids(GENDERS),
  face: ids(FACE_SHAPES),
  hair: ids(HAIR_STYLES),
  hairColor: ids(HAIR_COLORS),
  skin: ids(SKIN_TONES),
  outfit: ids(OUTFITS),
  outfitColor: ids(OUTFIT_COLORS),
}

/** กรองข้อมูลอวตาร (เช่นจากฐานข้อมูล) ให้มีแต่ค่าที่รู้จัก */
export function sanitizeAvatar(input) {
  const out = { ...DEFAULT_AVATAR }
  if (input && typeof input === 'object') {
    for (const key of Object.keys(VALID)) {
      if (VALID[key].has(input[key])) out[key] = input[key]
    }
  }
  return out
}

export const colorOf = (list, id) => (list.find((o) => o.id === id) ?? list[0]).color
