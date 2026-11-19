import { memo, useMemo, useRef } from 'react'
import { motion, useAnimationFrame } from 'framer-motion'
import Krathong from '../krathong/Krathong'
import { krathongPose } from '../../lib/drift'
import { KRATHONG_ANCHOR_Y } from './layout'

/**
 * กระทงทั้งหมดที่กำลังลอยอยู่
 * ตำแหน่งอัปเดตทุกเฟรมด้วย useAnimationFrame แล้วเขียน style ลง DOM ตรง ๆ
 * (ไม่ re-render React ทุกเฟรม → ลื่นแม้มีกระทงหลายสิบใบบนมือถือ)
 */
export default function FloatingKrathongs({ records, now, layout, flow, myClientId, activeId, setActive, cardRef, freshIds }) {
  const nodes = useRef(new Map())
  const L = useRef(layout)
  L.current = layout
  const active = useRef(activeId)
  active.current = activeId
  const byId = useMemo(() => new Map(records.map((r) => [r.id, r])), [records])
  const recs = useRef(byId)
  recs.current = byId

  useAnimationFrame(() => {
    const g = L.current
    if (!g.W) return
    const t = now()
    const touchX = g.touch.x / g.W
    for (const [id, el] of nodes.current) {
      const rec = recs.current.get(id)
      if (!rec) continue
      const mine = rec.clientId === myClientId
      // กระทงของคนอื่น: เริ่มจากท่าน้ำของเรา แล้วกระจายตามแนวตลิ่ง ไม่ให้ทับกัน
      const offset = mine ? 0 : touchX - rec.startX + rec.seed * 0.32
      const p = krathongPose(rec, t, flow, offset)
      const ax = p.x * g.W
      const ay = p.y * g.H + p.bob * 1.8 * p.scale
      el.style.transform = `translate3d(${(ax - g.base / 2).toFixed(1)}px, ${(ay - g.kH * KRATHONG_ANCHOR_Y).toFixed(1)}px, 0) scale(${p.scale.toFixed(3)}) rotate(${p.tilt.toFixed(2)}deg)`
      el.style.opacity = p.opacity.toFixed(3)
      el.style.zIndex = String(Math.round(100 + (1 - p.d) * 800))
      el.style.setProperty('--s', p.scale.toFixed(3))
      el.style.setProperty('--hit', Math.max(1, 0.55 / p.scale).toFixed(2))
      el.style.setProperty('--label-o', mine || id === active.current ? '1' : Math.min(1, Math.max(0, (p.scale - 0.5) * 3)).toFixed(2))

      if (id === active.current && cardRef.current) {
        const card = cardRef.current
        const cw = card.offsetWidth || 260
        const ch = card.offsetHeight || 150
        const topOfKrathong = ay - g.kH * KRATHONG_ANCHOR_Y * p.scale
        const cx = Math.min(g.W - cw / 2 - 8, Math.max(cw / 2 + 8, ax))
        const below = topOfKrathong - ch - 14 < 6
        const cy = below ? ay + 18 : topOfKrathong - 14
        card.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, ${below ? '0' : '-100%'})`
      }
    }
  })

  // cache ref callback ต่อ id เพื่อให้ memo ของ FloatingOne ทำงานได้
  const callbacks = useRef(new Map())
  const register = (id) => {
    let cb = callbacks.current.get(id)
    if (!cb) {
      cb = (el) => {
        if (el) nodes.current.set(id, el)
        else {
          nodes.current.delete(id)
          callbacks.current.delete(id)
        }
      }
      callbacks.current.set(id, cb)
    }
    return cb
  }

  return (
    <div className="absolute inset-0">
      {records.map((rec) => (
        <FloatingOne
          key={rec.id}
          rec={rec}
          layout={layout}
          mine={rec.clientId === myClientId}
          fresh={freshIds.has(rec.id)}
          register={register(rec.id)}
          setActive={setActive}
        />
      ))}
    </div>
  )
}

const FloatingOne = memo(function FloatingOne({ rec, layout, mine, fresh, register, setActive }) {
  return (
    <div
      ref={register}
      className="absolute left-0 top-0 will-change-transform"
      style={{ width: layout.base, height: layout.kH, transformOrigin: `50% ${KRATHONG_ANCHOR_Y * 100}%`, opacity: 0 }}
    >
      <motion.div
        className="relative h-full w-full"
        initial={mine && fresh ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        {/* แสงเทียนสะท้อนผิวน้ำ */}
        <div
          className="pointer-events-none absolute left-1/2 top-[78%] h-[70%] w-[46%] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse at top, rgb(255 190 100 / 0.55), transparent 70%)', filter: 'blur(4px)' }}
        />
        <Krathong krathong={rec.krathong} animated className="relative h-full w-full" />
      </motion.div>

      {/* ป้ายชื่อ (ขนาดคงที่ไม่ว่ากระทงจะอยู่ใกล้หรือไกล) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[6%] whitespace-nowrap transition-opacity duration-300"
        style={{ opacity: 'var(--label-o, 0)', transform: 'translate(-50%, -100%) scale(calc(1 / var(--s, 1)))', transformOrigin: '50% 100%' }}
      >
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] leading-none shadow-lg ${mine ? 'bg-gold-400 text-night-950' : 'bg-night-950/70 text-gold-100 ring-1 ring-gold-400/30'}`}
        >
          {mine ? `${rec.name} (คุณ)` : rec.name}
        </span>
      </div>

      <button
        type="button"
        aria-label={`กระทงของ ${rec.name}`}
        className="absolute inset-[5%] cursor-pointer rounded-full focus-visible:outline-gold-300"
        style={{ transform: 'scale(var(--hit, 1))' }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(rec.id, 'hover')}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null, 'hover')}
        onFocus={() => setActive(rec.id, 'focus')}
        onBlur={() => setActive(null, 'focus')}
        onClick={(e) => {
          e.stopPropagation()
          setActive(rec.id, 'tap')
        }}
      />
    </div>
  )
})
