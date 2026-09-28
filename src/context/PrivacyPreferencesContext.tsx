import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  clearPrivacyPreferences,
  defaultPrivacyPreferences,
  loadPrivacyPreferences,
  savePrivacyPreferences,
  type PrivacyPreferences,
} from '@/src/services/privacy-preferences';

type PrivacyPreferencesContextValue = {
  preferences: PrivacyPreferences;
  isReady: boolean;
  updatePreference: <Key extends keyof PrivacyPreferences>(
    key: Key,
    value: PrivacyPreferences[Key]
  ) => Promise<void>;
  clearSavedPreferences: () => Promise<void>;
};

const PrivacyPreferencesContext =
  createContext<PrivacyPreferencesContextValue | null>(null);

export function PrivacyPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(
    defaultPrivacyPreferences
  );
  const [isReady, setIsReady] = useState(false);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  useEffect(() => {
    let active = true;

    loadPrivacyPreferences()
      .then((storedPreferences) => {
        if (!active) {
          return;
        }

        preferencesRef.current = storedPreferences;
        setPreferences(storedPreferences);
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updatePreference = useCallback(
    async <Key extends keyof PrivacyPreferences>(
      key: Key,
      value: PrivacyPreferences[Key]
    ) => {
      const nextPreferences = {
        ...preferencesRef.current,
        [key]: value,
      };

      preferencesRef.current = nextPreferences;
      setPreferences(nextPreferences);
      await savePrivacyPreferences(nextPreferences);
    },
    []
  );

  const clearSavedPreferences = useCallback(async () => {
    preferencesRef.current = defaultPrivacyPreferences;
    setPreferences(defaultPrivacyPreferences);
    await clearPrivacyPreferences();
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      isReady,
      updatePreference,
      clearSavedPreferences,
    }),
    [clearSavedPreferences, isReady, preferences, updatePreference]
  );

  return (
    <PrivacyPreferencesContext.Provider value={value}>
      {children}
    </PrivacyPreferencesContext.Provider>
  );
}

export function usePrivacyPreferences(): PrivacyPreferencesContextValue {
  const value = useContext(PrivacyPreferencesContext);

  if (!value) {
    throw new Error(
      'usePrivacyPreferences must be used within PrivacyPreferencesProvider.'
    );
  }

  return value;
}
