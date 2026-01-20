import type { Move, ActivityType } from '../types';
import {
  formatTimeAgo,
  formatEventDayDate,
  formatEventTimeOnly,
  getStatusLabel,
} from '../utilities/helpers';

type MoveCardProps = {
  move: Move;
  now: number;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
};

export const MoveCard = ({ move, now, userName, onJoinMove, onLeaveMove, onSelectMove }: MoveCardProps) => {
  const isJoined = move.attendees.includes(userName);
  const isHost = move.hostName === userName;
  const statusLabel = getStatusLabel(move.startTime, move.endTime, now);
  const displayLocation = move.locationName || move.location;
  const isFull = move.attendees.length >= move.maxParticipants;
  const isJoinDisabled = !isJoined && isFull;
  const activityLabels: Record<ActivityType, string> = {
    Food: 'FD',
    Study: 'ST',
    Sports: 'SP',
    Social: 'SO',
    Other: 'OT',
  };

  return (
    <article className="move-card">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open move ${move.title}`}
        className="move-card__content move-card__content--horizontal"
        onClick={() => onSelectMove(move.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelectMove(move.id);
          }
        }}
      >
        <div className="move-card__icon" aria-hidden="true">
          <span>{activityLabels[move.activityType]}</span>
        </div>
        <div className="move-card__body">
          <div className="move-card__header">
            <div>
              <h3>{move.title}</h3>
              {move.remarks && (
                <p className="move-card__remarks">Remarks: {move.remarks}</p>
              )}
              <p className="move-card__subtitle">Hosted by {move.hostName}</p>
            </div>
            <div className="move-card__status">
              <span
                className={`status-badge ${statusLabel === 'Past' ? 'status-badge--past' : ''}`}
              >
                {statusLabel}
              </span>
              <span className="move-card__time">{formatTimeAgo(move.createdAt, now)}</span>
            </div>
          </div>
          <p className="move-card__description">{move.description}</p>
          <div className="move-card__meta">
            <span>{displayLocation}</span>
            <span>
              {formatEventDayDate(move.startTime)} {formatEventTimeOnly(move.startTime)} -{' '}
              {formatEventTimeOnly(move.endTime)}
            </span>
          </div>
          <div className="move-card__footer">
            <div className="move-card__tags">
              <span className="chip chip--soft">{move.area}</span>
              <span className="chip chip--soft">{move.activityType}</span>
            </div>
            <div className="move-card__actions">
              <span className="attendee-count">
                {move.attendees.length}/{move.maxParticipants}
              </span>
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
                    if (!isFull) onJoinMove(move.id);
                  }}
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
