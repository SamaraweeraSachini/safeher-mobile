import { FirebaseError } from 'firebase/app';

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';

import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestore,
} from '@/src/config/firebase';

type RegisterUserInput = {
  fullName: string;
  email: string;
  password: string;
};

export type SafeHerUserProfile = {
  uid: string;
  fullName: string;
  email: string;
  role: 'user';
  accountType: 'registered';
};

export async function registerUser({
  fullName,
  email,
  password,
}: RegisterUserInput): Promise<UserCredential> {
  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const userCredential =
    await createUserWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password
    );

  try {
    await updateProfile(userCredential.user, {
      displayName: normalizedName,
    });

    await createFirestoreProfile(
      userCredential.user,
      normalizedName,
      normalizedEmail
    );

    return userCredential;
  } catch {
    try {
      await deleteUser(userCredential.user);
    } catch {
      // Keep the original profile-creation error.
    }

    throw new Error(
      'Your account profile could not be created. Please try again.'
    );
  }
}

async function createFirestoreProfile(
  user: User,
  fullName: string,
  email: string
): Promise<void> {
  const profile: SafeHerUserProfile = {
    uid: user.uid,
    fullName,
    email,
    role: 'user',
    accountType: 'registered',
  };

  await setDoc(
    doc(
      firestore,
      'users',
      user.uid
    ),
    {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(
    firebaseAuth,
    email.trim().toLowerCase(),
    password
  );
}

export async function loginAsGuest(): Promise<UserCredential> {
  return signInAnonymously(firebaseAuth);
}

export async function logoutUser(): Promise<void> {
  await signOut(firebaseAuth);
}

export function getAuthenticationError(
  error: unknown
): string {
  if (!(error instanceof FirebaseError)) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in instead.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/weak-password':
      return 'Your password must contain at least 6 characters.';

    case 'auth/invalid-credential':
      return 'The email or password you entered is incorrect.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';

    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait and try again.';

    case 'auth/network-request-failed':
      return 'Unable to connect. Please check your internet connection.';

    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this application.';

    default:
      return 'Authentication failed. Please try again.';
  }
}