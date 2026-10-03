import * as Location from 'expo-location';

export type SosTrustedContact = {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
};

export type SosLocationResult = {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  mapsLink: string | null;
  message: string;
};

export type PreparedSos = {
  activatedAt: string;
  selectedContacts: SosTrustedContact[];
  location: SosLocationResult | null;
};

const LOCATION_TIMEOUT_MS = 15000;

export function createSosPreparation(
  contacts: SosTrustedContact[],
): PreparedSos {
  return {
    activatedAt: new Date().toISOString(),
    selectedContacts: contacts.map((contact) => ({ ...contact })),
    location: null,
  };
}

export async function retrieveSosLocation(): Promise<SosLocationResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    let permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (!permission.granted) {
      return {
        coordinates: null,
        mapsLink: null,
        message: permission.canAskAgain
          ? 'Location permission was denied. Emergency calling remains available.'
          : 'Location permission is disabled. Enable it in phone settings if you want to include your position. Emergency calling remains available.',
      };
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      return {
        coordinates: null,
        mapsLink: null,
        message:
          'Phone location services are turned off. Emergency calling remains available.',
      };
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Location request timed out.'));
        }, LOCATION_TIMEOUT_MS);
      }),
    ]);

    const { latitude, longitude } = position.coords;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      throw new Error('Invalid location coordinates.');
    }

    return {
      coordinates: { latitude, longitude },
      mapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
      message:
        'Location retrieved for this activation. This is a location snapshot, not live tracking.',
    };
  } catch {
    return {
      coordinates: null,
      mapsLink: null,
      message:
        'Could not retrieve your current location. You can retry or use emergency calling without it.',
    };
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}