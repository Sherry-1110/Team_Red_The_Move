import type { Move, ActivityType, CampusArea } from '../types';
import { formatTimeAgo, getStatusLabel, calculateDistance, formatDistance } from '../utilities/helpers';
import { BookOpen, CalendarClock, MapPin, Star, UserRound, Users, UtensilsCrossed } from 'lucide-react';
import type { ReactElement } from 'react';
import { useSavedMoves } from '../contexts/SavedMovesContext';

type MoveCardProps = {
  move: Move;
  now: number;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
  distance?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  variant?: 'default' | 'popup';
};

export const MoveCard = ({
  move,
  now,
  userName,
  onJoinMove,
  onLeaveMove,
  onSelectMove,
  distance,
  userLocation,
  variant = 'default',
}: MoveCardProps) => {
  const isJoined = move.attendees.includes(userName);
  const isHost = move.hostName === userName;
  const statusLabel = getStatusLabel(move.startTime, move.endTime, now);
  const displayLocation = move.locationName || move.location;
  const isFull = move.attendees.length >= move.maxParticipants;
  const isPast = statusLabel === 'Past';
  const isJoinDisabled = !isJoined && (isFull || isPast);
  const { isSaved, toggleSave } = useSavedMoves();
  
  // Calculate distance if not provided but userLocation is available
  const displayDistance = distance || (userLocation && move.latitude && move.longitude 
    ? formatDistance(calculateDistance(userLocation.latitude, userLocation.longitude, move.latitude, move.longitude))
    : null);

  const activityIcons: Record<ActivityType, ReactElement> = {
    Food: <UtensilsCrossed size={14} />,
    Study: <BookOpen size={14} />,
    Sports: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
        <path d="M3 12h18" />
        <path d="M6.2 6.2c3.6 3.6 8 3.6 11.6 0" />
        <path d="M6.2 17.8c3.6-3.6 8-3.6 11.6 0" />
      </svg>
    ),
    Social: <Users size={14} />,
    Other: <Users size={14} />,
  };

  const areaLabels: Record<CampusArea, string> = {
    North: 'N',
    South: 'S',
    Downtown: 'DT',
    Other: 'OT',
  };

  const formatDateRangeWithRelative = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startIso}-${endIso}`;

    const dateStr = start.toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    const todayStr = new Date(now).toDateString();
    const tomorrowStr = new Date(now + 24 * 60 * 60 * 1000).toDateString();
    const startDayStr = start.toDateString();
    const relative =
      startDayStr === todayStr
        ? 'Today'
        : startDayStr === tomorrowStr
          ? 'Tomorrow'
          : start.toLocaleDateString(undefined, { weekday: 'short' });

    return `${dateStr}, ${startTime}-${endTime} (${relative})`;
  };

  const cardClassName = `move-card${variant === 'popup' ? ' move-card--popup' : ''}`;
  const contentClassName = `move-card__content${variant === 'popup' ? ' move-card__content--stacked' : ' move-card__content--horizontal'}`;

  return (
    <article className={cardClassName}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open move ${move.title}`}
        className={contentClassName}
        onClick={() => onSelectMove(move.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelectMove(move.id);
          }
        }}
      >
        <div className="move-card__body move-card__body--stack">
          <div className="move-card__title-row">
            <h3 className="move-card__title">{move.title}</h3>
            <div className="move-card__badges">
              <span className="move-card__badge">{activityIcons[move.activityType]}</span>
              <span className="move-card__badge move-card__badge--text">{areaLabels[move.area]}</span>
            </div>
          </div>
          {move.remarks && <p className="move-card__prompt">{move.remarks}</p>}
          <div className="move-card__meta-stack">
            <div className="move-card__meta-row">
              <CalendarClock size={14} className="move-card__meta-icon" />
              <span>{formatDateRangeWithRelative(move.startTime, move.endTime)}</span>
            </div>
            <div className="move-card__meta-row">
              <MapPin size={14} className="move-card__meta-icon" />
              <span>{displayLocation}</span>
              {displayDistance && (
                <span className="move-card__distance">• {displayDistance} away</span>
              )}
            </div>
            <div className="move-card__meta-row">
              <UserRound size={14} className="move-card__meta-icon" />
              <span>Hosted by {move.hostName}</span>
            </div>
          </div>
        </div>
        <div className="move-card__right">
          <div className="move-card__status">
            <span
              className={`status-badge ${statusLabel === 'Past' ? 'status-badge--past' : ''}`}
            >
              {statusLabel}
            </span>
            <span className="move-card__time">{formatTimeAgo(move.createdAt, now)}</span>
          </div>
          <div className="move-card__actions move-card__actions--right">
            <span className="attendee-count attendee-count--with-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <circle cx="12" cy="7" r="4" fill="currentColor" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
              </svg>
              {move.attendees.length}/{move.maxParticipants}
            </span>
            <button
              className="save-toggle-btn"
              type="button"
              aria-label={`${isSaved(move.id) ? 'Unsave' : 'Save'} ${move.title}`}
              aria-pressed={isSaved(move.id)}
              onClick={(event) => {
                event.stopPropagation();
                void toggleSave(move.id);
              }}
            >
              <Star
                size={16}
                strokeWidth={2}
                fill={isSaved(move.id) ? 'currentColor' : 'none'}
              />
            </button>
            {isHost ? (
              <button
                className="btn btn--small btn--ghost"
                type="button"
                aria-label={`Hosting ${move.title}`}
                disabled
              >
                Hosting
              </button>
            ) : isJoined ? (
              <button
                className="btn btn--small btn--ghost"
                type="button"
                aria-label={`Leave ${move.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onLeaveMove(move.id);
                }}
              >
                Leave
              </button>
            ) : (
              <button
                className="btn btn--small btn--primary"
                type="button"
                aria-label={`Join ${move.title}`}
                disabled={isJoinDisabled}
                aria-disabled={isJoinDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isFull && !isPast) onJoinMove(move.id);
                }}
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
