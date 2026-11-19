import { useCallback, useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { THAILAND_CENTER } from '../../config/locations'
import { pinHtml } from './Pin'

/**
 * แผนที่สำรองเมื่อไม่มี Google Maps API key
 * - Leaflet + แผนที่ OpenStreetMap โทนมืดของ CARTO (ไม่ต้องใช้คีย์)
 * - ค้นหาด้วย Nominatim (OSM) — นโยบายการใช้งานจำกัด 1 ครั้ง/วินาที จึงค้นหาเมื่อกด Enter เท่านั้น
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org'

const icon = (variant) =>
  L.divIcon({ className: 'lk-pin-wrap', html: pinHtml(variant), iconSize: [38, 46], iconAnchor: [19, 44] })
const ICONS = { default: icon('default'), active: icon('active'), custom: icon('custom') }

const firstPart = (s = '') => s.split(',')[0].trim()

export default function LeafletMapKit({ children }) {
  const search = useCallback(async (q) => {
    if (!q.trim()) return []
    const res = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=6&countrycodes=th&accept-language=th&q=${encodeURIComponent(q)}`)
    if (!res.ok) throw new Error('search failed')
    const data = await res.json()
    return data.map((d) => {
      const name = d.name || firstPart(d.display_name)
      const address = d.display_name.split(',').slice(1, 4).join(',').trim()
      return { id: String(d.place_id), title: name, subtitle: address, resolve: async () => ({ name, lat: +d.lat, lng: +d.lon, address }) }
    })
  }, [])

  const reverse = useCallback(async (lat, lng) => {
    const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=th`)
    if (!res.ok) return null
    const d = await res.json()
    const a = d.address ?? {}
    return [a.suburb || a.city_district || a.town || a.village || a.municipality || a.county, a.state || a.city].filter(Boolean).join(', ') || null
  }, [])

  return children({ MapView: LeafletMapView, search, reverse, autocomplete: false, provider: 'OpenStreetMap' })
}

function LeafletMapView({ places, selectedId, customPin, focus, onSelectPlace, onMapClick }) {
  return (
    <MapContainer center={[THAILAND_CENTER.lat, THAILAND_CENTER.lng]} zoom={6} zoomControl={false} className="h-full w-full" attributionControl>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <ZoomControl position="bottomright" />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.id === selectedId ? ICONS.active : ICONS.default}
          title={p.name}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        />
      ))}
      {customPin && <Marker position={[customPin.lat, customPin.lng]} icon={ICONS.custom} zIndexOffset={2000} />}
      <ClickToPin onMapClick={onMapClick} />
      <FlyTo focus={focus} />
    </MapContainer>
  )
}

function ClickToPin({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 1.1 })
  }, [map, focus])
  return null
}
