import { useState } from 'react';
import type { Move, CampusArea } from '../types';
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
  const [selectedMemberRanges, setSelectedMemberRanges] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popularity'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

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

    // Filter by member count ranges
    if (selectedMemberRanges.length > 0) {
      const memberCount = move.attendees.length;
      const matchesRange = selectedMemberRanges.some(range => {
        if (range === '1-3') return memberCount >= 1 && memberCount <= 3;
        if (range === '4-7') return memberCount >= 4 && memberCount <= 7;
        if (range === '8+') return memberCount >= 8;
        return false;
      });
      if (!matchesRange) {
        return false;
      }
    }

    // Filter by search query (keyword, location)
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = `${move.title} ${move.description} ${move.location || ''} ${move.locationName || ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const exploreMoves = [...filteredMoves].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'popularity') {
      // Sort by number of attendees (popularity)
      const attendeesDelta = b.attendees.length - a.attendees.length;
      if (attendeesDelta !== 0) return attendeesDelta;
      // If same number of attendees, sort by newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    // Default sorting by status and then by creation time
    const statusRank = (move: Move) => {
      const status = now < new Date(move.startTime).getTime()
        ? 'Upcoming'
        : now <= new Date(move.endTime).getTime()
          ? 'Live Now'
          : 'Past';
      if (status === 'Live Now') return 0;
      if (status === 'Upcoming') return 1;
      return 2;
    };
    const statusDelta = statusRank(a) - statusRank(b);
    if (statusDelta !== 0) return statusDelta;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
        <div className="filter-dropdown">
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
                <h4>Campus Area</h4>
                {AREA_FILTERS.filter((area) => area !== 'All').map((area) => (
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
              
              <div className="filter-section">
                <h4>Status</h4>
                {['Live Now', 'Upcoming', 'Past'].map((status) => (
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
                <h4>Group Size</h4>
                {['1-3', '4-7', '8+'].map((range) => (
                  <label key={range} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedMemberRanges.includes(range)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedMemberRanges((prev) => [...prev, range]);
                        } else {
                          setSelectedMemberRanges((prev) => prev.filter((item) => item !== range));
                        }
                      }}
                    />
                    <span>{range} members</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sort-dropdown">
          <button
            type="button"
            className="filter-button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-label="Sort moves"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="7" y1="12" x2="21" y2="12" />
              <line x1="12" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isSortOpen && (
            <div className="filter-menu sort-menu">
              {[
                { value: 'newest', label: 'Newest first' },
                { value: 'popularity', label: 'Most popular' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`view-option ${sortBy === option.value ? 'view-option--active' : ''}`}
                  onClick={() => {
                    setSortBy(option.value as 'newest' | 'popularity');
                    setIsSortOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="view-dropdown">
          <button
            type="button"
            className="filter-button"
            onClick={() => setIsViewMenuOpen((prev) => !prev)}
            aria-label="Choose view mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isViewMenuOpen && (
            <div className="filter-menu view-menu">
              {[
                { value: 'list', label: 'List view' },
                { value: 'map', label: 'Map view' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`view-option ${viewMode === option.value ? 'view-option--active' : ''}`}
                  onClick={() => {
                    setViewMode(option.value as 'list' | 'map');
                    setIsViewMenuOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

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
            <MapView moves={exploreMoves} onSelectMove={onSelectMove} />
          )
        )}
      </section>
    </>
  );
};
