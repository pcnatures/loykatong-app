import { AnimatePresence, motion } from 'framer-motion'
import AvatarEditor from '../avatar/AvatarEditor'
import KrathongPicker from '../krathong/KrathongPicker'
import WishForm from '../wish/WishForm'
import Avatar from '../avatar/Avatar'
import Krathong from '../krathong/Krathong'

const STEPS = [
  { id: 'avatar', label: 'อวตาร' },
  { id: 'krathong', label: 'กระทง' },
  { id: 'wish', label: 'อธิษฐาน' },
]

/**
 * แผงปรับแต่ง 3 ขั้นตอน + สถานะระหว่างลอย + หน้าสำเร็จ
 * stage: 'edit' | 'releasing' | 'done'
 */
export default function CustomizePanel({
  stage,
  step,
  setStep,
  avatar,
  setAvatar,
  krathong,
  setKrathong,
  name,
  setName,
  wish,
  setWish,
  onRelease,
  onSouvenir,
  onAgain,
  onChangeLocation,
  location,
  error,
  className = '',
}) {
  return (
    <section className={`thai-frame glass flex flex-col rounded-3xl ${className}`} aria-label="ปรับแต่งก่อนลอยกระทง">
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'edit' && (
          <motion.div key="edit" className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <nav className="flex gap-1 border-b border-gold-400/15 p-2" aria-label="ขั้นตอน">
              {STEPS.map((s, i) => {
                const on = i === step
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={on ? 'step' : undefined}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-sm transition ${on ? 'bg-gold-400/15 text-gold-200' : 'text-gold-100/60 hover:text-gold-100'}`}
                  >
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${on ? 'bg-gold-400 text-night-950' : i < step ? 'bg-gold-600/60 text-night-950' : 'border border-gold-400/30'}`}>
                      {i < step ? '✓' : i + 1}
                    </span>
                    {s.label}
                  </button>
                )
              })}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                  {step === 0 && <AvatarEditor avatar={avatar} onChange={setAvatar} />}
                  {step === 1 && <KrathongPicker krathong={krathong} onChange={setKrathong} />}
                  {step === 2 && <WishForm name={name} onName={setName} wish={wish} onWish={setWish} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 border-t border-gold-400/15 p-3 sm:p-4">
              {step > 0 && (
                <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
                  ← ย้อนกลับ
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn-gold ml-auto" onClick={() => setStep(step + 1)}>
                  ถัดไป →
                </button>
              ) : (
                <button type="button" className="btn-gold ml-auto flex-1 text-base" disabled={!name.trim()} onClick={onRelease}>
                  🪷 ลอยกระทง
                </button>
              )}
            </div>
            {step === STEPS.length - 1 && !name.trim() && <p className="-mt-2 px-4 pb-3 text-right text-xs text-gold-100/50">กรอกชื่อผู้ลอยก่อนนะ</p>}
            {error && <p className="px-4 pb-3 text-sm text-rose-300">{error}</p>}
          </motion.div>
        )}

        {stage === 'releasing' && (
          <motion.div key="releasing" className="grid flex-1 place-items-center p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div>
              <motion.div className="mx-auto h-24 w-28" animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Krathong krathong={krathong} animated className="h-full w-full" />
              </motion.div>
              <p className="mt-4 font-display text-3xl text-gold-200">กำลังลอยกระทง…</p>
              <p className="mt-1 text-sm text-gold-100/60">ตั้งจิตอธิษฐาน แล้วปล่อยให้สายน้ำพาไป</p>
            </div>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" className="flex flex-1 flex-col items-center gap-4 p-6 text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-end justify-center gap-1">
              <div className="h-32 w-24">
                <Avatar avatar={avatar} pose="waiStand" className="h-full w-full" />
              </div>
              <div className="h-20 w-24">
                <Krathong krathong={krathong} animated className="h-full w-full" />
              </div>
            </div>
            <div>
              <p className="font-display text-4xl text-gold-200">ลอยกระทงสำเร็จ</p>
              <p className="mt-1 text-sm text-gold-100/70">
                กระทงของ <b className="font-medium text-gold-200">{name}</b> กำลังลอยอยู่ที่ {location.name} ให้ทุกคนเห็นแบบเรียลไทม์
              </p>
            </div>
            <button type="button" className="btn-gold w-full text-base" onClick={onSouvenir}>
              📸 บันทึกภาพที่ระลึก
            </button>
            <div className="grid w-full grid-cols-2 gap-2">
              <button type="button" className="btn-ghost" onClick={onAgain}>
                ลอยอีกใบ
              </button>
              <button type="button" className="btn-ghost" onClick={onChangeLocation}>
                เปลี่ยนสถานที่
              </button>
            </div>
            <p className="text-xs text-gold-100/50">แตะหรือชี้ที่กระทงใบอื่น ๆ บนผิวน้ำ เพื่ออ่านคำอธิษฐานของเพื่อน ๆ</p>
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
