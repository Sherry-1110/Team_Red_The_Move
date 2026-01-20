import { useState } from 'react';
import type { Move, CampusArea } from '../types';
import { AREA_FILTERS } from '../types';
import { MoveCard } from './MoveCard';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredMoves = moves.filter((move) => {
    // Filter by selected campus areas
    if (selectedAreas.length > 0 && !selectedAreas.includes(move.area)) {
      return false;
    }

    // Filter by search query (keyword, location)
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = `${move.title} ${move.description} ${move.location}`.toLowerCase();
    return haystack.includes(query);
  });

  const exploreMoves = [...filteredMoves].sort((a, b) => {
    const statusRank = (move: Move) => {
      const status =
        now < new Date(move.startTime).getTime()
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
            aria-label="Filter by campus area"
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
          )}
        </div>
      </section>

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
    </>
  );
};
