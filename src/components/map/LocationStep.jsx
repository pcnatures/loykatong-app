import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getScene } from '../../config/scenes'
import { makeCustomLocation, nearestPopular, POPULAR_LOCATIONS } from '../../config/locations'
import SceneBackdrop from '../river/SceneBackdrop'

// แผนที่ OpenStreetMap (Leaflet) — โหลดแยกไฟล์เมื่อเปิดหน้าเลือกสถานที่
const MapKit = lazy(() => import('./LeafletMapKit'))

export default function LocationStep({ initial, onConfirm }) {
  return (
    <Suspense fallback={<MapShell loading />}>
      <MapKit>{(kit) => <LocationPicker kit={kit} initial={initial} onConfirm={onConfirm} />}</MapKit>
    </Suspense>
  )
}

function MapShell({ loading }) {
  return (
    <div className="grid h-[60svh] place-items-center text-gold-200/70">{loading ? 'กำลังโหลดแผนที่…' : null}</div>
  )
}

function LocationPicker({ kit, initial, onConfirm }) {
  const { MapView, search, reverse, autocomplete, provider } = kit
  const [selected, setSelected] = useState(initial ?? null)
  const [customPin, setCustomPin] = useState(initial?.custom ? { lat: initial.lat, lng: initial.lng } : null)
  const [customName, setCustomName] = useState(initial?.custom ? initial.name : '')
  const [focus, setFocus] = useState(initial ? { lat: initial.lat, lng: initial.lng, zoom: 14 } : null)
  const [geoError, setGeoError] = useState('')
  const reverseReq = useRef(0)

  const choosePopular = (p) => {
    setSelected(p)
    setCustomPin(null)
    setFocus({ lat: p.lat, lng: p.lng, zoom: 15 })
  }

  const dropPin = async (lat, lng, presetName, presetAddress) => {
    const near = nearestPopular(lat, lng)
    if (near && !presetName) return choosePopular(near)
    setCustomPin({ lat, lng })
    const name = presetName || 'ริมน้ำใกล้บ้านฉัน'
    setCustomName(name)
    setSelected(makeCustomLocation({ lat, lng, name, address: presetAddress }))
    if (!presetAddress) {
      const req = ++reverseReq.current
      try {
        const address = await reverse(lat, lng)
        if (address && req === reverseReq.current) setSelected((s) => (s?.custom ? { ...s, province: address } : s))
      } catch {
        /* ไม่มีชื่อย่านก็ไม่เป็นไร */
      }
    }
  }

  const useMyLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) return setGeoError('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setFocus({ lat, lng, zoom: 15 })
        dropPin(lat, lng)
      },
      () => setGeoError('ไม่สามารถเข้าถึงตำแหน่งได้ ลองปักหมุดบนแผนที่แทนนะ'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const confirm = () => {
    if (!selected) return
    onConfirm(selected.custom ? { ...selected, name: customName.trim() || selected.name } : selected)
  }

  return (
    <div className={`mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 sm:px-5 lg:h-[calc(100svh-76px)] lg:flex-row lg:pb-6 ${selected ? 'pb-24' : 'pb-6'}`}>
      {/* แผนที่ */}
      <div className="thai-frame relative h-[48svh] min-h-[300px] overflow-hidden rounded-3xl lg:h-auto lg:flex-1">
        <MapView
          places={POPULAR_LOCATIONS}
          selectedId={selected && !selected.custom ? selected.id : null}
          customPin={customPin}
          focus={focus}
          onSelectPlace={choosePopular}
          onMapClick={(lat, lng) => dropPin(lat, lng)}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3">
          <SearchBox search={search} autocomplete={autocomplete} onPick={async (r) => {
            const place = await r.resolve()
            const near = nearestPopular(place.lat, place.lng, 0.6)
            if (near) return choosePopular(near)
            setFocus({ lat: place.lat, lng: place.lng, zoom: 15 })
            dropPin(place.lat, place.lng, place.name, place.address)
          }} />
        </div>
        <div className="absolute bottom-3 left-3 z-[1000] flex flex-col items-start gap-2">
          <button type="button" onClick={useMyLocation} className="glass btn-ghost text-sm">
            <span aria-hidden="true">◎</span> ใช้ตำแหน่งของฉัน
          </button>
          {geoError && <p className="glass rounded-lg px-2 py-1 text-xs text-rose-200">{geoError}</p>}
        </div>
        <p className="pointer-events-none absolute bottom-3 right-14 z-[1000] hidden rounded-full bg-night-950/60 px-2 py-0.5 text-[10px] text-gold-100/60 sm:block">
          แตะบนแผนที่เพื่อปักหมุดจุดลอยกระทงของคุณ · {provider}
        </p>
      </div>

      {/* แผงด้านข้าง */}
      <aside className="flex flex-col gap-4 lg:w-[400px] lg:overflow-y-auto lg:pr-1">
        <div className="shrink-0">
          <h2 className="font-display text-3xl text-gold-200 sm:text-4xl">เลือกที่ลอยกระทง</h2>
          <p className="mt-1 text-sm text-gold-100/70">เลือกสถานที่ยอดนิยม ค้นหา หรือแตะแผนที่เพื่อปักหมุดริมน้ำใกล้บ้าน — คนที่เลือกที่เดียวกันจะเห็นกระทงของกันและกันแบบเรียลไทม์</p>
        </div>

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="thai-frame shrink-0 overflow-hidden rounded-2xl bg-night-850"
            >
              <ScenePreview scene={selected.scene} className="h-24" />
              <div className="space-y-2 p-4">
                {selected.custom ? (
                  <label className="block">
                    <span className="text-xs text-gold-100/60">ตั้งชื่อจุดลอยกระทงของคุณ</span>
                    <input
                      value={customName}
                      maxLength={40}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gold-400/30 bg-night-950/60 px-3 py-2 text-gold-100 outline-none focus:border-gold-300"
                    />
                  </label>
                ) : (
                  <p className="text-lg font-medium text-gold-200">{selected.name}</p>
                )}
                <p className="text-xs text-gold-100/60">
                  {selected.water} · {selected.province}
                </p>
                <p className="text-sm text-gold-100/80">{selected.blurb}</p>
                <button type="button" onClick={confirm} className="btn-gold mt-1 w-full">
                  ไปที่ริมน้ำ <span aria-hidden="true">→</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="shrink-0">
          <p className="mb-2 text-xs uppercase tracking-widest text-gold-400/80">สถานที่ยอดนิยม</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {POPULAR_LOCATIONS.map((p) => {
              const on = selected?.id === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choosePopular(p)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition ${
                      on ? 'border-gold-300 bg-gold-400/10' : 'border-gold-400/15 bg-night-900/60 hover:border-gold-400/50'
                    }`}
                  >
                    <ScenePreview scene={p.scene} className="h-14 w-20 shrink-0 rounded-xl" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-gold-100">{p.name}</span>
                      <span className="block truncate text-[11px] text-gold-100/55">
                        {p.province} · {p.water}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      {/* มือถือ: แถบยืนยันติดขอบล่าง จะได้ไม่ต้องเลื่อนหา */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="mobile-confirm"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="glass fixed inset-x-3 bottom-3 z-[1500] flex items-center gap-3 rounded-2xl border border-gold-400/40 p-2 pl-4 shadow-2xl lg:hidden"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-gold-200">{selected.custom ? customName || selected.name : selected.name}</span>
              <span className="block truncate text-[11px] text-gold-100/55">{selected.province}</span>
            </span>
            <button type="button" onClick={confirm} className="btn-gold shrink-0 px-4 py-2.5 text-sm">
              ไปที่ริมน้ำ →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScenePreview({ scene, className = '' }) {
  const cfg = getScene(scene)
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(180deg, #050b1f, #1a2f72 70%, ${cfg.skyGlow}66)` }}>
      <SceneBackdrop scene={scene} sceneConfig={cfg} className="absolute inset-x-0 bottom-[18%] h-[82%] w-full" />
      <div className="absolute inset-x-0 bottom-0 h-[18%]" style={{ background: `linear-gradient(${cfg.water[0]}, ${cfg.water[1]})` }} />
    </div>
  )
}

function SearchBox({ search, autocomplete, onPick }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [state, setState] = useState('idle') // idle | loading | error | empty
  const [open, setOpen] = useState(false)
  const reqId = useRef(0)

  const localMatches = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return POPULAR_LOCATIONS.filter((p) => `${p.name} ${p.nameEn} ${p.province} ${p.water}`.toLowerCase().includes(t)).slice(0, 3)
  }, [q])

  const run = async (text) => {
    if (!text.trim()) return setResults([])
    const id = ++reqId.current
    setState('loading')
    try {
      const r = await search(text)
      if (id !== reqId.current) return
      setResults(r)
      setState(r.length ? 'idle' : 'empty')
    } catch {
      if (id === reqId.current) setState('error')
    }
  }

  // autocomplete = ค้นหาขณะพิมพ์ (debounce) | OSM/Nominatim ปิดไว้ ค้นหาเมื่อกด Enter (จำกัด 1 ครั้ง/วินาที)
  useEffect(() => {
    if (!autocomplete) return
    const t = setTimeout(() => run(q), 320)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, autocomplete])

  const pick = async (item) => {
    setOpen(false)
    setQ(item.title)
    await onPick(item)
  }

  const showList = open && q.trim() && (localMatches.length || results.length || state !== 'idle')

  return (
    <div
      className="pointer-events-auto relative mx-auto max-w-xl"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setOpen(true)
          run(q)
        }}
        className="glass flex items-center gap-2 rounded-full border border-gold-400/40 py-1 pl-4 pr-1 shadow-xl"
      >
        <span aria-hidden="true" className="text-gold-300">⌕</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            if (!autocomplete) setResults([])
          }}
          onFocus={() => setOpen(true)}
          placeholder="ค้นหาสถานที่ เช่น วัด สวนสาธารณะ ริมแม่น้ำ…"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gold-100 placeholder:text-gold-100/40 outline-none"
          aria-label="ค้นหาสถานที่"
        />
        <button type="submit" className="rounded-full bg-gold-400 px-4 py-1.5 text-sm text-night-950">
          ค้นหา
        </button>
      </form>
      {showList && (
        <ul className="glass absolute inset-x-0 top-full mt-2 max-h-72 overflow-auto rounded-2xl border border-gold-400/30 p-1 shadow-2xl">
          {localMatches.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => pick({ title: p.name, resolve: async () => p })} className="w-full rounded-xl px-3 py-2 text-left hover:bg-gold-400/10">
                <span className="block text-sm text-gold-200">★ {p.name}</span>
                <span className="block text-[11px] text-gold-100/50">สถานที่ยอดนิยม · {p.province}</span>
              </button>
            </li>
          ))}
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => pick(r)} className="w-full rounded-xl px-3 py-2 text-left hover:bg-gold-400/10">
                <span className="block truncate text-sm text-gold-100">{r.title}</span>
                <span className="block truncate text-[11px] text-gold-100/50">{r.subtitle}</span>
              </button>
            </li>
          ))}
          {state === 'loading' && <li className="px-3 py-2 text-xs text-gold-100/60">กำลังค้นหา…</li>}
          {state === 'empty' && <li className="px-3 py-2 text-xs text-gold-100/60">ไม่พบสถานที่ ลองคำอื่น หรือแตะแผนที่เพื่อปักหมุด</li>}
          {state === 'error' && <li className="px-3 py-2 text-xs text-rose-200">ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง</li>}
          {!autocomplete && state === 'idle' && !results.length && <li className="px-3 py-2 text-xs text-gold-100/50">กด Enter เพื่อค้นหาทั่วประเทศ</li>}
        </ul>
      )}
    </div>
  )
}
