import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

export async function createSosEvent():
  Promise<string | null> {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    return null;
  }

  const document =
    await addDoc(
      collection(
        firestore,
        'users',
        user.uid,
        'sosEvents'
      ),

      {
        status:
          'active',

        activatedAt:
          serverTimestamp(),

        resolvedAt:
          null,

        cancelledAt:
          null,

        prototype:
          true,
      }
    );

  return document.id;
}

export async function finishSosEvent(
  eventId: string,

  result:
    | 'resolved'
    | 'cancelled'
): Promise<void> {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    return;
  }

  await updateDoc(
    doc(
      firestore,
      'users',
      user.uid,
      'sosEvents',
      eventId
    ),

    {
      status:
        result,

      updatedAt:
        serverTimestamp(),

      ...(result ===
      'resolved'
        ? {
            resolvedAt:
              serverTimestamp(),
          }
        : {
            cancelledAt:
              serverTimestamp(),
          }),
    }
  );
}