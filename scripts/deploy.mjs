// อัปเดตเว็บด้วยคำสั่งเดียว
//   npm run deploy                      → ใช้ข้อความ commit อัตโนมัติ
//   npm run deploy -- "แก้สีปุ่ม"         → กำหนดข้อความ commit เอง
// package.json สั่ง `npm run build` ก่อน ถ้า build ไม่ผ่านจะหยุด ไม่ push
// push ขึ้น GitHub แล้ว Vercel จะ deploy ให้อัตโนมัติ
import { execFileSync } from 'node:child_process'

const SITE = 'https://loykatong-app.vercel.app/'

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const gitShow = (args) => execFileSync('git', args, { stdio: 'inherit' })
const fail = (msg) => {
  console.error(`\n✗ ${msg}`)
  process.exit(1)
}

try {
  git(['--version'])
} catch {
  fail('ไม่พบคำสั่ง git — ติดตั้ง Git แล้วเปิด Terminal ใหม่')
}

gitShow(['add', '-A'])

// กันไฟล์ลับ (.env, .env.local ฯลฯ) หลุดขึ้น GitHub แม้ .gitignore จะถูกแก้พลาด
const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const secrets = staged.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'))
if (secrets.length) {
  gitShow(['reset', '-q', '--', ...secrets])
  fail(`หยุดก่อน: มีไฟล์ลับจะถูก commit (${secrets.join(', ')}) — นำออกจาก commit แล้ว ตรวจ .gitignore`)
}

if (staged.length) {
  const custom = process.argv.slice(2).join(' ').trim()
  const stamp = new Date().toLocaleString('sv-SE').slice(0, 16) // YYYY-MM-DD HH:mm เวลาเครื่อง
  const message = custom || `Update site (${stamp})`
  gitShow(['commit', '-q', '-m', message])
  console.log(`✓ commit ${staged.length} ไฟล์: ${message}`)
} else {
  console.log('• ไม่มีไฟล์เปลี่ยน ข้ามการ commit')
}

let ahead = 0
try {
  ahead = Number(git(['rev-list', '--count', '@{u}..HEAD'])) || 0
} catch {
  ahead = 1 // ยังไม่ได้ผูก branch กับ GitHub → ลอง push ไปเลย
}
if (!ahead) {
  console.log(`• ไม่มีอะไรต้อง push — เว็บเป็นเวอร์ชันล่าสุดแล้ว: ${SITE}`)
  process.exit(0)
}

try {
  gitShow(['push'])
} catch {
  fail('push ไม่สำเร็จ — ถ้ามีคนแก้ไฟล์บน GitHub ให้รัน `git pull` ก่อนแล้วลองใหม่')
}
console.log(`\n✓ push แล้ว — Vercel จะอัปเดตเว็บภายในประมาณ 1 นาที: ${SITE}`)
