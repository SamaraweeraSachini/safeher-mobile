import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firebaseAuth, firestore } from '@/src/config/firebase';
import {
  CONTENT_FLAG_REASONS,
  type ContentFlagReason,
} from '@/src/types/content-flag';

const MAX_DETAILS_LENGTH = 300;
const FLAGS = 'contentFlags';

export class ContentFlagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentFlagError';
  }
}

function cleanDetails(details: string): string {
  return details.replace(/\s+/g, ' ').trim();
}

function isContentFlagReason(value: string): value is ContentFlagReason {
  return CONTENT_FLAG_REASONS.some((reason) => reason === value);
}

function savedFlags(
  data: Record<string, unknown> | undefined
): Record<string, unknown> {
  const flags = data?.[FLAGS];

  if (!flags || typeof flags !== 'object') {
    return {};
  }

  return { ...(flags as Record<string, unknown>) };
}

/**
 * Stores a pending moderation flag for one incident.
 * The reporter id is saved with the flag and is not shown in the app.
 */
export async function createContentFlag(
  incidentId: string,
  reason: string,
  details: string
): Promise<void> {
  const currentUser = firebaseAuth.currentUser;
  const cleanedIncidentId = incidentId.trim();
  const cleanedDetails = cleanDetails(details);

  if (!currentUser) {
    throw new ContentFlagError('Sign in to report this content.');
  }

  if (!cleanedIncidentId) {
    throw new ContentFlagError('This incident is not available to report.');
  }

  if (!isContentFlagReason(reason)) {
    throw new ContentFlagError('Select a reason.');
  }

  if (cleanedDetails.length > MAX_DETAILS_LENGTH) {
    throw new ContentFlagError('Shorten the details to 300 characters or less.');
  }

  const flag = {
    incidentId: cleanedIncidentId,
    reason,
    details: cleanedDetails,
    submittedBy: currentUser.uid,
    status: 'pending' as const,
    submittedAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(firestore, 'contentFlags'), flag);
    return;
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== 'permission-denied') {
      throw new ContentFlagError(
        'This report could not be submitted. Check your connection and try again.'
      );
    }
  }

  try {
    const accountReference = doc(firestore, 'users', currentUser.uid);
    const accountSnapshot = await getDoc(accountReference);
    const flagId = doc(collection(firestore, 'contentFlags')).id;

    await setDoc(
      accountReference,
      {
        [FLAGS]: {
          ...savedFlags(accountSnapshot.data()),
          [flagId]: flag,
        },
      },
      { merge: true }
    );
  } catch {
    throw new ContentFlagError(
      'This report could not be submitted. Check your connection and try again.'
    );
  }
}
