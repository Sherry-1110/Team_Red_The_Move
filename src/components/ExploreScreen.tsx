import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, List as ListIcon, CalendarClock, MapPin, Star, UserRound } from 'lucide-react';
import type { Move, CampusArea, ActivityType } from '../types';
import { AREA_FILTERS, AREA_LABELS } from '../types';
import { MoveCard } from './MoveCard';
import { MapView } from './MapView';
import { activityIcons } from './activityIcons';
import { useSavedMoves } from '../contexts/SavedMovesContext';
import { useLocation } from '../contexts/LocationContext';
import { formatDateRangeWithRelative, getStatusLabel } from '../utilities/helpers';

type ExploreScreenProps = {
  moves: Move[];
  now: number;
  userName: string;
  joinedMoves: Move[];
  hostingMoves: Move[];
  waitlistMoves: Move[];
  onJoinMove: (moveId: string) => void;
  onLeaveMove: (moveId: string) => void;
  onJoinWaitlist: (moveId: string) => void;
  onLeaveWaitlist: (moveId: string) => void;
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
  waitlistMoves,
  onJoinMove,
  onLeaveMove,
  onJoinWaitlist,
  onLeaveWaitlist,
  onSelectMove,
  onCancelMove,
  onEditMove,
}: ExploreScreenProps) => {
  const [selectedAreas, setSelectedAreas] = useState<CampusArea[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Upcoming', 'Live Now']);
  const [selectedCategories, setSelectedCategories] = useState<ActivityType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'upcoming' | 'newest' | 'popularity'>('upcoming');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeView, setActiveView] = useState<'explore' | 'joined' | 'hosting' | 'saved' | 'waitlist'>('explore');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showMyUpcoming, setShowMyUpcoming] = useState(false);

  const { unsaveMove, isSaved } = useSavedMoves();
  const { userLocation, isLocationLoading, requestLocation, hasLocationPermission } = useLocation();

  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLElement | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  const areaOptions = AREA_FILTERS.filter((area) => area !== 'All') as CampusArea[];
  const statusOptions = ['Upcoming', 'Live Now', 'Past'] as const;
  const categoryOptions: ActivityType[] = ['Sports', 'Social', 'Food', 'Study', 'Other'];

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

  // Show location prompt when switching to map view without permission
  useEffect(() => {
    console.log('Location check:', { viewMode, hasLocationPermission, userLocation });
    if (viewMode === 'map' && !hasLocationPermission && !userLocation) {
      console.log('Showing location prompt');
      setShowLocationPrompt(true);
    } else {
      setShowLocationPrompt(false);
    }
  }, [viewMode, hasLocationPermission, userLocation]);

  // Handle sticky tabs - works with .screen internal scrolling (Vicheda's layout)
  useEffect(() => {
    const handleScroll = () => {
      if (!tabsRef.current || !tabsContainerRef.current) return;

      const containerRect = tabsContainerRef.current.getBoundingClientRect();

      // Check if tabs should be sticky (when scrolled past their original position)
      // When container top is at or above viewport top, switch to fixed
      if (containerRect.top <= 0) {
        setIsTabsSticky(true);
      } else {
        setIsTabsSticky(false);
      }
    };

    // Find the .screen element (scroll container in Vicheda's layout)
    const screenElement = tabsRef.current?.closest('.screen');

    if (screenElement) {
      // Listen to scroll on .screen container (Vicheda's layout)
      screenElement.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Check initial state

      return () => screenElement.removeEventListener('scroll', handleScroll);
    } else {
      // Fallback to window scroll (if .screen not found)
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      return () => window.removeEventListener('scroll', handleScroll);
    }
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

  const sortActiveMoves = (list: Move[]) => {
    return [...list].sort((a, b) => {
      const getStatusRank = (move: Move) => {
        const start = new Date(move.startTime).getTime();
        const end = new Date(move.endTime).getTime();
        if (now >= start && now <= end) return 0; // Live Now
        if (now < start) return 1; // Upcoming
        return 2;
      };

      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;

      // Sort by start time (soonest first)
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  };

  const joinedActiveMoves = sortActiveMoves(
    moves.filter((move) => {
      const isJoined = move.attendees.includes(userName);
      const isHost = move.hostName === userName;
      if (!isJoined || isHost) return false;
      return now < new Date(move.endTime).getTime();
    }),
  );

  const hostingActiveMoves = sortActiveMoves(
    moves.filter((move) => {
      if (move.hostName !== userName) return false;
      return now < new Date(move.endTime).getTime();
    }),
  );

  const myActiveMovesCount = joinedActiveMoves.length + hostingActiveMoves.length;

  const locationPromptContent = (
    <div className="location-prompt">
      <MapPin size={18} />
      <p>Enable location to see where you are</p>
      <div className="location-prompt-actions">
        <button
          type="button"
          className="btn btn--small btn--primary"
          onClick={() => {
            requestLocation();
            setShowLocationPrompt(false);
          }}
          disabled={isLocationLoading}
        >
          {isLocationLoading ? 'Loading...' : 'Enable'}
        </button>
        <button
          type="button"
          className="btn btn--small btn--ghost"
          onClick={() => setShowLocationPrompt(false)}
        >
          Skip
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* In map view, portal the prompt on top of the map overlay so it's visible */}
      {showLocationPrompt && viewMode === 'map' && createPortal(
        <div className="location-prompt-overlay">
          {locationPromptContent}
        </div>,
        document.body
      )}
      {/* In list view, show prompt inline */}
      {showLocationPrompt && viewMode !== 'map' && locationPromptContent}

      {/* Tab Navigation for Explore, Joined, Hosting, Saved */}
      <div ref={tabsContainerRef}>
        <nav
          ref={tabsRef}
          className={`my-moves-tabs ${isTabsSticky ? 'my-moves-tabs--fixed' : ''}`}
          role="tablist"
          aria-label="Move Views"
        >
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
            aria-selected={activeView === 'waitlist'}
            className={`my-moves-tab ${activeView === 'waitlist' ? 'my-moves-tab--active' : ''}`}
            onClick={() => setActiveView('waitlist')}
          >
            Waitlist
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
      </div>

      <section className="explore-tools">
        <div className={`search-and-filters ${isSearchFocused ? 'search-focused' : ''}`}>
          <label className="search">
            <span className="sr-only">Search moves</span>
            <input
              type="search"
              placeholder="Search by activity, location, or keyword"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </label>

          {activeView === 'explore' && (
            <div className="filter-buttons-group">
              <div className="filter-dropdown" ref={filterRef}>
                <button
                  type="button"
                  className="filter-button"
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsSortOpen(false);
                  }}
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
                          <span>{AREA_LABELS[area]}</span>
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
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsFilterOpen(false);
                  }}
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

        {myActiveMovesCount > 0 && activeView === 'explore' && (
          <div className="my-upcoming-banner">
            <button
              type="button"
              className="my-upcoming-toggle"
              onClick={() => setShowMyUpcoming((prev) => !prev)}
            >
              <span className="my-upcoming-text">
                You have <span className="my-upcoming-count">{myActiveMovesCount}</span> {myActiveMovesCount === 1 ? 'Move' : 'Moves'} live now or upcoming.
              </span>
              <span className="my-upcoming-action">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="my-upcoming-arrow"
                  style={{ transform: showMyUpcoming ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>
            {showMyUpcoming && (
              <div className="my-upcoming-list">
                {/* Combined list of active moves (joined + hosting), sorted by start time */}
                {[...joinedActiveMoves, ...hostingActiveMoves]
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((move) => (
                    <MoveCard
                      key={move.id}
                      move={move}
                      now={now}
                      userName={userName}
                      onJoinMove={onJoinMove}
                      onLeaveMove={onLeaveMove}
                      onJoinWaitlist={onJoinWaitlist}
                      onLeaveWaitlist={onLeaveWaitlist}
                      onSelectMove={onSelectMove}
                      userLocation={userLocation}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
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
                  onJoinWaitlist={onJoinWaitlist}
                  onLeaveWaitlist={onLeaveWaitlist}
                  onSelectMove={onSelectMove}
                  userLocation={userLocation}
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
              onJoinWaitlist={onJoinWaitlist}
              onLeaveWaitlist={onLeaveWaitlist}
              onSelectMove={onSelectMove}
              userLocation={userLocation}
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
                <div
                  className="move-card__content move-card__content--clickable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${move.title}`}
                  onClick={() => onSelectMove(move.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMove(move.id);
                    }
                  }}
                >
                  <div className="move-card__header move-card__header--single-row">
                    <div>
                      <h3>{move.title}</h3>
                    </div>
                    <div className="move-card__status">
                      <div className="move-card__status-row">
                        <span className="move-card__badge">{activityIcons[move.activityType]}</span>
                        <span
                          className={`status-badge ${getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                            ? 'status-badge--past'
                            : ''
                            }`}
                        >
                          <span
                            className={`status-dot status-dot--${getStatusLabel(move.startTime, move.endTime, now)
                              .toLowerCase()
                              .replace(' ', '-')}`}
                            aria-hidden="true"
                          />
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="move-card__meta-stack">
                    <div className="move-card__meta-row">
                      <CalendarClock size={14} className="move-card__meta-icon" />
                      <span>{formatDateRangeWithRelative(move.startTime, move.endTime, now)}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <MapPin size={14} className="move-card__meta-icon" />
                      <span>{(move.locationName || move.location).split(',')[0]}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <UserRound size={14} className="move-card__meta-icon" />
                      <span>Hosted by {move.hostName}</span>
                    </div>
                  </div>
                  <div className="move-card__footer">
                    <span className="attendee-count attendee-count--with-icon">
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <circle cx="12" cy="7" r="4" fill="currentColor" />
                        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
                      </svg>
                      {move.attendees.length}/{move.maxParticipants}
                    </span>
                    <div className="move-card__actions">
                      <button
                        className="btn btn--small btn--ghost"
                        type="button"
                        aria-label={`Leave ${move.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeaveMove(move.id);
                        }}
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
                <div
                  className="move-card__content move-card__content--clickable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${move.title}`}
                  onClick={() => onSelectMove(move.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMove(move.id);
                    }
                  }}
                >
                  <div className="move-card__header move-card__header--single-row">
                    <div>
                      <h3>{move.title}</h3>
                    </div>
                    <div className="move-card__status">
                      <div className="move-card__status-row">
                        <span className="move-card__badge">{activityIcons[move.activityType]}</span>
                        <span
                          className={`status-badge ${getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                            ? 'status-badge--past'
                            : ''
                            }`}
                        >
                          <span
                            className={`status-dot status-dot--${getStatusLabel(move.startTime, move.endTime, now)
                              .toLowerCase()
                              .replace(' ', '-')}`}
                            aria-hidden="true"
                          />
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="move-card__meta-stack">
                    <div className="move-card__meta-row">
                      <CalendarClock size={14} className="move-card__meta-icon" />
                      <span>{formatDateRangeWithRelative(move.startTime, move.endTime, now)}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <MapPin size={14} className="move-card__meta-icon" />
                      <span>{(move.locationName || move.location).split(',')[0]}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <UserRound size={14} className="move-card__meta-icon" />
                      <span>You&apos;re hosting</span>
                    </div>
                  </div>
                  <div className="move-card__footer">
                    <span className="attendee-count attendee-count--with-icon">
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <circle cx="12" cy="7" r="4" fill="currentColor" />
                        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
                      </svg>
                      {move.attendees.length}/{move.maxParticipants}
                    </span>
                    <div className="move-card__actions">
                      <button
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMove?.(move.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelMove(move.id);
                        }}
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
                <div
                  className="move-card__content move-card__content--clickable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${move.title}`}
                  onClick={() => onSelectMove(move.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMove(move.id);
                    }
                  }}
                >
                  <div className="move-card__header move-card__header--single-row">
                    <div>
                      <h3>{move.title}</h3>
                    </div>
                    <div className="move-card__status">
                      <div className="move-card__status-row">
                        <span className="move-card__badge">{activityIcons[move.activityType]}</span>
                        <span
                          className={`status-badge ${getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                            ? 'status-badge--past'
                            : ''
                            }`}
                        >
                          <span
                            className={`status-dot status-dot--${getStatusLabel(move.startTime, move.endTime, now)
                              .toLowerCase()
                              .replace(' ', '-')}`}
                            aria-hidden="true"
                          />
                          {getStatusLabel(move.startTime, move.endTime, now)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="move-card__meta-stack">
                    <div className="move-card__meta-row">
                      <CalendarClock size={14} className="move-card__meta-icon" />
                      <span>{formatDateRangeWithRelative(move.startTime, move.endTime, now)}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <MapPin size={14} className="move-card__meta-icon" />
                      <span>{(move.locationName || move.location).split(',')[0]}</span>
                    </div>
                    <div className="move-card__meta-row">
                      <UserRound size={14} className="move-card__meta-icon" />
                      <span>Hosted by {move.hostName}</span>
                    </div>
                  </div>
                  <div className="move-card__footer">
                    <span className="attendee-count attendee-count--with-icon">
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <circle cx="12" cy="7" r="4" fill="currentColor" />
                        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
                      </svg>
                      {move.attendees.length}/{move.maxParticipants}
                    </span>
                    <div className="move-card__actions">
                      <button
                        className="save-toggle-btn"
                        type="button"
                        aria-label={`Unsave ${move.title}`}
                        aria-pressed="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          void unsaveMove(move.id);
                        }}
                        title="Remove from saved"
                      >
                        <Star
                          size={16}
                          strokeWidth={2}
                          fill="currentColor"
                        />
                      </button>
                      {move.attendees.includes(userName) ? (
                        <button
                          className="btn btn--small btn--ghost"
                          type="button"
                          aria-label={`Leave ${move.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeaveMove(move.id);
                          }}
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          className="btn btn--small btn--primary"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinMove(move.id);
                          }}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* Waitlist View */}
      {activeView === 'waitlist' && (
        <section className="move-list">
          {waitlistMoves.length === 0 ? (
            <div className="empty-state">
              <h3>No waitlist moves</h3>
              <p>Join waitlists for full events from Explore to see them here.</p>
            </div>
          ) : (
            waitlistMoves.map((move) => {
              const waitlist = Array.isArray(move.waitlist) ? move.waitlist : [];
              const waitlistPosition = waitlist.indexOf(userName) + 1;
              
              return (
                <article key={move.id} className="move-card move-card--compact">
                  <div
                    className="move-card__content move-card__content--clickable"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${move.title}`}
                    onClick={() => onSelectMove(move.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectMove(move.id);
                      }
                    }}
                  >
                    <div className="move-card__header move-card__header--single-row">
                      <div>
                        <h3>{move.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6a6279', margin: '4px 0 0 0' }}>
                          Position #{waitlistPosition} in waitlist
                        </p>
                      </div>
                      <div className="move-card__status">
                        <div className="move-card__status-row">
                          <span className="move-card__badge">{activityIcons[move.activityType]}</span>
                          <span
                            className={`status-badge ${getStatusLabel(move.startTime, move.endTime, now) === 'Past'
                              ? 'status-badge--past'
                              : ''
                              }`}
                          >
                            <span
                              className={`status-dot status-dot--${getStatusLabel(move.startTime, move.endTime, now)
                                .toLowerCase()
                                .replace(' ', '-')}`}
                              aria-hidden="true"
                            />
                            {getStatusLabel(move.startTime, move.endTime, now)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="move-card__meta-stack">
                      <div className="move-card__meta-row">
                        <CalendarClock size={14} className="move-card__meta-icon" />
                        <span>{formatDateRangeWithRelative(move.startTime, move.endTime, now)}</span>
                      </div>
                      <div className="move-card__meta-row">
                        <MapPin size={14} className="move-card__meta-icon" />
                        <span>{(move.locationName || move.location).split(',')[0]}</span>
                      </div>
                      <div className="move-card__meta-row">
                        <UserRound size={14} className="move-card__meta-icon" />
                        <span>Hosted by {move.hostName}</span>
                      </div>
                    </div>
                    <div className="move-card__footer">
                      <span className="attendee-count attendee-count--with-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <circle cx="12" cy="7" r="4" fill="currentColor" />
                          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
                        </svg>
                        {move.attendees.length}/{move.maxParticipants} • {waitlist.length} waiting
                      </span>
                      <div className="move-card__actions">
                        <button
                          className="btn btn--small btn--ghost"
                          type="button"
                          aria-label={`Leave waitlist for ${move.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeaveWaitlist(move.id);
                          }}
                        >
                          Leave Waitlist
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </>
  );
};
