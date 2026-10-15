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

const STORAGE_KEY =
  'safeher.privacy.preferences';

export type PrivacyPreferences = {
  anonymousReportingByDefault:
    boolean;

  allowLocationUse:
    boolean;

  showReportHistory:
    boolean;

  shareJourneys:
    boolean;

  safetyAlerts:
    boolean;
};

const DEFAULT_PREFERENCES:
  PrivacyPreferences = {
  anonymousReportingByDefault:
    true,

  allowLocationUse:
    true,

  showReportHistory:
    true,

  shareJourneys:
    true,

  safetyAlerts:
    true,
};

type PrivacyPreferenceKey =
  keyof PrivacyPreferences;

type PrivacyPreferencesContextValue = {
  preferences:
    PrivacyPreferences;

  isReady:
    boolean;

  updatePreference:
    <K extends PrivacyPreferenceKey>(
      key: K,
      value: PrivacyPreferences[K]
    ) => Promise<void>;

  clearSavedPreferences:
    () => Promise<void>;
};

const PrivacyPreferencesContext =
  createContext<
    PrivacyPreferencesContextValue | undefined
  >(
    undefined
  );

export function PrivacyPreferencesProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const [
    preferences,
    setPreferences,
  ] =
    useState<PrivacyPreferences>(
      DEFAULT_PREFERENCES
    );

  const [
    isReady,
    setIsReady,
  ] =
    useState(false);

  useEffect(() => {
    const loadPreferences =
      async () => {
        try {
          const stored =
            await AsyncStorage.getItem(
              STORAGE_KEY
            );

          if (
            !stored
          ) {
            return;
          }

          const parsed =
            JSON.parse(
              stored
            ) as Partial<PrivacyPreferences>;

          setPreferences({
            ...DEFAULT_PREFERENCES,

            ...parsed,
          });
        } catch (
          error
        ) {
          console.warn(
            'Could not load privacy preferences:',
            error
          );
        } finally {
          setIsReady(
            true
          );
        }
      };

    void loadPreferences();
  }, []);

  const savePreferences =
    useCallback(
      async (
        nextPreferences:
          PrivacyPreferences
      ) => {
        setPreferences(
          nextPreferences
        );

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            nextPreferences
          )
        );
      },
      []
    );

  const updatePreference =
    useCallback(
      async <
        K extends PrivacyPreferenceKey,
      >(
        key: K,
        value:
          PrivacyPreferences[K]
      ) => {
        const nextPreferences = {
          ...preferences,

          [key]:
            value,
        };

        await savePreferences(
          nextPreferences
        );
      },
      [
        preferences,
        savePreferences,
      ]
    );

  const clearSavedPreferences =
    useCallback(
      async () => {
        await AsyncStorage.removeItem(
          STORAGE_KEY
        );

        setPreferences(
          DEFAULT_PREFERENCES
        );
      },
      []
    );

  const value =
    useMemo(
      () => ({
        preferences,

        isReady,

        updatePreference,

        clearSavedPreferences,
      }),
      [
        preferences,
        isReady,
        updatePreference,
        clearSavedPreferences,
      ]
    );

  return (
    <PrivacyPreferencesContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </PrivacyPreferencesContext.Provider>
  );
}

export function usePrivacyPreferences():
  PrivacyPreferencesContextValue {
  const context =
    useContext(
      PrivacyPreferencesContext
    );

  if (
    !context
  ) {
    throw new Error(
      'usePrivacyPreferences must be used inside PrivacyPreferencesProvider.'
    );
  }

  return context;
}