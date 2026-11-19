import { createClient } from '@supabase/supabase-js'
import { KRATHONG_LIFETIME_MS } from '../lib/drift'
import { normalizeRecord } from './schema'

/**
 * ใช้ตาราง public.krathongs (ดู supabase/schema.sql)
 * - โหลดกระทงล่าสุดด้วย select
 * - รับกระทงใหม่ผ่าน Realtime "postgres_changes"
 * - นับคนออนไลน์ด้วย Realtime Presence
 */
const fromRow = (row, roomId) =>
  normalizeRecord(
    {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      wish: row.wish,
      avatar: row.avatar,
      krathong: row.krathong,
      createdAt: row.created_at,
      seed: row.seed,
      lane: row.lane,
      startX: row.start_x,
      startD: row.start_d,
    },
    roomId,
  )

const toRow = (roomId, rec) => ({
  id: rec.id,
  room_id: roomId,
  client_id: rec.clientId,
  name: rec.name,
  wish: rec.wish,
  avatar: rec.avatar,
  krathong: rec.krathong,
  seed: rec.seed,
  lane: rec.lane,
  start_x: rec.startX,
  start_d: rec.startD,
})

export function createSupabaseAdapter(url, anonKey) {
  const sb = createClient(url, anonKey)
  let offset = 0
  const now = () => Date.now() + offset

  return {
    mode: 'supabase',
    label: 'Supabase Realtime',
    now,

    joinRoom(roomId, me, h) {
      let closed = false
      const since = new Date(now() - KRATHONG_LIFETIME_MS).toISOString()

      sb.from('krathongs')
        .select('*')
        .eq('room_id', roomId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(150)
        .then(({ data, error }) => {
          if (closed) return
          if (error) return h.onError?.(error)
          data.forEach((row) => h.onAdd(fromRow(row, roomId)))
        })

      const channel = sb.channel(`room:${roomId}`, { config: { presence: { key: me.clientId } } })
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'krathongs', filter: `room_id=eq.${roomId}` },
          (payload) => h.onAdd(fromRow(payload.new, roomId)),
        )
        .on('presence', { event: 'sync' }, () => h.onPresence(Object.keys(channel.presenceState()).length))
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            h.onStatus?.('live')
            await channel.track({ at: Date.now() })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            h.onStatus?.('error')
          }
        })

      return () => {
        closed = true
        sb.removeChannel(channel)
      }
    },

    async publish(roomId, rec) {
      const t0 = Date.now()
      const { data, error } = await sb.from('krathongs').insert(toRow(roomId, rec)).select('created_at').single()
      if (error) throw error
      // ประมาณค่าความต่างของนาฬิกาเครื่องเรากับเซิร์ฟเวอร์จากเวลาที่ฐานข้อมูลบันทึก
      if (data?.created_at) offset = Date.parse(data.created_at) - (t0 + Date.now()) / 2
    },
  }
}
