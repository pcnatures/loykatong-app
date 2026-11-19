import { useEffect, useId, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import {
  colorOf,
  HAIR_COLORS,
  OUTFIT_COLORS,
  SKIN_TONES,
  sanitizeAvatar,
} from '../../config/avatarOptions'
import { darken, lighten } from '../../lib/color'

/*
 * อวตารแบบ SVG ล้วน (ไม่พึ่ง CSS) → ใช้ได้ทั้งในหน้าเว็บ และแปลงเป็นรูปบน Canvas สำหรับการ์ดที่ระลึก
 * viewBox 200 × 300 — เท้าอยู่ที่ y ≈ 288
 *
 * ท่าทาง (pose) กำหนดด้วย "ตำแหน่งมือ" แล้วใช้ 2-bone IK คำนวณข้อศอกให้อัตโนมัติ
 * เมื่อ animated = true จะค่อย ๆ เปลี่ยนท่าอย่างนุ่มนวลด้วย animate() ของ Framer Motion
 */

const GOLD = '#e9bf4f'
const GOLD_DARK = '#a8781f'
const INK = '#2a1a14'
const UPPER = 40
const FORE = 36

const POSES = {
  stand: { lx: -38, ly: 202, rx: 38, ry: 202, sit: 0, lean: 0, wai: 0 },
  hold: { lx: -7, ly: 199, rx: 7, ry: 199, sit: 0, lean: 0, wai: 0 },
  kneel: { lx: -7, ly: 199, rx: 7, ry: 199, sit: 1, lean: 0, wai: 0 },
  place: { lx: 16, ly: 206, rx: 84, ry: 204, sit: 1, lean: 9, wai: 0 },
  wai: { lx: -3, ly: 150, rx: 3, ry: 150, sit: 1, lean: 0, wai: 1 },
  waiStand: { lx: -3, ly: 150, rx: 3, ry: 150, sit: 0, lean: 0, wai: 1 },
}
export const AVATAR_POSES = Object.keys(POSES)

/** ตำแหน่งมือในพิกัด viewBox (ใช้จัดกระทงให้อยู่ในมือพอดี) */
export function handAnchor(pose = 'hold') {
  const p = POSES[pose] ?? POSES.hold
  return { x: 100 + (p.lx + p.rx) / 2, y: (p.ly + p.ry) / 2 + 45 * p.sit }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function ik(S, T, bend) {
  const dx = T[0] - S[0]
  const dy = T[1] - S[1]
  const dist = clamp(Math.hypot(dx, dy), 8, UPPER + FORE - 0.5)
  const base = Math.atan2(dy, dx)
  const cosA = (UPPER * UPPER + dist * dist - FORE * FORE) / (2 * UPPER * dist)
  const ang = base + bend * Math.acos(clamp(cosA, -1, 1))
  return {
    elbow: [S[0] + UPPER * Math.cos(ang), S[1] + UPPER * Math.sin(ang)],
    hand: [S[0] + dist * Math.cos(base), S[1] + dist * Math.sin(base)],
  }
}

const lerpPt = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const pts = (...p) => p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`)

function usePose(pose, animated) {
  const target = POSES[pose] ?? POSES.stand
  const [cur, setCur] = useState(target)
  const ref = useRef(target)
  useEffect(() => {
    if (!animated) {
      ref.current = target
      setCur(target)
      return
    }
    const from = ref.current
    const controls = animate(0, 1, {
      duration: 0.75,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (t) => {
        const v = {}
        for (const k of Object.keys(target)) v[k] = from[k] + (target[k] - from[k]) * t
        ref.current = v
        setCur(v)
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, animated])
  return animated ? cur : target
}

/* ───────────────────────── รูปหน้า ───────────────────────── */
const FACE_PATHS = {
  oval: 'M70 74 C70 44 130 44 130 74 C130 96 116 110 100 110 C84 110 70 96 70 74 Z',
  round: 'M67 76 C67 42 133 42 133 76 C133 98 118 108 100 108 C82 108 67 98 67 76 Z',
  heart: 'M68 70 C68 42 132 42 132 70 C132 88 118 104 100 111 C82 104 68 88 68 70 Z',
  square: 'M69 66 C69 44 131 44 131 66 L131 88 C131 102 116 108 100 108 C84 108 69 102 69 88 Z',
}

function Face({ g, skin, hair, face }) {
  const shade = darken(skin, 0.14)
  const brow = darken(hair, 0.1)
  return (
    <g>
      <ellipse cx="68" cy="80" rx="5.5" ry="8" fill={shade} />
      <ellipse cx="132" cy="80" rx="5.5" ry="8" fill={shade} />
      <path d={FACE_PATHS[face] ?? FACE_PATHS.oval} fill={skin} />
      {/* แก้มแดงระเรื่อ */}
      <ellipse cx="82" cy="92" rx="7" ry="4" fill="#ff7d7d" opacity="0.32" />
      <ellipse cx="118" cy="92" rx="7" ry="4" fill="#ff7d7d" opacity="0.32" />
      {/* คิ้ว */}
      {g === 'male' ? (
        <>
          <path d="M80 70 Q87 66 94 69" stroke={brow} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M106 69 Q113 66 120 70" stroke={brow} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M80 70 Q87 65.5 94 68.5" stroke={brow} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M106 68.5 Q113 65.5 120 70" stroke={brow} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      )}
      {/* ตา */}
      <ellipse cx="87" cy="80" rx="3.8" ry="4.6" fill={INK} />
      <ellipse cx="113" cy="80" rx="3.8" ry="4.6" fill={INK} />
      <circle cx="88.4" cy="78.3" r="1.4" fill="#fff" />
      <circle cx="114.4" cy="78.3" r="1.4" fill="#fff" />
      {g === 'female' && (
        <>
          <path d="M83.2 77.4 L80.4 75.4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M116.8 77.4 L119.6 75.4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {/* จมูก + ปาก */}
      <path d="M99 86 Q101 90 98.5 91" stroke={darken(skin, 0.28)} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {g === 'female' ? (
        <path d="M93 96.5 Q100 103 107 96.5 Q100 99 93 96.5 Z" fill="#d9536b" />
      ) : (
        <path d="M93.5 96.5 Q100 101.5 106.5 96.5" stroke="#a5443e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
    </g>
  )
}

/* ───────────────────────── ทรงผม ───────────────────────── */
// ชั้นหลัง (อยู่หลังลำตัว/ใบหน้า)
function HairBack({ style, color }) {
  const shade = darken(color, 0.25)
  switch (style) {
    case 'long':
      return <path d="M64 74 C58 26 142 26 136 74 L141 150 Q121 162 100 157 Q79 162 59 150 Z" fill={shade} />
    case 'bob':
      return <path d="M63 76 C58 30 142 30 137 76 L139 110 Q128 118 118 112 L82 112 Q72 118 61 110 Z" fill={shade} />
    case 'ponytail':
      return (
        <g fill={shade}>
          <ellipse cx="100" cy="66" rx="35" ry="31" />
          <path d="M126 50 C150 56 150 96 140 136 Q136 146 130 138 C138 108 136 78 122 62 Z" />
        </g>
      )
    case 'bun':
      return <ellipse cx="100" cy="66" rx="35" ry="31" fill={shade} />
    default:
      return null
  }
}

// ชั้นหน้า (ไรผม/หน้าม้า) + เครื่องประดับผม
function HairFront({ style, color, festive, uid }) {
  const fill = `url(#hair-${uid})`
  switch (style) {
    case 'bun':
      return (
        <g>
          <circle cx="100" cy="33" r="15" fill={fill} />
          <path d="M66 80 C62 40 138 40 134 80 C128 62 114 54 100 56 C86 54 72 62 66 80 Z" fill={fill} />
          {/* พวงมาลัยมะลิรอบมวย */}
          {[...Array(9)].map((_, i) => {
            const a = Math.PI * (0.95 + (i / 8) * 1.1)
            return <circle key={i} cx={100 + 16 * Math.cos(a)} cy={36 + 9 * Math.sin(a) + 6} r="2.6" fill="#fffaf0" stroke="#f0d98a" strokeWidth="0.6" />
          })}
          {festive && (
            <g>
              <path d="M112 22 L126 12" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="127" cy="11" r="3.4" fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.8" />
            </g>
          )}
        </g>
      )
    case 'long':
      return <path d="M65 84 C60 38 140 38 135 84 C130 64 118 54 106 54 C96 64 80 66 70 70 C68 74 66 78 65 84 Z" fill={fill} />
    case 'bob':
      return <path d="M64 84 C60 36 140 36 136 84 L134 72 Q120 62 100 64 Q80 62 66 72 Z" fill={fill} />
    case 'ponytail':
      return (
        <g>
          <path d="M66 80 C62 40 138 40 134 80 C128 62 114 54 100 56 C86 54 72 62 66 80 Z" fill={fill} />
          <circle cx="128" cy="56" r="4" fill={festive ? GOLD : '#e0709a'} />
        </g>
      )
    case 'short':
      return <path d="M67 78 C62 36 138 36 133 78 C130 64 124 58 116 56 C104 61 84 61 72 63 C70 67 68 72 67 78 Z" fill={fill} />
    case 'quiff':
      return <path d="M67 78 C61 44 78 25 104 27 C128 28 141 46 133 78 C130 62 122 52 108 54 C94 48 76 56 67 78 Z" fill={fill} />
    default:
      return null
  }
}

/* ───────────────────────── ช่วงล่าง ───────────────────────── */
function Lower({ kind, color, wh, uid }) {
  const dark = darken(color, 0.25)
  const shoe = '#3a2418'
  const L = 100 - wh
  const R = 100 + wh
  switch (kind) {
    case 'skirtLong': // ผ้าซิ่น
      return (
        <g>
          <ellipse cx="91" cy="287" rx="7" ry="3.5" fill={shoe} />
          <ellipse cx="109" cy="287" rx="7" ry="3.5" fill={shoe} />
          <path d={`M${L} 198 L${R} 198 L${R + 9} 285 L${L - 9} 285 Z`} fill={`url(#silk-${uid})`} />
          <path d={`M${L} 198 L${R} 198 L${R + 9} 285 L${L - 9} 285 Z`} fill={`url(#motif-${uid})`} opacity="0.55" />
          {/* จีบหน้านาง */}
          <path d="M94 200 L106 200 L109 284 L91 284 Z" fill={lighten(color, 0.12)} />
          <path d="M98 202 L97 284 M102 202 L103 284" stroke={dark} strokeWidth="0.9" opacity="0.6" />
          {/* เชิงผ้าทอง */}
          <path d={`M${L - 7} 268 L${R + 7} 268 L${R + 9} 285 L${L - 9} 285 Z`} fill={GOLD} />
          <path d={`M${L - 7} 272 L${R + 7} 272`} stroke={GOLD_DARK} strokeWidth="1.2" strokeDasharray="3 2" />
        </g>
      )
    case 'skirtMidi':
      return (
        <g>
          <rect x="86" y="246" width="9" height="36" rx="4" fill={`url(#leg-${uid})`} />
          <rect x="105" y="246" width="9" height="36" rx="4" fill={`url(#leg-${uid})`} />
          <ellipse cx="90" cy="286" rx="7.5" ry="3.8" fill="#f4f1ea" />
          <ellipse cx="110" cy="286" rx="7.5" ry="3.8" fill="#f4f1ea" />
          <path d={`M${L} 198 L${R} 198 L${R + 14} 254 Q100 262 ${L - 14} 254 Z`} fill={color} />
          <path d={`M90 204 L84 254 M110 204 L116 254 M100 204 L100 258`} stroke={dark} strokeWidth="0.9" opacity="0.5" />
        </g>
      )
    case 'jongkraben': // โจงกระเบน
      return (
        <g>
          <rect x="83" y="246" width="12" height="36" rx="4" fill="#f6f3ec" />
          <rect x="105" y="246" width="12" height="36" rx="4" fill="#f6f3ec" />
          <ellipse cx="88" cy="286" rx="8.5" ry="4" fill="#1c140f" />
          <ellipse cx="112" cy="286" rx="8.5" ry="4" fill="#1c140f" />
          <path
            d={`M${L} 198 L${R} 198 C${R + 10} 220 ${R + 12} 244 ${R + 4} 254 Q110 260 101.5 250 L100 222 L98.5 250 Q90 260 ${L - 4} 254 C${L - 12} 244 ${L - 10} 220 ${L} 198 Z`}
            fill={`url(#silk-${uid})`}
          />
          <path d={`M${L - 4} 250 Q90 257 98.5 248 M101.5 248 Q110 257 ${R + 4} 250`} stroke={GOLD} strokeWidth="2" fill="none" />
          <path d="M100 204 C96 214 96 222 100 228" stroke={dark} strokeWidth="1.2" fill="none" opacity="0.6" />
        </g>
      )
    case 'jeans':
    case 'trousers': {
      const c = kind === 'jeans' ? '#35558f' : color
      const d = darken(c, 0.2)
      return (
        <g>
          <ellipse cx="88" cy="286" rx="9" ry="4" fill={kind === 'jeans' ? '#f4f1ea' : '#1c140f'} />
          <ellipse cx="112" cy="286" rx="9" ry="4" fill={kind === 'jeans' ? '#f4f1ea' : '#1c140f'} />
          <path d={`M${L} 198 L${R} 198 L${R + 2} 283 L102 283 L100 214 L98 283 L${L - 2} 283 Z`} fill={c} />
          <path d={`M${L + 4} 204 L${L + 2} 283 M${R - 4} 204 L${R - 2} 283`} stroke={d} strokeWidth="1" opacity="0.6" />
          {kind === 'jeans' && <path d={`M${L} 204 L${R} 204`} stroke="#c9a05a" strokeWidth="1" strokeDasharray="2 2" />}
        </g>
      )
    }
    default:
      return null
  }
}

/* ───────────────────────── เสื้อ ───────────────────────── */
function Upper({ outfit, g, color, skin, sh, wh, uid }) {
  const dark = darken(color, 0.22)
  const torso = `M${100 - sh} 130 Q${100 - sh} 122 ${100 - sh + 10} 121 L${100 + sh - 10} 121 Q${100 + sh} 122 ${100 + sh} 130 L${100 + wh} 200 L${100 - wh} 200 Z`
  const neck = (
    <g>
      <rect x="91" y="100" width="18" height="26" rx="6" fill={skin} />
      <path d="M91 108 Q100 116 109 108 L109 112 Q100 119 91 112 Z" fill={darken(skin, 0.15)} />
    </g>
  )

  if (outfit === 'chakri') {
    if (g === 'male') {
      return (
        <g>
          {neck}
          <path d={torso} fill="#f3e6c8" />
          <path d="M92 121 Q100 129 108 121" stroke="#d8c59c" strokeWidth="2" fill="none" />
          {/* ผ้าเบี่ยงพาดไหล่ */}
          <path d={`M${100 + sh - 12} 120 L${100 + sh} 128 L${100 - wh + 6} 202 L${100 - wh - 6} 196 Z`} fill={`url(#silk-${uid})`} />
          <path d={`M${100 + sh - 12} 120 L${100 + sh} 128 L${100 - wh + 6} 202 L${100 - wh - 6} 196 Z`} fill={`url(#motif-${uid})`} />
          <rect x={100 - wh - 1} y="194" width={wh * 2 + 2} height="8" rx="2" fill={GOLD} />
        </g>
      )
    }
    return (
      <g>
        {neck}
        {/* ไหล่เปลือย */}
        <path d={`M${100 - sh} 132 Q${100 - sh} 121 ${100 - sh + 12} 120 L${100 + sh - 12} 120 Q${100 + sh} 121 ${100 + sh} 132 L${100 + sh - 4} 142 L${100 - sh + 4} 142 Z`} fill={skin} />
        {/* สร้อยคอทอง */}
        <path d="M89 118 Q100 134 111 118" stroke={GOLD} strokeWidth="2.2" fill="none" />
        <path d="M100 128 L103.5 132.5 L100 137 L96.5 132.5 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.6" />
        {/* ตัวเสื้อเกาะอก */}
        <path d={`M${100 - sh + 3} 140 Q100 135 ${100 + sh - 3} 140 L${100 + wh} 200 L${100 - wh} 200 Z`} fill={`url(#silk-${uid})`} />
        {/* สไบพาดไหล่ */}
        <path d={`M${100 + sh - 14} 118 L${100 + sh + 1} 127 L${100 - wh + 8} 203 L${100 - wh - 8} 197 Z`} fill={lighten(color, 0.1)} />
        <path d={`M${100 + sh - 14} 118 L${100 + sh + 1} 127 L${100 - wh + 8} 203 L${100 - wh - 8} 197 Z`} fill={`url(#motif-${uid})`} />
        <path d={`M${100 + sh - 14} 118 L${100 - wh - 8} 197 M${100 + sh + 1} 127 L${100 - wh + 8} 203`} stroke={GOLD} strokeWidth="1.6" />
        {/* เข็มขัดทอง */}
        <rect x={100 - wh - 1} y="193" width={wh * 2 + 2} height="8" rx="2" fill={GOLD} />
        <ellipse cx="100" cy="197" rx="7" ry="5.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
      </g>
    )
  }

  if (outfit === 'rajpattern') {
    return (
      <g>
        {neck}
        <path d={torso} fill={`url(#silk-${uid})`} />
        {/* คอตั้ง */}
        <path d="M89 113 L111 113 L112 126 Q100 130 88 126 Z" fill={lighten(color, 0.08)} stroke={dark} strokeWidth="0.8" />
        <path d="M100 128 L100 200" stroke={dark} strokeWidth="1" />
        {[138, 151, 164, 177, 190].map((y) => (
          <circle key={y} cx="100" cy={y} r="2.6" fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.6" />
        ))}
        <path d={`M${100 - sh + 10} 172 L${100 - 12} 172 M${100 + 12} 172 L${100 + sh - 10} 172`} stroke={dark} strokeWidth="1" opacity="0.6" />
      </g>
    )
  }

  if (outfit === 'prayuk') {
    return (
      <g>
        {neck}
        <path d={torso} fill={`url(#silk-${uid})`} />
        {g === 'female' ? (
          <path d="M86 121 Q100 142 114 121" stroke={GOLD} strokeWidth="4" fill={skin} />
        ) : (
          <>
            <path d="M90 116 L110 116 L110 124 Q100 127 90 124 Z" fill={lighten(color, 0.1)} />
            <rect x="96" y="126" width="8" height="74" fill={`url(#motif-${uid})`} />
            <path d="M96 126 L96 200 M104 126 L104 200" stroke={GOLD} strokeWidth="1.2" />
          </>
        )}
        <path d={`M${100 - wh - 1} 190 L${100 + wh + 1} 190 L${100 + wh} 200 L${100 - wh} 200 Z`} fill={`url(#motif-${uid})`} />
        <path d={`M${100 - wh - 1} 190 L${100 + wh + 1} 190`} stroke={GOLD} strokeWidth="1.5" />
      </g>
    )
  }

  // casual: เสื้อยืดลายกระทงเล็ก ๆ
  return (
    <g>
      {neck}
      <path d={torso} fill={color} />
      <path d="M90 121 Q100 132 110 121" stroke={dark} strokeWidth="2.4" fill="none" />
      <g transform="translate(100 162) scale(0.9)">
        <path d="M-12 2 Q0 12 12 2 L8 -3 L4 2 L0 -5 L-4 2 L-8 -3 Z" fill={GOLD} opacity="0.9" />
        <path d="M0 -14 Q3 -10 0 -7 Q-3 -10 0 -14 Z" fill="#ffd36b" />
      </g>
    </g>
  )
}

function lowerKind(outfit, g) {
  if (outfit === 'chakri') return g === 'male' ? 'jongkraben' : 'skirtLong'
  if (outfit === 'rajpattern') return g === 'female' ? 'skirtLong' : 'jongkraben'
  if (outfit === 'prayuk') return g === 'female' ? 'skirtLong' : 'trousers'
  return g === 'female' ? 'skirtMidi' : 'jeans'
}

function sleeveOf(outfit, g) {
  if (outfit === 'chakri') return g === 'male' ? 'long' : 'none'
  if (outfit === 'rajpattern') return 'long'
  if (outfit === 'prayuk') return g === 'female' ? 'mid' : 'short'
  return 'short'
}

/* ───────────────────────── คอมโพเนนต์หลัก ───────────────────────── */
export default function Avatar({ avatar: input, pose = 'stand', animated = false, shadow = true, className, title }) {
  const a = sanitizeAvatar(input)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const p = usePose(pose, animated)

  const skin = colorOf(SKIN_TONES, a.skin)
  const hair = colorOf(HAIR_COLORS, a.hairColor)
  const color = colorOf(OUTFIT_COLORS, a.outfitColor)
  const g = a.gender
  const sh = g === 'male' ? 37 : g === 'female' ? 31 : 34
  const wh = g === 'male' ? 29 : g === 'female' ? 22 : 26
  const festive = a.outfit === 'chakri' || a.outfit === 'rajpattern'

  const lowerColor = a.outfit === 'rajpattern' ? (a.outfitColor === 'royal' ? '#1b2457' : darken(color, 0.45)) : a.outfit === 'chakri' ? darken(color, 0.2) : a.outfit === 'prayuk' && g !== 'female' ? '#2a2a3a' : color
  const lower = lowerKind(a.outfit, g)
  const sleeve = sleeveOf(a.outfit, g)
  const sleeveColor = a.outfit === 'chakri' ? '#f3e6c8' : color

  // แขน
  const SL = [100 - sh + 7, 131]
  const SR = [100 + sh - 7, 131]
  const left = ik(SL, [100 + p.lx, p.ly], 1)
  const right = ik(SR, [100 + p.rx, p.ry], -1)
  const armW = g === 'male' ? 13 : 11.5

  const sit = p.sit
  const bodyY = 45 * sit

  const arm = (S, { elbow, hand }, key) => {
    const sleevePath =
      sleeve === 'long'
        ? `M${pts(S, elbow, lerpPt(elbow, hand, 0.82)).join(' L')}`
        : sleeve === 'mid'
          ? `M${pts(S, elbow, lerpPt(elbow, hand, 0.25)).join(' L')}`
          : sleeve === 'short'
            ? `M${pts(S, lerpPt(S, elbow, 0.6)).join(' L')}`
            : null
    return (
      <g key={key}>
        <path d={`M${pts(S, elbow, hand).join(' L')}`} stroke={skin} strokeWidth={armW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {sleevePath && (
          <path d={sleevePath} stroke={sleeveColor} strokeWidth={armW + 2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {sleeve === 'none' && (
          <circle cx={lerpPt(S, elbow, 0.5)[0]} cy={lerpPt(S, elbow, 0.5)[1]} r={armW / 2 + 0.8} fill="none" stroke={GOLD} strokeWidth="2.2" />
        )}
        {festive && sleeve !== 'long' && (
          <circle cx={lerpPt(elbow, hand, 0.8)[0]} cy={lerpPt(elbow, hand, 0.8)[1]} r={armW / 2 + 0.6} fill="none" stroke={GOLD} strokeWidth="2" />
        )}
        <circle cx={hand[0]} cy={hand[1]} r={armW / 2 + 1.2} fill={skin} opacity={1 - p.wai} />
      </g>
    )
  }

  const wx = (left.hand[0] + right.hand[0]) / 2
  const wy = (left.hand[1] + right.hand[1]) / 2

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 300"
      className={className}
      role="img"
      aria-label={title ?? 'อวตาร'}
    >
      <defs>
        <linearGradient id={`silk-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lighten(color, 0.18)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={darken(color, 0.25)} />
        </linearGradient>
        <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(hair, 0.15)} />
          <stop offset="1" stopColor={hair} />
        </linearGradient>
        <pattern id={`motif-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M5 1 L8 5 L5 9 L2 5 Z" fill={GOLD} opacity="0.7" />
          <circle cx="0" cy="0" r="1" fill={GOLD} opacity="0.8" />
          <circle cx="10" cy="10" r="1" fill={GOLD} opacity="0.8" />
        </pattern>
        <linearGradient id={`leg-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={darken(skin, 0.08)} />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
      </defs>
      {title && <title>{title}</title>}

      {shadow && <ellipse cx="100" cy="290" rx={46 + 14 * sit} ry="6" fill="#000" opacity="0.28" />}

      <g transform={`translate(0 ${bodyY.toFixed(2)})`}>
        <g transform={`translate(100 198) scale(${(1 + 0.32 * sit).toFixed(3)} ${(1 - 0.5 * sit).toFixed(3)}) translate(-100 -198)`}>
          <Lower kind={lower} color={lowerColor} wh={wh} uid={uid} />
        </g>

        <g transform={`rotate(${p.lean.toFixed(2)} 100 198)`}>
          <HairBack style={a.hair} color={hair} />
          <Upper outfit={a.outfit} g={g} color={color} skin={skin} sh={sh} wh={wh} uid={uid} />
          <Face g={g} skin={skin} hair={hair} face={a.face} />
          <HairFront style={a.hair} color={hair} festive={festive} uid={uid} />
          {(g === 'female' || festive) && g !== 'male' && (
            <g fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.5">
              <path d="M68 87 L70.5 93 L68 97 L65.5 93 Z" />
              <path d="M132 87 L134.5 93 L132 97 L129.5 93 Z" />
            </g>
          )}
          {arm(SL, left, 'L')}
          {arm(SR, right, 'R')}
          {p.wai > 0.01 && (
            <path
              d={`M${wx} ${wy - 15} C${wx + 7} ${wy - 8} ${wx + 7} ${wy + 6} ${wx} ${wy + 9} C${wx - 7} ${wy + 6} ${wx - 7} ${wy - 8} ${wx} ${wy - 15} Z`}
              fill={skin}
              stroke={darken(skin, 0.18)}
              strokeWidth="1"
              opacity={p.wai}
            />
          )}
        </g>
      </g>
    </svg>
  )
}
