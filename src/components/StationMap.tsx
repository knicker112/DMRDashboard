import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { AprsPosition } from '../hooks/useAprs'
import { formatDistance, haversineKm } from '../utils/geo'

function makeIcon(color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 6px ${color}88;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const homeIcon = makeIcon('#22d3ee', 16)
const greenIcon = makeIcon('#4ade80', 14)
const blueIcon = makeIcon('#60a5fa', 14)

interface StationEntry {
  callsign: string
  pos: AprsPosition
  slot: 1 | 2
}

interface Props {
  stations: StationEntry[]
  homeLat: number
  homeLng: number
  homeCallsign?: string
}

function FitBounds({ stations, homeLat, homeLng }: { stations: StationEntry[]; homeLat: number; homeLng: number }) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = [[homeLat, homeLng], ...stations.map(s => [s.pos.lat, s.pos.lng] as [number, number])]
    if (points.length === 1) {
      map.setView(points[0], 10)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] })
    }
  }, [map, stations, homeLat, homeLng])
  return null
}

export function StationMap({ stations, homeLat, homeLng, homeCallsign }: Props) {
  if (stations.length === 0) return null

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden mb-6 border border-slate-700">
      <div className="px-4 pt-3 pb-2 text-sm text-slate-300 font-bold tracking-widest flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
        APRS POSITIONEN
      </div>
      <div style={{ height: 240 }}>
        <MapContainer
          center={[homeLat, homeLng]}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds stations={stations} homeLat={homeLat} homeLng={homeLng} />

          <Marker position={[homeLat, homeLng]} icon={homeIcon}>
            <Popup>
              <strong>{homeCallsign ?? 'Heimstation'}</strong>
            </Popup>
          </Marker>

          {stations.map(({ callsign, pos, slot }) => {
            const dist = haversineKm(homeLat, homeLng, pos.lat, pos.lng)
            const icon = slot === 1 ? greenIcon : blueIcon
            return (
              <Marker key={callsign} position={[pos.lat, pos.lng]} icon={icon}>
                <Popup>
                  <strong>{callsign}</strong> (TS{slot})<br />
                  {formatDistance(dist)} von {homeCallsign ?? 'Heimstation'}<br />
                  {pos.comment && <span style={{ fontSize: '0.85em', color: '#666' }}>{pos.comment}</span>}
                </Popup>
              </Marker>
            )
          })}

          {stations.map(({ callsign, pos }) => (
            <Polyline
              key={`line-${callsign}`}
              positions={[[homeLat, homeLng], [pos.lat, pos.lng]]}
              pathOptions={{ color: '#94a3b8', weight: 1, dashArray: '4 6', opacity: 0.7 }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
