import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { canvasToBlob, downloadBlob, renderSouvenirCard } from '../../lib/souvenirCard'
import { buddhistYear } from '../../lib/thaiText'

/** หน้าต่างบันทึกภาพที่ระลึก: แสดงตัวอย่าง → ดาวน์โหลด PNG/JPG หรือแชร์ทันที */
export default function SouvenirModal({ data, onClose }) {
  const [state, setState] = useState('loading') // loading | ready | error
  const [preview, setPreview] = useState(null)
  const [note, setNote] = useState('')
  const canvasRef = useRef(null)
  const pngRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    let alive = true
    let url = null
    renderSouvenirCard(data)
      .then(async (canvas) => {
        canvasRef.current = canvas
        const png = await canvasToBlob(canvas, 'image/png')
        if (!alive) return
        pngRef.current = png
        url = URL.createObjectURL(png)
        setPreview(url)
        setState('ready')
      })
      .catch((err) => {
        console.error(err)
        if (alive) setState('error')
      })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [data])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const baseName = `loykrathong-${buddhistYear()}-${data.location.id}`
  const shareText = `ลอยกระทงออนไลน์ที่ ${data.location.name} 🪷${data.wish ? ` “${data.wish}”` : ''}`
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const download = async (type) => {
    const blob = type === 'png' ? pngRef.current : await canvasToBlob(canvasRef.current, 'image/jpeg', 0.92)
    downloadBlob(blob, `${baseName}.${type === 'png' ? 'png' : 'jpg'}`)
  }

  const file = pngRef.current ? new File([pngRef.current], `${baseName}.png`, { type: 'image/png' }) : null
  const canShareFile = !!(file && navigator.canShare?.({ files: [file] }))

  const share = async () => {
    try {
      if (canShareFile) await navigator.share({ files: [file], title: 'ลอยกระทงออนไลน์', text: shareText })
      else if (navigator.share) await navigator.share({ title: 'ลอยกระทงออนไลน์', text: shareText, url: shareUrl })
    } catch (err) {
      if (err?.name !== 'AbortError') setNote('แชร์ไม่สำเร็จ ลองดาวน์โหลดภาพแล้วโพสต์เองนะ')
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setNote('คัดลอกข้อความแล้ว ✓')
    } catch {
      setNote('คัดลอกไม่สำเร็จ')
    }
  }

  const enc = encodeURIComponent
  const socials = [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}&quote=${enc(shareText)}` },
    { label: 'LINE', href: `https://social-plugins.line.me/lineit/share?url=${enc(shareUrl)}&text=${enc(shareText)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(shareUrl)}` },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-[5000] grid place-items-center bg-night-950/80 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ภาพที่ระลึก"
    >
      <motion.div
        className="thai-frame glass flex max-h-[94svh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-3xl p-4 sm:flex-row sm:p-5"
        initial={{ y: 30, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-[340px] shrink-0">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-night-900 ring-1 ring-gold-400/30">
            {state === 'ready' && <img src={preview} alt="การ์ดภาพที่ระลึกลอยกระทง" className="h-full w-full object-cover" />}
            {state === 'loading' && <div className="grid h-full place-items-center text-sm text-gold-100/60">กำลังสร้างภาพ…</div>}
            {state === 'error' && <div className="grid h-full place-items-center p-6 text-center text-sm text-rose-300">สร้างภาพไม่สำเร็จ ลองใหม่อีกครั้ง</div>}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-3xl text-gold-200">ภาพที่ระลึก</h3>
              <p className="text-sm text-gold-100/65">เก็บความทรงจำคืนลอยกระทง หรือส่งให้คนที่คุณคิดถึง</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="rounded-full p-2 text-gold-100/70 hover:text-gold-100" aria-label="ปิด">
              ✕
            </button>
          </div>

          {canShareFile && (
            <button type="button" className="btn-gold" disabled={state !== 'ready'} onClick={share}>
              แชร์ภาพไปยังแอปอื่น (LINE, Facebook, IG…)
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${canShareFile ? 'btn-ghost' : 'btn-gold'} px-3 text-sm`} disabled={state !== 'ready'} onClick={() => download('png')}>
              ⬇ ดาวน์โหลด PNG
            </button>
            <button type="button" className="btn-ghost px-3 text-sm" disabled={state !== 'ready'} onClick={() => download('jpg')}>
              ⬇ ดาวน์โหลด JPG
            </button>
          </div>

          <div className="mt-1 space-y-2 rounded-2xl border border-gold-400/15 bg-night-950/40 p-3">
            <p className="text-xs text-gold-100/60">แชร์ลิงก์ชวนเพื่อนมาลอยด้วยกัน</p>
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5 text-sm">
                  {s.label}
                </a>
              ))}
              <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={copy}>
                คัดลอกข้อความ
              </button>
              {!canShareFile && typeof navigator !== 'undefined' && navigator.share && (
                <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={share}>
                  แชร์…
                </button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-gold-100/45">
              Facebook/LINE/X ไม่อนุญาตให้เว็บแนบรูปผ่านลิงก์โดยตรง — บนมือถือใช้ปุ่ม “แชร์ภาพ” หรือดาวน์โหลดแล้วโพสต์ได้เลย
            </p>
          </div>
          {note && <p className="text-sm text-gold-200">{note}</p>}
        </div>
      </motion.div>
    </motion.div>
  )
}
