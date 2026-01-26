import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';
import type { Move, CampusArea, ActivityType } from '../types';
import { AREA_FILTERS } from '../types';
import { MoveCard } from './MoveCard';
import { MapView } from './MapView';

type ExploreScreenProps = {
  moves: Move[];
  now: number;
  userName: string;
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onSelectMove: (moveId: string) => void;
};

export const ExploreScreen = ({ moves, now, userName, onJoinMove, onLeaveMove, onSelectMove }: ExploreScreenProps) => {
  const [selectedAreas, setSelectedAreas] = useState<CampusArea[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ActivityType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'upcoming' | 'newest' | 'popularity'>('upcoming');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isMyMovesExpanded, setIsMyMovesExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const areaOptions = AREA_FILTERS.filter((area) => area !== 'All') as CampusArea[];
  const statusOptions = ['Upcoming', 'Live Now', 'Past'] as const;
  const categoryOptions: ActivityType[] = ['Sports', 'Social', 'Food', 'Study'];

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

  const myActiveMoves = moves
    .filter((move) => {
      const isHost = move.hostName === userName;
      const isJoined = move.attendees.includes(userName);
      if (!isHost && !isJoined) return false;

      const end = new Date(move.endTime).getTime();
      return end >= now; // Live or Upcoming (not Past)
    })
    .sort((a, b) => {
      const getStatusRank = (m: Move) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        if (now >= start && now <= end) return 0; // Live Now
        if (now < start) return 1; // Upcoming
        return 2; // Past
      };
      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  return (
    <>
      <section className="explore-tools">
        <label className="search">
          <span className="sr-only">Search moves</span>
          <input
            type="search"
            placeholder="Search by activity, location, or keyword"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
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
      </section>

      {myActiveMoves.length > 0 && (
        <div className="active-moves-section">
          <button
            className="active-moves-bar"
            onClick={() => setIsMyMovesExpanded(!isMyMovesExpanded)}
          >
            <span>
              You have <span className="active-moves-count">{myActiveMoves.length}</span> Moves
              live or upcoming.
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isMyMovesExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {isMyMovesExpanded && (
            <div className="active-moves-list">
              {myActiveMoves.map((move) => (
                <MoveCard
                  key={move.id}
                  move={move}
                  now={now}
                  userName={userName}
                  onJoinMove={onJoinMove}
                  onLeaveMove={onLeaveMove}
                  onSelectMove={onSelectMove}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <section aria-live="polite" className="move-list">
        {viewMode === 'list' ? (
          exploreMoves.length === 0 ? (
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
          )
        ) : (
          exploreMoves.length === 0 ? (
            <div className="empty-state">
              <h3>No moves yet</h3>
              <p>Try another filter or post a new hangout.</p>
            </div>
          ) : (
            <MapView
              moves={exploreMoves}
              now={now}
              userName={userName}
              onJoinMove={onJoinMove}
              onLeaveMove={onLeaveMove}
              onSelectMove={onSelectMove}
            />
          )
        )}
      </section>
    </>
  );
};
