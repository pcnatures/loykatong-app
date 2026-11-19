import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './components/layout/Header'
import LocationStep from './components/map/LocationStep'
import RiverStage from './pages/RiverStage'
import { usePersistentState } from './hooks/usePersistentState'
import { DEFAULT_AVATAR, sanitizeAvatar } from './config/avatarOptions'
import { DEFAULT_KRATHONG, sanitizeKrathong } from './config/krathongOptions'

const isLocation = (v) => (v && typeof v === 'object' && typeof v.id === 'string' && Number.isFinite(v.lat) ? v : null)

export default function App() {
  const [location, setLocation] = usePersistentState('lk.location', null, isLocation)
  const [view, setView] = useState(location ? 'river' : 'map')
  const [avatar, setAvatar] = usePersistentState('lk.avatar', DEFAULT_AVATAR, sanitizeAvatar)
  const [krathong, setKrathong] = usePersistentState('lk.krathong', DEFAULT_KRATHONG, sanitizeKrathong)
  const [name, setName] = usePersistentState('lk.name', '', (v) => (typeof v === 'string' ? v : ''))

  return (
    <div className="flex min-h-svh flex-col">
      <Header onHome={() => setView('map')} />
      <AnimatePresence mode="wait">
        {view === 'map' || !location ? (
          <motion.main key="map" className="flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <LocationStep
              initial={location}
              onConfirm={(loc) => {
                setLocation(loc)
                setView('river')
              }}
            />
          </motion.main>
        ) : (
          <motion.main key={`river-${location.id}`} className="flex-1" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <RiverStage
              location={location}
              avatar={avatar}
              setAvatar={setAvatar}
              krathong={krathong}
              setKrathong={setKrathong}
              name={name}
              setName={setName}
              onChangeLocation={() => setView('map')}
            />
          </motion.main>
        )}
      </AnimatePresence>
      <footer className="px-4 pb-5 pt-2 text-center text-[11px] text-gold-100/40">
        ลอยกระทงอย่างยั่งยืน: เลือกกระทงย่อยสลายได้ · ร่วมรักษาแม่น้ำลำคลองของเรา 🌊
      </footer>
    </div>
  )
}
