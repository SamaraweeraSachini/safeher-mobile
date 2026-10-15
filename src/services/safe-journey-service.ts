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
  code:
    SafeJourneyErrorCode;

  constructor(
    code:
      SafeJourneyErrorCode,

    message:
      string
  ) {
    super(
      message
    );

    this.name =
      'SafeJourneyError';

    this.code =
      code;
  }
}

function getAuthenticatedUser() {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    throw new SafeJourneyError(
      'not-authenticated',
      'You must be signed in to use Safe Journey.'
    );
  }

  return user;
}

function validateCurrentLocation(
  configuration:
    SafeJourneyConfiguration
): void {
  const {
    currentLocation,
  } =
    configuration;

  if (
    !currentLocation ||
    !Number.isFinite(
      currentLocation.latitude
    ) ||
    !Number.isFinite(
      currentLocation.longitude
    ) ||
    currentLocation.latitude <
      -90 ||
    currentLocation.latitude >
      90 ||
    currentLocation.longitude <
      -180 ||
    currentLocation.longitude >
      180
  ) {
    throw new SafeJourneyError(
      'current-location-required',
      'Your current location is required before starting a Safe Journey.'
    );
  }
}

function validateJourney(
  configuration:
    SafeJourneyConfiguration
): void {
  if (
    configuration.destination
      .trim()
      .length ===
    0
  ) {
    throw new SafeJourneyError(
      'destination-required',
      'Destination is required.'
    );
  }

  validateCurrentLocation(
    configuration
  );

  if (
    !(
      configuration.expectedArrivalTime instanceof
      Date
    ) ||
    Number.isNaN(
      configuration.expectedArrivalTime.getTime()
    ) ||
    configuration.expectedArrivalTime.getTime() <=
      Date.now()
  ) {
    throw new SafeJourneyError(
      'invalid-arrival-time',
      'Expected arrival time must be in the future.'
    );
  }

  if (
    configuration.shareJourney &&
    configuration
      .trustedContactIds
      .length ===
      0
  ) {
    throw new SafeJourneyError(
      'contact-required',
      'Select at least one trusted contact when Share Journey is enabled.'
    );
  }
}

function timestampToDate(
  value:
    unknown
): Date | null {
  return value instanceof
    Timestamp
    ? value.toDate()
    : null;
}

function parseJourney(
  id:
    string,

  userId:
    string,

  data:
    Record<
      string,
      any
    >
): StoredSafeJourney {
  const arrival =
    timestampToDate(
      data.expectedArrivalTime
    );

  if (!arrival) {
    throw new SafeJourneyError(
      'firestore-error',
      'A Safe Journey contains invalid arrival information.'
    );
  }

  const status =
    data.status ===
    'completed'
      ? 'completed'
      : data.status ===
          'cancelled'
        ? 'cancelled'
        : 'active';

  return {
    id,

    userId,

    destination:
      typeof data.destination ===
      'string'
        ? data.destination
        : 'Unknown destination',

    destinationLocation:
      data.destinationLocation &&
      Number.isFinite(
        data.destinationLocation
          .latitude
      ) &&
      Number.isFinite(
        data.destinationLocation
          .longitude
      )
        ? {
            latitude:
              data.destinationLocation
                .latitude,

            longitude:
              data.destinationLocation
                .longitude,
          }
        : null,

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
      arrival,

    trustedContactIds:
      Array.isArray(
        data.trustedContactIds
      )
        ? data.trustedContactIds.filter(
            (
              id
            ): id is string =>
              typeof id ===
              'string'
          )
        : [],

    checkInIntervalMinutes:
      data.checkInIntervalMinutes,

    shareJourney:
      Boolean(
        data.shareJourney
      ),

    status,

    createdAt:
      timestampToDate(
        data.createdAt
      ) ??
      new Date(),

    lastCheckInAt:
      timestampToDate(
        data.lastCheckInAt
      ),

    completedAt:
      timestampToDate(
        data.completedAt
      ),

    cancelledAt:
      timestampToDate(
        data.cancelledAt
      ),
  };
}

async function ensureNoActiveJourney(
  userId:
    string
): Promise<void> {
  const journeysRef =
    collection(
      firestore,
      'users',
      userId,
      'safeJourneys'
    );

  const activeQuery =
    query(
      journeysRef,

      where(
        'status',
        '==',
        'active'
      ),

      limit(
        1
      )
    );

  const snapshot =
    await getDocs(
      activeQuery
    );

  if (
    !snapshot.empty
  ) {
    throw new SafeJourneyError(
      'active-journey-exists',
      'You already have an active Safe Journey. Resume, complete or cancel it before starting another one.'
    );
  }
}

export async function createSafeJourney(
  configuration:
    SafeJourneyConfiguration
): Promise<string> {
  const user =
    getAuthenticatedUser();

  validateJourney(
    configuration
  );

  try {
    await ensureNoActiveJourney(
      user.uid
    );

    const document =
      await addDoc(
        collection(
          firestore,
          'users',
          user.uid,
          'safeJourneys'
        ),

        {
          userId:
            user.uid,

          destination:
            configuration
              .destination
              .trim(),

          destinationLocation:
            configuration
              .destinationLocation ??
            null,

          currentLocation: {
            latitude:
              configuration
                .currentLocation
                .latitude,

            longitude:
              configuration
                .currentLocation
                .longitude,
          },

          expectedArrivalTime:
            configuration
              .expectedArrivalTime,

          trustedContactIds:
            configuration
              .trustedContactIds,

          checkInIntervalMinutes:
            configuration
              .checkInIntervalMinutes,

          shareJourney:
            configuration
              .shareJourney,

          status:
            'active',

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          lastCheckInAt:
            null,

          completedAt:
            null,

          cancelledAt:
            null,
        }
      );

    return document.id;
  } catch (
    error
  ) {
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
  Promise<
    StoredSafeJourney | null
  > {
  const user =
    getAuthenticatedUser();

  try {
    const activeQuery =
      query(
        collection(
          firestore,
          'users',
          user.uid,
          'safeJourneys'
        ),

        where(
          'status',
          '==',
          'active'
        ),

        limit(
          1
        )
      );

    const snapshot =
      await getDocs(
        activeQuery
      );

    if (
      snapshot.empty
    ) {
      return null;
    }

    const document =
      snapshot.docs[0];

    return parseJourney(
      document.id,
      user.uid,
      document.data()
    );
  } catch (
    error
  ) {
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
  journeyId:
    string
): Promise<void> {
  const user =
    getAuthenticatedUser();

  if (
    !journeyId.trim()
  ) {
    throw new SafeJourneyError(
      'journey-not-active',
      'No active Safe Journey was found.'
    );
  }

  try {
    await updateDoc(
      doc(
        firestore,
        'users',
        user.uid,
        'safeJourneys',
        journeyId
      ),

      {
        lastCheckInAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        status:
          'active',
      }
    );
  } catch (
    error
  ) {
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

export async function completeSafeJourney(
  journeyId:
    string
): Promise<void> {
  const user =
    getAuthenticatedUser();

  if (
    !journeyId.trim()
  ) {
    throw new SafeJourneyError(
      'journey-not-active',
      'No active Safe Journey was found.'
    );
  }

  try {
    await updateDoc(
      doc(
        firestore,
        'users',
        user.uid,
        'safeJourneys',
        journeyId
      ),

      {
        status:
          'completed',

        completedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );
  } catch (
    error
  ) {
    console.error(
      'Safe Journey completion failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Your Safe Journey could not be completed. Please try again.'
    );
  }
}

export async function cancelSafeJourney(
  journeyId:
    string
): Promise<void> {
  const user =
    getAuthenticatedUser();

  if (
    !journeyId.trim()
  ) {
    throw new SafeJourneyError(
      'journey-not-active',
      'No active Safe Journey was found.'
    );
  }

  try {
    await updateDoc(
      doc(
        firestore,
        'users',
        user.uid,
        'safeJourneys',
        journeyId
      ),

      {
        status:
          'cancelled',

        cancelledAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );
  } catch (
    error
  ) {
    console.error(
      'Safe Journey cancellation failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Your Safe Journey could not be cancelled. Please try again.'
    );
  }
}

/**
 * Returns every journey state.
 *
 * Active journeys are placed first so Journey History can also
 * work as a quick resume screen.
 */
export async function getSafeJourneyHistory():
  Promise<
    StoredSafeJourney[]
  > {
  const user =
    getAuthenticatedUser();

  try {
    const snapshot =
      await getDocs(
        collection(
          firestore,
          'users',
          user.uid,
          'safeJourneys'
        )
      );

    return snapshot.docs
      .map(
        document =>
          parseJourney(
            document.id,
            user.uid,
            document.data()
          )
      )
      .sort(
        (
          first,
          second
        ) => {
          if (
            first.status ===
              'active' &&
            second.status !==
              'active'
          ) {
            return -1;
          }

          if (
            second.status ===
              'active' &&
            first.status !==
              'active'
          ) {
            return 1;
          }

          const firstDate =
            first.completedAt ??
            first.cancelledAt ??
            first.createdAt;

          const secondDate =
            second.completedAt ??
            second.cancelledAt ??
            second.createdAt;

          return (
            secondDate.getTime() -
            firstDate.getTime()
          );
        }
      );
  } catch (
    error
  ) {
    if (
      error instanceof
      SafeJourneyError
    ) {
      throw error;
    }

    console.error(
      'Safe Journey history retrieval failed:',
      error
    );

    throw new SafeJourneyError(
      'firestore-error',
      'Journey history could not be loaded. Please try again.'
    );
  }
}