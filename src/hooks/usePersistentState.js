import { useEffect, useState } from 'react'

/** useState ที่จำค่าไว้ใน localStorage (อวตาร/ชื่อ/สถานที่ล่าสุด) */
export function usePersistentState(key, initial, sanitize = (v) => v) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return sanitize(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  useEffect(() => {
    try {
      if (value === undefined || value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* private mode / storage full */
    }
  }, [key, value])

  return [value, setValue]
}
