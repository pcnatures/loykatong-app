import { motion } from 'framer-motion'
import Avatar from './Avatar'
import { Cards, Chips, Field, Swatches } from '../ui/Options'
import {
  DEFAULT_HAIR_BY_GENDER,
  FACE_SHAPES,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  OUTFITS,
  randomAvatar,
  SKIN_TONES,
} from '../../config/avatarOptions'

export default function AvatarEditor({ avatar, onChange }) {
  const set = (key) => (val) => onChange({ ...avatar, [key]: val })

  const setGender = (gender) => {
    // ถ้ายังใช้ทรงผมเริ่มต้นของเพศเดิมอยู่ เปลี่ยนเป็นทรงเริ่มต้นของเพศใหม่ให้อัตโนมัติ
    const hair = avatar.hair === DEFAULT_HAIR_BY_GENDER[avatar.gender] ? DEFAULT_HAIR_BY_GENDER[gender] : avatar.hair
    onChange({ ...avatar, gender, hair })
  }

  return (
    <div className="space-y-5">
      <Preview avatar={avatar} onRandom={() => onChange(randomAvatar())} />
      <Field label="เพศ">
        <Chips name="เพศ" options={GENDERS} value={avatar.gender} onChange={setGender} />
      </Field>
      <Field label="โครงหน้า">
        <Chips name="โครงหน้า" options={FACE_SHAPES} value={avatar.face} onChange={set('face')} />
      </Field>
      <Field label="ทรงผม">
        <Chips name="ทรงผม" options={HAIR_STYLES} value={avatar.hair} onChange={set('hair')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="สีผม">
          <Swatches name="สีผม" options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
        </Field>
        <Field label="สีผิว">
          <Swatches name="สีผิว" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
        </Field>
      </div>
      <Field label="ชุดแต่งกาย">
        <Cards
          name="ชุดแต่งกาย"
          options={OUTFITS}
          value={avatar.outfit}
          onChange={set('outfit')}
          render={(o) => (
            <span className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-night-800">
              <Avatar avatar={{ ...avatar, outfit: o.id }} shadow={false} className="h-full w-full" />
            </span>
          )}
        />
      </Field>
      <Field label="สีชุด">
        <Swatches name="สีชุด" options={OUTFIT_COLORS} value={avatar.outfitColor} onChange={set('outfitColor')} />
      </Field>
    </div>
  )
}

function Preview({ avatar, onRandom }) {
  return (
    <div className="relative grid place-items-center overflow-hidden rounded-3xl border border-gold-400/25 bg-[radial-gradient(circle_at_50%_30%,rgba(239,197,90,0.25),transparent_60%),linear-gradient(180deg,#0f1f4f,#081230)] py-3">
      <motion.div
        className="h-56 w-40"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Avatar avatar={avatar} pose="waiStand" animated className="h-full w-full" title="ตัวอย่างอวตาร" />
      </motion.div>
      <button type="button" onClick={onRandom} className="btn-ghost absolute right-3 top-3 bg-night-950/40 px-3 py-1.5 text-xs">
        🎲 สุ่ม
      </button>
      <p className="text-xs text-gold-100/60">ตัวอย่างแบบเรียลไทม์</p>
    </div>
  )
}
