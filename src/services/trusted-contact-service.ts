import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

import type {
  TrustedContact,
  TrustedContactInput,
} from '@/src/types/trusted-contact';

export class TrustedContactError extends Error {}

function getCurrentUserId(): string {
  const user =
    firebaseAuth.currentUser;

  if (
    !user ||
    user.isAnonymous
  ) {
    throw new TrustedContactError(
      'Sign in with a registered account to manage trusted contacts.'
    );
  }

  return user.uid;
}

function normalizePhone(
  phone: string
): string {
  return phone.replace(
    /[^\d+]/g,
    ''
  );
}

function validateContact(
  input: TrustedContactInput
) {
  if (
    !input.name.trim()
  ) {
    throw new TrustedContactError(
      'Contact name is required.'
    );
  }

  const phone =
    normalizePhone(
      input.phone
    );

  const digits =
    phone.replace(
      /\D/g,
      ''
    );

  if (
    digits.length < 7 ||
    digits.length > 15
  ) {
    throw new TrustedContactError(
      'Enter a valid phone number.'
    );
  }

  return {
    name:
      input.name.trim(),

    relationship:
      input.relationship.trim(),

    phone,
  };
}

export function subscribeToTrustedContacts(
  onChanged: (
    contacts: TrustedContact[]
  ) => void,

  onError?: (
    message: string
  ) => void
): Unsubscribe {
  const userId =
    getCurrentUserId();

  return onSnapshot(
    collection(
      firestore,
      'users',
      userId,
      'trustedContacts'
    ),

    snapshot => {
      const contacts =
        snapshot.docs
          .map(
            document => {
              const data =
                document.data();

              return {
                id:
                  document.id,

                name:
                  typeof data.name ===
                  'string'
                    ? data.name.trim()
                    : '',

                relationship:
                  typeof data.relationship ===
                  'string'
                    ? data.relationship.trim()
                    : '',

                phone:
                  typeof data.phone ===
                  'string'
                    ? data.phone.trim()
                    : '',
              } satisfies TrustedContact;
            }
          )
          .filter(
            contact =>
              contact.name.length >
              0
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          );

      onChanged(
        contacts
      );
    },

    error => {
      console.error(
        'Trusted contacts listener failed:',
        error
      );

      onError?.(
        'Trusted contacts could not be loaded.'
      );
    }
  );
}

export async function addTrustedContact(
  input: TrustedContactInput
): Promise<string> {
  const userId =
    getCurrentUserId();

  const validated =
    validateContact(
      input
    );

  const document =
    await addDoc(
      collection(
        firestore,
        'users',
        userId,
        'trustedContacts'
      ),

      {
        ...validated,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );

  return document.id;
}

export async function updateTrustedContact(
  contactId: string,

  input: TrustedContactInput
): Promise<void> {
  const userId =
    getCurrentUserId();

  const validated =
    validateContact(
      input
    );

  await updateDoc(
    doc(
      firestore,
      'users',
      userId,
      'trustedContacts',
      contactId
    ),

    {
      ...validated,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function deleteTrustedContact(
  contactId: string
): Promise<void> {
  const userId =
    getCurrentUserId();

  await deleteDoc(
    doc(
      firestore,
      'users',
      userId,
      'trustedContacts',
      contactId
    )
  );
}