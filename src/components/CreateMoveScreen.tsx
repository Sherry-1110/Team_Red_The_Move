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
};

export const CreateMoveScreen = ({ onCreateMove }: CreateMoveScreenProps) => {
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
  const initialEnd = new Date(initialNow.getTime() + 60 * 60 * 1000);

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
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const activityMenuRef = useRef<HTMLDivElement | null>(null);
  const areaMenuRef = useRef<HTMLDivElement | null>(null);

  const validateAndSetStartTime = (datePart: string, timePart: string) => {
    const candidate = `${datePart}T${timePart}`;
    const candidateTime = new Date(candidate).getTime();
    const nowValue = new Date();
    nowValue.setSeconds(0, 0);
    const nowTime = nowValue.getTime();
    if (Number.isNaN(candidateTime) || candidateTime < nowTime) {
      const fallback = toLocalDateTimeValue(nowValue);
      setStartTimeWarning('Start time must be in the future.');
      setFormState((prev) => ({ ...prev, startTime: fallback }));
      return;
    }
    setStartTimeWarning('');
    setFormState((prev) => ({ ...prev, startTime: candidate }));
  };

  const validateAndSetEndTime = (datePart: string, timePart: string) => {
    const candidate = `${datePart}T${timePart}`;
    const candidateTime = new Date(candidate).getTime();
    const nowValue = new Date();
    nowValue.setSeconds(0, 0);
    const oneHourLater = new Date(nowValue.getTime() + 60 * 60 * 1000);
    const nowTime = nowValue.getTime();
    if (Number.isNaN(candidateTime) || candidateTime < nowTime) {
      const fallback = toLocalDateTimeValue(oneHourLater);
      setEndTimeWarning('End time must be in the future.');
      setFormState((prev) => ({ ...prev, endTime: fallback }));
      return;
    }
    setEndTimeWarning('');
    setFormState((prev) => ({ ...prev, endTime: candidate }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedMaxParticipants =
      typeof formState.maxParticipants === 'number' && Number.isFinite(formState.maxParticipants)
        ? formState.maxParticipants
        : 1;
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
    const resetEnd = new Date(resetNow.getTime() + 60 * 60 * 1000);
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
      return () => {};
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

  return (
    <section className="create-panel">
      <div className="panel-heading">
        <h2>Create a Move</h2>
        <p>Share a quick plan and publish it instantly.</p>
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
        <div className="form-row">
          <label>
            <span className="form-label">
              Start Date <span className="form-required">*</span>
            </span>
            <input
              type="date"
              value={getDatePart(formState.startTime)}
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
            <input
              type="time"
              value={getTimePart(formState.startTime)}
              onChange={(event) => {
                const nextTime = event.target.value;
                const datePart = getDatePart(formState.startTime);
                validateAndSetStartTime(datePart, nextTime);
              }}
              required
            />
          </label>
        </div>
        {startTimeWarning && <p className="form-error">{startTimeWarning}</p>}
        <div className="form-row">
          <label>
            <span className="form-label">
              End Date <span className="form-required">*</span>
            </span>
            <input
              type="date"
              value={getDatePart(formState.endTime)}
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
            <input
              type="time"
              value={getTimePart(formState.endTime)}
              onChange={(event) => {
                const nextTime = event.target.value;
                const datePart = getDatePart(formState.endTime);
                validateAndSetEndTime(datePart, nextTime);
              }}
              required
            />
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
                        className={`sort-option${
                          activity === formState.activityType ? ' sort-option--active' : ''
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
  );
};
