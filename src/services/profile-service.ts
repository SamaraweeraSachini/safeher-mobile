import {
    doc,
    getDoc,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';
import type { SafeHerUserProfile } from '@/src/services/auth-service';

export async function getUserProfile(
  uid: string
): Promise<SafeHerUserProfile | null> {
  const profileReference = doc(
    firestore,
    'users',
    uid
  );

  const profileSnapshot = await getDoc(profileReference);

  if (!profileSnapshot.exists()) {
    return null;
  }

  const data = profileSnapshot.data();

  return {
    uid: data.uid ?? uid,
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    role: 'user',
    accountType: 'registered',
  };
}