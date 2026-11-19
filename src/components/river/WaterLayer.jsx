import { useMemo } from 'react'
import { seededRandom } from '../../lib/ids'
import { HORIZON } from '../../lib/drift'
import { MOON_X } from './SkyLayer'

const waveSvg = (color, amp) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='16'><path d='M0 8 Q20 ${8 - amp} 40 8 T80 8 T120 8 T160 8' fill='none' stroke='${color}' stroke-width='1.4' stroke-linecap='round'/></svg>`,
  )}")`

/** ผิวน้ำ: ไล่สีตามความลึก + เงาจันทร์ระยิบระยับ + แสงไฟสะท้อน + ระลอกคลื่น */
export default function WaterLayer({ scene, seed = 'water' }) {
  const streaks = useMemo(() => {
    const rnd = seededRandom(seed)
    return Array.from({ length: 14 }, (_, i) => ({
      x: 3 + rnd() * 94,
      w: 10 + rnd() * 30,
      h: 6 + rnd() * 16,
      color: scene.lights[i % scene.lights.length],
      d: rnd() * 3,
    }))
  }, [seed, scene])

  const waves = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const t = i / 10 // 0 = ไกล, 1 = ใกล้
        return {
          top: HORIZON * 100 + 1.5 + Math.pow(t, 1.6) * (97 - HORIZON * 100),
          h: 6 + t * 14,
          size: 60 + t * 170,
          opacity: 0.12 + t * 0.2,
          dur: 26 - t * 14,
          dir: i % 2 ? 1 : -1,
        }
      }),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: `${HORIZON * 100}%` }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${scene.water[0]} 0%, ${scene.water[1]} 100%)` }} />
      {/* แสงเรืองจากขอบฟ้าสะท้อนน้ำ */}
      <div className="absolute inset-x-0 top-0 h-[18%]" style={{ background: `linear-gradient(180deg, ${scene.skyGlow}30, transparent)` }} />

      {/* เงาจันทร์ */}
      <div className="absolute top-0 h-[70%] -translate-x-1/2" style={{ left: `${MOON_X}%`, width: 'clamp(60px, 12vw, 160px)' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="absolute left-1/2 -translate-x-1/2 rounded-full animate-shimmer"
            style={{
              top: `${i * 8.5}%`,
              width: `${14 + ((i * 37) % 46)}%`,
              height: 2 + i * 0.35,
              background: 'linear-gradient(90deg, transparent, rgb(255 238 190 / 0.7), transparent)',
              filter: 'blur(1.5px)',
              animationDelay: `${(i % 5) * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* แสงไฟสะท้อนจากฝั่ง */}
      {streaks.map((s, i) => (
        <span
          key={i}
          className="absolute top-0 -translate-x-1/2 rounded-full animate-shimmer"
          style={{
            left: `${s.x}%`,
            width: s.w * 0.5,
            height: `${s.h}%`,
            background: `linear-gradient(180deg, ${s.color}80, transparent)`,
            filter: 'blur(4px)',
            animationDelay: `${s.d}s`,
          }}
        />
      ))}

      {/* ระลอกคลื่น (ไกล = เล็กและช้า) */}
      {waves.map((w, i) => (
        <div
          key={i}
          className="absolute inset-x-0"
          style={{
            top: `${((w.top - HORIZON * 100) / (100 - HORIZON * 100)) * 100}%`,
            height: w.h,
            backgroundImage: waveSvg('#cfe0ff', 3),
            backgroundSize: `${w.size}px ${w.h}px`,
            backgroundRepeat: 'repeat-x',
            opacity: w.opacity,
            animation: `wave-x ${w.dur}s linear infinite ${w.dir < 0 ? 'reverse' : 'normal'}`,
            '--wave-w': `${w.size}px`,
          }}
        />
      ))}
    </div>
  )
}
