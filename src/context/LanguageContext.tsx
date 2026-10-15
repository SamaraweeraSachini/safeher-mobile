import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppLanguage = 'en' | 'si';

type LanguageContextValue = {
  language: AppLanguage;
  isReady: boolean;
  setLanguage: (
    language: AppLanguage
  ) => Promise<void>;
  toggleLanguage: () => Promise<void>;
};

const STORAGE_KEY = 'safeher.language';

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null
  );

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    language,
    setLanguageState,
  ] = useState<AppLanguage>('en');

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(
      STORAGE_KEY
    )
      .then(value => {
        if (
          value === 'en' ||
          value === 'si'
        ) {
          setLanguageState(value);
        }
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const setLanguage =
    useCallback(
      async (
        nextLanguage: AppLanguage
      ) => {
        setLanguageState(
          nextLanguage
        );

        await AsyncStorage.setItem(
          STORAGE_KEY,
          nextLanguage
        );
      },
      []
    );

  const toggleLanguage =
    useCallback(async () => {
      await setLanguage(
        language === 'en'
          ? 'si'
          : 'en'
      );
    }, [
      language,
      setLanguage,
    ]);

  const value =
    useMemo(
      () => ({
        language,
        isReady,
        setLanguage,
        toggleLanguage,
      }),
      [
        language,
        isReady,
        setLanguage,
        toggleLanguage,
      ]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage():
  LanguageContextValue {
  const value =
    useContext(
      LanguageContext
    );

  if (!value) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider.'
    );
  }

  return value;
}