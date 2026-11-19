import { getApps, initializeApp } from 'firebase/app'
import {
  getDatabase,
  limitToLast,
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  onValue,
  orderByChild,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  startAt,
} from 'firebase/database'
import { KRATHONG_LIFETIME_MS } from '../lib/drift'
import { normalizeRecord, toStored } from './schema'

/**
 * โครงสร้างข้อมูลใน Realtime Database
 *   rooms/{roomId}/krathongs/{id}  → ข้อมูลกระทง
 *   rooms/{roomId}/presence/{clientId} → คนที่กำลังออนไลน์ในสถานที่นี้ (ลบอัตโนมัติเมื่อหลุด)
 * กฎความปลอดภัยดูที่ firebase/database.rules.json
 */
export function createFirebaseAdapter(config) {
  const app = getApps()[0] ?? initializeApp(config)
  const db = getDatabase(app)

  // ชดเชยนาฬิกาเครื่องผู้ใช้ให้ตรงกับเซิร์ฟเวอร์ → ทุกคนเห็นกระทงอยู่ตำแหน่งเดียวกัน
  let offset = 0
  onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
    offset = Number(snap.val()) || 0
  })
  const now = () => Date.now() + offset

  return {
    mode: 'firebase',
    label: 'Firebase Realtime',
    now,

    joinRoom(roomId, me, h) {
      const unsubs = []
      const q = query(
        ref(db, `rooms/${roomId}/krathongs`),
        orderByChild('createdAt'),
        startAt(now() - KRATHONG_LIFETIME_MS),
        limitToLast(150),
      )
      const onErr = (err) => h.onError?.(err)
      unsubs.push(onChildAdded(q, (snap) => h.onAdd(normalizeRecord({ ...snap.val(), id: snap.key }, roomId)), onErr))
      unsubs.push(onChildRemoved(q, (snap) => h.onRemove(snap.key), onErr))

      // Presence
      const presRef = ref(db, `rooms/${roomId}/presence/${me.clientId}`)
      unsubs.push(
        onValue(ref(db, '.info/connected'), (snap) => {
          if (snap.val() !== true) {
            h.onStatus?.('connecting')
            return
          }
          onDisconnect(presRef)
            .remove()
            .then(() => set(presRef, { at: serverTimestamp() }))
            .then(() => h.onStatus?.('live'))
            .catch(onErr)
        }),
      )
      unsubs.push(onValue(ref(db, `rooms/${roomId}/presence`), (snap) => h.onPresence(snap.size), onErr))

      return () => {
        unsubs.forEach((u) => u())
        onDisconnect(presRef).cancel().catch(() => {})
        remove(presRef).catch(() => {})
      }
    },

    async publish(roomId, rec) {
      await set(ref(db, `rooms/${roomId}/krathongs/${rec.id}`), toStored(rec))
    },
  }
}
