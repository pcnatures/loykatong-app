import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { checkProfanity } from '../../lib/profanity'
import { clampChars, countChars } from '../../lib/thaiText'
import { NAME_MAX, WISH_MAX } from '../../realtime/schema'

const IDEAS = [
  'ขอให้ครอบครัวมีสุขภาพแข็งแรง',
  'ขอให้การงานราบรื่น ประสบความสำเร็จ',
  'ขอให้สอบผ่านทุกวิชา',
  'ขอขมาพระแม่คงคา ขอให้สิ่งไม่ดีลอยไปกับสายน้ำ',
  'ขอให้รักครั้งนี้มั่นคงตลอดไป',
]

export default function WishForm({ name, onName, wish, onWish }) {
  const nameCheck = useMemo(() => checkProfanity(name), [name])
  const wishCheck = useMemo(() => checkProfanity(wish), [wish])
  const wishLen = countChars(wish)
  const flagged = !nameCheck.clean || !wishCheck.clean

  return (
    <div className="space-y-5">
      <label className="block space-y-2">
        <span className="flex items-baseline justify-between text-sm text-gold-200">
          ชื่อผู้ลอย <span className="text-[11px] text-gold-100/50">{countChars(name)}/{NAME_MAX}</span>
        </span>
        <input
          value={name}
          onChange={(e) => onName(clampChars(e.target.value, NAME_MAX))}
          placeholder="ชื่อที่จะแสดงบนกระทง"
          autoComplete="nickname"
          className="w-full rounded-2xl border border-gold-400/30 bg-night-950/60 px-4 py-3 text-gold-100 outline-none placeholder:text-gold-100/35 focus:border-gold-300"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-baseline justify-between text-sm text-gold-200">
          คำอธิษฐาน
          <span className={`text-[11px] ${wishLen >= WISH_MAX ? 'text-ember-400' : 'text-gold-100/50'}`}>
            {wishLen}/{WISH_MAX}
          </span>
        </span>
        <textarea
          value={wish}
          rows={4}
          onChange={(e) => onWish(clampChars(e.target.value, WISH_MAX))}
          placeholder="อธิษฐานในใจ หรือพิมพ์ไว้ให้ทุกคนเห็นก็ได้…"
          className="w-full resize-none rounded-2xl border border-gold-400/30 bg-night-950/60 px-4 py-3 leading-relaxed text-gold-100 outline-none placeholder:text-gold-100/35 focus:border-gold-300"
        />
        <div className="h-1 overflow-hidden rounded-full bg-night-700">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-ember-400 transition-all" style={{ width: `${(wishLen / WISH_MAX) * 100}%` }} />
        </div>
      </label>

      <AnimatePresence>
        {flagged && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl border border-ember-400/40 bg-ember-500/10 p-3 text-sm text-ember-300"
            role="status"
          >
            <p>🙏 พบถ้อยคำที่ไม่สุภาพ ระบบจะแทนที่ด้วย ✿ ก่อนลอยกระทงนะ</p>
            <p className="mt-1 text-xs text-gold-100/70">
              ตัวอย่างที่จะแสดง: <span className="text-gold-100">{[!nameCheck.clean && nameCheck.masked, !wishCheck.clean && wishCheck.masked].filter(Boolean).join(' · ')}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <p className="text-xs text-gold-100/55">ไม่รู้จะอธิษฐานอะไร? แตะเพื่อเลือก</p>
        <div className="flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => onWish(clampChars(idea, WISH_MAX))}
              className="rounded-full border border-gold-400/20 bg-night-900/60 px-3 py-1 text-xs text-gold-100/80 hover:border-gold-400/60"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
