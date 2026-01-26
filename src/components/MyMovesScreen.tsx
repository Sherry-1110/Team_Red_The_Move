import { useState } from 'react';
import type { Move } from '../types';
import { formatTimeAgo, formatEventTime, getStatusLabel } from '../utilities/helpers';
import { useSavedMoves } from '../contexts/SavedMovesContext';
import { Star } from 'lucide-react';

type MyMovesScreenProps = {
  allMoves: Move[];
  joinedMoves: Move[];
  hostingMoves: Move[];
  now: number;
  onCancelMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
  onEditMove?: (moveId: string) => void;
};

export const MyMovesScreen = ({
  allMoves,
  joinedMoves,
  hostingMoves,
  now,
  onCancelMove,
  onLeaveMove,
  onSelectMove,
  onEditMove,
}: MyMovesScreenProps) => {
  const [myMovesTab, setMyMovesTab] = useState<'joined' | 'hosting' | 'saved'>('joined');
  const { unsaveMove, isSaved } = useSavedMoves();

  // Filter all moves to get only saved ones from the full collection
  const savedMoves = allMoves.filter((move) => {
    if (!isSaved(move.id)) return false;
    return new Date(move.endTime).getTime() >= now;
  });

  return (
    <section className="my-moves">
      <nav className="my-moves-tabs" role="tablist" aria-label="My Moves">
        <button
          type="button"
          role="tab"
          aria-selected={myMovesTab === 'joined'}
          className={`my-moves-tab ${myMovesTab === 'joined' ? 'my-moves-tab--active' : ''}`}
          onClick={() => setMyMovesTab('joined')}
        >
          Joined
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={myMovesTab === 'hosting'}
          className={`my-moves-tab ${myMovesTab === 'hosting' ? 'my-moves-tab--active' : ''}`}
          onClick={() => setMyMovesTab('hosting')}
        >
          Hosting
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={myMovesTab === 'saved'}
          className={`my-moves-tab ${myMovesTab === 'saved' ? 'my-moves-tab--active' : ''}`}
          onClick={() => setMyMovesTab('saved')}
        >
          Saved
        </button>
      </nav>
      <div className="move-list">
        {myMovesTab === 'joined' && (
          <>
            {joinedMoves.length === 0 ? (
              <div className="empty-state">
                <h3>No joined moves</h3>
                <p>Jump into a move from Explore to see it here.</p>
              </div>
            ) : (
              joinedMoves.map((move) => (
                <article key={move.id} className="move-card move-card--compact">
                  <div className="move-card__content">
                    <div className="move-card__header">
                      <div>
                        <h3>{move.title}</h3>
                        <p className="move-card__subtitle">Hosted by {move.hostName}</p>
                      </div>
                      <div className="move-card__status">
                        <span
                          className={`status-badge ${
                            getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                              ? 'status-badge--past'
                              : ''
                          }`}
                        >
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                        <span className="move-card__time">
                          {formatTimeAgo(move.createdAt, now)}
                        </span>
                      </div>
                    </div>
                    <div className="move-card__meta">
                      <span>{move.locationName || move.location}</span>
                      <span>
                        {formatEventTime(move.startTime)} - {formatEventTime(move.endTime)}
                      </span>
                      <span>{move.activityType}</span>
                    </div>
                    <div className="move-card__footer">
                      <span className="attendee-count">{move.attendees.length} going</span>
                      <div className="move-card__actions">
                        <button
                          className="btn btn--small"
                          type="button"
                          onClick={() => onSelectMove(move.id)}
                        >
                          Details
                        </button>
                        <button
                          className="btn btn--small btn--ghost"
                          type="button"
                          aria-label={`Leave ${move.title}`}
                          onClick={() => onLeaveMove(move.id)}
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </>
        )}
        {myMovesTab === 'hosting' && (
          <>
            {hostingMoves.length === 0 ? (
              <div className="empty-state">
                <h3>No hosting moves</h3>
                <p>Create a move to rally people nearby.</p>
              </div>
            ) : (
              hostingMoves.map((move) => (
                <article key={move.id} className="move-card move-card--compact">
                  <div className="move-card__content">
                    <div className="move-card__header">
                      <div>
                        <h3>{move.title}</h3>
                        <p className="move-card__subtitle">You&apos;re hosting</p>
                      </div>
                      <div className="move-card__status">
                        <span
                          className={`status-badge ${
                            getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                              ? 'status-badge--past'
                              : ''
                          }`}
                        >
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                        <span className="move-card__time">
                          {formatTimeAgo(move.createdAt, now)}
                        </span>
                      </div>
                    </div>
                    <div className="move-card__meta">
                      <span>{move.locationName || move.location}</span>
                      <span>
                        {formatEventTime(move.startTime)} - {formatEventTime(move.endTime)}
                      </span>
                    </div>
                    <div className="move-card__footer">
                      <span className="attendee-count">{move.attendees.length} going</span>
                      <div className="move-card__actions">
                        <button
                          className="btn btn--ghost btn--small"
                          type="button"
                          onClick={() => onEditMove?.(move.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--ghost btn--small"
                          type="button"
                          onClick={() => onCancelMove(move.id)}
                          aria-label="Cancel move"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                        <button
                          className="btn btn--small"
                          type="button"
                          onClick={() => onSelectMove(move.id)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </>
        )}
        {myMovesTab === 'saved' && (
          <>
            {savedMoves.length === 0 ? (
              <div className="empty-state">
                <h3>No saved moves</h3>
                <p>Save moves from Explore to see them here.</p>
              </div>
            ) : (
              savedMoves.map((move) => (
                <article key={move.id} className="move-card move-card--compact">
                  <div className="move-card__content">
                    <div className="move-card__header">
                      <div>
                        <h3>{move.title}</h3>
                        <p className="move-card__subtitle">Hosted by {move.hostName}</p>
                      </div>
                      <div className="move-card__status">
                        <span
                          className={`status-badge ${
                            getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                              ? 'status-badge--past'
                              : ''
                          }`}
                        >
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                        <span className="move-card__time">
                          {formatTimeAgo(move.createdAt, now)}
                        </span>
                      </div>
                    </div>
                    <div className="move-card__meta">
                      <span>{move.locationName || move.location}</span>
                      <span>
                        {formatEventTime(move.startTime)} - {formatEventTime(move.endTime)}
                      </span>
                      <span>{move.activityType}</span>
                    </div>
                    <div className="move-card__footer">
                      <span className="attendee-count">{move.attendees.length} going</span>
                      <div className="move-card__actions">
                        <button
                          className="btn btn--small"
                          type="button"
                          onClick={() => onSelectMove(move.id)}
                        >
                          Details
                        </button>
                        <button
                          className="save-toggle-btn"
                          type="button"
                          aria-label={`Unsave ${move.title}`}
                          aria-pressed="true"
                          onClick={() => void unsaveMove(move.id)}
                          title="Remove from saved"
                        >
                          <Star
                            size={16}
                            strokeWidth={2}
                            fill="currentColor"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </>
        )}
      </div>
    </section>
  )};
