import { useCallback, useEffect, useRef, useState } from 'react'
import { isExpired } from '../lib/drift'
import { getRealtime } from '../realtime'

const MAX_VISIBLE = 90

/**
 * เข้าห้อง (สถานที่) แล้วรับกระทงของทุกคนแบบเรียลไทม์
 * @returns {{ records, online, status, publish, now, mode, label, ready }}
 */
export function useRealtimeRoom(roomId, clientId) {
  const [adapter, setAdapter] = useState(null)
  const [records, setRecords] = useState([])
  const [online, setOnline] = useState(1)
  const [status, setStatus] = useState('connecting')
  const mapRef = useRef(new Map())
  const flushRef = useRef(() => {})

  useEffect(() => {
    let alive = true
    getRealtime().then((a) => alive && setAdapter(a))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!adapter || !roomId) return
    const map = new Map()
    mapRef.current = map
    setRecords([])
    setStatus('connecting')

    let timer = null
    const flush = () => {
      timer = null
      const list = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt)
      setRecords(list.slice(-MAX_VISIBLE))
    }
    const schedule = () => {
      if (!timer) timer = setTimeout(flush, 40)
    }
    flushRef.current = schedule

    const leave = adapter.joinRoom(
      roomId,
      { clientId },
      {
        onAdd: (rec) => {
          if (!rec || map.has(rec.id) || isExpired(rec, adapter.now())) return
          map.set(rec.id, rec)
          schedule()
        },
        onRemove: (id) => map.delete(id) && schedule(),
        onPresence: (n) => setOnline(Math.max(1, n || 1)),
        onStatus: setStatus,
        onError: (err) => {
          console.warn('[realtime]', err)
          setStatus('error')
        },
      },
    )

    const prune = setInterval(() => {
      const t = adapter.now()
      let changed = false
      for (const [id, r] of map) {
        if (isExpired(r, t)) {
          map.delete(id)
          changed = true
        }
      }
      if (changed) schedule()
    }, 10_000)

    return () => {
      clearInterval(prune)
      clearTimeout(timer)
      leave()
    }
  }, [adapter, roomId, clientId])

  /** เพิ่มกระทงของเราทันที (optimistic) แล้วค่อยส่งขึ้นเซิร์ฟเวอร์ */
  const publish = useCallback(
    async (rec) => {
      mapRef.current.set(rec.id, rec)
      flushRef.current()
      if (adapter) await adapter.publish(roomId, rec)
    },
    [adapter, roomId],
  )

  const now = useCallback(() => (adapter ? adapter.now() : Date.now()), [adapter])

  return { records, online, status, publish, now, mode: adapter?.mode, label: adapter?.label, ready: !!adapter }
}
