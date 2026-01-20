// Northwestern Campus and Evanston locations with coordinates
export type LocationName =
  | 'North Campus - Henry Crown Sports Pavilion'
  | 'North Campus - Kellogg School of Management'
  | 'North Campus - Norris Center'
  | 'North Campus - Rebecca Crown Center'
  | 'North Campus - Technological Institute'
  | 'North Campus - Lake Michigan'
  | 'South Campus - Seeley G. Mudd Library'
  | 'South Campus - University Library'
  | 'South Campus - Parkes Hall'
  | 'South Campus - Deering Library'
  | 'South Campus - Lakeside Field'
  | 'Downtown Evanston - Fountain Square'
  | 'Downtown Evanston - Whole Foods'
  | 'Downtown Evanston - Arts Park'
  | 'Downtown Evanston - Civic Center'
  | 'Downtown Evanston - Lighthouse Beach'
  | 'Other';

export interface LocationCoordinates {
  name: LocationName;
  latitude: number;
  longitude: number;
  area: 'North' | 'South' | 'Downtown' | 'Other';
  displayName: string;
}

export const LOCATION_COORDINATES: Record<LocationName, LocationCoordinates> = {
  'North Campus - Henry Crown Sports Pavilion': {
    name: 'North Campus - Henry Crown Sports Pavilion',
    latitude: 42.0534,
    longitude: -87.6756,
    area: 'North',
    displayName: 'Henry Crown Sports Pavilion',
  },
  'North Campus - Kellogg School of Management': {
    name: 'North Campus - Kellogg School of Management',
    latitude: 42.0535,
    longitude: -87.6768,
    area: 'North',
    displayName: 'Kellogg School',
  },
  'North Campus - Norris Center': {
    name: 'North Campus - Norris Center',
    latitude: 42.0547,
    longitude: -87.6752,
    area: 'North',
    displayName: 'Norris Center',
  },
  'North Campus - Rebecca Crown Center': {
    name: 'North Campus - Rebecca Crown Center',
    latitude: 42.0542,
    longitude: -87.6780,
    area: 'North',
    displayName: 'Rebecca Crown Center',
  },
  'North Campus - Technological Institute': {
    name: 'North Campus - Technological Institute',
    latitude: 42.0527,
    longitude: -87.6785,
    area: 'North',
    displayName: 'Tech Institute',
  },
  'North Campus - Lake Michigan': {
    name: 'North Campus - Lake Michigan',
    latitude: 42.0580,
    longitude: -87.6730,
    area: 'North',
    displayName: 'Lake Michigan',
  },
  'South Campus - Seeley G. Mudd Library': {
    name: 'South Campus - Seeley G. Mudd Library',
    latitude: 42.0468,
    longitude: -87.6775,
    area: 'South',
    displayName: 'Mudd Library',
  },
  'South Campus - University Library': {
    name: 'South Campus - University Library',
    latitude: 42.0455,
    longitude: -87.6790,
    area: 'South',
    displayName: 'University Library',
  },
  'South Campus - Parkes Hall': {
    name: 'South Campus - Parkes Hall',
    latitude: 42.0462,
    longitude: -87.6805,
    area: 'South',
    displayName: 'Parkes Hall',
  },
  'South Campus - Deering Library': {
    name: 'South Campus - Deering Library',
    latitude: 42.0475,
    longitude: -87.6765,
    area: 'South',
    displayName: 'Deering Library',
  },
  'South Campus - Lakeside Field': {
    name: 'South Campus - Lakeside Field',
    latitude: 42.0425,
    longitude: -87.6720,
    area: 'South',
    displayName: 'Lakeside Field',
  },
  'Downtown Evanston - Fountain Square': {
    name: 'Downtown Evanston - Fountain Square',
    latitude: 42.0458,
    longitude: -87.6858,
    area: 'Downtown',
    displayName: 'Fountain Square',
  },
  'Downtown Evanston - Whole Foods': {
    name: 'Downtown Evanston - Whole Foods',
    latitude: 42.0475,
    longitude: -87.6880,
    area: 'Downtown',
    displayName: 'Whole Foods',
  },
  'Downtown Evanston - Arts Park': {
    name: 'Downtown Evanston - Arts Park',
    latitude: 42.0440,
    longitude: -87.6870,
    area: 'Downtown',
    displayName: 'Arts Park',
  },
  'Downtown Evanston - Civic Center': {
    name: 'Downtown Evanston - Civic Center',
    latitude: 42.0430,
    longitude: -87.6900,
    area: 'Downtown',
    displayName: 'Civic Center',
  },
  'Downtown Evanston - Lighthouse Beach': {
    name: 'Downtown Evanston - Lighthouse Beach',
    latitude: 42.0495,
    longitude: -87.6850,
    area: 'Downtown',
    displayName: 'Lighthouse Beach',
  },
  Other: {
    name: 'Other',
    latitude: 42.0500,
    longitude: -87.6750,
    area: 'Other',
    displayName: 'Northwestern Area',
  },
};

export const getLocationCoordinates = (locationName: string): LocationCoordinates | null => {
  const location = Object.values(LOCATION_COORDINATES).find(
    (loc) => loc.displayName.toLowerCase() === locationName.toLowerCase()
  );
  return location || null;
};

export const getDefaultCoordinatesForArea = (area: string): LocationCoordinates => {
  const areaLocations = Object.values(LOCATION_COORDINATES).filter(
    (loc) => loc.area === area
  );
  return areaLocations.length > 0 ? areaLocations[0] : LOCATION_COORDINATES.Other;
};
