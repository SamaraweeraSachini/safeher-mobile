import * as Location from 'expo-location';

export type AddressCoordinate = {
  latitude:
    number;

  longitude:
    number;
};

export async function reverseGeocodeLocation(
  coordinate:
    AddressCoordinate
): Promise<string | null> {
  try {
    const results =
      await Location.reverseGeocodeAsync(
        coordinate
      );

    const first =
      results[0];

    if (!first) {
      return null;
    }

    const parts = [
      first.name,
      first.street,
      first.district,
      first.city,
      first.subregion,
      first.region,
      first.postalCode,
      first.country,
    ]
      .map(
        part =>
          part?.trim()
      )
      .filter(
        (
          part
        ): part is string =>
          Boolean(part)
      )
      .filter(
        (
          part,
          index,
          values
        ) =>
          values.indexOf(
            part
          ) === index
      );

    return (
      parts.join(
        ', '
      ) || null
    );
  } catch (
    error
  ) {
    console.warn(
      'Reverse geocoding failed:',
      error
    );

    return null;
  }
}