import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
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
  IncidentStatus,
} from '@/src/types/incident';

const ACTIVE_INCIDENT_LIMIT =
  50;

let submissionInProgress =
  false;

export class IncidentSubmissionError extends Error {
  code:
    | 'not-authenticated'
    | 'duplicate-submission'
    | 'invalid-location'
    | 'firestore-error';

  constructor(
    code:
      IncidentSubmissionError['code'],

    message:
      string
  ) {
    super(
      message
    );

    this.name =
      'IncidentSubmissionError';

    this.code =
      code;
  }
}

export class IncidentRetrievalError extends Error {
  code =
    'firestore-error' as const;

  constructor(
    message:
      string
  ) {
    super(
      message
    );

    this.name =
      'IncidentRetrievalError';
  }
}

function coordinatesAreValid(
  latitude:
    number,

  longitude:
    number
): boolean {
  return (
    Number.isFinite(
      latitude
    ) &&
    Number.isFinite(
      longitude
    ) &&
    latitude >=
      -90 &&
    latitude <=
      90 &&
    longitude >=
      -180 &&
    longitude <=
      180
  );
}

function convertCoordinates(
  value:
    unknown
): IncidentCoordinates | null {
  if (
    typeof value !==
      'object' ||
    value ===
      null
  ) {
    return null;
  }

  const coordinates =
    value as {
      latitude?:
        unknown;

      longitude?:
        unknown;
    };

  if (
    typeof coordinates.latitude !==
      'number' ||
    typeof coordinates.longitude !==
      'number' ||
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
  value:
    unknown
):
  | Timestamp
  | null
  | undefined {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return value instanceof
    Timestamp
    ? value
    : undefined;
}

function getAddress(
  data:
    Record<
      string,
      unknown
    >
): string | null {
  return (
    typeof data.address ===
      'string' &&
    data.address
      .trim()
      .length >
      0
      ? data.address.trim()
      : null
  );
}

const REPORT_STATUSES:
  IncidentStatus[] = [
    'active',
    'under-review',
    'resolved',
    'removed',
  ];

function isReportStatus(
  value:
    unknown
): value is IncidentStatus {
  return (
    typeof value ===
      'string' &&
    REPORT_STATUSES.includes(
      value as IncidentStatus
    )
  );
}

function convertDocument(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >,

  requireActive:
    boolean
): Incident | null {
  if (
    !id ||
    !isIncidentCategoryId(
      data.type
    ) ||
    !isReportStatus(
      data.status
    ) ||
    (
      requireActive &&
      data.status !==
        'active'
    ) ||
    typeof data.description !==
      'string' ||
    typeof data.anonymous !==
      'boolean' ||
    typeof data.creatorUid !==
      'string'
  ) {
    return null;
  }

  const coordinates =
    convertCoordinates(
      data.coordinates
    );

  const createdAt =
    convertCreatedAt(
      data.createdAt
    );

  if (
    !coordinates ||
    createdAt ===
      undefined
  ) {
    return null;
  }

  return {
    id,

    type:
      data.type,

    description:
      data.description.trim(),

    coordinates,

    address:
      getAddress(
        data
      ),

    anonymous:
      data.anonymous,

    status:
      data.status,

    creatorUid:
      data.creatorUid,

    createdAt,
  };
}

export function convertIncidentDocument(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >
): Incident | null {
  return convertDocument(
    id,
    data,
    true
  );
}

function sortIncidentsByNewest(
  first:
    Incident,

  second:
    Incident
): number {
  return (
    (
      second.createdAt?.toMillis() ??
      0
    ) -
    (
      first.createdAt?.toMillis() ??
      0
    )
  );
}

export function subscribeToActiveIncidents(
  onIncidentsChanged:
    (
      incidents:
        Incident[]
    ) => void,

  onError:
    (
      error:
        IncidentRetrievalError
    ) => void
): Unsubscribe {
  const activeQuery =
    query(
      collection(
        firestore,
        'incidents'
      ),

      where(
        'status',
        '==',
        'active'
      )
    );

  return onSnapshot(
    activeQuery,

    snapshot => {
      const incidentsById =
        new Map<
          string,
          Incident
        >();

      snapshot.docs.forEach(
        document => {
          const incident =
            convertIncidentDocument(
              document.id,
              document.data()
            );

          if (
            incident
          ) {
            incidentsById.set(
              incident.id,
              incident
            );
          }
        }
      );

      const incidents =
        Array.from(
          incidentsById.values()
        )
          .sort(
            sortIncidentsByNewest
          )
          .slice(
            0,
            ACTIVE_INCIDENT_LIMIT
          );

      onIncidentsChanged(
        incidents
      );
    },

    error => {
      console.error(
        'Active incident listener failed:',
        error
      );

      onError(
        new IncidentRetrievalError(
          'SafeHer lost its real-time incident connection. Check your internet connection and try again.'
        )
      );
    }
  );
}

export function subscribeToUserReports(
  userId:
    string,

  onReportsChanged:
    (
      reports:
        Incident[]
    ) => void,

  onError:
    (
      error:
        IncidentRetrievalError
    ) => void
): Unsubscribe {
  const reportsQuery =
    query(
      collection(
        firestore,
        'incidents'
      ),

      where(
        'creatorUid',
        '==',
        userId
      )
    );

  return onSnapshot(
    reportsQuery,

    snapshot => {
      const reports =
        snapshot.docs
          .map(
            document =>
              convertDocument(
                document.id,
                document.data(),
                false
              )
          )
          .filter(
            (
              report
            ): report is Incident =>
              report !==
              null
          )
          .sort(
            sortIncidentsByNewest
          );

      onReportsChanged(
        reports
      );
    },

    error => {
      console.error(
        'User report listener failed:',
        error
      );

      onError(
        new IncidentRetrievalError(
          'Your reports could not be loaded. Check your connection and try again.'
        )
      );
    }
  );
}

export async function createIncidentReport(
  input:
    CreateIncidentInput
): Promise<string> {
  if (
    submissionInProgress
  ) {
    throw new IncidentSubmissionError(
      'duplicate-submission',

      'This incident report is already being submitted.'
    );
  }

  const currentUser =
    firebaseAuth.currentUser;

  if (
    !currentUser
  ) {
    throw new IncidentSubmissionError(
      'not-authenticated',

      'You must be logged in or continue as a guest before submitting an incident report.'
    );
  }

  if (
    !coordinatesAreValid(
      input.coordinates
        .latitude,

      input.coordinates
        .longitude
    )
  ) {
    throw new IncidentSubmissionError(
      'invalid-location',

      'The selected incident location is invalid.'
    );
  }

  submissionInProgress =
    true;

  try {
    const document =
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

          address:
            input.address?.trim() ||
            null,

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

    return document.id;
  } catch (
    error
  ) {
    console.error(
      'Incident submission error:',
      error
    );

    throw new IncidentSubmissionError(
      'firestore-error',

      'SafeHer could not submit your incident report. Check your internet connection and try again.'
    );
  } finally {
    submissionInProgress =
      false;
  }
}