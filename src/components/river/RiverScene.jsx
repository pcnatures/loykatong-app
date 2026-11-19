import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SceneBackdrop from './SceneBackdrop'
import SkyLayer from './SkyLayer'
import WaterLayer from './WaterLayer'
import FloatingKrathongs from './FloatingKrathongs'
import KrathongInfoCard from './KrathongInfoCard'
import MyAvatarStage from './MyAvatarStage'
import { LotusLeaves, Pier, PierLamp } from './Foreground'
import { sceneLayout } from './layout'
import { useElementSize } from '../../hooks/useElementSize'
import { HORIZON } from '../../lib/drift'

/**
 * ฉากริมน้ำแบบเรียลไทม์
 * ซ้อนเลเยอร์: ท้องฟ้า → ฉากหลังสถานที่ → ผิวน้ำ → กระทงทุกใบ → ท่าน้ำ/อวตาร → UI
 */
export default function RiverScene({ location, scene, room, myClientId, freshIds, avatar, krathong, name, release, onPlaced, onDone, onChangeLocation, className = '' }) {
  const rootRef = useRef(null)
  const size = useElementSize(rootRef)
  const layout = useMemo(() => (size.width ? sceneLayout(size.width, size.height) : { W: 0, H: 0 }), [size.width, size.height])

  const [active, setActiveState] = useState({ id: null, source: null })
  const setActive = useCallback((id, source) => {
    setActiveState((cur) => {
      if (source === 'tap') return cur.id === id && cur.source === 'tap' ? { id: null, source: null } : { id, source }
      if (id === null) return cur.source === source ? { id: null, source: null } : cur
      if (cur.source === 'tap') return cur
      return { id, source }
    })
  }, [])
  const cardRef = useRef(null)
  const activeRec = room.records.find((r) => r.id === active.id) ?? null

  const toasts = useArrivalToasts(room.records, myClientId, room.now)

  return (
    <div
      ref={rootRef}
      className={`relative isolate select-none overflow-hidden bg-night-950 ${className}`}
      onClick={() => setActiveState({ id: null, source: null })}
    >
      <SkyLayer scene={scene} seed={location.id} />
      {/* ฉากหลังสูงตามความกว้าง (10:3) และเกาะเส้นขอบฟ้าเสมอ */}
      <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${100 - HORIZON * 100 - 0.4}%`, aspectRatio: '10 / 3' }}>
        <SceneBackdrop scene={location.scene} sceneConfig={scene} animated className="h-full w-full" />
      </div>
      <WaterLayer scene={scene} seed={location.id} />

      <FloatingKrathongs
        records={room.records}
        now={room.now}
        layout={layout}
        flow={scene.flow}
        myClientId={myClientId}
        activeId={active.id}
        setActive={setActive}
        cardRef={cardRef}
        freshIds={freshIds}
      />

      <Pier layout={layout} />
      <PierLamp layout={layout} />
      <LotusLeaves layout={layout} />
      <MyAvatarStage layout={layout} avatar={avatar} krathong={krathong} name={name} release={release} onPlaced={onPlaced} onDone={onDone} />

      <KrathongInfoCard
        ref={cardRef}
        rec={activeRec}
        mine={activeRec?.clientId === myClientId}
        now={room.now}
        onClose={active.source === 'tap' ? () => setActiveState({ id: null, source: null }) : null}
      />

      {/* ── UI ด้านบน ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2100] flex items-start justify-between gap-2 p-3 sm:p-4">
        <motion.div
          key={location.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass pointer-events-auto max-w-[70%] rounded-2xl border border-gold-400/30 px-3 py-2 shadow-xl"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-gold-200 sm:text-base">
            <PinIcon /> <span className="truncate">{location.name}</span>
          </p>
          <p className="truncate text-[11px] text-gold-100/60 sm:text-xs">
            {location.water} · {location.province}
          </p>
        </motion.div>
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <StatusPill room={room} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChangeLocation()
            }}
            className="glass rounded-full border border-gold-400/30 px-3 py-1 text-xs text-gold-200 hover:border-gold-300"
          >
            เปลี่ยนสถานที่
          </button>
        </div>
      </div>

      {/* แจ้งเตือนเมื่อมีคนอื่นเพิ่งลอยกระทง */}
      <div className="pointer-events-none absolute inset-x-0 top-[22%] z-[2050] flex flex-col items-center gap-1.5 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass rounded-full border border-gold-400/30 px-3 py-1 text-xs text-gold-100 shadow-lg"
            >
              ✨ <b className="font-medium text-gold-300">{t.name}</b> เพิ่งลอยกระทง
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StatusPill({ room }) {
  const dot = room.status === 'live' ? 'bg-emerald-400' : room.status === 'error' ? 'bg-rose-500' : 'bg-amber-400'
  const label = room.status === 'live' ? 'สด' : room.status === 'error' ? 'ออฟไลน์' : 'กำลังเชื่อมต่อ'
  return (
    <div className="glass flex items-center gap-2 rounded-full border border-gold-400/30 px-3 py-1 text-[11px] text-gold-100 sm:text-xs" title={room.label}>
      <span className="relative flex h-2 w-2">
        {room.status === 'live' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="whitespace-nowrap">
        <span className="hidden sm:inline">{label} · ออนไลน์ </span>
        {room.online.toLocaleString('th-TH')} คน · 🪷 {room.records.length}
      </span>
    </div>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-gold-400" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

function useArrivalToasts(records, myClientId, now) {
  const seen = useRef(null)
  const timers = useRef([])
  const [toasts, setToasts] = useState([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (seen.current === null) {
      // ครั้งแรก: จำของเดิมทั้งหมดไว้ ไม่ต้องแจ้งเตือน
      seen.current = new Set(records.map((r) => r.id))
      return
    }
    const fresh = []
    for (const r of records) {
      if (seen.current.has(r.id)) continue
      seen.current.add(r.id)
      if (r.clientId !== myClientId && now() - r.createdAt < 15_000) fresh.push({ id: r.id, name: r.name })
    }
    if (!fresh.length) return
    setToasts((t) => [...t, ...fresh].slice(-3))
    const ids = fresh.map((f) => f.id)
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => !ids.includes(x.id))), 4500))
  }, [records, myClientId, now])
  return toasts
}
