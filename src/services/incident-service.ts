import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

import type {
  CreateIncidentInput,
} from '@/src/types/incident';

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

    this.name =
      'IncidentSubmissionError';

    this.code = code;
  }
}

function validateCoordinates(
  latitude: number,
  longitude: number
) {
  const coordinatesAreNumbers =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const latitudeIsValid =
    latitude >= -90 &&
    latitude <= 90;

  const longitudeIsValid =
    longitude >= -180 &&
    longitude <= 180;

  if (
    !coordinatesAreNumbers ||
    !latitudeIsValid ||
    !longitudeIsValid
  ) {
    throw new IncidentSubmissionError(
      'invalid-location',
      'The selected incident location is invalid. Please select your current location again.'
    );
  }
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
          type: input.type,

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

          anonymous: input.anonymous,

          status: 'active',

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