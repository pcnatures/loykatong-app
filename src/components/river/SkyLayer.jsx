import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { seededRandom } from '../../lib/ids'
import { HORIZON } from '../../lib/drift'

/** ท้องฟ้ายามค่ำคืน: ดาว จันทร์เพ็ญ แสงเรืองที่ขอบฟ้า โคมลอย และดอกไม้ไฟ */
export default function SkyLayer({ scene, seed = 'sky' }) {
  const stars = useMemo(() => {
    const rnd = seededRandom(seed)
    return Array.from({ length: 70 }, () => ({
      x: rnd() * 100,
      y: rnd() * HORIZON * 90,
      s: rnd() < 0.15 ? 2.4 : 1 + rnd(),
      d: rnd() * 4,
    }))
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* ท้องฟ้าไล่สี */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: `${HORIZON * 100 + 1}%`,
          background: `linear-gradient(180deg, #040918 0%, #0a1640 45%, #1a2f72 82%, ${scene.skyGlow}55 100%)`,
        }}
      />
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
        />
      ))}
      <Moon />
      {scene.lanterns && <Lanterns seed={seed} />}
      {scene.fireworks && <Fireworks />}
    </div>
  )
}

export const MOON_X = 78 // % — ใช้วาดเงาจันทร์บนน้ำให้ตรงกัน

function Moon() {
  return (
    <div className="absolute" style={{ left: `${MOON_X}%`, top: '9%', transform: 'translateX(-50%)' }}>
      <div
        className="rounded-full"
        style={{
          width: 'clamp(46px, 7vw, 86px)',
          aspectRatio: '1',
          background: 'radial-gradient(circle at 38% 35%, #fffdf2 0%, #fff3cf 45%, #f5dc9c 100%)',
          boxShadow: '0 0 40px 12px rgb(255 238 190 / 0.35), 0 0 120px 40px rgb(255 214 140 / 0.18)',
        }}
      >
        <span className="absolute left-[30%] top-[52%] h-[16%] w-[16%] rounded-full bg-[#e9cf8f]/50" />
        <span className="absolute left-[58%] top-[30%] h-[10%] w-[10%] rounded-full bg-[#e9cf8f]/50" />
        <span className="absolute left-[55%] top-[62%] h-[8%] w-[8%] rounded-full bg-[#e9cf8f]/40" />
      </div>
    </div>
  )
}

/** โคมลอย (ยี่เป็ง) ค่อย ๆ ลอยขึ้นฟ้าจากขอบฟ้า */
function Lanterns({ seed }) {
  const list = useMemo(() => {
    const rnd = seededRandom(seed + 'lantern')
    return Array.from({ length: 16 }, () => ({
      x: 4 + rnd() * 90,
      size: 7 + rnd() * 9,
      dur: 22 + rnd() * 20,
      delay: -rnd() * 40,
      drift: (rnd() - 0.5) * 80,
    }))
  }, [seed])
  return (
    <>
      {list.map((l, i) => (
        <span
          key={i}
          className="absolute animate-float-up"
          style={{
            left: `${l.x}%`,
            top: `${HORIZON * 100 - 2}%`,
            width: l.size,
            height: l.size * 1.25,
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
            '--drift-x': `${l.drift}px`,
            borderRadius: '40% 40% 20% 20%',
            background: 'linear-gradient(180deg, #ffd88a, #ff9a3d 70%, #ff7a1a)',
            boxShadow: `0 0 ${l.size * 1.4}px ${l.size * 0.4}px rgb(255 160 70 / 0.55)`,
          }}
        />
      ))}
    </>
  )
}

const FW_COLORS = ['#ffd36b', '#ff7aa8', '#8fd8ff', '#b9ff9c', '#ffffff', '#ffb55e']

function Fireworks() {
  const [bursts, setBursts] = useState([])
  useEffect(() => {
    let alive = true
    let timer
    const spawn = () => {
      if (!alive) return
      const id = Math.random().toString(36).slice(2)
      setBursts((b) => [
        ...b.slice(-2),
        { id, x: 10 + Math.random() * 60, y: 8 + Math.random() * 18, color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)], r: 40 + Math.random() * 40 },
      ])
      setTimeout(() => alive && setBursts((b) => b.filter((x) => x.id !== id)), 2200)
      timer = setTimeout(spawn, 3500 + Math.random() * 5000)
    }
    timer = setTimeout(spawn, 1200)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  return (
    <AnimatePresence>
      {bursts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2
            return (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{ background: b.color, boxShadow: `0 0 8px 2px ${b.color}` }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(a) * b.r, y: Math.sin(a) * b.r + 18, opacity: 0, scale: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
              />
            )
          })}
        </div>
      ))}
    </AnimatePresence>
  )
}
