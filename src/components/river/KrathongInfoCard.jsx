import { forwardRef } from 'react'
import Avatar from '../avatar/Avatar'
import { KRATHONG_TYPES, labelOf } from '../../config/krathongOptions'
import { timeAgo } from '../../lib/thaiText'

/** การ์ดที่ลอยขึ้นมาเมื่อชี้/แตะกระทง: อวตาร + ชื่อ + คำอธิษฐาน */
const KrathongInfoCard = forwardRef(function KrathongInfoCard({ rec, mine, now, onClose }, ref) {
  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-[2000] w-[min(270px,80vw)]" style={{ transform: 'translate(-9999px, 0)' }}>
      {rec && (
        <div className="glass pointer-events-auto rounded-2xl border border-gold-400/40 p-3 shadow-2xl shadow-black/60">
          <div className="flex items-start gap-3">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-night-700/60 ring-1 ring-gold-400/30">
              <Avatar avatar={rec.avatar} pose="waiStand" shadow={false} className="h-full w-full scale-[1.35] translate-y-[16%]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium text-gold-200">{rec.name}</p>
                {mine && <span className="rounded-full bg-gold-400 px-1.5 text-[10px] text-night-950">ของคุณ</span>}
                {rec.demo && <span className="rounded-full bg-night-600 px-1.5 text-[10px] text-gold-100/80">ตัวอย่าง</span>}
              </div>
              <p className="text-[11px] text-gold-100/60">
                {labelOf(KRATHONG_TYPES, rec.krathong.type)} · {timeAgo(now() - rec.createdAt)}
              </p>
            </div>
            {onClose && (
              <button type="button" onClick={onClose} className="-mr-1 -mt-1 rounded-full p-1 text-gold-100/60 hover:text-gold-100" aria-label="ปิด">
                ✕
              </button>
            )}
          </div>
          {rec.wish ? (
            <p className="mt-2 rounded-xl bg-night-950/40 px-3 py-2 text-sm leading-relaxed text-gold-100 [overflow-wrap:anywhere]">
              <span className="text-gold-400">“</span>
              {rec.wish}
              <span className="text-gold-400">”</span>
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-gold-100/50">อธิษฐานอยู่ในใจ</p>
          )}
        </div>
      )}
    </div>
  )
})

export default KrathongInfoCard
