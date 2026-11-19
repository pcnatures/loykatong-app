import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import RiverScene from '../components/river/RiverScene'
import CustomizePanel from '../components/panel/CustomizePanel'
import SouvenirModal from '../components/share/SouvenirModal'
import { getScene } from '../config/scenes'
import { useRealtimeRoom } from '../hooks/useRealtimeRoom'
import { makeDriftParams } from '../lib/drift'
import { getClientId, uuid } from '../lib/ids'
import { maskProfanity } from '../lib/profanity'

const COOLDOWN_MS = 8000

/** หน้าริมน้ำ: ฉากเรียลไทม์ + แผงปรับแต่ง + ลอยกระทง + ภาพที่ระลึก */
export default function RiverStage({ location, avatar, setAvatar, krathong, setKrathong, name, setName, onChangeLocation }) {
  const clientId = useMemo(getClientId, [])
  const room = useRealtimeRoom(location.id, clientId)
  const scene = getScene(location.scene)

  const [wish, setWish] = useState('')
  const [step, setStep] = useState(0)
  const [stage, setStage] = useState('edit') // edit | releasing | done
  const [release, setRelease] = useState(null)
  const [souvenir, setSouvenir] = useState(null)
  const [lastRelease, setLastRelease] = useState(null)
  const [error, setError] = useState('')
  const [freshIds] = useState(() => new Set())
  const lastAt = useRef(0)
  const sceneRef = useRef(null)

  const startRelease = () => {
    setError('')
    if (!name.trim()) return setError('กรอกชื่อผู้ลอยก่อนนะ')
    const wait = COOLDOWN_MS - (Date.now() - lastAt.current)
    if (wait > 0) return setError(`รออีก ${Math.ceil(wait / 1000)} วินาที ก่อนลอยใบถัดไปนะ`)
    lastAt.current = Date.now()
    setRelease({
      id: uuid(),
      name: maskProfanity(name.trim()),
      wish: maskProfanity(wish.trim()),
      avatar,
      krathong,
    })
    setStage('releasing')
    // บนมือถือ เลื่อนขึ้นไปดูฉากลอยกระทง
    if (sceneRef.current && sceneRef.current.getBoundingClientRect().top < 0) {
      sceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const onPlaced = useCallback(
    async (req, { startX, startD }) => {
      const rec = {
        id: req.id,
        room: location.id,
        clientId,
        name: req.name,
        wish: req.wish,
        avatar: req.avatar,
        krathong: req.krathong,
        createdAt: room.now(),
        ...makeDriftParams(startX, startD),
      }
      freshIds.add(rec.id)
      setLastRelease({ ...req, location })
      try {
        await room.publish(rec)
      } catch (err) {
        console.error(err)
        // PT429 = ฐานข้อมูลจำกัดอัตราการลอย (ดู krathongs_guard ใน supabase/schema.sql)
        setError(
          err?.code === 'PT429'
            ? 'ตอนนี้มีคนลอยกระทงถี่มาก กระทงใบนี้เลยยังไม่ถูกส่งให้คนอื่นเห็น — รอสักครู่แล้วลองใหม่นะ'
            : 'ส่งกระทงขึ้นเซิร์ฟเวอร์ไม่สำเร็จ คนอื่นอาจยังมองไม่เห็น — ตรวจสอบการเชื่อมต่อหรือการตั้งค่าฐานข้อมูล',
        )
      }
    },
    [location, clientId, room, freshIds],
  )

  const onDone = useCallback(() => setStage('done'), [])

  const again = () => {
    setRelease(null)
    setWish('')
    setStep(1)
    setStage('edit')
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 pb-6 sm:px-5 lg:h-[calc(100svh-76px)] lg:grid-cols-[minmax(0,1fr)_400px]">
      <div ref={sceneRef} className="thai-frame relative h-[58svh] min-h-[360px] scroll-mt-3 overflow-hidden rounded-3xl lg:h-full">
        <RiverScene
          key={location.id}
          className="h-full w-full"
          location={location}
          scene={scene}
          room={room}
          myClientId={clientId}
          freshIds={freshIds}
          avatar={stage === 'edit' ? avatar : (release?.avatar ?? avatar)}
          krathong={stage === 'edit' ? krathong : (release?.krathong ?? krathong)}
          name={name.trim() ? maskProfanity(name.trim()) : ''}
          release={release}
          onPlaced={onPlaced}
          onDone={onDone}
          onChangeLocation={onChangeLocation}
        />
      </div>

      <CustomizePanel
        className="min-h-[420px] lg:min-h-0"
        stage={stage}
        step={step}
        setStep={setStep}
        avatar={avatar}
        setAvatar={setAvatar}
        krathong={krathong}
        setKrathong={setKrathong}
        name={name}
        setName={setName}
        wish={wish}
        setWish={setWish}
        onRelease={startRelease}
        onSouvenir={() => lastRelease && setSouvenir({ ...lastRelease, date: new Date() })}
        onAgain={again}
        onChangeLocation={onChangeLocation}
        location={location}
        error={error}
      />

      <AnimatePresence>{souvenir && <SouvenirModal data={souvenir} onClose={() => setSouvenir(null)} />}</AnimatePresence>
    </div>
  )
}
