import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

import type {
  SafeJourneyConfiguration,
} from '@/src/types/safe-journey';

export type SafeJourneyErrorCode =
  | 'not-authenticated'
  | 'destination-required'
  | 'current-location-required'
  | 'invalid-arrival-time'
  | 'contact-required'
  | 'active-journey-exists'
  | 'firestore-error';

export class SafeJourneyError extends Error {
  code: SafeJourneyErrorCode;

  constructor(
    code: SafeJourneyErrorCode,
    message: string
  ) {
    super(message);

    this.name = 'SafeJourneyError';
    this.code = code;
  }
}

function isValidCoordinate(
  value: number
): boolean {
  return Number.isFinite(value);
}

function validateCurrentLocation(
  configuration: SafeJourneyConfiguration
): void {
  const { currentLocation } =
    configuration;

  if (
    !currentLocation ||
    !isValidCoordinate(
      currentLocation.latitude
    ) ||
    !isValidCoordinate(
      currentLocation.longitude
    ) ||
    currentLocation.latitude < -90 ||
    currentLocation.latitude > 90 ||
    currentLocation.longitude < -180 ||
    currentLocation.longitude > 180
  ) {
    throw new SafeJourneyError(
      'current-location-required',
      'Your current location is required before starting a Safe Journey.'
    );
  }
}

function validateJourney(
  configuration: SafeJourneyConfiguration
): void {
  if (
    configuration.destination.trim().length === 0
  ) {
    throw new SafeJourneyError(
      'destination-required',
      'Destination is required.'
    );
  }

  validateCurrentLocation(configuration);

  const arrivalTime =
    configuration.expectedArrivalTime;

  if (
    !(arrivalTime instanceof Date) ||
    Number.isNaN(arrivalTime.getTime()) ||
    arrivalTime.getTime() <= Date.now()
  ) {
    throw new SafeJourneyError(
      'invalid-arrival-time',
      'Expected arrival time must be in the future.'
    );
  }

  if (
    configuration.shareJourney &&
    configuration.trustedContactIds.length === 0
  ) {
    throw new SafeJourneyError(
      'contact-required',
      'Select at least one trusted contact when Share Journey is enabled.'
    );
  }
}

async function ensureNoActiveJourney(
  userId: string
): Promise<void> {
  const journeysRef =
    collection(
      firestore,
      'users',
      userId,
      'safeJourneys'
    );

  const activeJourneyQuery =
    query(
      journeysRef,
      where('status', '==', 'active'),
      limit(1)
    );

  const snapshot =
    await getDocs(activeJourneyQuery);

  if (!snapshot.empty) {
    throw new SafeJourneyError(
      'active-journey-exists',
      'You already have an active Safe Journey. Complete or cancel it before starting another one.'
    );
  }
}

export async function createSafeJourney(
  configuration: SafeJourneyConfiguration
): Promise<string> {
  const currentUser =
    firebaseAuth.currentUser;

  if (!currentUser) {
    throw new SafeJourneyError(
      'not-authenticated',
      'You must be signed in to start a Safe Journey.'
    );
  }

  validateJourney(configuration);

  try {
    await ensureNoActiveJourney(
      currentUser.uid
    );

    const journeysRef =
      collection(
        firestore,
        'users',
        currentUser.uid,
        'safeJourneys'
      );

    const document =
      await addDoc(
        journeysRef,
        {
          userId: currentUser.uid,

          destination:
            configuration.destination.trim(),

          destinationLocation:
            configuration.destinationLocation ?? null,

          currentLocation: {
            latitude:
              configuration.currentLocation.latitude,

            longitude:
              configuration.currentLocation.longitude,
          },

          expectedArrivalTime:
            configuration.expectedArrivalTime,

          trustedContactIds:
            configuration.trustedContactIds,

          checkInIntervalMinutes:
            configuration.checkInIntervalMinutes,

          shareJourney:
            configuration.shareJourney,

          status: 'active',

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

    return document.id;
  } catch (error) {
    if (
      error instanceof
      SafeJourneyError
    ) {
      throw error;
    }

    console.error(
      'Safe Journey creation failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Safe Journey could not be saved. Check your connection and try again.'
    );
  }
}