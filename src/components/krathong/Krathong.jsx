import { useId } from 'react'
import { FLOWER_COLORS, sanitizeKrathong } from '../../config/krathongOptions'
import { darken, lighten, mix } from '../../lib/color'

/*
 * กระทงแบบ SVG ล้วน — viewBox 160 × 140, แนวน้ำอยู่ที่ y ≈ 114
 * animated = true → เปลวเทียนไหว (ใช้ class Tailwind) | false → ภาพนิ่ง (ใช้ทำการ์ด)
 */

export const KRATHONG_WATERLINE = 114 / 140

const GOLD = '#e9bf4f'

function Flower({ x, y, r, color, center }) {
  const petals = 8
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2
        return <circle key={i} cx={(r * 0.55 * Math.cos(a)).toFixed(2)} cy={(r * 0.45 * Math.sin(a)).toFixed(2)} r={(r * 0.5).toFixed(2)} fill={color} />
      })}
      <circle r={r * 0.5} fill={lighten(color, 0.12)} />
      <circle r={r * 0.22} fill={center} />
    </g>
  )
}

function Flame({ x, y, s = 1, animated, uid }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="17" fill={`url(#glow-${uid})`} />
      <g
        className={animated ? 'animate-flicker' : undefined}
        style={animated ? { transformBox: 'fill-box', transformOrigin: '50% 90%' } : undefined}
      >
        <path d="M0 -15 C5 -8 6.5 -2 0 3 C-6.5 -2 -5 -8 0 -15 Z" fill={`url(#flame-${uid})`} />
        <path d="M0 -6 C2 -3 2.4 0 0 2 C-2.4 0 -2 -3 0 -6 Z" fill="#fffbe8" />
      </g>
    </g>
  )
}

function Candle({ x, top, bottom, w = 8, animated, uid }) {
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={bottom - top} rx="1.5" fill={`url(#wax-${uid})`} />
      <ellipse cx={x} cy={top} rx={w / 2} ry="1.6" fill="#fff9ec" />
      <path d={`M${x} ${top} L${x} ${top - 3}`} stroke="#3b2a1f" strokeWidth="1" />
      <Flame x={x} y={top - 4} animated={animated} uid={uid} />
    </g>
  )
}

function Lights({ candle, top, animated, uid }) {
  if (candle === 'twin')
    return (
      <>
        <Candle x={71} top={top + 6} bottom={top + 30} animated={animated} uid={uid} />
        <Candle x={89} top={top + 4} bottom={top + 30} animated={animated} uid={uid} />
      </>
    )
  if (candle === 'single') return <Candle x={80} top={top - 4} bottom={top + 30} w={9} animated={animated} uid={uid} />
  if (candle === 'tealight')
    return (
      <g>
        {[-1, -0.5, 0, 0.5, 1].map((k) => (
          <path
            key={k}
            d={`M${80 + k * 8} ${top + 28} Q${80 + k * 11 - 5} ${top + 18} ${80 + k * 10} ${top + 12} Q${80 + k * 11 + 5} ${top + 18} ${80 + k * 8} ${top + 28} Z`}
            fill={k === 0 ? '#ffd0dc' : '#ff9fbe'}
            stroke="#e0709a"
            strokeWidth="0.6"
          />
        ))}
        <ellipse cx="80" cy={top + 22} rx="7" ry="2.4" fill="#fff4d6" />
        <Flame x={80} y={top + 18} s={0.9} animated={animated} uid={uid} />
      </g>
    )
  // classic: เทียน 1 + ธูป 3 ดอก
  return (
    <g>
      {[
        [69, 61],
        [70.5, 65],
        [72, 69],
      ].map(([bx, tx], i) => (
        <g key={i}>
          <path d={`M${bx} ${top + 30} L${tx - 8} ${top - 4 + i * 1.5}`} stroke="#7a4a26" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx={tx - 8} cy={top - 4 + i * 1.5} r="1.6" fill="#ff5a2a" />
          <circle cx={tx - 8} cy={top - 4 + i * 1.5} r="3.6" fill="#ff7a3a" opacity="0.35" />
        </g>
      ))}
      <path d={`M54 ${top - 8} C50 ${top - 18} 58 ${top - 24} 54 ${top - 34}`} stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.18" />
      <Candle x={84} top={top} bottom={top + 30} animated={animated} uid={uid} />
    </g>
  )
}

function FlowerMound({ flower, cy = 86 }) {
  const f = FLOWER_COLORS.find((o) => o.id === flower) ?? FLOWER_COLORS[0]
  const spots = [
    [66, cy - 2, 7.5],
    [94, cy - 2, 7.5],
    [80, cy - 5, 8],
    [57, cy + 6, 7],
    [103, cy + 6, 7],
    [71, cy + 7, 7.5],
    [89, cy + 7, 7.5],
  ]
  return (
    <g>
      <ellipse cx="80" cy={cy + 6} rx="34" ry="10" fill="#2f6b34" />
      {[
        [48, cy + 8, -30],
        [112, cy + 8, 30],
        [80, cy + 12, 0],
      ].map(([x, y, r], i) => (
        <path key={i} d="M0 0 Q6 -5 14 0 Q6 5 0 0 Z" fill="#5fa04a" transform={`translate(${x} ${y}) rotate(${r})`} />
      ))}
      {spots.map(([x, y, r], i) => (
        <Flower key={i} x={x} y={y} r={r} color={f.color} center={f.center} />
      ))}
    </g>
  )
}

/* ── ฐานกระทง: ตอนหลัง (back) วาดก่อนดอกไม้ ตอนหน้า (front) วาดทีหลัง ── */
const RIM = { cx: 80, cy: 100, rx: 56, ry: 14 }
const rimPoint = (a, dr = 0) => [RIM.cx + (RIM.rx + dr) * Math.cos(a), RIM.cy + (RIM.ry + dr * 0.25) * Math.sin(a)]

function Folds({ count, front, shape, fillId, stroke, height = 24, width = 15, offset = 0 }) {
  const items = []
  for (let i = 0; i < count; i++) {
    const a = ((i + offset) / count) * Math.PI * 2
    const isFront = Math.sin(a) >= 0
    if (isFront !== front) continue
    const [px, py] = rimPoint(a)
    const h = height * (0.85 + 0.15 * Math.sin(a))
    const w = width
    const d =
      shape === 'round'
        ? `M${px - w / 2} ${py} C${px - w / 2} ${py - h} ${px + w / 2} ${py - h} ${px + w / 2} ${py} Z`
        : `M${px - w / 2} ${py} Q${px - w / 3} ${py - h * 0.55} ${px} ${py - h} Q${px + w / 3} ${py - h * 0.55} ${px + w / 2} ${py} Q${px} ${py + 3} ${px - w / 2} ${py} Z`
    items.push({ a, d, py })
  }
  items.sort((p, q) => p.py - q.py)
  return items.map(({ d }, i) => <path key={i} d={d} fill={`url(#${fillId})`} stroke={stroke} strokeWidth="0.8" />)
}

function BaseDisc({ top, side, rim }) {
  const { cx, cy, rx, ry } = RIM
  return (
    <g>
      <path d={`M${cx - rx} ${cy} L${cx - rx} ${cy + 9} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 9} L${cx + rx} ${cy} Z`} fill={side} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={top} stroke={rim} strokeWidth="1" />
    </g>
  )
}

function Banana({ flower, candle, animated, uid }) {
  return (
    <g>
      <BaseDisc top="#5d9a44" side="#2c5f2c" rim="#3f7f35" />
      <Folds count={16} front={false} fillId={`leaf-${uid}`} stroke="#d9f0b8" height={26} />
      <Folds count={16} front={false} fillId={`leaf-${uid}`} stroke="#d9f0b8" offset={0.5} height={20} />
      <FlowerMound flower={flower} cy={76} />
      <Lights candle={candle} top={42} animated={animated} uid={uid} />
      <Folds count={16} front fillId={`leaf-${uid}`} stroke="#d9f0b8" offset={0.5} height={13} width={13} />
      <Folds count={16} front fillId={`leaf-${uid}`} stroke="#d9f0b8" height={10} width={13} />
      <path d="M26 110 Q80 128 134 110" stroke={GOLD} strokeWidth="1.4" fill="none" strokeDasharray="2 3" />
    </g>
  )
}

function Bread({ flower, candle, animated, uid }) {
  const f = FLOWER_COLORS.find((o) => o.id === flower) ?? FLOWER_COLORS[0]
  return (
    <g>
      <BaseDisc top="#e2ae6e" side="#9a6230" rim="#b67a3d" />
      <Folds count={14} front={false} shape="round" fillId={`bread-${uid}`} stroke={darken(mix('#e2ae6e', f.color, 0.3), 0.2)} height={20} width={17} />
      <FlowerMound flower={flower} />
      <Lights candle={candle} top={52} animated={animated} uid={uid} />
      <Folds count={14} front shape="round" fillId={`bread-${uid}`} stroke={darken(mix('#e2ae6e', f.color, 0.3), 0.2)} height={20} width={17} />
      {[...Array(9)].map((_, i) => (
        <circle key={i} cx={34 + i * 11.5} cy={112 + Math.sin(i) * 2} r="1" fill="#7a4a1c" opacity="0.6" />
      ))}
    </g>
  )
}

function Lotus({ flower, candle, animated, uid }) {
  const petal = (a, len, w, dr = 0) => {
    const [px, py] = rimPoint(a, dr)
    const tilt = Math.cos(a) * (dr < 0 ? 10 : 20)
    return { py, d: `M0 0 C${-w} ${-len * 0.4} ${-w * 0.6} ${-len * 0.85} 0 ${-len} C${w * 0.6} ${-len * 0.85} ${w} ${-len * 0.4} 0 0 Z`, t: `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${tilt.toFixed(1)})` }
  }
  const outer = Array.from({ length: 12 }, (_, i) => petal((i / 12) * Math.PI * 2, 34, 11))
  const inner = Array.from({ length: 8 }, (_, i) => petal((i / 8) * Math.PI * 2 + 0.3, 30, 8, -22))
  const draw = (list, front, fill) =>
    list
      .filter((p) => (p.py >= RIM.cy) === front)
      .sort((p, q) => p.py - q.py)
      .map((p, i) => <path key={i} d={p.d} transform={p.t} fill={fill} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.7" />)
  return (
    <g>
      <ellipse cx="80" cy="108" rx="66" ry="13" fill="#2d6a37" />
      <path d="M80 108 L146 106" stroke="#4f9150" strokeWidth="1" />
      {draw(outer, false, `url(#petal-${uid})`)}
      {draw(inner, false, `url(#petalIn-${uid})`)}
      <ellipse cx="80" cy="92" rx="24" ry="8" fill="#f6d36b" />
      <Lights candle={candle} top={56} animated={animated} uid={uid} />
      {draw(inner, true, `url(#petalIn-${uid})`)}
      {draw(outer, true, `url(#petal-${uid})`)}
    </g>
  )
}

function Ice({ flower, candle, animated, uid }) {
  const f = FLOWER_COLORS.find((o) => o.id === flower) ?? FLOWER_COLORS[0]
  return (
    <g>
      <path d="M22 98 L40 84 L80 80 L120 84 L138 98 L130 114 L80 121 L30 114 Z" fill={`url(#ice-${uid})`} stroke="#e8f8ff" strokeWidth="1.2" />
      <path d="M22 98 L80 104 L138 98 M80 104 L80 121 M40 84 L52 102 M120 84 L108 102" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" fill="none" />
      {/* ดอกไม้ที่ถูกแช่แข็งอยู่ข้างใน */}
      <g opacity="0.6">
        <Flower x={50} y={106} r={6} color={f.color} center={f.center} />
        <Flower x={80} y={111} r={6.5} color={f.color} center={f.center} />
        <Flower x={110} y={106} r={6} color={f.color} center={f.center} />
      </g>
      <path d="M44 86 L80 82 L116 86 L104 96 L56 96 Z" fill="#ffffff" opacity="0.25" />
      <FlowerMound flower={flower} cy={84} />
      <Lights candle={candle} top={50} animated={animated} uid={uid} />
      {[
        [30, 92],
        [128, 90],
        [96, 116],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 5} L${x + 1.2} ${y - 1.2} L${x + 5} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 5} L${x - 1.2} ${y + 1.2} L${x - 5} ${y} L${x - 1.2} ${y - 1.2} Z`} fill="#ffffff" />
      ))}
    </g>
  )
}

function Swan({ flower, candle, animated, uid }) {
  const f = FLOWER_COLORS.find((o) => o.id === flower) ?? FLOWER_COLORS[0]
  const feather = (x, y, rot, len, fill, key) => (
    <path key={key} d={`M0 0 C-5 ${-len * 0.4} -3 ${-len * 0.9} 0 ${-len} C3 ${-len * 0.9} 5 ${-len * 0.4} 0 0 Z`} transform={`translate(${x} ${y}) rotate(${rot})`} fill={fill} stroke={GOLD} strokeWidth="0.8" />
  )
  return (
    <g>
      <ellipse cx="82" cy="112" rx="56" ry="9" fill="#1d3f2a" opacity="0.6" />
      {/* หาง */}
      {[50, 62, 74].map((r, i) => feather(124, 100, r, 30 - i * 3, `url(#swanW-${uid})`, `t${i}`))}
      {/* ลำตัว */}
      <path d="M30 100 C32 118 128 122 136 98 C120 106 60 108 30 100 Z" fill={`url(#swanB-${uid})`} stroke={GOLD} strokeWidth="1" />
      {/* ปีก */}
      {[-60, -45, -30, -15, 0, 15].map((r, i) => feather(90 + i * 3, 102, r + 50, 34 - Math.abs(i - 2) * 2, `url(#swanW-${uid})`, `w${i}`))}
      <FlowerMound flower={flower} cy={88} />
      <Lights candle={candle} top={54} animated={animated} uid={uid} />
      {/* คอและหัวหงส์ */}
      <path d="M40 102 C24 92 26 70 38 58 C46 50 44 38 36 36" stroke={`url(#swanN-${uid})`} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M40 102 C24 92 26 70 38 58 C46 50 44 38 36 36" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="35" cy="36" r="6.5" fill="#fff8ea" stroke={GOLD} strokeWidth="1" />
      <path d="M30 34 L20 39 L30 39 Z" fill="#f08a24" />
      <circle cx="34" cy="34.5" r="1.3" fill="#2a1a14" />
      <path d="M36 29 C38 24 44 24 46 27" stroke={GOLD} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="47" cy="27" r="2" fill={f.color} />
    </g>
  )
}

const BODIES = { banana: Banana, lotus: Lotus, bread: Bread, ice: Ice, swan: Swan }

export default function Krathong({ krathong: input, animated = false, glow = true, className, title }) {
  const k = sanitizeKrathong(input)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const f = FLOWER_COLORS.find((o) => o.id === k.flower) ?? FLOWER_COLORS[0]
  const Body = BODIES[k.type] ?? Banana
  const petalBase = k.flower === 'marigold' ? '#ffb3c8' : f.color

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140" className={className} role="img" aria-label={title ?? 'กระทง'}>
      <defs>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor="#ffe6a3" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#ffb45a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`aura-${uid}`}>
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff9a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`flame-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff7a1a" />
          <stop offset="0.55" stopColor="#ffc24a" />
          <stop offset="1" stopColor="#fff2b8" />
        </linearGradient>
        <linearGradient id={`wax-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.6" stopColor="#ffe7b0" />
          <stop offset="1" stopColor="#e9c98a" />
        </linearGradient>
        <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a5d67a" />
          <stop offset="1" stopColor="#3f7f35" />
        </linearGradient>
        <linearGradient id={`bread-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(mix('#e2ae6e', f.color, 0.35), 0.15)} />
          <stop offset="1" stopColor={darken(mix('#e2ae6e', f.color, 0.3), 0.15)} />
        </linearGradient>
        <linearGradient id={`petal-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lighten(petalBase, 0.55)} />
          <stop offset="1" stopColor={petalBase} />
        </linearGradient>
        <linearGradient id={`petalIn-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lighten(petalBase, 0.75)} />
          <stop offset="1" stopColor={lighten(petalBase, 0.25)} />
        </linearGradient>
        <linearGradient id={`ice-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6f7ff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#9ad6f5" stopOpacity="0.75" />
          <stop offset="1" stopColor="#4fa3d9" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`swanB-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#f0d58c" />
        </linearGradient>
        <linearGradient id={`swanW-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="1" stopColor={mix('#ffffff', GOLD, 0.35)} />
        </linearGradient>
        <linearGradient id={`swanN-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3e2b0" />
        </linearGradient>
      </defs>
      {title && <title>{title}</title>}
      {glow && <ellipse cx="80" cy="70" rx="72" ry="60" fill={`url(#aura-${uid})`} />}
      <Body flower={k.flower} candle={k.candle} animated={animated} uid={uid} />
    </svg>
  )
}
