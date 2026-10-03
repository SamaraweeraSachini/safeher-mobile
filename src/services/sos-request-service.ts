import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';
import type {
  PreparedSos,
  SosLocationResult,
  SosTrustedContact,
} from '@/src/services/sos-preparation-service';

export type ActiveSosRequest = {
  id: string;
  userId: string;
  status: 'active';
  simulation: true;
  preparation: PreparedSos;
};

function requestReference(userId: string) {
  return doc(firestore, 'users', userId, 'sosRequests', 'active');
}

function readActiveRequest(
  userId: string,
  data: DocumentData,
): ActiveSosRequest | null {
  if (data.status !== 'active') return null;

  if (
    data.userId !== userId ||
    data.simulation !== true ||
    !(data.activatedAt instanceof Timestamp) ||
    !Array.isArray(data.selectedContacts)
  ) {
    throw new Error('The saved SOS record is invalid.');
  }

  const selectedContacts: SosTrustedContact[] = data.selectedContacts.map(
    (value: unknown) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('The saved SOS contact data is invalid.');
      }

      const contact = value as Record<string, unknown>;

      if (
        typeof contact.id !== 'string' ||
        typeof contact.name !== 'string' ||
        typeof contact.relationship !== 'string' ||
        typeof contact.phoneNumber !== 'string'
      ) {
        throw new Error('The saved SOS contact data is invalid.');
      }

      return {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
      };
    },
  );

  let coordinates: SosLocationResult['coordinates'] = null;

  if (data.latitude !== null || data.longitude !== null) {
    if (
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number' ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude) ||
      Math.abs(data.latitude) > 90 ||
      Math.abs(data.longitude) > 180
    ) {
      throw new Error('The saved SOS location is invalid.');
    }

    coordinates = {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  }

  return {
    id: 'active',
    userId,
    status: 'active',
    simulation: true,
    preparation: {
      activatedAt: data.activatedAt.toDate().toISOString(),
      selectedContacts,
      location: {
        coordinates,
        mapsLink: coordinates
          ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
          : null,
        message:
          typeof data.locationMessage === 'string'
            ? data.locationMessage
            : 'Location information is unavailable.',
      },
    },
  };
}

export async function getActiveSosRequest(
  userId: string,
): Promise<ActiveSosRequest | null> {
  const snapshot = await getDocFromServer(requestReference(userId));

  return snapshot.exists()
    ? readActiveRequest(userId, snapshot.data())
    : null;
}

export async function saveActiveSosRequest(
  userId: string,
  preparation: PreparedSos,
): Promise<ActiveSosRequest> {
  if (!preparation.location) {
    throw new Error('Wait for the location result before saving SOS.');
  }

  const activationDate = new Date(preparation.activatedAt);

  if (!Number.isFinite(activationDate.getTime())) {
    throw new Error('The activation time is invalid.');
  }

  const reference = requestReference(userId);
  const location = preparation.location;

  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);

    if (snapshot.exists()) {
      const existing = readActiveRequest(userId, snapshot.data());

      if (existing) {
        // Repeated confirmation or retry must not overwrite active SOS.
        return existing;
      }

      throw new Error(
        'The previous SOS record is closed. Starting another request will be enabled with the SOS lifecycle task.',
      );
    }

    transaction.set(reference, {
      userId,
      status: 'active',
      simulation: true,
      activatedAt: Timestamp.fromDate(activationDate),
      createdAt: serverTimestamp(),
      latitude: location.coordinates?.latitude ?? null,
      longitude: location.coordinates?.longitude ?? null,
      locationMessage: location.message,
      locationUpdatedAt: serverTimestamp(),
      selectedContactIds: preparation.selectedContacts.map(
        (contact) => contact.id,
      ),
      selectedContacts: preparation.selectedContacts.map(
        (contact) => ({ ...contact }),
      ),
      cancelledAt: null,
      resolvedAt: null,
    });

    return {
      id: 'active',
      userId,
      status: 'active',
      simulation: true,
      preparation,
    };
  });
}

export async function updateActiveSosLocation(
  userId: string,
  location: SosLocationResult,
): Promise<ActiveSosRequest> {
  if (!location.coordinates) {
    throw new Error(location.message);
  }

  const reference = requestReference(userId);

  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists()) {
      throw new Error('No saved SOS request was found.');
    }

    const existing = readActiveRequest(userId, snapshot.data());

    if (!existing) {
      throw new Error('This SOS request is no longer active.');
    }

    transaction.update(reference, {
      latitude: location.coordinates!.latitude,
      longitude: location.coordinates!.longitude,
      locationMessage: location.message,
      locationUpdatedAt: serverTimestamp(),
    });

    return {
      ...existing,
      preparation: {
        ...existing.preparation,
        location,
      },
    };
  });
}