import { REALTIME_PROVIDER } from '../../config/env'
import { buddhistYear, toThaiDigits } from '../../lib/thaiText'

const MODE_LABEL = {
  firebase: 'Firebase · เรียลไทม์',
  supabase: 'Supabase · เรียลไทม์',
  local: 'โหมดสาธิต',
}

export default function Header({ onHome }) {
  return (
    <header className="mx-auto flex h-[64px] w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
      <button type="button" onClick={onHome} className="flex items-center gap-2.5 text-left" aria-label="กลับไปหน้าเลือกสถานที่">
        <Logo />
        <span className="leading-none">
          <span className="gold-text block font-display text-2xl font-bold sm:text-3xl">ลอยกระทงออนไลน์</span>
          <span className="block text-[11px] tracking-wide text-gold-100/55">คืนวันเพ็ญเดือนสิบสอง · พ.ศ. {toThaiDigits(buddhistYear())}</span>
        </span>
      </button>
      <span
        className="hidden rounded-full border border-gold-400/25 bg-night-900/60 px-3 py-1 text-[11px] text-gold-100/70 sm:inline-block"
        title={REALTIME_PROVIDER === 'local' ? 'ยังไม่ได้ตั้งค่าฐานข้อมูล: กระทงจะซิงก์ระหว่างแท็บในเบราว์เซอร์นี้ (ลองเปิด 2 แท็บ)' : undefined}
      >
        {MODE_LABEL[REALTIME_PROVIDER]}
      </span>
    </header>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-[0_0_10px_rgba(255,190,90,0.5)]" aria-hidden="true">
      <circle cx="32" cy="22" r="13" fill="#ffcf6b" opacity=".18" />
      <path d="M32 9c3.4 4.4 4.4 7.6 0 12-4.4-4.4-3.4-7.6 0-12z" fill="#ffc34d" />
      <rect x="30" y="20" width="4" height="12" rx="1" fill="#fff3d6" />
      <path d="M8 40c6-10 15-8 24-8s18-2 24 8c-6 7-15 9-24 9s-18-2-24-9z" fill="#2f8f4e" />
      <path d="M12 40l5-9 4 8 5-10 3 10 3 0 3-10 5 10 4-8 5 9" fill="#e0ac3c" />
      <path d="M6 53c9 3 17 3 26 0s17-3 26 0" stroke="#e0ac3c" strokeWidth="2" fill="none" opacity=".6" />
    </svg>
  )
}
