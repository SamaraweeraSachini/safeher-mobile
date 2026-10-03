
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';

export type TrustedContact = {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TrustedContactInput = {
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
};

function getContactsCollection(uid: string) {
  return collection(
    firestore,
    'users',
    uid,
    'trustedContacts'
  );
}

export function subscribeToTrustedContacts(
  uid: string,
  onContactsChanged: (contacts: TrustedContact[]) => void,
  onError: (error: Error) => void
) {
  const contactsQuery = getContactsCollection(uid);

  return onSnapshot(
    contactsQuery,
    snapshot => {
      const contacts = snapshot.docs.map(
        contactDocument => ({
          id: contactDocument.id,
          ...contactDocument.data(),
        } as TrustedContact)
      );

      contacts.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });

      onContactsChanged(contacts);
    },
    error => onError(error)
  );
}

export async function saveTrustedContact(
  uid: string,
  contactId: string | null,
  input: TrustedContactInput
): Promise<void> {
  const contactsCollection = getContactsCollection(uid);
  const existingContacts = await getDocs(
    contactsCollection
  );

  const batch = writeBatch(firestore);

  if (input.isPrimary) {
    existingContacts.docs.forEach(contactDocument => {
      if (contactDocument.id !== contactId) {
        batch.update(contactDocument.ref, {
          isPrimary: false,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  if (contactId) {
    const contactReference = doc(
      firestore,
      'users',
      uid,
      'trustedContacts',
      contactId
    );

    batch.update(contactReference, {
      name: input.name,
      relationship: input.relationship,
      phoneNumber: input.phoneNumber,
      isPrimary: input.isPrimary,
      updatedAt: serverTimestamp(),
    });
  } else {
    const newContactReference = doc(
      contactsCollection
    );

    batch.set(newContactReference, {
      name: input.name,
      relationship: input.relationship,
      phoneNumber: input.phoneNumber,
      isPrimary: input.isPrimary,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function deleteTrustedContact(
  uid: string,
  contactId: string
): Promise<void> {
  const contactReference = doc(
    firestore,
    'users',
    uid,
    'trustedContacts',
    contactId
  );

  await deleteDoc(contactReference);
}
