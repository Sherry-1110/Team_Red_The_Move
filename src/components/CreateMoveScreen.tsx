import { useState, type FormEvent } from 'react';
import type { CampusArea, ActivityType } from '../types';
import { AREA_FILTERS, ACTIVITY_FILTERS } from '../types';

type FormState = {
  title: string;
  description: string;
  remarks: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  area: CampusArea;
  activityType: ActivityType;
};

type CreateMoveScreenProps = {
  onCreateMove: (formData: FormState) => void;
};

export const CreateMoveScreen = ({ onCreateMove }: CreateMoveScreenProps) => {
  const [formState, setFormState] = useState<FormState>({
    title: '',
    description: '',
    remarks: '',
    location: '',
    startTime: '',
    endTime: '',
    maxParticipants: 1,
    area: 'North',
    activityType: 'Social',
  });
  const [formError, setFormError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !formState.title ||
      !formState.description ||
      !formState.location ||
      !formState.startTime ||
      !formState.endTime ||
      !formState.activityType
    ) {
      setFormError(
        'Add a title, description, location, activity type, start time, and end time to post a move.',
      );
      return;
    }
    if (!Number.isFinite(formState.maxParticipants) || formState.maxParticipants < 1) {
      setFormError('Max participants must be at least 1.');
      return;
    }
    const start = new Date(formState.startTime).getTime();
    const end = new Date(formState.endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      setFormError('End time must be after the start time.');
      return;
    }
    setFormError('');
    onCreateMove(formState);
    setFormState({
      title: '',
      description: '',
      remarks: '',
      location: '',
      startTime: '',
      endTime: '',
      maxParticipants: 1,
      area: 'North',
      activityType: 'Social',
    });
  };

  return (
    <section className="create-panel">
      <div className="panel-heading">
        <h2>Create a Move</h2>
        <p>Share a quick plan and publish it instantly.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Pickup soccer on Tech Lawn"
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            rows={4}
            value={formState.description}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="What&apos;s the vibe? What should people bring?"
          />
        </label>
        <label>
          <span>Remarks</span>
          <input
            type="text"
            value={formState.remarks}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, remarks: event.target.value }))
            }
            placeholder="Optional notes for attendees"
          />
        </label>
        <label>
          <span>Location</span>
          <input
            type="text"
            value={formState.location}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, location: event.target.value }))
            }
            placeholder="Tech Lawn, Norris, or downtown"
          />
        </label>
        <div className="form-row">
          <label>
            <span>Start Time</span>
            <input
              type="datetime-local"
              value={formState.startTime}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, startTime: event.target.value }))
              }
            />
          </label>
          <label>
            <span>End Time</span>
            <input
              type="datetime-local"
              value={formState.endTime}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, endTime: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>Max Participants</span>
            <input
              type="number"
              min={1}
              required
              value={formState.maxParticipants}
              onChange={(event) => {
                const nextValue = event.target.valueAsNumber;
                setFormState((prev) => ({
                  ...prev,
                  maxParticipants: Number.isNaN(nextValue) ? prev.maxParticipants : nextValue,
                }));
              }}
            />
          </label>
          <label>
            <span>Activity Type</span>
            <select
              value={formState.activityType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  activityType: event.target.value as ActivityType,
                }))
              }
            >
              {ACTIVITY_FILTERS.filter((activity) => activity !== 'All').map(
                (activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            <span>Area</span>
            <select
              value={formState.area}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, area: event.target.value as CampusArea }))
              }
            >
              {AREA_FILTERS.filter((area) => area !== 'All').map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </div>
        {formError && <p className="form-error">{formError}</p>}
        <button className="btn btn--primary" type="submit">
          Post Move
        </button>
      </form>
    </section>
  );
};
