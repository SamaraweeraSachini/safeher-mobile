import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  where,
} from 'firebase/firestore';

import {
  isIncidentCategoryId,
} from '@/constants/incident-categories';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

import type {
  CreateIncidentInput,
  Incident,
  IncidentCoordinates,
} from '@/src/types/incident';

const ACTIVE_INCIDENT_LIMIT = 50;

let submissionInProgress = false;

export class IncidentSubmissionError extends Error {
  code:
    | 'not-authenticated'
    | 'duplicate-submission'
    | 'invalid-location'
    | 'firestore-error';

  constructor(
    code: IncidentSubmissionError['code'],
    message: string
  ) {
    super(message);

    this.name = 'IncidentSubmissionError';
    this.code = code;
  }
}

export class IncidentRetrievalError extends Error {
  code: 'firestore-error';

  constructor(message: string) {
    super(message);

    this.name = 'IncidentRetrievalError';
    this.code = 'firestore-error';
  }
}

function coordinatesAreValid(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function validateCoordinates(
  latitude: number,
  longitude: number
): void {
  if (
    !coordinatesAreValid(
      latitude,
      longitude
    )
  ) {
    throw new IncidentSubmissionError(
      'invalid-location',
      'The selected incident location is invalid. Please select your current location again.'
    );
  }
}

function convertCoordinates(
  value: unknown
): IncidentCoordinates | null {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return null;
  }

  const coordinates = value as {
    latitude?: unknown;
    longitude?: unknown;
  };

  if (
    typeof coordinates.latitude !== 'number' ||
    typeof coordinates.longitude !== 'number'
  ) {
    return null;
  }

  if (
    !coordinatesAreValid(
      coordinates.latitude,
      coordinates.longitude
    )
  ) {
    return null;
  }

  return {
    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,
  };
}

function convertCreatedAt(
  value: unknown
): Timestamp | null | undefined {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  return undefined;
}

/**
 * Converts unknown Firestore data into the shared Incident model.
 * Invalid documents return null instead of crashing the application.
 */
export function convertIncidentDocument(
  id: string,
  data: Record<string, unknown>
): Incident | null {
  if (!id) {
    console.warn(
      'An incident document was ignored because its ID was missing.'
    );

    return null;
  }

  if (
    !isIncidentCategoryId(
      data.type
    )
  ) {
    console.warn(
      `Incident ${id} was ignored because its type is unsupported.`
    );

    return null;
  }

  if (data.status !== 'active') {
    console.warn(
      `Incident ${id} was ignored because it is not active.`
    );

    return null;
  }

  if (
    typeof data.description !==
    'string'
  ) {
    console.warn(
      `Incident ${id} was ignored because its description is invalid.`
    );

    return null;
  }

  const coordinates =
    convertCoordinates(
      data.coordinates
    );

  if (!coordinates) {
    console.warn(
      `Incident ${id} was ignored because its coordinates are invalid.`
    );

    return null;
  }

  if (
    typeof data.anonymous !==
    'boolean'
  ) {
    console.warn(
      `Incident ${id} was ignored because its anonymous value is invalid.`
    );

    return null;
  }

  if (
    typeof data.creatorUid !== 'string' ||
    data.creatorUid.trim().length === 0
  ) {
    console.warn(
      `Incident ${id} was ignored because its creator is invalid.`
    );

    return null;
  }

  const createdAt =
    convertCreatedAt(
      data.createdAt
    );

  if (createdAt === undefined) {
    console.warn(
      `Incident ${id} was ignored because its creation date is invalid.`
    );

    return null;
  }

  return {
    id,
    type: data.type,
    description:
      data.description.trim(),
    coordinates,
    anonymous:
      data.anonymous,
    status: 'active',
    creatorUid:
      data.creatorUid,
    createdAt,
  };
}

function sortIncidentsByNewest(
  firstIncident: Incident,
  secondIncident: Incident
): number {
  const firstTime =
    firstIncident.createdAt
      ?.toMillis() ?? 0;

  const secondTime =
    secondIncident.createdAt
      ?.toMillis() ?? 0;

  return secondTime - firstTime;
}

/**
 * Removes duplicate incident objects using the Firestore document ID.
 * The newest version of a duplicated document is retained.
 */
function removeDuplicateIncidents(
  incidents: Incident[]
): Incident[] {
  const incidentsById =
    new Map<string, Incident>();

  incidents.forEach(incident => {
    incidentsById.set(
      incident.id,
      incident
    );
  });

  return Array.from(
    incidentsById.values()
  );
}

/**
 * Subscribes to active incidents through a Firestore real-time listener.
 *
 * Firestore sends a complete query snapshot whenever an active incident is
 * added, changed or removed. Returning the unsubscribe function allows the
 * React hook to clean up the listener when its screen unmounts.
 */
export function subscribeToActiveIncidents(
  onIncidentsChanged: (
    incidents: Incident[]
  ) => void,

  onError: (
    error: IncidentRetrievalError
  ) => void
): Unsubscribe {
  const incidentsReference =
    collection(
      firestore,
      'incidents'
    );

  const activeIncidentsQuery =
    query(
      incidentsReference,
      where(
        'status',
        '==',
        'active'
      )
    );

  const unsubscribe =
    onSnapshot(
      activeIncidentsQuery,

      snapshot => {
        const convertedIncidents =
          snapshot.docs
            .map(
              documentSnapshot =>
                convertIncidentDocument(
                  documentSnapshot.id,
                  documentSnapshot.data()
                )
            )
            .filter(
              (
                incident
              ): incident is Incident =>
                incident !== null
            );

        const activeIncidents =
          removeDuplicateIncidents(
            convertedIncidents
          )
            .sort(
              sortIncidentsByNewest
            )
            .slice(
              0,
              ACTIVE_INCIDENT_LIMIT
            );

        onIncidentsChanged(
          activeIncidents
        );
      },

      error => {
        console.error(
          'Active incident real-time listener error:',
          error
        );

        onError(
          new IncidentRetrievalError(
            'SafeHer lost its real-time incident connection. Check your internet connection and try again.'
          )
        );
      }
    );

  return unsubscribe;
}

export async function createIncidentReport(
  input: CreateIncidentInput
): Promise<string> {
  if (submissionInProgress) {
    throw new IncidentSubmissionError(
      'duplicate-submission',
      'This incident report is already being submitted.'
    );
  }

  const currentUser =
    firebaseAuth.currentUser;

  if (!currentUser) {
    throw new IncidentSubmissionError(
      'not-authenticated',
      'You must be logged in or continue as a guest before submitting an incident report.'
    );
  }

  validateCoordinates(
    input.coordinates.latitude,
    input.coordinates.longitude
  );

  submissionInProgress = true;

  try {
    const incidentReference =
      await addDoc(
        collection(
          firestore,
          'incidents'
        ),
        {
          type:
            input.type,

          description:
            input.description.trim(),

          coordinates: {
            latitude:
              input.coordinates
                .latitude,

            longitude:
              input.coordinates
                .longitude,
          },

          anonymous:
            input.anonymous,

          status:
            'active',

          creatorUid:
            currentUser.uid,

          createdAt:
            serverTimestamp(),
        }
      );

    return incidentReference.id;
  } catch (error) {
    if (
      error instanceof
      IncidentSubmissionError
    ) {
      throw error;
    }

    console.error(
      'Firestore incident submission error:',
      error
    );

    throw new IncidentSubmissionError(
      'firestore-error',
      'SafeHer could not submit your incident report. Check your internet connection and try again.'
    );
  } finally {
    submissionInProgress = false;
  }
}