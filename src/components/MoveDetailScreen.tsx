import { useMemo, useState } from 'react';
import type { Move, ActivityType, CampusArea } from '../types';
import { formatTimeAgo, formatEventTime } from '../utilities/helpers';
import { useSavedMoves } from '../contexts/SavedMovesContext';
import {
  BookOpen,
  CalendarClock,
  MapPin,
  Plus,
  Star,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { ReactElement } from 'react';

type MoveDetailScreenProps = {
  move: Move;
  now: number;
  userId: string;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onCancelMove: (moveId: string) => void;
  onAddComment: (moveId: string, text: string) => void;
  onDeleteComment: (moveId: string, commentId: string) => void;
  onClose: () => void;
};

export const MoveDetailScreen = ({
  move,
  now,
  userId,
  userName,
  onJoinMove,
  onLeaveMove,
  onCancelMove,
  onAddComment,
  onDeleteComment,
  onClose,
}: MoveDetailScreenProps) => {
  const [commentDraft, setCommentDraft] = useState('');
  const { isSaved, toggleSave } = useSavedMoves();

  const handleAddComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(move.id, trimmed);
    setCommentDraft('');
  };

  const displayLocation = move.locationName || move.location;
  const mapsHref = move.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`;
  const attendeeInitials = useMemo(
    () =>
      move.attendees.map((attendee) =>
        attendee
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
      ),
    [move.attendees],
  );
  const shouldLimitAttendees = move.maxParticipants > 10;
  const visibleAttendeeCount = shouldLimitAttendees
    ? Math.min(10, attendeeInitials.length)
    : attendeeInitials.length;
  const remainingAttendeeCount = attendeeInitials.length - visibleAttendeeCount;
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
  const areaIcons: Record<CampusArea, ReactElement> = {
    North: <MapPin size={14} />,
    South: <MapPin size={14} />,
    Downtown: <MapPin size={14} />,
    Other: <MapPin size={14} />,
  };

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="detail"
        data-testid="move-detail"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="detail__close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="detail__title-row">
          <h2>{move.title}</h2>
          <div className="detail__title-actions">
            <button
              className="save-toggle-btn"
              type="button"
              aria-label={`${isSaved(move.id) ? 'Unsave' : 'Save'} ${move.title}`}
              aria-pressed={isSaved(move.id)}
              onClick={() => void toggleSave(move.id)}
            >
              <Star size={16} strokeWidth={2} fill={isSaved(move.id) ? 'currentColor' : 'none'} />
            </button>
            <div className="detail__buttons">
              {move.hostId === userId ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  aria-label={`Cancel ${move.title}`}
                  onClick={() => onCancelMove(move.id)}
                >
                  Leave
                </button>
              ) : move.attendees.includes(userName) ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  aria-label={`Leave ${move.title}`}
                  onClick={() => onLeaveMove(move.id)}
                >
                  Leave
                </button>
              ) : (
                <button
                  className="btn btn--primary"
                  type="button"
                  aria-label={`Join ${move.title}`}
                  onClick={() => onJoinMove(move.id)}
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="detail__badges">
          <span className="detail__badge">
            {areaIcons[move.area]}
            {move.area}
          </span>
          <span className="detail__badge">
            {activityIcons[move.activityType]}
            {move.activityType}
          </span>
        </div>
        <div className="detail__info-card">
          <p className="detail__description">{move.description}</p>
          <div className="detail__info">
            <div className="detail__info-row">
              <MapPin size={14} />
              <span>
                {displayLocation}{' '}
                <a className="inline-link" href={mapsHref} target="_blank" rel="noreferrer">
                  (Directions)
                </a>
              </span>
            </div>
            <div className="detail__info-row">
              <CalendarClock size={14} />
              <span>
                {formatEventTime(move.startTime)} - {formatEventTime(move.endTime)}
              </span>
            </div>
            <div className="detail__info-row">
              <UserRound size={14} />
              <span>Hosted by {move.hostName}</span>
            </div>
          </div>
        </div>

        <div className="detail__attendees">
          <div className="detail__attendees-header">
            <h3>Attendees</h3>
            <span className="attendee-count attendee-count--with-icon" data-testid="attendee-count">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <circle cx="12" cy="7" r="4" fill="currentColor" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
              </svg>
              {move.attendees.length}/{move.maxParticipants}
            </span>
          </div>
          {move.attendees.includes(userName) ? (
            <div className="detail__avatars">
              {attendeeInitials.slice(0, visibleAttendeeCount).map((initials, index) => (
                <span
                  key={`${initials}-${index}`}
                  className="detail__avatar detail__avatar--filled"
                >
                  {initials}
                </span>
              ))}
              {remainingAttendeeCount > 0 && (
                <span className="detail__avatar detail__avatar--filled">
                  +{remainingAttendeeCount}
                </span>
              )}
            </div>
          ) : (
            <p className="muted">Join to see the attendee list.</p>
          )}
        </div>

        <div className="detail__comments">
          <div className="detail__comment-input-container">
            <input
              type="text"
              className="detail__comment-input"
              placeholder="Comment here..."
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <button
              type="button"
              className="detail__comment-send"
              onClick={handleAddComment}
              disabled={!commentDraft.trim()}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="comments">
            {move.comments.length === 0 ? (
              <p className="muted">No comments yet. Start the plan.</p>
            ) : (
              move.comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment__header">
                    <strong>{comment.author}</strong>
                    <span>{formatTimeAgo(comment.createdAt, now)}</span>
                  </div>
                  <div className="comment__body">
                    <p>{comment.text}</p>
                    {comment.author === userName && (
                      <button
                        type="button"
                        className="comment__delete"
                        aria-label="Delete comment"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this comment?')) {
                            onDeleteComment(move.id, comment.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
