import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Move } from '../types';
import { getDefaultCoordinatesForArea } from '../utilities/locations';

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
  onSelectMove: (moveId: string) => void;
};

export const MapView = ({ moves, onSelectMove }: MapViewProps) => {
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
          const displayLocation = move.locationName || move.location;

          if (lat === undefined || lng === undefined) {
            const defaultCoords = getDefaultCoordinatesForArea(move.area);
            lat = defaultCoords.latitude;
            lng = defaultCoords.longitude;
          }

          return (
            <Marker key={move.id} position={[lat, lng]}>
              <Popup>
                <div className="popup-content" onClick={() => onSelectMove(move.id)}>
                  <h4>{move.title}</h4>
                  <p className="popup-subtitle">by {move.hostName}</p>
                  <p className="popup-location">{displayLocation}</p>
                  <p className="popup-activity">{move.activityType}</p>
                  <button className="popup-button">View Details</button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
