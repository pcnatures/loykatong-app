/**
 * สถานที่ลอยกระทงยอดนิยม (พิกัดจริง WGS84)
 * scene → ใช้เลือกฉากหลังริมน้ำใน components/river/SceneBackdrop.jsx
 */
export const POPULAR_LOCATIONS = [
  {
    id: 'asiatique',
    name: 'เอเชียทีค เดอะ ริเวอร์ฟรอนท์',
    nameEn: 'Asiatique The Riverfront',
    province: 'กรุงเทพมหานคร',
    water: 'แม่น้ำเจ้าพระยา',
    lat: 13.7046,
    lng: 100.5032,
    scene: 'riverfront',
    blurb: 'ชิงช้าสวรรค์ยักษ์และแสงไฟริมเจ้าพระยา',
  },
  {
    id: 'rama8',
    name: 'สะพานพระราม 8',
    nameEn: 'Rama VIII Bridge',
    province: 'กรุงเทพมหานคร',
    water: 'แม่น้ำเจ้าพระยา',
    lat: 13.7681,
    lng: 100.4951,
    scene: 'bridge',
    blurb: 'สวนริมน้ำใต้สะพานขึงสีทองอันโดดเด่น',
  },
  {
    id: 'chula',
    name: 'จุฬาลงกรณ์มหาวิทยาลัย',
    nameEn: 'Chulalongkorn University',
    province: 'กรุงเทพมหานคร',
    water: 'สระน้ำหน้าหอประชุม',
    lat: 13.7384,
    lng: 100.5322,
    scene: 'campus',
    blurb: 'งานลอยกระทงในรั้วจามจุรี ท่ามกลางศาลาไทย',
  },
  {
    id: 'watarun',
    name: 'วัดอรุณราชวราราม',
    nameEn: 'Wat Arun',
    province: 'กรุงเทพมหานคร',
    water: 'แม่น้ำเจ้าพระยา',
    lat: 13.7437,
    lng: 100.4889,
    scene: 'temple',
    blurb: 'พระปรางค์เรืองแสงเหนือสายน้ำยามค่ำคืน',
  },
  {
    id: 'lumphini',
    name: 'สวนลุมพินี',
    nameEn: 'Lumphini Park',
    province: 'กรุงเทพมหานคร',
    water: 'ทะเลสาบสวนลุมพินี',
    lat: 13.7307,
    lng: 100.5418,
    scene: 'park',
    blurb: 'ทะเลสาบกลางเมือง ล้อมด้วยตึกระฟ้า',
  },
  {
    id: 'cm-moat',
    name: 'คูเมืองเชียงใหม่ (ประตูท่าแพ)',
    nameEn: 'Chiang Mai Moat · Tha Phae Gate',
    province: 'เชียงใหม่',
    water: 'คูเมืองเชียงใหม่',
    lat: 18.7877,
    lng: 98.9934,
    scene: 'moat',
    blurb: 'ประเพณียี่เป็ง โคมลอยเต็มฟ้าเหนือกำแพงเมือง',
  },
  {
    id: 'cm-nawarat',
    name: 'สะพานนวรัฐ ริมแม่น้ำปิง',
    nameEn: 'Nawarat Bridge · Ping River',
    province: 'เชียงใหม่',
    water: 'แม่น้ำปิง',
    lat: 18.7871,
    lng: 99.0008,
    scene: 'northRiver',
    blurb: 'สะพานเหล็กโค้งคลาสสิกกับโคมลอยยี่เป็ง',
  },
  {
    id: 'sukhothai',
    name: 'อุทยานประวัติศาสตร์สุโขทัย',
    nameEn: 'Sukhothai Historical Park',
    province: 'สุโขทัย',
    water: 'ตระพังทอง · วัดมหาธาตุ',
    lat: 17.0172,
    lng: 99.7036,
    scene: 'historical',
    blurb: 'ต้นกำเนิดประเพณี “ลอยกระทง เผาเทียน เล่นไฟ”',
  },
]

export const THAILAND_CENTER = { lat: 13.2, lng: 100.9 }

/** สร้าง location object สำหรับหมุดที่ผู้ใช้ปักเอง */
export function makeCustomLocation({ lat, lng, name, address, scene }) {
  return {
    id: customRoomId(lat, lng),
    name: name?.trim() || 'จุดลอยกระทงของฉัน',
    nameEn: 'My Krathong Spot',
    province: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    water: 'แหล่งน้ำใกล้บ้าน',
    lat,
    lng,
    scene: scene || guessScene(name),
    custom: true,
    blurb: 'จุดลอยกระทงที่คุณปักหมุดเอง',
  }
}

/**
 * คนที่ปักหมุดใกล้กัน (~1 กม.) จะอยู่ "ห้อง" เดียวกันและเห็นกระทงของกันและกัน
 * ใช้ตัวอักษรที่ปลอดภัยกับ Firebase key (ห้าม . # $ [ ] /)
 */
export function customRoomId(lat, lng) {
  const enc = (n) => n.toFixed(2).replace('-', 'm').replace('.', 'p')
  return `geo_${enc(lat)}_${enc(lng)}`
}

const toRad = (d) => (d * Math.PI) / 180
export function distanceKm(a, b) {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** ถ้าปักหมุดใกล้สถานที่ยอดนิยม (≤ maxKm) ให้ไปรวมห้องเดียวกัน จะได้เจอคนอื่นมากขึ้น */
export function nearestPopular(lat, lng, maxKm = 1.2) {
  let best = null
  for (const p of POPULAR_LOCATIONS) {
    const d = distanceKm({ lat, lng }, p)
    if (d <= maxKm && (!best || d < best.d)) best = { place: p, d }
  }
  return best?.place ?? null
}

/** เดาฉากหลังจากชื่อสถานที่ที่ค้นหา (เช่น มีคำว่า "วัด" → ฉากวัด) */
export function guessScene(name = '') {
  if (/วัด|wat|temple/i.test(name)) return 'temple'
  if (/สะพาน|bridge/i.test(name)) return 'bridge'
  if (/มหาวิทยาลัย|university|โรงเรียน|school|college/i.test(name)) return 'campus'
  if (/สวน|park|บึง|ทะเลสาบ|lake/i.test(name)) return 'park'
  if (/อุทยานประวัติศาสตร์|historical/i.test(name)) return 'historical'
  if (/คูเมือง|moat|ประตู/i.test(name)) return 'moat'
  return 'village'
}
