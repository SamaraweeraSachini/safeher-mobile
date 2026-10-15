import {
  collection,
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

export type SosClosedStatus = 'cancelled' | 'resolved';

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
  if (data.status === 'cancelled' || data.status === 'resolved') {
    return null;
  }

  if (
    data.status !== 'active' ||
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
  const location = preparation.location;

  if (!location) {
    throw new Error('Wait for the location result before saving SOS.');
  }

  const activationDate = new Date(preparation.activatedAt);

  if (!Number.isFinite(activationDate.getTime())) {
    throw new Error('The activation time is invalid.');
  }

  const reference = requestReference(userId);

  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);

    if (snapshot.exists()) {
      const existing = readActiveRequest(userId, snapshot.data());

      if (existing) {
        return existing;
      }

      // A closed request already has a separate history record.
      // The current-request slot can now hold a new activation.
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
  expectedActivatedAt: string,
): Promise<ActiveSosRequest> {
  const coordinates = location.coordinates;

  if (!coordinates) {
    throw new Error(location.message);
  }

  return runTransaction(firestore, async (transaction) => {
    const reference = requestReference(userId);
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists()) {
      throw new Error('No saved SOS request was found.');
    }

    const existing = readActiveRequest(userId, snapshot.data());

    if (
      !existing ||
      existing.preparation.activatedAt !== expectedActivatedAt
    ) {
      throw new Error('The active SOS request changed. Reload the screen.');
    }

    transaction.update(reference, {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
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

export async function closeActiveSosRequest(
  userId: string,
  expectedActivatedAt: string,
  status: SosClosedStatus,
): Promise<SosClosedStatus> {
  const reference = requestReference(userId);

  // Allocate once, outside the transaction retry callback.
  const historyReference = doc(
    collection(firestore, 'users', userId, 'sosRequestHistory'),
  );

  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists()) {
      throw new Error('No SOS request was found.');
    }

    const data = snapshot.data();

    if (
      data.userId !== userId ||
      data.simulation !== true ||
      !(data.activatedAt instanceof Timestamp) ||
      data.activatedAt.toDate().toISOString() !== expectedActivatedAt
    ) {
      throw new Error('The SOS request changed. Reload before continuing.');
    }

    if (data.status === status) {
      // An already completed retry does not create another history entry.
      return status;
    }

    if (data.status !== 'active') {
      throw new Error('This SOS request is already closed.');
    }

    const closure =
      status === 'cancelled'
        ? {
            status,
            cancelledAt: serverTimestamp(),
          }
        : {
            status,
            resolvedAt: serverTimestamp(),
          };

    // Current state and history are committed together.
    transaction.update(reference, closure);

    transaction.set(historyReference, {
      ...data,
      ...closure,
    });

    return status;
  });
}