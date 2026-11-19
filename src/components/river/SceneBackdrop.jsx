import { useId } from 'react'
import { seededRandom } from '../../lib/ids'

/*
 * ฉากหลังเหนือเส้นขอบฟ้าของแต่ละสถานที่ (silhouette)
 * viewBox 1000 × 300 — ขอบล่าง (y = 300) คือเส้นขอบฟ้า/ผิวน้ำ
 * ใช้ preserveAspectRatio="xMidYMax slice" ให้ภาพเกาะขอบล่างเสมอทุกขนาดจอ
 */

const SIL = '#0a1638'
const SIL_FAR = '#12224f'
const GOLD = '#f2c75c'

function buildings(seed, { count, xMin = 0, xMax = 1000, hMin, hMax, wMin = 24, wMax = 60 }) {
  const rnd = seededRandom(seed)
  const out = []
  let x = xMin
  for (let i = 0; i < count && x < xMax; i++) {
    const w = wMin + rnd() * (wMax - wMin)
    const h = hMin + rnd() * (hMax - hMin)
    const windows = []
    for (let wy = 300 - h + 8; wy < 290; wy += 9) {
      for (let wx = x + 4; wx < x + w - 6; wx += 8) {
        if (rnd() < 0.32) windows.push([wx, wy])
      }
    }
    out.push({ x, w, h, windows, spire: rnd() < 0.18 })
    x += w + rnd() * 6
  }
  return out
}

function Skyline({ seed, far = false, ...opts }) {
  const list = buildings(seed, opts)
  return (
    <g>
      {list.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={300 - b.h} width={b.w} height={b.h} fill={far ? SIL_FAR : SIL} />
          {b.spire && <path d={`M${b.x + b.w / 2} ${300 - b.h - 26} L${b.x + b.w / 2 - 3} ${300 - b.h} L${b.x + b.w / 2 + 3} ${300 - b.h} Z`} fill={far ? SIL_FAR : SIL} />}
          {b.windows.map(([wx, wy], j) => (
            <rect key={j} x={wx} y={wy} width="3.2" height="4" fill={j % 7 === 0 ? '#9fc7ff' : '#ffd88a'} opacity={far ? 0.35 : 0.75} />
          ))}
        </g>
      ))}
    </g>
  )
}

function Mountains({ color = SIL_FAR, peaks = [[0, 220], [180, 150], [330, 200], [520, 120], [700, 190], [860, 140], [1000, 210]] }) {
  const d = `M0 300 L${peaks.map(([x, y]) => `${x} ${y}`).join(' L')} L1000 300 Z`
  return <path d={d} fill={color} />
}

function Trees({ seed, y = 300, count = 22, color = SIL, hMin = 30, hMax = 70 }) {
  const rnd = seededRandom(seed)
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i / count) * 1000 + rnd() * 30
        const h = hMin + rnd() * (hMax - hMin)
        return (
          <g key={i}>
            <rect x={x - 2} y={y - h * 0.4} width="4" height={h * 0.4} />
            <ellipse cx={x} cy={y - h * 0.6} rx={h * 0.45} ry={h * 0.4} />
          </g>
        )
      })}
    </g>
  )
}

function Palm({ x, h = 110, flip = 1 }) {
  const top = 300 - h
  return (
    <g fill={SIL} stroke={SIL}>
      <path d={`M${x} 300 Q${x + 10 * flip} ${300 - h / 2} ${x + 4 * flip} ${top}`} strokeWidth="6" fill="none" />
      {[-70, -35, 0, 35, 70, 110, -110].map((a) => (
        <path key={a} d={`M${x + 4 * flip} ${top} q${Math.sin((a * Math.PI) / 180) * 28} ${-Math.cos((a * Math.PI) / 180) * 18 + 12} ${Math.sin((a * Math.PI) / 180) * 52} ${-Math.cos((a * Math.PI) / 180) * 10 + 30}`} strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** หลังคาทรงไทยซ้อนชั้น (ใช้กับศาลา/ประตูเมือง) */
function ThaiRoof({ x, y, w, tiers = 3, color = SIL, lit = true }) {
  const parts = []
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.22)
    const ty = y - i * 22
    parts.push(
      <g key={i}>
        <path d={`M${x - tw / 2} ${ty} L${x - tw / 4} ${ty - 26} L${x + tw / 4} ${ty - 26} L${x + tw / 2} ${ty} Z`} fill={color} />
        {lit && <path d={`M${x - tw / 2} ${ty} L${x - tw / 4} ${ty - 26} L${x + tw / 4} ${ty - 26} L${x + tw / 2} ${ty}`} stroke={GOLD} strokeWidth="1.6" fill="none" opacity="0.85" />}
        {/* ช่อฟ้า */}
        <path d={`M${x - tw / 2} ${ty} q-8 -4 -6 -14`} stroke={lit ? GOLD : color} strokeWidth="2" fill="none" />
        <path d={`M${x + tw / 2} ${ty} q8 -4 6 -14`} stroke={lit ? GOLD : color} strokeWidth="2" fill="none" />
      </g>,
    )
  }
  return <g>{parts}</g>
}

/* ───────── ฉากเฉพาะสถานที่ ───────── */

function Riverfront({ animated }) {
  const cx = 720
  const cy = 165
  const r = 112
  const gondolaColors = ['#ff6fae', '#7fd6ff', '#ffd36b', '#9cff9c', '#ff9a4a', '#c79cff']
  return (
    <g>
      <Skyline seed="bkk-far" far count={40} hMin={50} hMax={150} />
      {/* ชิงช้าสวรรค์ */}
      <path d={`M${cx - 50} 300 L${cx} ${cy} L${cx + 50} 300`} stroke="#22346e" strokeWidth="7" fill="none" />
      <g className={animated ? 'animate-spin-slow' : undefined} style={animated ? { transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px` } : undefined}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffe6a8" strokeWidth="2.5" opacity="0.9" />
        <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke="#ffb55e" strokeWidth="1" opacity="0.7" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2
          const gx = cx + r * Math.cos(a)
          const gy = cy + r * Math.sin(a)
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={gx} y2={gy} stroke="#ffe6a8" strokeWidth="0.8" opacity="0.5" />
              <circle cx={gx} cy={gy} r="4.5" fill={gondolaColors[i % gondolaColors.length]} />
            </g>
          )
        })}
      </g>
      <circle cx={cx} cy={cy} r="7" fill={GOLD} />
      {/* โกดังริมน้ำ */}
      {[60, 230, 400].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 300 L${x} 248 L${x + 75} 228 L${x + 150} 248 L${x + 150} 300 Z`} fill={SIL} />
          {Array.from({ length: 7 }, (_, j) => (
            <rect key={j} x={x + 12 + j * 19} y={262} width="9" height="14" rx="4" fill={j % 2 === i % 2 ? '#ffcf7a' : '#ffb55e'} opacity="0.85" />
          ))}
        </g>
      ))}
      <rect x="0" y="292" width="1000" height="8" fill={SIL} />
    </g>
  )
}

function Bridge() {
  const px = 300
  const top = 60
  const deck = 228
  const cablesL = Array.from({ length: 9 }, (_, i) => 30 + i * 28)
  const cablesR = Array.from({ length: 16 }, (_, i) => 340 + i * 42)
  return (
    <g>
      <Skyline seed="bkk-bridge" far count={38} hMin={40} hMax={120} />
      {/* สายเคเบิล */}
      {cablesL.map((x) => (
        <line key={x} x1={px} y1={top + 30} x2={x} y2={deck} stroke={GOLD} strokeWidth="1.2" opacity="0.75" />
      ))}
      {cablesR.map((x) => (
        <line key={x} x1={px} y1={top + 30} x2={x} y2={deck} stroke={GOLD} strokeWidth="1.2" opacity="0.75" />
      ))}
      {/* เสาสะพานรูปตัว Y คว่ำ */}
      <path d={`M${px - 34} 300 L${px - 6} ${top + 40} L${px - 4} ${top} L${px + 4} ${top} L${px + 6} ${top + 40} L${px + 34} 300 L${px + 22} 300 L${px} ${top + 90} L${px - 22} 300 Z`} fill="#f6e2a8" />
      <path d={`M${px - 4} ${top} L${px + 4} ${top} L${px + 6} ${top + 40} L${px - 6} ${top + 40} Z`} fill="#fff4cf" />
      {/* พื้นสะพาน */}
      <rect x="0" y={deck} width="1000" height="10" fill={SIL} />
      <rect x="0" y={deck} width="1000" height="2.5" fill="#ffd36b" opacity="0.9" />
      {Array.from({ length: 34 }, (_, i) => (
        <circle key={i} cx={i * 30 + 8} cy={deck - 3} r="2" fill="#fff1c2" />
      ))}
      <Trees seed="rama8" y={300} count={26} hMin={18} hMax={40} />
    </g>
  )
}

function Campus() {
  return (
    <g>
      <Skyline seed="chula" far count={30} hMin={40} hMax={140} />
      {/* หอประชุมหลังคาทรงไทย */}
      <rect x="200" y="238" width="260" height="62" fill={SIL} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={214 + i * 27} y="252" width="12" height="30" rx="5" fill="#ffd39a" opacity="0.8" />
      ))}
      <ThaiRoof x={330} y={240} w={300} tiers={3} />
      {/* ศาลาไทยริมสระ */}
      <rect x="640" y="262" width="6" height="38" fill={SIL} />
      <rect x="734" y="262" width="6" height="38" fill={SIL} />
      <ThaiRoof x={690} y={264} w={140} tiers={2} />
      <Trees seed="chula-tree" y={300} count={18} hMin={40} hMax={90} />
      {/* ไฟประดับ (สายไฟระย้า) */}
      {[
        [0, 210, 200],
        [460, 206, 640],
        [740, 214, 1000],
      ].map(([x1, sag, x2], i) => {
        const n = 14
        return (
          <g key={i}>
            <path d={`M${x1} ${sag - 20} Q${(x1 + x2) / 2} ${sag + 20} ${x2} ${sag - 20}`} stroke="#3a4a7a" strokeWidth="1" fill="none" />
            {Array.from({ length: n }, (_, j) => {
              const t = (j + 0.5) / n
              const x = x1 + (x2 - x1) * t
              const y = (1 - t) * (1 - t) * (sag - 20) + 2 * (1 - t) * t * (sag + 20) + t * t * (sag - 20)
              return <circle key={j} cx={x} cy={y + 3} r="2.6" fill={['#ff97b5', '#ffd36b', '#9fd8ff'][j % 3]} />
            })}
          </g>
        )
      })}
    </g>
  )
}

function Prang({ x, h, w, uid }) {
  const base = 300
  const top = base - h
  // พระปรางค์: ฐานกว้าง → เรือนธาตุ → ยอดเรียวแหลม
  const d = `M${x - w / 2} ${base} L${x - w * 0.42} ${base - h * 0.18} L${x - w * 0.3} ${base - h * 0.22} L${x - w * 0.28} ${base - h * 0.48} L${x - w * 0.2} ${base - h * 0.52} C${x - w * 0.2} ${base - h * 0.75} ${x - w * 0.08} ${base - h * 0.88} ${x} ${top} C${x + w * 0.08} ${base - h * 0.88} ${x + w * 0.2} ${base - h * 0.75} ${x + w * 0.2} ${base - h * 0.52} L${x + w * 0.28} ${base - h * 0.48} L${x + w * 0.3} ${base - h * 0.22} L${x + w * 0.42} ${base - h * 0.18} L${x + w / 2} ${base} Z`
  return (
    <g>
      <path d={d} fill={`url(#prang-${uid})`} />
      {[0.2, 0.3, 0.4, 0.56, 0.66, 0.76].map((t) => {
        const half = t < 0.5 ? w * (0.42 - (t - 0.18) * 0.4) : w * (0.2 - (t - 0.52) * 0.45)
        return <line key={t} x1={x - half} y1={base - h * t} x2={x + half} y2={base - h * t} stroke="#8a5a1a" strokeWidth="1.2" opacity="0.6" />
      })}
      <line x1={x} y1={top} x2={x} y2={top - 18} stroke={GOLD} strokeWidth="2" />
    </g>
  )
}

function Temple({ uid }) {
  return (
    <g>
      <Trees seed="arun-far" y={300} count={30} color={SIL_FAR} hMin={30} hMax={60} />
      <Prang x={500} h={270} w={150} uid={uid} />
      <Prang x={330} h={140} w={70} uid={uid} />
      <Prang x={670} h={140} w={70} uid={uid} />
      <Prang x={230} h={95} w={48} uid={uid} />
      <Prang x={770} h={95} w={48} uid={uid} />
      <rect x="150" y="286" width="700" height="14" fill="#3a2a10" />
      <path d="M150 286 L850 286" stroke={GOLD} strokeWidth="2" />
      <Trees seed="arun" y={300} count={10} hMin={30} hMax={56} />
    </g>
  )
}

function Park() {
  return (
    <g>
      <Skyline seed="silom-far" far count={36} hMin={80} hMax={220} wMin={30} wMax={70} />
      <Skyline seed="silom" count={30} hMin={50} hMax={150} wMin={26} wMax={56} />
      <Trees seed="lumphini" y={300} count={26} hMin={34} hMax={70} />
    </g>
  )
}

function CityWall() {
  return (
    <g>
      <Mountains peaks={[[0, 200], [160, 120], [300, 90], [420, 140], [600, 170], [780, 120], [1000, 190]]} />
      <Trees seed="cm" y={300} count={26} color="#0e1c48" hMin={30} hMax={60} />
      {/* กำแพงอิฐ + ใบเสมา */}
      <rect x="0" y="246" width="1000" height="54" fill="#3a1f18" />
      {Array.from({ length: 50 }, (_, i) => (
        <rect key={i} x={i * 20} y="236" width="12" height="12" fill="#3a1f18" />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <line key={i} x1="0" y1={252 + (i % 6) * 8} x2="1000" y2={252 + (i % 6) * 8} stroke="#5a2f22" strokeWidth="0.8" opacity="0.4" />
      ))}
      {/* ประตูท่าแพ */}
      <rect x="430" y="214" width="140" height="86" fill="#40221a" />
      <path d="M470 300 L470 262 Q500 236 530 262 L530 300 Z" fill="#120a08" />
      <ThaiRoof x={500} y={216} w={170} tiers={2} color="#2a1410" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={60 + i * 95} cy="252" r="3" fill="#ffb55e" />
      ))}
    </g>
  )
}

function NorthRiver() {
  return (
    <g>
      <Mountains peaks={[[0, 210], [140, 130], [280, 160], [430, 100], [620, 170], [820, 110], [1000, 200]]} />
      <Skyline seed="cm-town" far count={42} hMin={20} hMax={60} />
      {/* สะพานเหล็กโค้ง */}
      {[
        [80, 480],
        [520, 920],
      ].map(([x1, x2]) => {
        const mid = (x1 + x2) / 2
        return (
          <g key={x1}>
            <path d={`M${x1} 250 Q${mid} 130 ${x2} 250`} stroke="#d9e6ff" strokeWidth="5" fill="none" opacity="0.9" />
            <path d={`M${x1} 250 Q${mid} 150 ${x2} 250`} stroke={GOLD} strokeWidth="2" fill="none" />
            {Array.from({ length: 13 }, (_, i) => {
              const t = (i + 1) / 14
              const x = x1 + (x2 - x1) * t
              const y = (1 - t) * (1 - t) * 250 + 2 * (1 - t) * t * 130 + t * t * 250
              return <line key={i} x1={x} y1={y} x2={x} y2="250" stroke="#d9e6ff" strokeWidth="1.4" opacity="0.7" />
            })}
          </g>
        )
      })}
      <rect x="0" y="250" width="1000" height="8" fill={SIL} />
      {[60, 500, 940].map((x) => (
        <rect key={x} x={x - 12} y="250" width="24" height="50" fill={SIL} />
      ))}
    </g>
  )
}

function Chedi({ x, h, w, candles }) {
  const base = 300
  // เจดีย์ทรงพุ่มข้าวบิณฑ์ (ดอกบัวตูม) แบบสุโขทัย
  return (
    <g fill="#1b2347" stroke={GOLD} strokeOpacity="0.35" strokeWidth="1">
      <rect x={x - w / 2} y={base - h * 0.12} width={w} height={h * 0.12} />
      <rect x={x - w * 0.38} y={base - h * 0.22} width={w * 0.76} height={h * 0.1} />
      <rect x={x - w * 0.24} y={base - h * 0.52} width={w * 0.48} height={h * 0.3} />
      <path d={`M${x - w * 0.24} ${base - h * 0.52} C${x - w * 0.34} ${base - h * 0.66} ${x - w * 0.1} ${base - h * 0.84} ${x} ${base - h * 0.9} C${x + w * 0.1} ${base - h * 0.84} ${x + w * 0.34} ${base - h * 0.66} ${x + w * 0.24} ${base - h * 0.52} Z`} />
      <rect x={x - 2} y={base - h} width="4" height={h * 0.12} />
      <path d={`M${x - w / 2} ${base - h * 0.12} L${x + w / 2} ${base - h * 0.12}`} stroke={GOLD} strokeWidth="1.2" opacity="0.6" />
      {candles &&
        Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={x - w / 2 + 6 + (i * (w - 12)) / 6} cy={base - h * 0.12 - 3} r="2.4" fill="#ffcf6b" />
        ))}
    </g>
  )
}

function Historical({ candles }) {
  return (
    <g>
      <Trees seed="skt-far" y={300} count={20} color={SIL_FAR} hMin={30} hMax={60} />
      <Palm x={90} h={150} />
      <Palm x={940} h={130} flip={-1} />
      <Chedi x={500} h={250} w={130} candles={candles} />
      <Chedi x={340} h={150} w={80} candles={candles} />
      <Chedi x={660} h={150} w={80} candles={candles} />
      {/* แนวเสาวิหารที่เหลือแต่ซาก */}
      {[180, 210, 240, 270, 730, 760, 790, 820].map((x, i) => (
        <rect key={x} x={x} y={300 - 70 - (i % 3) * 8} width="12" height={70 + (i % 3) * 8} fill="#1b2347" />
      ))}
      <rect x="160" y="286" width="680" height="14" fill="#1b2347" />
      {candles &&
        Array.from({ length: 26 }, (_, i) => <circle key={i} cx={170 + i * 26} cy="284" r="2.2" fill="#ffcf6b" />)}
    </g>
  )
}

function Village() {
  return (
    <g>
      <Mountains color="#0e1c48" peaks={[[0, 230], [200, 180], [380, 210], [560, 170], [760, 205], [1000, 180]]} />
      <Trees seed="village" y={300} count={20} color="#0d1a44" hMin={30} hMax={64} />
      <Palm x={140} h={140} />
      <Palm x={190} h={110} flip={-1} />
      <Palm x={860} h={150} flip={-1} />
      {/* บ้านไม้ใต้ถุนสูง */}
      {[
        [420, 1],
        [600, 0.8],
      ].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 300) scale(${s}) translate(0 -300)`}>
          <rect x="-4" y="250" width="5" height="50" fill={SIL} />
          <rect x="96" y="250" width="5" height="50" fill={SIL} />
          <rect x="-8" y="210" width="114" height="44" fill={SIL} />
          <path d="M-20 212 L50 168 L120 212 Z" fill={SIL} />
          <rect x="12" y="222" width="16" height="18" fill="#ffcf7a" opacity="0.9" />
          <rect x="66" y="222" width="16" height="18" fill="#ffb55e" opacity="0.9" />
        </g>
      ))}
    </g>
  )
}

export default function SceneBackdrop({ scene = 'village', animated = false, className, sceneConfig }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const content = {
    riverfront: <Riverfront animated={animated} />,
    bridge: <Bridge />,
    campus: <Campus />,
    temple: <Temple uid={uid} />,
    park: <Park />,
    moat: <CityWall />,
    northRiver: <NorthRiver />,
    historical: <Historical candles={sceneConfig?.candlesOnRuins ?? true} />,
    village: <Village />,
  }[scene] ?? <Village />

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`prang-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset="0.45" stopColor="#f2c75c" />
          <stop offset="1" stopColor="#a8701f" />
        </linearGradient>
      </defs>
      {content}
    </svg>
  )
}
