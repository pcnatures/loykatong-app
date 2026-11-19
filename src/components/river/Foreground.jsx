/** ท่าน้ำไม้ (ที่อวตารยืน) และใบบัวด้านหน้า เพื่อเพิ่มมิติความลึก */
export function Pier({ layout: L }) {
  if (!L.W) return null
  const w = L.pierRight
  const h = L.H - L.pierTop
  const planks = 7
  return (
    <svg className="pointer-events-none absolute left-0" style={{ top: L.pierTop, width: w + 12, height: h + 2 }} viewBox={`0 0 ${w + 12} ${h + 2}`} aria-hidden="true">
      <defs>
        <linearGradient id="pier-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4426" />
          <stop offset="1" stopColor="#3b2414" />
        </linearGradient>
      </defs>
      {/* เสาท่าน้ำ */}
      {[w * 0.15, w * 0.55, w - 6].map((x, i) => (
        <rect key={i} x={x} y={h * 0.25} width="7" height={h} fill="#2a190e" />
      ))}
      <path d={`M0 0 L${w} 0 L${w + 10} ${h * 0.42} L0 ${h * 0.42} Z`} fill="url(#pier-wood)" />
      {Array.from({ length: planks }, (_, i) => (
        <line key={i} x1={(i * w) / planks} y1="0" x2={(i * (w + 10)) / planks} y2={h * 0.42} stroke="#2a190e" strokeWidth="1.2" opacity="0.7" />
      ))}
      <path d={`M0 0 L${w} 0`} stroke="#c58a4f" strokeWidth="2" opacity="0.7" />
      <rect x="0" y={h * 0.42} width={w + 10} height="5" fill="#24150b" />
    </svg>
  )
}

/** ตะเกียงริมท่าน้ำให้แสงอุ่น ๆ */
export function PierLamp({ layout: L }) {
  if (!L.W) return null
  const x = Math.max(4, L.aLeft * 0.4)
  const lampH = L.aH * 0.9
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: L.pierTop - lampH + 4, width: 14, height: lampH }}>
      <div className="absolute bottom-0 left-1/2 h-full w-[3px] -translate-x-1/2 bg-[#2a190e]" />
      <div className="absolute left-1/2 top-0 h-5 w-4 -translate-x-1/2 rounded-sm bg-gradient-to-b from-gold-200 to-ember-500 shadow-[0_0_24px_10px_rgba(255,170,80,0.45)]" />
    </div>
  )
}

export function LotusLeaves({ layout: L }) {
  if (!L.W) return null
  const s = Math.min(L.W, L.H) * 0.22
  return (
    <svg className="pointer-events-none absolute bottom-0 right-0" style={{ width: s * 1.6, height: s * 0.7, zIndex: 950 }} viewBox="0 0 160 70" aria-hidden="true">
      <ellipse cx="110" cy="56" rx="48" ry="12" fill="#1f5232" />
      <path d="M110 56 L158 52" stroke="#0f2f1c" strokeWidth="2" />
      <ellipse cx="62" cy="64" rx="34" ry="8" fill="#246039" />
      <path d="M62 64 L30 62" stroke="#123a22" strokeWidth="1.6" />
      <path d="M128 50 C126 30 138 22 134 10 C142 22 146 34 138 50 Z" fill="#ff9fbe" />
      <path d="M134 50 C126 34 128 22 120 14 C132 20 140 34 136 50 Z" fill="#ffc2d3" />
      <path d="M126 48 L127 58" stroke="#1f5232" strokeWidth="2" />
    </svg>
  )
}
