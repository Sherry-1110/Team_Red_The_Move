import { useState } from 'react';
import type { Move } from '../types';
import { AREA_FILTERS, ACTIVITY_FILTERS } from '../types';

type EditMoveScreenProps = {
  move: Move;
  onEditMove: (moveId: string, formData: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    area: string;
    activityType: string;
  }) => void;
  onClose: () => void;
};

export const EditMoveScreen = ({ move, onEditMove, onClose }: EditMoveScreenProps) => {
  const [formData, setFormData] = useState({
    title: move.title,
    description: move.description,
    location: move.location,
    startTime: new Date(move.startTime).toISOString().slice(0, 16),
    endTime: new Date(move.endTime).toISOString().slice(0, 16),
    area: move.area,
    activityType: move.activityType,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onEditMove(move.id, formData);
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="detail__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="detail__header">
          <h2>Edit Move</h2>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Title
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Beach Volleyball Game"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell people more about this event..."
              rows={3}
            />
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., North Beach"
            />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </label>

          <div className="form-row">
            <label>
              Start Time
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
              />
              {errors.startTime && <span className="form-error">{errors.startTime}</span>}
            </label>

            <label>
              End Time
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
              />
              {errors.endTime && <span className="form-error">{errors.endTime}</span>}
            </label>
          </div>

          <div className="form-row">
            <label>
              Area
              <select name="area" value={formData.area} onChange={handleInputChange}>
                <option value="">Select an area</option>
                {AREA_FILTERS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Activity Type
              <select
                name="activityType"
                value={formData.activityType}
                onChange={handleInputChange}
              >
                <option value="">Select activity type</option>
                {ACTIVITY_FILTERS.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="detail__buttons">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
