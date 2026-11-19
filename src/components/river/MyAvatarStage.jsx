import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Avatar, { handAnchor } from '../avatar/Avatar'
import Krathong from '../krathong/Krathong'
import { yToDepth } from '../../lib/drift'
import { krathongBoxAt } from './layout'

/*
 * อวตารของผู้ใช้บนท่าน้ำ + ลำดับแอนิเมชันตอนลอยกระทง
 *   idle  → ยืนถือกระทง
 *   kneel → นั่งพับเพียบลง
 *   place → เอื้อมมือวางกระทงลงบนผิวน้ำ (คลื่นกระเพื่อม)
 *   wai   → พนมมืออธิษฐาน ขณะกระทงค่อย ๆ ลอยออกไป
 *   done  → ลุกขึ้นยืน
 */
const POSE_OF = { idle: 'hold', kneel: 'kneel', place: 'place', wai: 'wai', done: 'stand' }
const TIMELINE = [
  ['kneel', 0],
  ['place', 950],
  ['placed', 1900],
  ['wai', 2050],
  ['done', 5600],
]

export default function MyAvatarStage({ layout: L, avatar, krathong, name, release, onPlaced, onDone }) {
  const [phase, setPhase] = useState('idle')
  const [ripple, setRipple] = useState(0)
  const cb = useRef({ onPlaced, onDone })
  cb.current = { onPlaced, onDone }
  const layoutRef = useRef(L)
  layoutRef.current = L

  useEffect(() => {
    if (!release) {
      setPhase('idle')
      return
    }
    const timers = TIMELINE.map(([step, at]) =>
      setTimeout(() => {
        if (step === 'placed') {
          const g = layoutRef.current
          setRipple((n) => n + 1)
          cb.current.onPlaced?.(release, { startX: g.touch.x / g.W, startD: yToDepth(g.touch.y / g.H) })
          return
        }
        setPhase(step)
        if (step === 'done') cb.current.onDone?.(release)
      }, at),
    )
    return () => timers.forEach(clearTimeout)
  }, [release])

  if (!L.W) return null

  const pose = POSE_OF[phase]
  const hand = handAnchor(pose === 'stand' || pose === 'wai' ? 'hold' : pose)
  const handX = L.aLeft + (hand.x / 200) * L.aW
  const handY = L.aTop + (hand.y / 300) * L.aH + L.aH * 0.02
  const target = phase === 'place' ? L.touch : { x: handX, y: handY }
  const box = krathongBoxAt(L, target.x, target.y)
  const showHeld = phase === 'idle' || phase === 'kneel' || phase === 'place'

  return (
    <>
      {/* อวตาร */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ left: L.aLeft, top: L.aTop, width: L.aW, height: L.aH, zIndex: 960 }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Avatar avatar={avatar} pose={pose} animated className="h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" />
        {name && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap transition-[top] duration-700"
            style={{ top: ['kneel', 'place', 'wai'].includes(phase) ? '15%' : '0%' }}
          >
            <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] text-night-950 shadow">{name}</span>
          </div>
        )}
      </motion.div>

      {/* กระทงในมือ → ลงน้ำ */}
      <AnimatePresence>
        {showHeld && (
          <motion.div
            key="held"
            className="pointer-events-none absolute left-0 top-0"
            style={{ width: L.base, height: L.kH, zIndex: phase === 'place' ? 990 : 970 }}
            initial={{ x: box.x, y: box.y + 20, opacity: 0 }}
            animate={{ x: box.x, y: box.y, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.01 } }}
            transition={{ duration: phase === 'place' ? 0.85 : 0.7, ease: [0.45, 0, 0.2, 1] }}
          >
            <Krathong krathong={krathong} animated className="h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ระลอกน้ำตอนวางกระทง */}
      {ripple > 0 && (
        <div key={ripple} className="pointer-events-none absolute" style={{ left: L.touch.x, top: L.touch.y, zIndex: 940 }}>
          {[0, 0.35, 0.7].map((d) => (
            <span
              key={d}
              className="absolute left-0 top-0 rounded-[50%] border-2 border-gold-200/70"
              style={{ width: L.base * 2.2, height: L.base * 0.55, animation: `ripple 1.8s ease-out ${d}s both` }}
            />
          ))}
        </div>
      )}

      {/* คำอธิษฐานลอยขึ้นฟ้า */}
      <AnimatePresence>
        {phase === 'wai' && release?.wish && (
          <motion.div
            key="wish"
            className="pointer-events-none absolute inset-x-0 top-[26%] flex justify-center px-6"
            style={{ zIndex: 1500 }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: [0, 1, 1, 0], y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.4, ease: 'easeOut' }}
          >
            <p className="max-w-[440px] text-center font-display text-xl leading-snug text-gold-200 drop-shadow-[0_0_12px_rgba(255,200,120,0.9)] [overflow-wrap:anywhere] sm:text-3xl">
              “{release.wish}”
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ประกายแสง */}
      <AnimatePresence>
        {phase === 'wai' &&
          Array.from({ length: 10 }, (_, i) => (
            <motion.span
              key={`sp${i}`}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gold-200 shadow-[0_0_10px_3px_rgba(255,214,120,0.8)]"
              style={{ left: L.touch.x + (i - 5) * 10, top: L.touch.y - 20, zIndex: 1400 }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -60 - (i % 4) * 30, x: (i % 2 ? 1 : -1) * (10 + i * 3) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, delay: i * 0.12, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>
    </>
  )
}
