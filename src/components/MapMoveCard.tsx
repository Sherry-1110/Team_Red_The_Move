import type { Move } from '../types';
import { MoveCard } from './MoveCard';
import { calculateDistance, formatDistance } from '../utilities/helpers';
import { getDefaultCoordinatesForArea } from '../utilities/locations';

type MapMoveCardProps = {
  move: Move;
  now: number;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onJoinWaitlist: (moveId: string) => void;
  onLeaveWaitlist: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
};

export const MapMoveCard = ({
  move,
  now,
  userName,
  onJoinMove,
  onLeaveMove,
  onJoinWaitlist,
  onLeaveWaitlist,
  onSelectMove,
  userLocation,
}: MapMoveCardProps) => {
  // Calculate distance if user location is available
  const distance = userLocation ? (() => {
    let eventLat = move.latitude;
    let eventLng = move.longitude;
    
    // Use provided coordinates or calculate from area
    if (eventLat === undefined || eventLng === undefined) {
      const defaultCoords = getDefaultCoordinatesForArea(move.area);
      eventLat = defaultCoords.latitude;
      eventLng = defaultCoords.longitude;
    }
    
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      eventLat,
      eventLng
    );
  })() : null;

  return (
    <div className="map-popup-card">
      <MoveCard
        move={move}
        now={now}
        userName={userName}
        onJoinMove={onJoinMove}
        onLeaveMove={onLeaveMove}
        onJoinWaitlist={onJoinWaitlist}
        onLeaveWaitlist={onLeaveWaitlist}
        onSelectMove={onSelectMove}
        distance={distance !== null ? formatDistance(distance) : null}
        userLocation={userLocation}
        variant="popup"
      />
    </div>
  );
};
