import { useState } from 'react';
import type { Move } from '../types';
import { formatTimeAgo, formatEventTime, getStatusLabel } from '../utilities/helpers';

type MoveDetailScreenProps = {
  move: Move;
  now: number;
  userId: string;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onCancelMove: (moveId: string) => void;
  onAddComment: (moveId: string, text: string) => void;
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
  onClose,
}: MoveDetailScreenProps) => {
  const [commentDraft, setCommentDraft] = useState('');

  const handleAddComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(move.id, trimmed);
    setCommentDraft('');
  };

  const statusLabel = getStatusLabel(move.startTime, move.endTime, now);
  const displayLocation = move.locationName || move.location;
  const mapsHref = move.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`;

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true">
      <div className="detail" data-testid="move-detail">
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
        <div className="detail__header">
          <div>
            <p className="eyebrow">{move.area} Campus</p>
            <h2>{move.title}</h2>
            <p className="detail__subtitle">Hosted by {move.hostName}</p>
          </div>
          <div className="detail__status">
            <span
              className={`status-badge ${statusLabel === 'Past' ? 'status-badge--past' : ''}`}
            >
              {statusLabel}
            </span>
            <span className="detail__time">{formatTimeAgo(move.createdAt, now)}</span>
          </div>
        </div>
        <p className="detail__description">{move.description}</p>
        <div className="detail__meta">
          <div>
            <strong>Location</strong>
            <span>
              {displayLocation}{' '}
              <a
                className="inline-link"
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
              >
                (Directions)
              </a>
            </span>
          </div>
          <div>
            <strong>Time</strong>
            <span>
              {formatEventTime(move.startTime)} - {formatEventTime(move.endTime)}
            </span>
          </div>
          <div>
            <strong>Activity</strong>
            <span>{move.activityType}</span>
          </div>
        </div>
        <div className="detail__actions">
          <span className="attendee-count" data-testid="attendee-count">
            {move.attendees.length} going
          </span>
          <div className="detail__buttons">
            {move.hostId === userId ? (
              <button
                className="btn btn--ghost"
                type="button"
                aria-label={`Cancel ${move.title}`}
                onClick={() => onCancelMove(move.id)}
              >
                Cancel Move
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

        <div className="detail__attendees">
          <h3>Attendees</h3>
          {move.attendees.includes(userName) ? (
            <ul>
              {move.attendees.map((attendee) => (
                <li key={attendee}>{attendee}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Join to see the attendee list.</p>
          )}
        </div>

        <div className="detail__comments">
          <h3>Comments</h3>
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
                  <p>{comment.text}</p>
                </div>
              ))
            )}
          </div>
          <div className="comment-form">
            <label>
              <span className="sr-only">Add a comment</span>
              <input
                type="text"
                placeholder="Coordinate details here"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
            </label>
            <button className="btn btn--primary" type="button" onClick={handleAddComment}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
