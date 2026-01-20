import { LOCATION_COORDINATES } from '../utilities/locations';

type LocationSelectorProps = {
  selectedLocation: string;
  onChange: (location: string, latitude?: number, longitude?: number) => void;
};

export const LocationSelector = ({ selectedLocation, onChange }: LocationSelectorProps) => {
  const locations = Object.values(LOCATION_COORDINATES);

  return (
    <div className="location-selector">
      <label htmlFor="location-select">
        <span>Specific Location</span>
        <select
          id="location-select"
          value={selectedLocation}
          onChange={(e) => {
            const selected = e.target.value;
            const locationData = locations.find((loc) => loc.displayName === selected);
            if (locationData) {
              onChange(locationData.displayName, locationData.latitude, locationData.longitude);
            } else {
              onChange(selected);
            }
          }}
        >
          <option value="">Select a location</option>
          {locations.map((location) => (
            <option key={location.name} value={location.displayName}>
              {location.displayName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
