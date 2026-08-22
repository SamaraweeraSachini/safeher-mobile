import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { firebaseAuth } from '@/src/config/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isRegisteredUser: boolean;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        firebaseAuth,
        firebaseUser => {
          setUser(firebaseUser);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,

      loading,

      isAuthenticated:
        user !== null,

      isGuest:
        user?.isAnonymous === true,

      isRegisteredUser:
        user !== null &&
        user.isAnonymous === false,
    }),
    [
      user,
      loading,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}