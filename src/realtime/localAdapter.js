import { randomAvatar } from '../config/avatarOptions'
import { CANDLE_STYLES, FLOWER_COLORS, KRATHONG_TYPES } from '../config/krathongOptions'
import { KRATHONG_LIFETIME_MS } from '../lib/drift'
import { uuid } from '../lib/ids'
import { normalizeRecord } from './schema'

/**
 * โหมดสาธิต — ไม่ต้องมีเซิร์ฟเวอร์
 * ซิงก์กระทงและจำนวนคนออนไลน์ "ระหว่างแท็บ" ในเบราว์เซอร์เดียวกันผ่าน BroadcastChannel
 * (เปิด 2 แท็บแล้วลอยกระทง จะเห็นกันแบบเรียลไทม์) และเก็บไว้ใน localStorage
 */
const CHANNEL = 'loykrathong-demo-v1'
const SAMPLE = [
  ['น้องมะปราง', 'ขอให้ครอบครัวมีสุขภาพแข็งแรง อยู่กันพร้อมหน้าทุกปีนะ'],
  ['พี่ต้นกล้า', 'ขอให้สอบติดคณะที่ตั้งใจไว้ สู้ ๆ!'],
  ['คุณยายบุญมา', 'ขอขมาพระแม่คงคา ขอให้ลูกหลานเจริญรุ่งเรือง'],
  ['Mint & Tae', 'ขอให้เราได้ลอยกระทงด้วยกันแบบนี้ทุกปี 💛'],
  ['ทีมงานออฟฟิศ', 'ขอให้งานราบรื่น โบนัสปังปลายปี'],
  ['Alex', 'Wishing peace and happiness for everyone tonight ✨'],
  ['นักวิ่งตอนเช้า', 'ขอให้หายเจ็บเข่า แล้วได้วิ่งมาราธอนครั้งแรก'],
]

const pick = (list) => list[Math.floor(Math.random() * list.length)].id

function demoRecords() {
  const now = Date.now()
  return SAMPLE.slice(0, 5 + Math.floor(Math.random() * 3)).map(([name, wish], i) => ({
    id: uuid(),
    clientId: `demo-${i}`,
    name,
    wish,
    avatar: randomAvatar(),
    krathong: { type: pick(KRATHONG_TYPES), flower: pick(FLOWER_COLORS), candle: pick(CANDLE_STYLES) },
    createdAt: now - (20 + Math.random() * 300) * 1000,
    seed: Math.random(),
    lane: 0.2 + Math.random() * 0.6,
    startX: 0.25 + Math.random() * 0.2,
    startD: 0.02,
    demo: true,
  }))
}

export function createLocalAdapter() {
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
  const key = (room) => `lk.demo.${room}`
  const load = (room) => {
    try {
      return JSON.parse(localStorage.getItem(key(room)) || '[]')
    } catch {
      return []
    }
  }
  const save = (room, list) => {
    try {
      localStorage.setItem(key(room), JSON.stringify(list.slice(-120)))
    } catch {
      /* ignore */
    }
  }

  return {
    mode: 'local',
    label: 'โหมดสาธิต',
    now: () => Date.now(),

    joinRoom(roomId, me, h) {
      const t = Date.now()
      let list = load(roomId).filter((r) => t - r.createdAt < KRATHONG_LIFETIME_MS)
      if (!list.some((r) => !r.demo) && list.length < 3) list = [...list, ...demoRecords()]
      save(roomId, list)
      list.forEach((r) => h.onAdd(normalizeRecord(r, roomId)))

      const peers = new Map()
      const recount = () => {
        const n = Date.now()
        for (const [id, at] of peers) if (n - at > 9000) peers.delete(id)
        h.onPresence(peers.size + 1)
      }
      const beat = () => bc?.postMessage({ type: 'presence', room: roomId, clientId: me.clientId, at: Date.now() })
      const onMsg = (e) => {
        const m = e.data
        if (!m || m.room !== roomId) return
        if (m.type === 'presence' && m.clientId !== me.clientId) {
          const isNew = !peers.has(m.clientId)
          peers.set(m.clientId, Date.now())
          recount()
          if (isNew) beat() // ตอบกลับทันทีให้แท็บใหม่เห็นเรา
        } else if (m.type === 'leave') {
          peers.delete(m.clientId)
          recount()
        } else if (m.type === 'krathong') {
          h.onAdd(normalizeRecord(m.record, roomId))
        }
      }
      bc?.addEventListener('message', onMsg)
      beat()
      recount()
      h.onStatus?.('live')
      const iv = setInterval(() => {
        beat()
        recount()
      }, 3000)

      return () => {
        clearInterval(iv)
        bc?.removeEventListener('message', onMsg)
        bc?.postMessage({ type: 'leave', room: roomId, clientId: me.clientId })
      }
    },

    async publish(roomId, rec) {
      const list = load(roomId)
      list.push(rec)
      save(roomId, list)
      bc?.postMessage({ type: 'krathong', room: roomId, record: rec })
    },
  }
}
