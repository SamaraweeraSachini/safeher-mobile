import type { RouteCoordinate } from '@/src/types/route';

export type LocationSuggestion = RouteCoordinate & {
  id: string;
  name: string;
};

type GeoapifyResult = {
  place_id?: string;
  formatted?: string;
  lat?: number;
  lon?: number;
};

type GeoapifyResponse = {
  results?: GeoapifyResult[];
};

/** Returns validated location suggestions for an entered address. */
export async function getLocationSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<LocationSuggestion[]> {
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Geoapify API key is missing.');
  }

  const url =
    'https://api.geoapify.com/v1/geocode/autocomplete' +
    `?text=${encodeURIComponent(query.trim())}` +
    '&format=json&limit=5' +
    `&apiKey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error('Location suggestions could not be loaded.');
  }

  const data = (await response.json()) as GeoapifyResponse;

  if (!Array.isArray(data.results)) {
    throw new Error('Location suggestions returned an invalid response.');
  }

  return data.results.flatMap((place, index) => {
    const latitude = place.lat;
    const longitude = place.lon;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !place.formatted
    ) {
      return [];
    }

    return [
      {
        id: place.place_id ?? `${latitude}-${longitude}-${index}`,
        name: place.formatted,
        latitude,
        longitude,
      },
    ];
  });
}