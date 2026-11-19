/**
 * ตั้งค่าบรรยากาศของแต่ละฉาก
 * - flow: ความเร็วกระแสน้ำ (1 = แม่น้ำไหลปกติ, < 0.5 = สระ/คูน้ำนิ่ง)
 * - lanterns: โคมลอยบนฟ้า (ยี่เป็ง)
 * - fireworks: ดอกไม้ไฟเป็นระยะ
 * - lights: สีไฟสะท้อนบนผิวน้ำ
 */
export const SCENES = {
  riverfront: {
    label: 'ริมเจ้าพระยา',
    flow: 1,
    fireworks: true,
    skyGlow: '#ff8a3d',
    water: ['#0d1e52', '#071233'],
    lights: ['#ffb55e', '#ff6fae', '#7fd6ff', '#ffe08a'],
  },
  bridge: {
    label: 'ใต้สะพานพระราม 8',
    flow: 1,
    fireworks: true,
    skyGlow: '#ffb347',
    water: ['#0d1e52', '#071233'],
    lights: ['#ffd36b', '#ffd36b', '#fff1c2'],
  },
  campus: {
    label: 'สระน้ำในรั้วจามจุรี',
    flow: 0.3,
    stringLights: true,
    skyGlow: '#ff6fae',
    water: ['#10245a', '#081536'],
    lights: ['#ff97b5', '#ffd39a', '#ffd39a'],
  },
  temple: {
    label: 'หน้าพระปรางค์วัดอรุณ',
    flow: 1,
    skyGlow: '#ffb55e',
    water: ['#0e1f50', '#061030'],
    lights: ['#ffcf6b', '#ffcf6b', '#ffe6a8'],
  },
  park: {
    label: 'ทะเลสาบกลางเมือง',
    flow: 0.3,
    skyGlow: '#6c8cff',
    water: ['#0e2257', '#061233'],
    lights: ['#a8c4ff', '#ffd39a', '#ff97b5'],
  },
  moat: {
    label: 'คูเมืองเชียงใหม่',
    flow: 0.45,
    lanterns: true,
    skyGlow: '#ff9a3d',
    water: ['#11224e', '#07112d'],
    lights: ['#ffb55e', '#ffb55e', '#ffd39a'],
  },
  northRiver: {
    label: 'ริมแม่น้ำปิง',
    flow: 0.85,
    lanterns: true,
    skyGlow: '#ff9a3d',
    water: ['#0f2150', '#07112d'],
    lights: ['#ffb55e', '#ffd39a', '#ffb55e'],
  },
  historical: {
    label: 'ตระพังทอง สุโขทัย',
    flow: 0.25,
    fireworks: true,
    candlesOnRuins: true,
    skyGlow: '#ffa24d',
    water: ['#12234f', '#07112d'],
    lights: ['#ffcf6b', '#ffb55e', '#ffcf6b'],
  },
  village: {
    label: 'ริมน้ำใกล้บ้าน',
    flow: 0.7,
    skyGlow: '#ffb55e',
    water: ['#0f2152', '#071233'],
    lights: ['#ffd39a', '#ffb55e'],
  },
}

export const getScene = (id) => SCENES[id] ?? SCENES.village
