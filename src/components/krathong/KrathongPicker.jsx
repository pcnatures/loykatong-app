import { motion } from 'framer-motion'
import Krathong from './Krathong'
import { Cards, Chips, Field, Swatches } from '../ui/Options'
import { CANDLE_STYLES, FLOWER_COLORS, KRATHONG_TYPES } from '../../config/krathongOptions'

export default function KrathongPicker({ krathong, onChange }) {
  const set = (key) => (val) => onChange({ ...krathong, [key]: val })
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-gold-400/25 bg-[linear-gradient(180deg,#0f1f4f_0%,#0f1f4f_58%,#0b1a48_58%,#071233_100%)] px-6 pb-2 pt-4">
        <motion.div
          className="mx-auto w-[min(260px,70%)]"
          animate={{ y: [0, -3, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Krathong krathong={krathong} animated className="h-auto w-full" title="ตัวอย่างกระทง" />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[14%] mx-auto h-6 w-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,190,100,0.35),transparent_70%)]" />
      </div>

      <Field label="รูปแบบกระทง">
        <Cards
          name="รูปแบบกระทง"
          options={KRATHONG_TYPES}
          value={krathong.type}
          onChange={set('type')}
          render={(o) => (
            <span className="h-11 w-12 shrink-0">
              <Krathong krathong={{ ...krathong, type: o.id }} glow={false} className="h-full w-full" />
            </span>
          )}
        />
      </Field>
      <Field label="สีดอกไม้" hint={FLOWER_COLORS.find((f) => f.id === krathong.flower)?.label}>
        <Swatches name="สีดอกไม้" options={FLOWER_COLORS} value={krathong.flower} onChange={set('flower')} />
      </Field>
      <Field label="เทียนและธูป">
        <Chips name="เทียนและธูป" options={CANDLE_STYLES} value={krathong.candle} onChange={set('candle')} />
      </Field>
    </div>
  )
}
