export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
  name?: string;
};

export type PlacePrediction = {
  description: string;
  placeId: string;
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const EVANSTON_CENTER = { lat: 42.0451, lng: -87.6877 };
const EVANSTON_RADIUS_METERS = 8000;

const loadPlacesLibrary = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps Places requires a browser environment.'));
  }
  if ((window as any).google?.maps?.places) return Promise.resolve((window as any).google);
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error('Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in your environment.'),
    );
  }

  if ((window as any)._gmapsPlacesPromise) return (window as any)._gmapsPlacesPromise;

  (window as any)._gmapsPlacesPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error('Failed to load Google Maps Places script.'));
    document.head.appendChild(script);
  });

  return (window as any)._gmapsPlacesPromise;
};

export const fetchPlacePredictions = async (query: string): Promise<PlacePrediction[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const google = await loadPlacesLibrary();
  const service = new google.maps.places.AutocompleteService();
  const sessionToken = new google.maps.places.AutocompleteSessionToken();

  const request: google.maps.places.AutocompletionRequest = {
    input: trimmed,
    sessionToken,
    location: new google.maps.LatLng(EVANSTON_CENTER.lat, EVANSTON_CENTER.lng),
    radius: EVANSTON_RADIUS_METERS,
    componentRestrictions: { country: 'us' },
  };

  return new Promise<PlacePrediction[]>((resolve) => {
    service.getPlacePredictions(
      request,
      (results: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }
        resolve(
          results.map((prediction: google.maps.places.AutocompletePrediction) => ({
            description: prediction.description,
            placeId: prediction.place_id,
          })),
        );
      },
    );
  });
};

export const fetchPlaceDetails = async (placeId: string): Promise<GeocodeResult | null> => {
  if (!placeId) return null;
  const google = await loadPlacesLibrary();
  const sessionToken = new google.maps.places.AutocompleteSessionToken();
  const dummyEl = document.createElement('div');
  const service = new google.maps.places.PlacesService(dummyEl);

  const request: google.maps.places.PlaceDetailsRequest = {
    placeId,
    sessionToken,
    fields: ['geometry.location', 'formatted_address', 'place_id'],
  };

  return new Promise<GeocodeResult | null>((resolve) => {
    service.getDetails(
      request,
      (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
        resolve(null);
        return;
      }

        const location = result.geometry?.location;
        if (!location) {
          resolve(null);
          return;
        }

        resolve({
          latitude: location.lat(),
          longitude: location.lng(),
          formattedAddress: result.formatted_address ?? '',
          placeId: result.place_id ?? placeId,
          name: result.name ?? undefined,
        });
      },
    );
  });
};
