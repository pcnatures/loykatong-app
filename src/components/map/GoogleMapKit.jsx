import { useCallback, useEffect, useRef } from 'react'
import { AdvancedMarker, APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '../../config/env'
import { THAILAND_CENTER } from '../../config/locations'
import { PinMarker } from './Pin'

/**
 * Google Maps (ใช้เมื่อกำหนด VITE_GOOGLE_MAPS_API_KEY)
 * - แผนที่โทนมืด + Advanced Markers
 * - ค้นหาสถานที่ด้วย Places API (New): AutocompleteSuggestion
 * - แปลงพิกัดเป็นชื่อย่าน (reverse geocode) ด้วย Geocoding API
 */
export default function GoogleMapKit({ children }) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="th" region="TH">
      <Inner>{children}</Inner>
    </APIProvider>
  )
}

function Inner({ children }) {
  const places = useMapsLibrary('places')
  const geocoding = useMapsLibrary('geocoding')
  const token = useRef(null)

  const search = useCallback(
    async (input) => {
      if (!places || !input.trim()) return []
      token.current ??= new places.AutocompleteSessionToken()
      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: token.current,
        includedRegionCodes: ['th'],
        language: 'th',
        region: 'th',
      })
      return suggestions
        .filter((s) => s.placePrediction)
        .slice(0, 6)
        .map(({ placePrediction: p }) => ({
          id: p.placeId,
          title: (p.mainText ?? p.text).toString(),
          subtitle: p.secondaryText?.toString() ?? '',
          resolve: async () => {
            const place = p.toPlace()
            await place.fetchFields({ fields: ['displayName', 'location', 'formattedAddress'] })
            token.current = null // จบ session การค้นหา (คิดค่าบริการถูกลง)
            return { name: place.displayName, lat: place.location.lat(), lng: place.location.lng(), address: place.formattedAddress }
          },
        }))
    },
    [places],
  )

  const reverse = useCallback(
    async (lat, lng) => {
      if (!geocoding) return null
      const { results } = await new geocoding.Geocoder().geocode({ location: { lat, lng }, language: 'th' })
      const r = results?.[0]
      if (!r) return null
      const pick = (type) => r.address_components.find((c) => c.types.includes(type))?.long_name
      return (
        [pick('sublocality_level_1') || pick('locality') || pick('administrative_area_level_2'), pick('administrative_area_level_1')]
          .filter(Boolean)
          .join(', ') || r.formatted_address
      )
    },
    [geocoding],
  )

  return children({ MapView: GoogleMapView, search, reverse, autocomplete: true, provider: 'Google Maps' })
}

function GoogleMapView({ places, selectedId, customPin, focus, onSelectPlace, onMapClick }) {
  return (
    <Map
      className="h-full w-full"
      defaultCenter={THAILAND_CENTER}
      defaultZoom={6}
      mapId={GOOGLE_MAPS_MAP_ID}
      colorScheme="DARK"
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      clickableIcons={false}
      onClick={(e) => {
        const ll = e.detail.latLng
        if (ll) onMapClick(ll.lat, ll.lng)
      }}
    >
      {places.map((p) => (
        <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.name} zIndex={p.id === selectedId ? 10 : 1} onClick={() => onSelectPlace(p)}>
          <PinMarker variant={p.id === selectedId ? 'active' : 'default'} />
        </AdvancedMarker>
      ))}
      {customPin && (
        <AdvancedMarker position={customPin} zIndex={20}>
          <PinMarker variant="custom" />
        </AdvancedMarker>
      )}
      <FlyTo focus={focus} />
    </Map>
  )
}

function FlyTo({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !focus) return
    map.panTo({ lat: focus.lat, lng: focus.lng })
    map.setZoom(focus.zoom)
  }, [map, focus])
  return null
}
