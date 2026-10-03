import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';

export type TrustedContact = {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TrustedContactInput = {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
};

function getContactsCollection(uid: string) {
  return collection(firestore, 'users', uid, 'trustedContacts');
}

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function validateTrustedContact(input: TrustedContactInput): void {
  if (!input.name.trim()) {
    throw new Error('Please enter the contact name.');
  }

  if (!input.relationship.trim()) {
    throw new Error('Please select a relationship.');
  }

  const phoneNumber = input.phoneNumber.trim();
  const digitsOnly = normalizePhoneNumber(phoneNumber);

  if (
    !phoneNumber ||
    !/^\+?[0-9\s().-]+$/.test(phoneNumber) ||
    digitsOnly.length < 7 ||
    digitsOnly.length > 15 ||
    (phoneNumber.match(/\+/g) ?? []).length > 1 ||
    (phoneNumber.includes('+') && !phoneNumber.startsWith('+'))
  ) {
    throw new Error(
      'Enter a valid phone number containing 7 to 15 digits.'
    );
  }

  const email = input.email?.trim() ?? '';

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
}

export function subscribeToTrustedContacts(
  uid: string,
  onContactsChanged: (contacts: TrustedContact[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    getContactsCollection(uid),
    snapshot => {
      const contacts = snapshot.docs.map(contactDocument => ({
        id: contactDocument.id,
        ...contactDocument.data(),
      } as TrustedContact));

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
  validateTrustedContact(input);

  const contactsCollection = getContactsCollection(uid);
  const existingContacts = await getDocs(contactsCollection);
  const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

  const duplicateContact = existingContacts.docs.find(contactDocument => {
    if (contactDocument.id === contactId) {
      return false;
    }

    const existingPhone = contactDocument.data().phoneNumber;

    return (
      typeof existingPhone === 'string' &&
      normalizePhoneNumber(existingPhone) === normalizedPhone
    );
  });

  if (duplicateContact) {
    throw new Error(
      'This phone number is already saved for another trusted contact. Please use a different number.'
    );
  }

  const batch = writeBatch(firestore);
  const email = input.email?.trim() ?? '';

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

  const contactData = {
    name: input.name.trim(),
    relationship: input.relationship.trim(),
    phoneNumber: input.phoneNumber.trim(),
    email,
    isPrimary: input.isPrimary,
    updatedAt: serverTimestamp(),
  };

  if (contactId) {
    const contactReference = doc(
      firestore,
      'users',
      uid,
      'trustedContacts',
      contactId
    );

    batch.update(contactReference, contactData);
  } else {
    const newContactReference = doc(contactsCollection);

    batch.set(newContactReference, {
      ...contactData,
      createdAt: serverTimestamp(),
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
