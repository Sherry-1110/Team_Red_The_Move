import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CampusArea, ActivityType } from '../types';
import { AREA_FILTERS, ACTIVITY_FILTERS } from '../types';
import { fetchPlaceDetails, fetchPlacePredictions, type PlacePrediction } from '../utilities/geocode';

type FormState = {
  title: string;
  description: string;
  signupPrompt: string;
  signupPromptRequiresResponse: boolean;
  location: string;
  locationName?: string;
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  endTime: string;
  maxParticipants: number | '';
  area: CampusArea;
  activityType: ActivityType;
};

type CreateMoveScreenProps = {
  onCreateMove: (formData: FormState) => void;
  onClose?: () => void;
};

export const CreateMoveScreen = ({ onCreateMove, onClose }: CreateMoveScreenProps) => {
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getLocalTimeString = (date: Date) => date.toTimeString().slice(0, 5);
  const toLocalDateTimeValue = (date: Date) =>
    `${getLocalDateString(date)}T${getLocalTimeString(date)}`;
  const getDatePart = (value: string) => value.split('T')[0] ?? '';
  const getTimePart = (value: string) => value.split('T')[1] ?? '00:00';

  const initialNow = new Date();
  initialNow.setSeconds(0, 0);
  const initialEnd = new Date(initialNow.getTime() + 60 * 60 * 1000); // Same date, one hour later

  const [formState, setFormState] = useState<FormState>({
    title: '',
    description: '',
    signupPrompt: '',
    signupPromptRequiresResponse: false,
    location: '',
    locationName: undefined,
    locationUrl: undefined,
    latitude: undefined,
    longitude: undefined,
    startTime: toLocalDateTimeValue(initialNow),
    endTime: toLocalDateTimeValue(initialEnd),
    maxParticipants: 2,
    area: 'North',
    activityType: 'Social',
  });
  const [formError, setFormError] = useState('');
  const [titleWarning, setTitleWarning] = useState('');
  const [maxParticipantsWarning, setMaxParticipantsWarning] = useState('');
  const [startTimeWarning, setStartTimeWarning] = useState('');
  const [endTimeWarning, setEndTimeWarning] = useState('');
  const [predictionError, setPredictionError] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isFetchingPredictions, setIsFetchingPredictions] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [startHourInput, setStartHourInput] = useState('12');
  const [startMinuteInput, setStartMinuteInput] = useState('00');
  const [endHourInput, setEndHourInput] = useState('1');
  const [endMinuteInput, setEndMinuteInput] = useState('00');
  const [isStartHourFocused, setIsStartHourFocused] = useState(false);
  const [isStartMinuteFocused, setIsStartMinuteFocused] = useState(false);
  const [isEndHourFocused, setIsEndHourFocused] = useState(false);
  const [isEndMinuteFocused, setIsEndMinuteFocused] = useState(false);
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const activityMenuRef = useRef<HTMLDivElement | null>(null);
  const areaMenuRef = useRef<HTMLDivElement | null>(null);
  const startMinuteRef = useRef<HTMLInputElement | null>(null);
  const endMinuteRef = useRef<HTMLInputElement | null>(null);
  const parseTimeParts = (value: string) => {
    const [hoursRaw, minutesRaw] = value.split(':');
    const hours24 = Number(hoursRaw);
    const minutes = Number(minutesRaw ?? '0');
    const safeHours24 = Number.isFinite(hours24) ? hours24 : 0;
    const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
    const hour12 = safeHours24 % 12 === 0 ? 12 : safeHours24 % 12;
    const period = safeHours24 < 12 ? 'AM' : 'PM';
    return { hour12, minute: safeMinutes, period };
  };
  const toTimeValue = (hour12: number, minute: number, period: 'AM' | 'PM') => {
    const normalizedHour = Math.min(12, Math.max(1, Math.round(hour12)));
    const normalizedMinute = Math.min(59, Math.max(0, Math.round(minute)));
    const hours24 = period === 'AM'
      ? normalizedHour % 12
      : normalizedHour % 12 + 12;
    return `${String(hours24).padStart(2, '0')}:${String(normalizedMinute).padStart(2, '0')}`;
  };

  const validateAndSetStartTime = (datePart: string, timePart: string, isTimeChange: boolean = false) => {
    const candidate = `${datePart}T${timePart}`;
    const candidateTime = new Date(candidate).getTime();
    const nowValue = new Date();
    nowValue.setSeconds(0, 0);
    const nowTime = nowValue.getTime();
    const isInvalid = Number.isNaN(candidateTime) || candidateTime < nowTime;
    if (isInvalid) {
      setStartTimeWarning('Start time must be in the future.');
    } else {
      setStartTimeWarning('');
    }
    // Always update to user's choice when toggling AM/PM so the button visibly switches
    const startTimeToSet = isInvalid && !isTimeChange ? toLocalDateTimeValue(nowValue) : candidate;

    setFormState((prev) => {
      const newState = { ...prev, startTime: startTimeToSet };

      // Auto-update end date to match start date if they're different
      const currentEndDate = getDatePart(prev.endTime);
      if (currentEndDate !== datePart) {
        const currentEndTime = getTimePart(prev.endTime);
        newState.endTime = `${datePart}T${currentEndTime}`;
      }

      // Auto-update end time to one hour after start time when start time changes
      if (isTimeChange) {
        const startDate = new Date(startTimeToSet);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add one hour
        const endDatePart = getDatePart(newState.endTime); // Use the updated end date
        const newEndTime = getLocalTimeString(endDate);
        newState.endTime = `${endDatePart}T${newEndTime}`;
      }

      return newState;
    });
  };

  const validateAndSetEndTime = (datePart: string, timePart: string) => {
    const candidate = `${datePart}T${timePart}`;
    const candidateTime = new Date(candidate).getTime();
    const nowValue = new Date();
    nowValue.setSeconds(0, 0);
    const nowTime = nowValue.getTime();
    const isInvalid = Number.isNaN(candidateTime) || candidateTime < nowTime;
    if (isInvalid) {
      setEndTimeWarning('End time must be in the future.');
    } else {
      setEndTimeWarning('');
    }
    // Always update to candidate so AM/PM toggle is visible; submit will block if invalid
    setFormState((prev) => ({ ...prev, endTime: candidate }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedMaxParticipants =
      typeof formState.maxParticipants === 'number' && Number.isFinite(formState.maxParticipants)
        ? formState.maxParticipants
        : 2;
    if (
      !formState.title ||
      !formState.location ||
      !formState.startTime ||
      !formState.endTime ||
      !formState.activityType
    ) {
      setFormError(
        'Add a title, location, activity type, start time, and end time to post a move.',
      );
      return;
    }
    if (formState.title.length > 50) {
      setFormError('Title must be 50 characters or fewer.');
      return;
    }
    if (normalizedMaxParticipants < 2) {
      setFormError('Max participants must be at least 2.');
      return;
    }
    if (normalizedMaxParticipants > 50) {
      setFormError('Max participants cannot exceed 50.');
      return;
    }
    if (formState.latitude == null || formState.longitude == null) {
      setFormError('Pick a suggested location so we can place it on the map.');
      return;
    }
    const start = new Date(formState.startTime).getTime();
    const end = new Date(formState.endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      setFormError('End time must be after the start time.');
      return;
    }
    if (start < Date.now()) {
      setFormError('Start time must be in the future.');
      return;
    }
    setFormError('');
    onCreateMove({
      ...formState,
      maxParticipants: normalizedMaxParticipants,
    });
    const resetNow = new Date();
    resetNow.setSeconds(0, 0);
    const resetEnd = new Date(resetNow.getTime() + 60 * 60 * 1000); // Same date, one hour later
    setFormState({
      title: '',
      description: '',
      signupPrompt: '',
      signupPromptRequiresResponse: false,
      location: '',
      locationName: undefined,
      locationUrl: undefined,
      latitude: undefined,
      longitude: undefined,
      startTime: toLocalDateTimeValue(resetNow),
      endTime: toLocalDateTimeValue(resetEnd),
      maxParticipants: 2,
      area: 'North',
      activityType: 'Social',
    });
    setPredictions([]);
    setPredictionError('');
    setResolvedAddress('');
  };

  const isFormComplete =
    Boolean(formState.title.trim()) &&
    Boolean(formState.location.trim()) &&
    Boolean(formState.startTime) &&
    Boolean(formState.endTime) &&
    Boolean(formState.activityType) &&
    Boolean(formState.area);

  useEffect(() => {
    const query = formState.location.trim();

    if (resolvedAddress && resolvedAddress !== query) {
      setResolvedAddress('');
      setFormState((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
    }

    if (!query) {
      setPredictionError('');
      setPredictions([]);
      setResolvedAddress('');
      setFormState((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
      return () => { };
    }

    let canceled = false;
    const debounce = setTimeout(async () => {
      setIsFetchingPredictions(true);
      setPredictionError('');
      try {
        const results = await fetchPlacePredictions(query);
        if (canceled) return;
        setPredictions(results);
        if (results.length === 0) {
          setPredictionError('No nearby matches. Try a more specific building name.');
        }
      } catch (error) {
        if (!canceled) {
          setPredictionError('Could not fetch suggestions. Check your network or API key.');
          setPredictions([]);
        }
      } finally {
        if (!canceled) {
          setIsFetchingPredictions(false);
        }
      }
    }, 400);

    return () => {
      canceled = true;
      clearTimeout(debounce);
    };
  }, [formState.location, resolvedAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (activityMenuRef.current && !activityMenuRef.current.contains(target)) {
        setIsActivityMenuOpen(false);
      }
      if (areaMenuRef.current && !areaMenuRef.current.contains(target)) {
        setIsAreaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setIsResolvingPlace(true);
    setFormError('');
    setPredictionError('');
    try {
      const details = await fetchPlaceDetails(prediction.placeId);
      if (!details) {
        setPredictionError('Could not fetch that place. Try another suggestion.');
        return;
      }
      setFormState((prev) => ({
        ...prev,
        location: details.formattedAddress || prediction.description,
        locationName: details.name || prediction.description,
        locationUrl: details.placeId
          ? `https://www.google.com/maps/search/?api=1&query=place_id:${details.placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.formattedAddress || prediction.description)}`,
        latitude: details.latitude,
        longitude: details.longitude,
      }));
      setResolvedAddress(details.name || details.formattedAddress || prediction.description);
      setPredictions([]);
    } catch (error) {
      setPredictionError('Could not fetch that place. Try another suggestion.');
    } finally {
      setIsResolvingPlace(false);
    }
  };

  const startDatePart = getDatePart(formState.startTime);
  const endDatePart = getDatePart(formState.endTime);
  const startTimePart = getTimePart(formState.startTime);
  const endTimePart = getTimePart(formState.endTime);
  const todayDate = getLocalDateString(new Date());
  const nowTime = getLocalTimeString(new Date());
  const isStartDateToday = startDatePart === todayDate;
  const isEndDateSameAsStart = endDatePart === startDatePart;
  const startParts = parseTimeParts(startTimePart);
  const endParts = parseTimeParts(endTimePart);

  useEffect(() => {
    if (!isStartHourFocused) {
      setStartHourInput(String(startParts.hour12));
    }
    if (!isStartMinuteFocused) {
      setStartMinuteInput(String(startParts.minute).padStart(2, '0'));
    }
  }, [startParts.hour12, startParts.minute, startParts.period, isStartHourFocused, isStartMinuteFocused]);

  useEffect(() => {
    if (!isEndHourFocused) {
      setEndHourInput(String(endParts.hour12));
    }
    if (!isEndMinuteFocused) {
      setEndMinuteInput(String(endParts.minute).padStart(2, '0'));
    }
  }, [endParts.hour12, endParts.minute, endParts.period, isEndHourFocused, isEndMinuteFocused]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="create-panel modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-heading">
          <h2>Create a Move</h2>
          <p>Share a quick plan and publish it instantly.</p>
          {onClose && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span className="form-label">
              Title <span className="form-required">*</span>
            </span>
            <input
              type="text"
              value={formState.title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                const trimmedTitle = nextTitle.slice(0, 50);
                setFormState((prev) => ({ ...prev, title: trimmedTitle }));
                setTitleWarning(
                  nextTitle.length > 50 ? 'Title must be 50 characters or fewer.' : '',
                );
              }}
              placeholder="Pickup soccer on Tech Lawn"
              required
            />
            {titleWarning && <p className="form-error">{titleWarning}</p>}
          </label>
          <label>
            <span>Description</span>
            <textarea
              rows={1}
              className="form-textarea--single"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="What&apos;s the vibe? What should people bring?"
            />
          </label>
          <label>
            <span className="form-label">
              Location <span className="form-required">*</span>
            </span>
            <span className="form-helper">
              <em>
                Location must be a street address or building name; add specific details in the
                description.
              </em>
            </span>
            <input
              type="text"
              value={formState.location}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="Search Evanston buildings or places"
              required
            />
          </label>
          <div className="suggestions">
            {!resolvedAddress && isFetchingPredictions && (
              <p className="helper-text">Searching nearby Evanston spots...</p>
            )}
            {!resolvedAddress && predictionError && <p className="form-error">{predictionError}</p>}
            {!resolvedAddress && predictions.length > 0 && (
              <ul className="suggestion-list">
                {predictions.map((prediction) => (
                  <li key={prediction.placeId}>
                    <button
                      type="button"
                      className="suggestion-item"
                      onClick={() => handleSelectPrediction(prediction)}
                      disabled={isResolvingPlace}
                    >
                      {prediction.description}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-row-labels">
            <span className="form-label">
              Start Date <span className="form-required">*</span>
            </span>
            <span className="form-label">
              Start Time <span className="form-required">*</span>
            </span>
          </div>
          <div className="form-row form-row--time">
            <label>
              <span className="form-label">
                Start Date <span className="form-required">*</span>
              </span>
              <input
                type="date"
                value={startDatePart}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  const timePart = getTimePart(formState.startTime);
                  validateAndSetStartTime(nextDate, timePart);
                }}
                required
              />
            </label>
            <label>
              <span className="form-label">
                Start Time <span className="form-required">*</span>
              </span>
              <div className="time-box">
                <div className="time-inputs">
                  <input
                    className="time-input time-input--hour"
                    type="text"
                    inputMode="numeric"
                    value={startHourInput}
                    onFocus={() => setIsStartHourFocused(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        startMinuteRef.current?.focus();
                        startMinuteRef.current?.select();
                      }
                    }}
                    onChange={(event) => {
                      const nextRaw = event.target.value.replace(/[^\d]/g, '');
                      if (nextRaw.length > 2) return;
                      setStartHourInput(nextRaw);
                      if (nextRaw === '') return;
                      const nextHour = Number(nextRaw);
                      if (!Number.isFinite(nextHour)) return;
                      const nextTime = toTimeValue(
                        nextHour,
                        Number(startMinuteInput || startParts.minute),
                        startParts.period as 'AM' | 'PM',
                      );
                      const isDisabled = isStartDateToday && nextTime < nowTime;
                      if (isDisabled) return;
                      validateAndSetStartTime(startDatePart, nextTime, true);
                    }}
                    onBlur={() => {
                      setIsStartHourFocused(false);
                      if (startHourInput.trim() === '') {
                        setStartHourInput(String(startParts.hour12));
                      }
                    }}
                    aria-label="Start hour"
                  />
                  <span className="time-input__separator">:</span>
                  <input
                    className="time-input time-input--minute"
                    type="text"
                    inputMode="numeric"
                    value={startMinuteInput}
                    ref={startMinuteRef}
                    onFocus={() => setIsStartMinuteFocused(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    onChange={(event) => {
                      const nextRaw = event.target.value.replace(/[^\d]/g, '');
                      if (nextRaw.length > 2) return;
                      setStartMinuteInput(nextRaw);
                      if (nextRaw === '') return;
                      const nextMinute = Number(nextRaw);
                      if (!Number.isFinite(nextMinute)) return;
                      const nextTime = toTimeValue(
                        Number(startHourInput || startParts.hour12),
                        nextMinute,
                        startParts.period as 'AM' | 'PM',
                      );
                      const isDisabled = isStartDateToday && nextTime < nowTime;
                      if (isDisabled) return;
                      validateAndSetStartTime(startDatePart, nextTime, true);
                    }}
                    onBlur={() => {
                      setIsStartMinuteFocused(false);
                      if (startMinuteInput.trim() === '') {
                        setStartMinuteInput(String(startParts.minute).padStart(2, '0'));
                      }
                    }}
                    aria-label="Start minutes"
                  />
                </div>
                <div className="time-input__period">
                  <button
                    type="button"
                    className="time-pill is-selected"
                    onClick={() => {
                      const nextPeriod = startParts.period === 'AM' ? 'PM' : 'AM';
                      const nextTime = toTimeValue(startParts.hour12, startParts.minute, nextPeriod);
                      validateAndSetStartTime(startDatePart, nextTime, true);
                    }}
                    aria-label={`Start time period: ${startParts.period}, click to switch`}
                  >
                    {startParts.period}
                  </button>
                </div>
              </div>
            </label>
          </div>
          {startTimeWarning && <p className="form-error">{startTimeWarning}</p>}
          <div className="form-row-labels">
            <span className="form-label">
              End Date <span className="form-required">*</span>
            </span>
            <span className="form-label">
              End Time <span className="form-required">*</span>
            </span>
          </div>
          <div className="form-row form-row--time">
            <label>
              <span className="form-label">
                End Date <span className="form-required">*</span>
              </span>
              <input
                type="date"
                value={endDatePart}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  const timePart = getTimePart(formState.endTime);
                  validateAndSetEndTime(nextDate, timePart);
                }}
                required
              />
            </label>
            <label>
              <span className="form-label">
                End Time <span className="form-required">*</span>
              </span>
              <div className="time-box">
                <div className="time-inputs">
                  <input
                    className="time-input time-input--hour"
                    type="text"
                    inputMode="numeric"
                    value={endHourInput}
                    onFocus={() => setIsEndHourFocused(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        endMinuteRef.current?.focus();
                        endMinuteRef.current?.select();
                      }
                    }}
                    onChange={(event) => {
                      const nextRaw = event.target.value.replace(/[^\d]/g, '');
                      if (nextRaw.length > 2) return;
                      setEndHourInput(nextRaw);
                      if (nextRaw === '') return;
                      const nextHour = Number(nextRaw);
                      if (!Number.isFinite(nextHour)) return;
                      const nextTime = toTimeValue(
                        nextHour,
                        Number(endMinuteInput || endParts.minute),
                        endParts.period as 'AM' | 'PM',
                      );
                      const isDisabled = isEndDateSameAsStart && nextTime <= startTimePart;
                      if (isDisabled) return;
                      validateAndSetEndTime(endDatePart, nextTime);
                    }}
                    onBlur={() => {
                      setIsEndHourFocused(false);
                      if (endHourInput.trim() === '') {
                        setEndHourInput(String(endParts.hour12));
                      }
                    }}
                    aria-label="End hour"
                  />
                  <span className="time-input__separator">:</span>
                  <input
                    className="time-input time-input--minute"
                    type="text"
                    inputMode="numeric"
                    value={endMinuteInput}
                    ref={endMinuteRef}
                    onFocus={() => setIsEndMinuteFocused(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    onChange={(event) => {
                      const nextRaw = event.target.value.replace(/[^\d]/g, '');
                      if (nextRaw.length > 2) return;
                      setEndMinuteInput(nextRaw);
                      if (nextRaw === '') return;
                      const nextMinute = Number(nextRaw);
                      if (!Number.isFinite(nextMinute)) return;
                      const nextTime = toTimeValue(
                        Number(endHourInput || endParts.hour12),
                        nextMinute,
                        endParts.period as 'AM' | 'PM',
                      );
                      const isDisabled = isEndDateSameAsStart && nextTime <= startTimePart;
                      if (isDisabled) return;
                      validateAndSetEndTime(endDatePart, nextTime);
                    }}
                    onBlur={() => {
                      setIsEndMinuteFocused(false);
                      if (endMinuteInput.trim() === '') {
                        setEndMinuteInput(String(endParts.minute).padStart(2, '0'));
                      }
                    }}
                    aria-label="End minutes"
                  />
                </div>
                <div className="time-input__period">
                  <button
                    type="button"
                    className="time-pill is-selected"
                    onClick={() => {
                      const nextPeriod = endParts.period === 'AM' ? 'PM' : 'AM';
                      const nextTime = toTimeValue(endParts.hour12, endParts.minute, nextPeriod);
                      validateAndSetEndTime(endDatePart, nextTime);
                    }}
                    aria-label={`End time period: ${endParts.period}, click to switch`}
                  >
                    {endParts.period}
                  </button>
                </div>
              </div>
            </label>
          </div>
          {endTimeWarning && <p className="form-error">{endTimeWarning}</p>}
          <label>
            <span className="form-label">
              Max Participants <span className="form-required">*</span>
            </span>
            <input
              type="number"
              min={2}
              max={50}
              value={formState.maxParticipants}
              onChange={(event) => {
                const nextValue = event.target.valueAsNumber;
                const cappedValue = Number.isNaN(nextValue) ? '' : Math.min(nextValue, 50);
                setMaxParticipantsWarning(
                  Number.isNaN(nextValue)
                    ? ''
                    : nextValue > 50
                      ? 'Max participants cannot exceed 50.'
                      : nextValue < 2
                        ? 'Max participants must be at least 2.'
                        : '',
                );
                setFormState((prev) => ({
                  ...prev,
                  maxParticipants: cappedValue,
                }));
              }}
            />
            {maxParticipantsWarning && (
              <p className="form-error">{maxParticipantsWarning}</p>
            )}
          </label>
          <div className="form-row">
            <label>
              <span className="form-label">
                Activity Type <span className="form-required">*</span>
              </span>
              <div className="form-select" ref={activityMenuRef}>
                <button
                  type="button"
                  className="form-select__button"
                  aria-haspopup="listbox"
                  aria-expanded={isActivityMenuOpen}
                  onClick={() => {
                    setIsActivityMenuOpen((prev) => !prev);
                    setIsAreaMenuOpen(false);
                  }}
                >
                  {formState.activityType}
                </button>
                {isActivityMenuOpen && (
                  <div className="form-select__menu" role="listbox">
                    {ACTIVITY_FILTERS.filter((activity) => activity !== 'All').map(
                      (activity) => (
                        <button
                          key={activity}
                          type="button"
                          role="option"
                          aria-selected={activity === formState.activityType}
                          className={`sort-option${activity === formState.activityType ? ' sort-option--active' : ''
                            }`}
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              activityType: activity,
                            }));
                            setIsActivityMenuOpen(false);
                          }}
                        >
                          {activity}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </label>
            <label>
              <span className="form-label">
                Area <span className="form-required">*</span>
              </span>
              <div className="form-select" ref={areaMenuRef}>
                <button
                  type="button"
                  className="form-select__button"
                  aria-haspopup="listbox"
                  aria-expanded={isAreaMenuOpen}
                  onClick={() => {
                    setIsAreaMenuOpen((prev) => !prev);
                    setIsActivityMenuOpen(false);
                  }}
                >
                  {formState.area}
                </button>
                {isAreaMenuOpen && (
                  <div className="form-select__menu" role="listbox">
                    {AREA_FILTERS.filter((area) => area !== 'All').map((area) => (
                      <button
                        key={area}
                        type="button"
                        role="option"
                        aria-selected={area === formState.area}
                        className={`sort-option${area === formState.area ? ' sort-option--active' : ''}`}
                        onClick={() => {
                          setFormState((prev) => ({ ...prev, area }));
                          setIsAreaMenuOpen(false);
                        }}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
          <label>
            <span>Signup Prompts</span>
            <span className="form-helper">
              Add questions or notices for attendees when they sign up.
            </span>
            <textarea
              rows={2}
              value={formState.signupPrompt}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, signupPrompt: event.target.value }))
              }
              placeholder="Example: Share your phone number so we can coordinate."
            />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <button
            className={`btn btn--primary${isFormComplete ? '' : ' btn--disabled'}`}
            type="submit"
            disabled={!isFormComplete}
          >
            Post Move
          </button>
        </form>
      </section>
    </div>
  );
};
