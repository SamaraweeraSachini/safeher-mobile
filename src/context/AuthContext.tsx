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

import {
  loginAsGuest,
  logoutUser,
} from '@/src/services/auth-service';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isRegisteredUser: boolean;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
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

  const continueAsGuest =
    async () => {
      await loginAsGuest();
    };

  const logout =
    async () => {
      await logoutUser();
    };

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

      continueAsGuest,

      logout,
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