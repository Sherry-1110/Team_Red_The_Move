import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Move } from '../types';
import { getDefaultCoordinatesForArea } from '../utilities/locations';
import { MoveCard } from './MoveCard';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type MapViewProps = {
  moves: Move[];
  now: number;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
};

export const MapView = ({
  moves,
  now,
  userName,
  onJoinMove,
  onLeaveMove,
  onSelectMove,
}: MapViewProps) => {
  // Northwestern campus center coordinates
  const mapCenter = [42.0500, -87.6750] as [number, number];
  const mapZoom = 14;

  return (
    <div className="map-container">
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {moves.map((move) => {
          // Use provided coordinates or calculate from area
          let lat = move.latitude;
          let lng = move.longitude;
          if (lat === undefined || lng === undefined) {
            const defaultCoords = getDefaultCoordinatesForArea(move.area);
            lat = defaultCoords.latitude;
            lng = defaultCoords.longitude;
          }

          return (
            <Marker key={move.id} position={[lat, lng]}>
              <Popup>
                <div className="map-popup-card">
                  <MoveCard
                    move={move}
                    now={now}
                    userName={userName}
                    onJoinMove={onJoinMove}
                    onLeaveMove={onLeaveMove}
                    onSelectMove={onSelectMove}
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
