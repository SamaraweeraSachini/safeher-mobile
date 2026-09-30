import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

import type {
  SafeJourneyConfiguration,
  StoredSafeJourney,
} from '@/src/types/safe-journey';

export type SafeJourneyErrorCode =
  | 'not-authenticated'
  | 'destination-required'
  | 'current-location-required'
  | 'invalid-arrival-time'
  | 'contact-required'
  | 'active-journey-exists'
  | 'journey-not-active'
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
    configuration.destination.trim()
      .length === 0
  ) {
    throw new SafeJourneyError(
      'destination-required',
      'Destination is required.'
    );
  }

  validateCurrentLocation(
    configuration
  );

  const arrivalTime =
    configuration.expectedArrivalTime;

  if (
    !(arrivalTime instanceof Date) ||
    Number.isNaN(
      arrivalTime.getTime()
    ) ||
    arrivalTime.getTime() <=
      Date.now()
  ) {
    throw new SafeJourneyError(
      'invalid-arrival-time',
      'Expected arrival time must be in the future.'
    );
  }

  if (
    configuration.shareJourney &&
    configuration.trustedContactIds
      .length === 0
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
      where(
        'status',
        '==',
        'active'
      ),
      limit(1)
    );

  const snapshot =
    await getDocs(
      activeJourneyQuery
    );

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

  validateJourney(
    configuration
  );

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
          userId:
            currentUser.uid,

          destination:
            configuration.destination.trim(),

          destinationLocation:
            configuration.destinationLocation ??
            null,

          currentLocation: {
            latitude:
              configuration.currentLocation
                .latitude,

            longitude:
              configuration.currentLocation
                .longitude,
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

          lastCheckInAt:
            null,
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

export async function getActiveSafeJourney():
  Promise<StoredSafeJourney | null> {
  const currentUser =
    firebaseAuth.currentUser;

  if (!currentUser) {
    throw new SafeJourneyError(
      'not-authenticated',
      'You must be signed in to view your Safe Journey.'
    );
  }

  try {
    const journeysRef =
      collection(
        firestore,
        'users',
        currentUser.uid,
        'safeJourneys'
      );

    const activeJourneyQuery =
      query(
        journeysRef,
        where(
          'status',
          '==',
          'active'
        ),
        limit(1)
      );

    const snapshot =
      await getDocs(
        activeJourneyQuery
      );

    if (snapshot.empty) {
      return null;
    }

    const document =
      snapshot.docs[0];

    const data =
      document.data();

    const arrivalTimestamp =
      data.expectedArrivalTime;

    const createdTimestamp =
      data.createdAt;

    const lastCheckInTimestamp =
      data.lastCheckInAt;

    if (
      !(
        arrivalTimestamp instanceof
        Timestamp
      )
    ) {
      throw new SafeJourneyError(
        'firestore-error',
        'The active journey contains invalid arrival information.'
      );
    }

    const createdAt =
      createdTimestamp instanceof
      Timestamp
        ? createdTimestamp.toDate()
        : new Date();

    return {
      id:
        document.id,

      userId:
        currentUser.uid,

      destination:
        typeof data.destination ===
        'string'
          ? data.destination
          : 'Unknown destination',

      destinationLocation:
        data.destinationLocation ??
        null,

      currentLocation: {
        latitude:
          Number(
            data.currentLocation
              ?.latitude
          ),

        longitude:
          Number(
            data.currentLocation
              ?.longitude
          ),
      },

      expectedArrivalTime:
        arrivalTimestamp.toDate(),

      trustedContactIds:
        Array.isArray(
          data.trustedContactIds
        )
          ? data.trustedContactIds
          : [],

      checkInIntervalMinutes:
        data.checkInIntervalMinutes,

      shareJourney:
        Boolean(
          data.shareJourney
        ),

      status:
        'active',

      createdAt,

      lastCheckInAt:
        lastCheckInTimestamp instanceof
        Timestamp
          ? lastCheckInTimestamp.toDate()
          : null,
    };
  } catch (error) {
    if (
      error instanceof
      SafeJourneyError
    ) {
      throw error;
    }

    console.error(
      'Active Safe Journey retrieval failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Your active Safe Journey could not be loaded. Check your connection and try again.'
    );
  }
}

export async function recordSafeJourneyCheckIn(
  journeyId: string
): Promise<void> {
  const currentUser =
    firebaseAuth.currentUser;

  if (!currentUser) {
    throw new SafeJourneyError(
      'not-authenticated',
      'You must be signed in to check in.'
    );
  }

  if (!journeyId.trim()) {
    throw new SafeJourneyError(
      'journey-not-active',
      'No active Safe Journey was found.'
    );
  }

  try {
    const journeyRef =
      doc(
        firestore,
        'users',
        currentUser.uid,
        'safeJourneys',
        journeyId
      );

    await updateDoc(
      journeyRef,
      {
        lastCheckInAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        status:
          'active',
      }
    );
  } catch (error) {
    if (
      error instanceof
      SafeJourneyError
    ) {
      throw error;
    }

    console.error(
      'Safe Journey check-in failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Your safety check-in could not be recorded. Please try again.'
    );
  }
}