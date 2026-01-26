import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, List as ListIcon, Star } from 'lucide-react';
import type { Move, CampusArea, ActivityType } from '../types';
import { AREA_FILTERS } from '../types';
import { MoveCard } from './MoveCard';
import { MapView } from './MapView';
import { useSavedMoves } from '../contexts/SavedMovesContext';
import { formatTimeAgo, formatEventTime, getStatusLabel } from '../utilities/helpers';

type ExploreScreenProps = {
  moves: Move[];
  now: number;
  userName: string;
  joinedMoves: Move[];
  hostingMoves: Move[];
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
  onCancelMove: (moveId: string) => void;
  onEditMove?: (moveId: string) => void;
};

export const ExploreScreen = ({ 
  moves, 
  now, 
  userName, 
  joinedMoves,
  hostingMoves,
  onJoinMove, 
  onLeaveMove, 
  onSelectMove,
  onCancelMove,
  onEditMove,
}: ExploreScreenProps) => {
  const [selectedAreas, setSelectedAreas] = useState<CampusArea[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ActivityType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'upcoming' | 'newest' | 'popularity'>('upcoming');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeView, setActiveView] = useState<'explore' | 'joined' | 'hosting' | 'saved'>('explore');
  const { unsaveMove, isSaved } = useSavedMoves();
  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const areaOptions = AREA_FILTERS.filter((area) => area !== 'All') as CampusArea[];
  const statusOptions = ['Upcoming', 'Live Now', 'Past'] as const;
  const categoryOptions: ActivityType[] = ['Sports', 'Social', 'Food', 'Study'];

  // Filter all moves to get only saved ones from the full collection
  const savedMoves = moves.filter((move) => isSaved(move.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterRef.current && filterRef.current.contains(target)) return;
      if (sortRef.current && sortRef.current.contains(target)) return;
      setIsFilterOpen(false);
      setIsSortOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMoves = moves.filter((move) => {
    // Filter by selected campus areas
    if (selectedAreas.length > 0 && !selectedAreas.includes(move.area)) {
      return false;
    }

    // Filter by selected statuses
    if (selectedStatuses.length > 0) {
      const status = now < new Date(move.startTime).getTime()
        ? 'Upcoming'
        : now <= new Date(move.endTime).getTime()
          ? 'Live Now'
          : 'Past';
      if (!selectedStatuses.includes(status)) {
        return false;
      }
    }

    // Filter by selected categories
    if (selectedCategories.length > 0 && !selectedCategories.includes(move.activityType)) {
      return false;
    }

    // Filter by search query (keyword, location)
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = `${move.title} ${move.description} ${move.location || ''} ${move.locationName || ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const exploreMoves = [...filteredMoves].sort((a, b) => {
    const getStatusRank = (move: Move) => {
      const start = new Date(move.startTime).getTime();
      const end = new Date(move.endTime).getTime();
      if (now >= start && now <= end) return 0; // Live Now
      if (now < start) return 1; // Upcoming
      return 2; // Past
    };

    if (sortBy === 'upcoming') {
      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;
      // If same status, upcoming/live: sort by start time (soonest first)
      if (rankA < 2) {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      // If past: sort by start time (most recent first)
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    }

    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    if (sortBy === 'popularity') {
      const attendeesDelta = b.attendees.length - a.attendees.length;
      if (attendeesDelta !== 0) return attendeesDelta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return 0;
  });

  return (
    <>
      <section className="explore-tools">
        {/* Tab Navigation for Explore, Joined, Hosting, Saved */}
        <nav className="my-moves-tabs" role="tablist" aria-label="Move Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'explore'}
            className={`my-moves-tab ${activeView === 'explore' ? 'my-moves-tab--active' : ''}`}
            onClick={() => setActiveView('explore')}
          >
            Explore
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'joined'}
            className={`my-moves-tab ${activeView === 'joined' ? 'my-moves-tab--active' : ''}`}
            onClick={() => setActiveView('joined')}
          >
            Joined
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'hosting'}
            className={`my-moves-tab ${activeView === 'hosting' ? 'my-moves-tab--active' : ''}`}
            onClick={() => setActiveView('hosting')}
          >
            Hosting
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'saved'}
            className={`my-moves-tab ${activeView === 'saved' ? 'my-moves-tab--active' : ''}`}
            onClick={() => setActiveView('saved')}
          >
            Saved
          </button>
        </nav>

        <div className="search-and-filters">
          <label className="search">
            <span className="sr-only">Search moves</span>
            <input
              type="search"
              placeholder="Search by activity, location, or keyword"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          {activeView === 'explore' && (
            <div className="filter-buttons-group">
              <div className="filter-dropdown" ref={filterRef}>
                <button
                  type="button"
                  className="filter-button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  aria-label="Filter moves"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </button>
          {isFilterOpen && (
            <div className="filter-menu">
              <div className="filter-section">
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={
                      selectedAreas.length === areaOptions.length &&
                      selectedStatuses.length === statusOptions.length &&
                      selectedCategories.length === categoryOptions.length
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedAreas(areaOptions);
                        setSelectedStatuses([...statusOptions]);
                        setSelectedCategories(categoryOptions);
                      } else {
                        setSelectedAreas([]);
                        setSelectedStatuses([]);
                        setSelectedCategories([]);
                      }
                    }}
                  />
                  <span>All</span>
                </label>
              </div>

              <div className="filter-section">
                <h4>Status</h4>
                {statusOptions.map((status) => (
                  <label key={status} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedStatuses((prev) => [...prev, status]);
                        } else {
                          setSelectedStatuses((prev) => prev.filter((item) => item !== status));
                        }
                      }}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <h4>Category</h4>
                {categoryOptions.map((category) => (
                  <label key={category} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedCategories((prev) => [...prev, category]);
                        } else {
                          setSelectedCategories((prev) => prev.filter((item) => item !== category));
                        }
                      }}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <h4>Campus Area</h4>
                {areaOptions.map((area) => (
                  <label key={area} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(area as CampusArea)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedAreas((prev) => [...prev, area as CampusArea]);
                        } else {
                          setSelectedAreas((prev) => prev.filter((item) => item !== area));
                        }
                      }}
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
            </div>

            <div className="sort-dropdown" ref={sortRef}>
          <button
            type="button"
            className="filter-button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-label="Sort moves"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21 16-4 4-4-4" />
              <path d="M17 20V4" />
              <path d="m3 8 4-4 4 4" />
              <path d="M7 4v16" />
            </svg>
          </button>
          {isSortOpen && (
            <div className="filter-menu sort-menu">
              {[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'newest', label: 'Newest Post' },
                { value: 'popularity', label: 'Most popular' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`view-option ${sortBy === option.value ? 'view-option--active' : ''}`}
                  onClick={() => {
                    setSortBy(option.value as 'upcoming' | 'newest' | 'popularity');
                    setIsSortOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
            </div>

            <button
              type="button"
              className="filter-button"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
              style={{ background: 'var(--purple)', color: '#fff' }}
            >
              {viewMode === 'list' ? <MapIcon size={20} /> : <ListIcon size={20} />}
            </button>
            </div>
          )}
        </div>

      </section>

      {/* Explore View */}
      {activeView === 'explore' && (
        <>
          <section aria-live="polite" className="move-list">
            {exploreMoves.length === 0 ? (
          <div className="empty-state">
            <h3>No moves yet</h3>
            <p>Try another filter or post a new hangout.</p>
          </div>
        ) : (
          exploreMoves.map((move) => (
            <MoveCard
              key={move.id}
              move={move}
              now={now}
              userName={userName}
              onJoinMove={onJoinMove}
              onLeaveMove={onLeaveMove}
              onSelectMove={onSelectMove}
            />
          ))
        )}
          </section>

        {viewMode === 'map' && exploreMoves.length > 0 && (
          <MapView
            moves={exploreMoves}
            now={now}
            userName={userName}
            onJoinMove={onJoinMove}
            onLeaveMove={onLeaveMove}
            onSelectMove={onSelectMove}
            onClose={() => setViewMode('list')}
          />
        )}
        </>
      )}

      {/* Joined Moves View */}
      {activeView === 'joined' && (
        <section className="move-list">
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
        </section>
      )}

      {/* Hosting Moves View */}
      {activeView === 'hosting' && (
        <section className="move-list">
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
        </section>
      )}

      {/* Saved Moves View */}
      {activeView === 'saved' && (
        <section className="move-list">
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
        </section>
      )}
    </>
  );
};